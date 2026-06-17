const crypto = require('crypto');
const {
  generateWAMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');
const { PassThrough } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

// Single default color for text statuses (purple)
const PURPLE_COLOR = '#9C27B0';

// Temporary session storage for private chat
const sessions = new Map();

module.exports = {
  name: 'groupstatus',
  aliases: ['togstatus', 'swgc', 'gs', 'gstatus'],
  description: 'Post replied media or text as a WhatsApp group status (new Group Status feature).',
  usage: '.groupstatus [caption]  (reply to image/video/audio) OR .groupstatus your text',
  category: 'admin',
  groupOnly: false,        // ✅ Private chat me bhi chalega
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

      // ============================================
      // 🔹 CASE: Private Chat – Group Selection Flow
      // ============================================
      if (!isGroup) {
        // Agar private chat mein hai aur koi media reply nahi kiya
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

          // Store the message/text for this user
          sessions.set(sender, {
            type: 'text',
            content: caption,
            timestamp: Date.now()
          });

          await sendGroupList(sock, from, sender);
          return;
        }

        // Private chat + media reply
        const targetMessage = {
          key: {
            remoteJid: from,
            id: ctxInfo.stanzaId,
            participant: ctxInfo.participant,
          },
          message: ctxInfo.quotedMessage,
        };

        const mtype = Object.keys(targetMessage.message)[0] || '';

        // Download media based on type
        let mediaBuf = null;
        let mediaType = '';

        if (/image|sticker/i.test(mtype)) {
          mediaType = 'image';
          try {
            mediaBuf = await downloadMedia(targetMessage.message, 'image');
          } catch {
            return extra.reply('❌ Failed to download image');
          }
        } else if (/video/i.test(mtype)) {
          mediaType = 'video';
          try {
            mediaBuf = await downloadMedia(targetMessage.message, 'video');
          } catch {
            return extra.reply('❌ Failed to download video');
          }
        } else if (/audio/i.test(mtype)) {
          mediaType = 'audio';
          try {
            mediaBuf = await downloadMedia(targetMessage.message, 'audio');
          } catch {
            return extra.reply('❌ Failed to download audio');
          }
        } else {
          return extra.reply('❌ Unsupported media type. Reply to an image, video, or audio.');
        }

        if (!mediaBuf) return extra.reply('❌ Could not download media');

        // Store the media for this user
        sessions.set(sender, {
          type: mediaType,
          content: mediaBuf,
          caption: caption || '',
          timestamp: Date.now()
        });

        await sendGroupList(sock, from, sender);
        return;
      }

      // ============================================
      // 🔹 CASE: Group Chat – Existing Behavior
      // ============================================
      // Only inside groups (existing logic)
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
          await groupStatus(sock, from, {
            text: caption,
            backgroundColor: PURPLE_COLOR,
          });
          return extra.reply('✅ Text group status posted!');
        } catch (e) {
          console.error('groupstatus text error:', e);
          return extra.reply('❌ Failed to post text group status: ' + (e.message || e));
        }
      }

      // Quoted media in group (existing logic)
      const targetMessage = {
        key: {
          remoteJid: from,
          id: ctxInfo.stanzaId,
          participant: ctxInfo.participant,
        },
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
        let buf;
        try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download image'); }
        if (!buf) return extra.reply('❌ Could not download image');
        try {
          await groupStatus(sock, from, { image: buf, caption: caption || '' });
          return extra.reply('✅ Image group status posted!');
        } catch (e) {
          console.error('groupstatus image error:', e);
          return extra.reply('❌ Failed to post image group status: ' + (e.message || e));
        }
      }

      if (/video/i.test(mtype)) {
        await extra.reply('⏳ Posting video group status...');
        let buf;
        try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download video'); }
        if (!buf) return extra.reply('❌ Could not download video');
        try {
          await groupStatus(sock, from, { video: buf, caption: caption || '' });
          return extra.reply('✅ Video group status posted!');
        } catch (e) {
          console.error('groupstatus video error:', e);
          return extra.reply('❌ Failed to post video group status: ' + (e.message || e));
        }
      }

      if (/audio/i.test(mtype)) {
        await extra.reply('⏳ Posting audio group status...');
        let buf;
        try { buf = await downloadBuf(); } catch { return extra.reply('❌ Failed to download audio'); }
        if (!buf) return extra.reply('❌ Could not download audio');
        let vn;
        try { vn = await toVN(buf); } catch { vn = buf; }
        let waveform;
        try { waveform = await generateWaveform(buf); } catch { waveform = undefined; }
        try {
          await groupStatus(sock, from, { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform });
          return extra.reply('✅ Audio group status posted!');
        } catch (e) {
          console.error('groupstatus audio error:', e);
          return extra.reply('❌ Failed to post audio group status: ' + (e.message || e));
        }
      }

      return extra.reply('❌ Unsupported media type. Reply to an image, video, or audio.');
    } catch (e) {
      console.error('groupstatus command error (outer):', e);
      return extra.reply('❌ Error: ' + (e.message || e));
    }
  },
};

