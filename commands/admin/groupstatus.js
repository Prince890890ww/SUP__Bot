const crypto = require('crypto');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

const PURPLE_COLOR = '#9C27B0';
const sessions = new Map();

module.exports = {
  name: 'groupstatus',
  aliases: ['togstatus', 'swgc', 'gs', 'gstatus'],
  description: 'Post replied media or text as a WhatsApp group status (new Group Status feature).',
  usage: '.groupstatus [caption]  (reply to image/video/audio) OR .groupstatus your text',
  category: 'admin',
  groupOnly: false,
  adminOnly: true,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      const from = extra.from;
      const sender = msg.key.participant || from;
      const isGroup = extra.isGroup;
      const caption = (args.join(' ') || '').trim();
      const ctxInfo = msg.message?.extendedTextMessage?.contextInfo;
      const hasQuoted = !!ctxInfo?.quotedMessage;

      // ---------- PRIVATE CHAT ----------
      if (!isGroup) {
        if (!hasQuoted) {
          if (!caption) {
            return extra.reply(
              '📝 *Group Status Usage (Private Chat)*\n\n' +
              '• Reply to image/video/audio with:\n' +
              '  `.groupstatus [optional caption]`\n' +
              '• Or send text status only:\n' +
              '  `.groupstatus Your text here`\n\n' +
              'After that, bot will ask which group to post in.\n' +
              'Text statuses use a single purple background color by default.'
            );
          }

          sessions.set(sender, { type: 'text', content: caption, timestamp: Date.now() });
          await sendGroupList(sock, from, sender);
          return;
        }

        // Private chat + media reply
        const targetMessage = {
          key: { remoteJid: from, id: ctxInfo.stanzaId, participant: ctxInfo.participant },
          message: ctxInfo.quotedMessage,
        };
        const mtype = Object.keys(targetMessage.message)[0] || '';
        let mediaBuf = null;
        let mediaType = '';

        if (/image|sticker/i.test(mtype)) {
          mediaType = 'image';
          try { mediaBuf = await downloadMedia(targetMessage.message, 'image'); } catch { return extra.reply('❌ Failed to download image'); }
        } else if (/video/i.test(mtype)) {
          mediaType = 'video';
          try { mediaBuf = await downloadMedia(targetMessage.message, 'video'); } catch { return extra.reply('❌ Failed to download video'); }
        } else if (/audio/i.test(mtype)) {
          mediaType = 'audio';
          try { mediaBuf = await downloadMedia(targetMessage.message, 'audio'); } catch { return extra.reply('❌ Failed to download audio'); }
        } else {
          return extra.reply('❌ Unsupported media type. Reply to an image, video, or audio.');
        }
        if (!mediaBuf) return extra.reply('❌ Could not download media');

        sessions.set(sender, { type: mediaType, content: mediaBuf, caption: caption || '', timestamp: Date.now() });
        await sendGroupList(sock, from, sender);
        return;
      }

      // ---------- GROUP CHAT (existing logic) ----------
      if (!hasQuoted) {
        if (!caption) {
          return extra.reply(
            '📝 *Group Status Usage*\n\n' +
            '• Reply to image/video/audio with:\n' +
            '  `.groupstatus [optional caption]`\n' +
            '• Or send text status only:\n' +
            '  `.groupstatus Your text here`\n\n' +
            'Text statuses use a single purple background color by default.'
          );
        }
        await extra.reply('⏳ Posting text group status...');
        try {
          await groupStatus(sock, from, { text: caption, backgroundColor: PURPLE_COLOR });
          return extra.reply('✅ Text group status posted!');
        } catch (e) {
          return extra.reply('❌ Failed to post text group status: ' + (e.message || e));
        }
      }

      // Quoted media in group (existing logic)
      const targetMessage = {
        key: { remoteJid: from, id: ctxInfo.stanzaId, participant: ctxInfo.participant },
        message: ctxInfo.quotedMessage,
      };
      const mtype = Object.keys(targetMessage.message)[0] || '';
      const downloadBuf = async () => {
        const qmsg = targetMessage.message;
        if (/image/i.test(mtype))   return await downloadMedia(qmsg, 'image');
        if (/video/i.test(mtype))   return await downloadMedia(qmsg, 'video');
        if (/audio/i.test(mtype))   return await downloadMedia(qmsg, 'audio');
        if (/sticker/i.test(mtype)) return await downloadMedia(qmsg, 'sticker');
        return null;
      };

      if (/image|sticker/i.test(mtype)) {
        await extra.reply('⏳ Posting image group status...');
        let buf; try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download image'); }
        if (!buf) return extra.reply('❌ Could not download image');
        try { await groupStatus(sock, from, { image: buf, caption: caption || '' }); return extra.reply('✅ Image group status posted!'); } catch (e) { return extra.reply('❌ Failed to post image group status: ' + (e.message || e)); }
      }

      if (/video/i.test(mtype)) {
        await extra.reply('⏳ Posting video group status...');
        let buf; try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download video'); }
        if (!buf) return extra.reply('❌ Could not download video');
        try { await groupStatus(sock, from, { video: buf, caption: caption || '' }); return extra.reply('✅ Video group status posted!'); } catch (e) { return extra.reply('❌ Failed to post video group status: ' + (e.message || e)); }
      }

      if (/audio/i.test(mtype)) {
        await extra.reply('⏳ Posting audio group status...');
        let buf; try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download audio'); }
        if (!buf) return extra.reply('❌ Could not download audio');
        let vn; try { vn = await toVN(buf); } catch { vn = buf; }
        let waveform; try { waveform = await generateWaveform(buf); } catch { waveform = undefined; }
        try { await groupStatus(sock, from, { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform }); return extra.reply('✅ Audio group status posted!'); } catch (e) { return extra.reply('❌ Failed to post audio group status: ' + (e.message || e)); }
      }

      return extra.reply('❌ Unsupported media type. Reply to an image, video, or audio.');
    } catch (e) {
      console.error('groupstatus command error (outer):', e);
      return extra.reply('❌ Error: ' + (e.message || e));
    }
  },
};

