const crypto = require('crypto');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

// ============================================
// 🎨 RANDOM COLOR LIST (20+ Colors)
// ============================================
const COLORS = [
  '#FF0000', // Red
  '#FF5722', // Deep Orange
  '#FF9800', // Orange
  '#FFEB3B', // Yellow
  '#4CAF50', // Green
  '#00BCD4', // Cyan
  '#2196F3', // Blue
  '#3F51B5', // Indigo
  '#673AB7', // Deep Purple
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#FF4081', // Light Pink
  '#7C4DFF', // Light Purple
  '#00E5FF', // Light Blue
  '#FFEA00', // Light Yellow
  '#76FF03', // Light Green
  '#FF6F00', // Amber
  '#D50000', // Dark Red
  '#0D47A1', // Dark Blue
  '#004D40', // Dark Teal
  '#880E4F', // Dark Pink
  '#4A148C', // Dark Purple
  '#1A237E', // Dark Indigo
  '#BF360C', // Dark Orange
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const sessions = new Map();

module.exports = {
  name: 'groupstatus',
  aliases: ['togstatus', 'swgc', 'gs', 'gstatus'],
  description: 'Post replied media or text as a WhatsApp group status (ALL groups supported).',
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

      if (!isGroup) {
        if (!hasQuoted) {
          if (!caption) {
            return extra.reply(
              '📝 *Group Status Usage (Private Chat)*\n\n' +
              '• Reply to image/video/audio with:\n' +
              '  `.groupstatus [optional caption]`\n' +
              '• Or send text status only:\n' +
              '  `.groupstatus Your text here`\n\n' +
              '🎨 *Random background color every time!*\n' +
              '• 0 = ALL groups (45 sec delay, 3 min break)\n' +
              '• WhatsApp crash-proof version'
            );
          }

          sessions.set(sender, { type: 'text', content: caption, timestamp: Date.now() });
          await sendGroupList(sock, from, sender);
          return;
        }

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

      // ---------- GROUP CHAT ----------
      if (!hasQuoted) {
        if (!caption) {
          return extra.reply(
            '📝 *Group Status Usage*\n\n' +
            '• Reply to image/video/audio with:\n' +
            '  `.groupstatus [optional caption]`\n' +
            '• Or send text status only:\n' +
            '  `.groupstatus Your text here`\n\n' +
            '🎨 Random background color every time!'
          );
        }
        await extra.reply('⏳ Posting text group status...');
        try {
          // 🎨 Random color for this status
          await groupStatus(sock, from, { text: caption, backgroundColor: getRandomColor() });
          return extra.reply('✅ Text group status posted!');
        } catch (e) {
          return extra.reply('❌ Failed to post text group status: ' + (e.message || e));
        }
      }

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
        try { await groupStatus(sock, from, { image: buf, caption: caption || '', backgroundColor: getRandomColor() }); return extra.reply('✅ Image group status posted!'); } catch (e) { return extra.reply('❌ Failed to post image group status: ' + (e.message || e)); }
      }

      if (/video/i.test(mtype)) {
        await extra.reply('⏳ Posting video group status...');
        let buf; try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download video'); }
        if (!buf) return extra.reply('❌ Could not download video');
        try { await groupStatus(sock, from, { video: buf, caption: caption || '', backgroundColor: getRandomColor() }); return extra.reply('✅ Video group status posted!'); } catch (e) { return extra.reply('❌ Failed to post video group status: ' + (e.message || e)); }
      }

      if (/audio/i.test(mtype)) {
        await extra.reply('⏳ Posting audio group status...');
        let buf; try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download audio'); }
        if (!buf) return extra.reply('❌ Could not download audio');
        let vn; try { vn = await toVN(buf); } catch { vn = buf; }
        let waveform; try { waveform = await generateWaveform(buf); } catch { waveform = undefined; }
        try { await groupStatus(sock, from, { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform, backgroundColor: getRandomColor() }); return extra.reply('✅ Audio group status posted!'); } catch (e) { return extra.reply('❌ Failed to post audio group status: ' + (e.message || e)); }
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
      if (session.timeoutId) clearTimeout(session.timeoutId);
      session.page = 0;
      session.totalPages = totalPages;
      session.groupList = groupList;
      
      // 2 hours timeout (7200 seconds)
      session.timeoutId = setTimeout(() => {
        if (sessions.has(userId)) {
          sessions.delete(userId);
          sock.sendMessage(chatId, { text: '⏱️ Session expired. Send .groupstatus again.' }).catch(() => {});
        }
      }, 7200000);
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

  let numberedList = '\n📋 *Group List (reply with number):*\n\n';
  groupList.forEach((g, i) => {
    numberedList += `  ${i+1}. ${g.subject || 'Unnamed'}\n`;
  });
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

  if (buttonId === 'gstatus_all') {
    if (session.timeoutId) clearTimeout(session.timeoutId);
    session.timeoutId = setTimeout(() => {
      if (sessions.has(sender)) {
        sessions.delete(sender);
        sock.sendMessage(from, { text: '⏱️ Session expired. Send .groupstatus again.' }).catch(() => {});
      }
    }, 7200000);

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

  if (num === 0) {
    if (session.timeoutId) clearTimeout(session.timeoutId);
    session.timeoutId = setTimeout(() => {
      if (sessions.has(sender)) {
        sessions.delete(sender);
        sock.sendMessage(from, { text: '⏱️ Session expired. Send .groupstatus again.' }).catch(() => {});
      }
    }, 7200000);

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
    if (session.type === 'text') content = { text: session.content, backgroundColor: getRandomColor() };
    else if (session.type === 'image') content = { image: session.content, caption: session.caption || '', backgroundColor: getRandomColor() };
    else if (session.type === 'video') content = { video: session.content, caption: session.caption || '', backgroundColor: getRandomColor() };
    else if (session.type === 'audio') {
      let vn = session.content;
      try { vn = await toVN(session.content); } catch {}
      let waveform; try { waveform = await generateWaveform(session.content); } catch {}
      content = { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform, backgroundColor: getRandomColor() };
    }
    await groupStatus(sock, selectedGroup.id, content);
    await sock.sendMessage(chatId, { text: `✅ Status posted to *${selectedGroup.subject}*` });
  } catch (error) {
    console.error('PostStatus Error:', error);
    await sock.sendMessage(chatId, { text: `❌ Failed in ${selectedGroup.subject}: ${error.message}` });
  }
}

// ============================================
// 📤 POST TO ALL GROUPS (45 sec delay, 3 min break)
// ============================================
async function handlePostToAll(sock, chatId, userId, session) {
  const groupList = session.groupList;
  if (!groupList || groupList.length === 0) {
    await sock.sendMessage(chatId, { text: '❌ No groups found.' });
    return;
  }

  if (session._allPosted) {
    await sock.sendMessage(chatId, { text: '⚠️ Already posted to all groups in this session. Send .groupstatus again to refresh.' });
    return;
  }

  const total = groupList.length;
  await sock.sendMessage(chatId, { text: `🚀 Posting to all ${total} groups...\n⏳ 45 sec delay between groups.` });

  let success = 0;
  let failed = 0;
  const postedGroups = new Set();

  for (let i = 0; i < total; i++) {
    const g = groupList[i];
    
    if (postedGroups.has(g.id)) {
      console.log(`⏭️ Skipping duplicate: ${g.subject}`);
      continue;
    }

    try {
      let content = {};
      const color = getRandomColor(); // 🎨 Random color for each group
      if (session.type === 'text') content = { text: session.content, backgroundColor: color };
      else if (session.type === 'image') content = { image: session.content, caption: session.caption || '', backgroundColor: color };
      else if (session.type === 'video') content = { video: session.content, caption: session.caption || '', backgroundColor: color };
      else if (session.type === 'audio') {
        let vn = session.content;
        try { vn = await toVN(session.content); } catch {}
        let waveform; try { waveform = await generateWaveform(session.content); } catch {}
        content = { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform, backgroundColor: color };
      }
      await groupStatus(sock, g.id, content);
      success++;
      postedGroups.add(g.id);
      console.log(`✅ ${success}/${total} posted to ${g.subject} (color: ${color})`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to post to ${g.subject}:`, error.message);
    }

    // 45 SECONDS DELAY
    if (i < total - 1) {
      await new Promise(resolve => setTimeout(resolve, 45000));
    }

    // Progress update every 5 groups
    if ((i + 1) % 5 === 0 || i === total - 1) {
      await sock.sendMessage(chatId, { text: `📊 Progress: ${success + failed}/${total} done (✅ ${success} | ❌ ${failed})` });
    }

    // 3 MIN BREAK after every 15 groups
    if ((i + 1) % 15 === 0 && i < total - 1) {
      await sock.sendMessage(chatId, { text: `⏸️ Break for 3 minutes (${i+1}/${total} done)...` });
      await new Promise(resolve => setTimeout(resolve, 180000));
    }
  }

  session._allPosted = true;
  await sock.sendMessage(chatId, { text: `✅ All done! Posted to ${success}/${total} groups. Failed: ${failed}` });
}

// ============================================
// 📦 Helpers
// ============================================
async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg;
  const stream = await downloadContentFromMessage(mediaMsg, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function groupStatus(sock, jid, content) {
  const { backgroundColor } = content;
  // If no backgroundColor provided, pick random
  const bgColor = backgroundColor || getRandomColor();
  delete content.backgroundColor; // Remove from content so it doesn't conflict
  const inside = await generateWAMessageContent(content, {
    upload: sock.waUploadToServer,
    backgroundColor: bgColor,
  });
  const secret = crypto.randomBytes(32);
  const msg = generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: { messageSecret: secret },
      groupStatusMessageV2: {
        message: { ...inside, messageContextInfo: { messageSecret: secret } },
      },
    },
    {}
  );
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}

function toVN(buffer) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks = [];
    input.end(buffer);
    ffmpeg(input)
      .noVideo()
      .audioCodec('libopus')
      .format('ogg')
      .audioChannels(1)
      .audioFrequency(48000)
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe(output);
    output.on('data', (c) => chunks.push(c));
  });
}

function generateWaveform(buffer, bars = 64) {
  return new Promise((resolve, reject) => {
    const input = new PassThrough();
    input.end(buffer);
    const chunks = [];
    ffmpeg(input)
      .audioChannels(1)
      .audioFrequency(16000)
      .format('s16le')
      .on('error', reject)
      .on('end', () => {
        const raw = Buffer.concat(chunks);
        const samples = raw.length / 2;
        const amps = [];
        for (let i = 0; i < samples; i++) amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
        const size = Math.floor(amps.length / bars);
        if (size === 0) return resolve(undefined);
        const avg = Array.from({ length: bars }, (_, i) =>
          amps.slice(i * size, (i + 1) * size).reduce((a, b) => a + b, 0) / size
        );
        const max = Math.max(...avg);
        if (max === 0) return resolve(undefined);
        resolve(Buffer.from(avg.map((v) => Math.floor((v / max) * 100))).toString('base64'));
      })
      .pipe()
      .on('data', (c) => chunks.push(c));
  });
}

module.exports.handleGroupStatusButton = handleGroupStatusButton;
module.exports.handleGroupStatusTextReply = handleGroupStatusTextReply;