// ============================================
// 📋 Helper: Send Group List with Buttons
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

    const sendPage = async (pageNum) => {
      const start = pageNum * perPage;
      const end = Math.min(start + perPage, groupList.length);
      const pageGroups = groupList.slice(start, end);

      const buttons = [];
      for (const g of pageGroups) {
        const displayName = g.subject || 'Unnamed';
        buttons.push({
          buttonId: `gstatus_${g.id}`,
          buttonText: { displayText: displayName.length > 20 ? displayName.slice(0, 18) + '…' : displayName },
          type: 1
        });
      }

      if (totalPages > 1) {
        if (pageNum > 0) {
          buttons.push({ buttonId: `gstatus_page_${pageNum - 1}`, buttonText: { displayText: '◀ Prev' }, type: 1 });
        }
        if (pageNum < totalPages - 1) {
          buttons.push({ buttonId: `gstatus_page_${pageNum + 1}`, buttonText: { displayText: 'Next ▶' }, type: 1 });
        }
      }
      buttons.push({ buttonId: 'gstatus_cancel', buttonText: { displayText: '❌ Cancel' }, type: 1 });

      const session = sessions.get(userId);
      const msgPreview = session?.type === 'text' ? session.content : (session?.caption || 'Media');
      const header = `📌 *Your status:*\n${msgPreview}\n\n👇 *Select group (page ${pageNum+1}/${totalPages})*`;

      await sock.sendMessage(chatId, {
        text: header,
        buttons: buttons,
        headerType: 1
      });
    };

    // Store page info in session
    const session = sessions.get(userId);
    if (session) {
      session.page = 0;
      session.totalPages = totalPages;
      session.groupList = groupList;
    }

    await sendPage(0);

    // Timeout after 60 seconds
    setTimeout(() => {
      if (sessions.has(userId)) {
        sessions.delete(userId);
        sock.sendMessage(chatId, { text: '⏱️ Session expired. Send .groupstatus again.' }).catch(() => {});
      }
    }, 60000);

  } catch (error) {
    console.error('sendGroupList error:', error);
    await sock.sendMessage(chatId, { text: '❌ Failed to fetch group list: ' + (error.message || error) });
  }
}