// ============================================
// 📋 Send Group List with "ALL" Option
// ============================================
async function sendGroupList(sock, chatId, userId) {
  try {
    const groups = await sock.groupFetchAllParticipating();
    const groupList = Object.values(groups);
    if (groupList.length === 0) {
      await sock.sendMessage(chatId, { text: '❌ Bot kisi group ka member nahi hai.' });
      return;
    }

    const perPage = 3;
    const totalPages = Math.ceil(groupList.length / perPage);
    let page = 0;

    const session = sessions.get(userId);
    if (session) {
      // Clear any old timeout
      if (session.timeoutId) clearTimeout(session.timeoutId);
      session.page = 0;
      session.totalPages = totalPages;
      session.groupList = groupList;
      
      // ⏱️ Default timeout: 5 minutes (for single group selection)
      session.timeoutId = setTimeout(() => {
        if (sessions.has(userId)) {
          sessions.delete(userId);
          sock.sendMessage(chatId, { text: '⏱️ Session expired. Send .groupstatus again.' }).catch(() => {});
        }
      }, 300000);
    }

    await sendPage(sock, chatId, userId, 0);

  } catch (error) {
    console.error('sendGroupList error:', error);
    await sock.sendMessage(chatId, { text: '❌ Failed to fetch group list: ' + (error.message || error) });
  }
}

async function sendPage(sock, chatId, userId, pageNum) {
  const session = sessions.get(userId);
  if (!session) return;
  const groupList = session.groupList;
  const totalPages = session.totalPages;
  const perPage = 3;
  const start = pageNum * perPage;
  const end = Math.min(start + perPage, groupList.length);
  const pageGroups = groupList.slice(start, end);

  // Build numbered list for text reply
  let numberedList = '\n📋 *Group List (reply with number):*\n\n';
  groupList.forEach((g, i) => {
    numberedList += `  ${i+1}. ${g.subject || 'Unnamed'}\n`;
  });
  // ✅ ADD "ALL" OPTION AT THE END
  numberedList += `\n  *0. ALL GROUPS (post to all)* 🚀`;

  const buttons = [];
  for (const g of pageGroups) {
    const displayName = g.subject || 'Unnamed';
    buttons.push({
      buttonId: `gstatus_${g.id}`,
      buttonText: { displayText: displayName.length > 20 ? displayName.slice(0, 18) + '…' : displayName },
      type: 1
    });
  }

  // ✅ ADD "ALL" BUTTON
  buttons.push({
    buttonId: 'gstatus_all',
    buttonText: { displayText: '🚀 ALL GROUPS' },
    type: 1
  });

  if (totalPages > 1) {
    if (pageNum > 0) buttons.push({ buttonId: `gstatus_page_${pageNum - 1}`, buttonText: { displayText: '◀ Prev' }, type: 1 });
    if (pageNum < totalPages - 1) buttons.push({ buttonId: `gstatus_page_${pageNum + 1}`, buttonText: { displayText: 'Next ▶' }, type: 1 });
  }
  buttons.push({ buttonId: 'gstatus_cancel', buttonText: { displayText: '❌ Cancel' }, type: 1 });

  const msgPreview = session.type === 'text' ? session.content : (session.caption || 'Media');
  const header = `📌 *Your status:*\n${msgPreview}\n\n👇 *Select group (page ${pageNum+1}/${totalPages})*\n${numberedList}\n_You can also click the buttons above or reply with the number._`;

  await sock.sendMessage(chatId, {
    text: header,
    buttons: buttons,
    headerType: 1
  });
}

// ============================================
// 🔘 Handle Button Clicks
// ============================================
async function handleGroupStatusButton(sock, msg) {
  const buttonMsg = msg.message?.buttonsResponseMessage;
  if (!buttonMsg) return false;
  const buttonId = buttonMsg.selectedButtonId;
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || from;
  if (!buttonId.startsWith('gstatus_')) return false;

  const session = sessions.get(sender);
  if (!session) {
    await sock.sendMessage(from, { text: '⏱️ Session expired. Send .groupstatus again.' });
    return true;
  }

  if (buttonId === 'gstatus_cancel') {
    sessions.delete(sender);
    await sock.sendMessage(from, { text: '❌ Cancelled.' });
    return true;
  }

  // ✅ ALL GROUPS BUTTON
  if (buttonId === 'gstatus_all') {
    // 🔥 FIX: Extend session timeout to 30 minutes for ALL operation
    if (session.timeoutId) clearTimeout(session.timeoutId);
    session.timeoutId = setTimeout(() => {
      if (sessions.has(sender)) {
        sessions.delete(sender);
        sock.sendMessage(from, { text: '⏱️ Session expired. Send .groupstatus again.' }).catch(() => {});
      }
    }, 1800000); // 30 minutes

    await handlePostToAll(sock, from, sender, session);
    return true;
  }

  if (buttonId.startsWith('gstatus_page_')) {
    const pageNum = parseInt(buttonId.replace('gstatus_page_', ''));
    if (!isNaN(pageNum) && session.groupList) {
      session.page = pageNum;
      await sendPage(sock, from, sender, pageNum);
    }
    return true;
  }

  const groupId = buttonId.replace('gstatus_', '');
  const selectedGroup = session.groupList?.find(g => g.id === groupId);
  if (!selectedGroup) {
    await sock.sendMessage(from, { text: '❌ Group not found.' });
    return true;
  }

  await postToSingleGroup(sock, from, sender, session, selectedGroup);
  return true;
}