// ============================================
// 🔘 Handle Button Clicks (called from index.js)
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

  // Cancel
  if (buttonId === 'gstatus_cancel') {
    sessions.delete(sender);
    await sock.sendMessage(from, { text: '❌ Cancelled.' });
    return true;
  }

  // Pagination
  if (buttonId.startsWith('gstatus_page_')) {
    const pageNum = parseInt(buttonId.replace('gstatus_page_', ''));
    if (!isNaN(pageNum) && session.groupList) {
      session.page = pageNum;
      await sendGroupListPage(sock, from, sender, session, pageNum);
    }
    return true;
  }

  // Extract group ID
  const groupId = buttonId.replace('gstatus_', '');
  const selectedGroup = session.groupList?.find(g => g.id === groupId);
  if (!selectedGroup) {
    await sock.sendMessage(from, { text: '❌ Group not found.' });
    return true;
  }

  // Post status to selected group
  try {
    await sock.sendMessage(from, { text: `⏳ Posting to *${selectedGroup.subject}*...` });

    let content = {};
    if (session.type === 'text') {
      content = { text: session.content, backgroundColor: PURPLE_COLOR };
    } else if (session.type === 'image') {
      content = { image: session.content, caption: session.caption || '' };
    } else if (session.type === 'video') {
      content = { video: session.content, caption: session.caption || '' };
    } else if (session.type === 'audio') {
      let vn = session.content;
      try { vn = await toVN(session.content); } catch {}
      let waveform;
      try { waveform = await generateWaveform(session.content); } catch {}
      content = { audio: vn, mimetype: 'audio/ogg; codecs=opus', ptt: true, waveform };
    }

    await groupStatus(sock, groupId, content);
    await sock.sendMessage(from, { text: `✅ Status posted to *${selectedGroup.subject}*` });
  } catch (error) {
    console.error('PostStatus Error:', error);
    await sock.sendMessage(from, { text: `❌ Failed in ${selectedGroup.subject}: ${error.message}` });
  }

  // Do NOT delete session – user can click another group
  return true;
}

// Helper to send a specific page
async function sendGroupListPage(sock, chatId, userId, session, pageNum) {
  const groupList = session.groupList;
  const totalPages = session.totalPages;
  const perPage = 3;
  const start = pageNum * perPage;
  const end = Math.min(start + perPage, groupList.length);
  const pageGroups = groupList.slice(start, end);

  const buttons = [];
  for (const g of pageGroups) {
    const displayName = g.subject || 'Unnamed';
    buttons.push({
      buttonId: `gstatus_${g.id}`,
      buttonText: { displayText: displayName.length > 20 ? displayName.slice(0, 18) + '…' : displayName },
      type: 1
    });
  }

  if (totalPages > 1) {
    if (pageNum > 0) {
      buttons.push({ buttonId: `gstatus_page_${pageNum - 1}`, buttonText: { displayText: '◀ Prev' }, type: 1 });
    }
    if (pageNum < totalPages - 1) {
      buttons.push({ buttonId: `gstatus_page_${pageNum + 1}`, buttonText: { displayText: 'Next ▶' }, type: 1 });
    }
  }
  buttons.push({ buttonId: 'gstatus_cancel', buttonText: { displayText: '❌ Cancel' }, type: 1 });

  const msgPreview = session.type === 'text' ? session.content : (session.caption || 'Media');
  const header = `📌 *Your status:*\n${msgPreview}\n\n👇 *Select group (page ${pageNum+1}/${totalPages})*`;

  await sock.sendMessage(chatId, {
    text: header,
    buttons: buttons,
    headerType: 1
  });
}

// ============================================
// 📦 Existing Helpers (unchanged)
// ============================================
async function downloadMedia(msg, type) {
  const mediaMsg = msg[`${type}Message`] || msg;
  const stream = await downloadContentFromMessage(mediaMsg, type);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function groupStatus(sock, jid, content) {
  const { backgroundColor } = content;
  delete content.backgroundColor;

  const inside = await generateWAMessageContent(content, {
    upload: sock.waUploadToServer,
    backgroundColor: backgroundColor || PURPLE_COLOR,
  });

  const secret = crypto.randomBytes(32);
  const msg = generateWAMessageFromContent(
    jid,
    {
      messageContextInfo: { messageSecret: secret },
      groupStatusMessageV2: {
        message: {
          ...inside,
          messageContextInfo: { messageSecret: secret },
        },
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
        for (let i = 0; i < samples; i++) {
          amps.push(Math.abs(raw.readInt16LE(i * 2)) / 32768);
        }
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

// Export button handler for index.js
module.exports.handleGroupStatusButton = handleGroupStatusButton;