// ============================================
// 🔢 Handle Text Number Replies
// ============================================
async function handleGroupStatusTextReply(sock, msg) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || from;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  if (!text) return false;

  const num = parseInt(text.trim());
  if (isNaN(num) || num < 0 || num > 99) return false;

  const session = sessions.get(sender);
  if (!session) return false;

  const groupList = session.groupList;
  if (!groupList || groupList.length === 0) return false;

  // ✅ ALL GROUPS (number 0)
  if (num === 0) {
    // 🔥 FIX: Extend session timeout to 30 minutes for ALL operation
    if (session.timeoutId) clearTimeout(session.timeoutId);
    session.timeoutId = setTimeout(() => {
      if (sessions.has(sender)) {
        sessions.delete(sender);
        sock.sendMessage(from, { text: '⏱️ Session expired. Send .groupstatus again.' }).catch(() => {});
      }
    }, 1800000); // 30 minutes

    await handlePostToAll(sock, from, sender, session);
    return true;
  }

  if (num < 1 || num > groupList.length) {
    await sock.sendMessage(from, { text: `❌ Invalid number. Choose between 1 and ${groupList.length} (or 0 for ALL).` });
    return true;
  }

  const selectedGroup = groupList[num - 1];
  await postToSingleGroup(sock, from, sender, session, selectedGroup);
  return true;
}

// ============================================
// 📤 Post to Single Group
// ============================================
async function postToSingleGroup(sock, chatId, userId, session, selectedGroup) {
  try {
    await sock.sendMessage(chatId, { text: `⏳ Posting to *${selectedGroup.subject}*...` });
    let content = {};
    if (session.type === 'text') content = { text: session.content, backgroundColor: PURPLE_COLOR };
    else if (session.type === 'image') content = { image: session.content, caption: session.caption || '' };
    else if (session.type === 'video') content = { video: session.content, caption: session.caption || '' };
    else if (session.type === 'audio') {
      let vn = session.content;
      try { vn = await toVN(session.content); } catch {}
      let waveform; try { waveform = await generateWaveform(session.content); } catch {}
      content = { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform };
    }
    await groupStatus(sock, selectedGroup.id, content);
    await sock.sendMessage(chatId, { text: `✅ Status posted to *${selectedGroup.subject}*` });
  } catch (error) {
    console.error('PostStatus Error:', error);
    await sock.sendMessage(chatId, { text: `❌ Failed in ${selectedGroup.subject}: ${error.message}` });
  }
}

// ============================================
// 📤 POST TO ALL GROUPS (30-minute timeout extended)
// ============================================
async function handlePostToAll(sock, chatId, userId, session) {
  const groupList = session.groupList;
  if (!groupList || groupList.length === 0) {
    await sock.sendMessage(chatId, { text: '❌ No groups found.' });
    return;
  }

  await sock.sendMessage(chatId, { text: `🚀 Starting to post to all ${groupList.length} groups...\n⏳ This may take several minutes. Session is extended to 30 mins.` });

  let success = 0;
  let failed = 0;
  const total = groupList.length;

  for (let i = 0; i < total; i++) {
    const g = groupList[i];
    try {
      let content = {};
      if (session.type === 'text') content = { text: session.content, backgroundColor: PURPLE_COLOR };
      else if (session.type === 'image') content = { image: session.content, caption: session.caption || '' };
      else if (session.type === 'video') content = { video: session.content, caption: session.caption || '' };
      else if (session.type === 'audio') {
        let vn = session.content;
        try { vn = await toVN(session.content); } catch {}
        let waveform; try { waveform = await generateWaveform(session.content); } catch {}
        content = { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform };
      }
      await groupStatus(sock, g.id, content);
      success++;
      console.log(`✅ ${success}/${total} posted to ${g.subject}`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to post to ${g.subject}:`, error.message);
    }

    // ✅ RATE LIMIT PROTECTION – wait 3-5 seconds between groups
    if (i < total - 1) {
      const delay = 3000 + Math.floor(Math.random() * 3000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // ✅ Send progress update every 10 groups
    if ((i + 1) % 10 === 0 || i === total - 1) {
      await sock.sendMessage(chatId, { text: `📊 Progress: ${success + failed}/${total} done (✅ ${success} | ❌ ${failed})` });
    }
  }

  await sock.sendMessage(chatId, { text: `✅ All done! Posted to ${success}/${total} groups. Failed: ${failed}` });
  // Keep session active so user can post again
}
