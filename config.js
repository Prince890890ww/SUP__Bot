/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['212607361454'], // Add your number without + or spaces (e.g., 919876543210)
    ownerName: ['AHMED LAMTALSSI', 'Ahmed Lamtalssi'], // Owner names corresponding to ownerNumber array
    
    // Bot Configuration
    botName: 'SUP BOT',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || 'KnightBot!H4sIAAAAAAAAA5VUa4+iSBT9L/VVM/IQFJNOBhAFER+t+GAzHwoosAQKLAoUJ/73Cfb09GyyO9v7ragi5557zj33OyA5LpGNGjD6DgqKa8hQe2RNgcAIaFUUIQq6IIQMghEYGn4VmFKUrTP5lOOJYbIiGzhFuZ1r/vKM4Xy97DGTd0j/BTy6oKj8FAd/ALx3TmUhTS94og/stVpv7rWxWHWsjaZ2ln5lYStt1k4WDQn3Ah4tIsQUk9goTihDFKY2alYQ08/Rb+yTSM/HbBWLs6WdK4vq1acKmcra2jnJyJhqZe71JpFhxp+jD68iGeue6cCtKkR2OBRr/1wQLMnzJNpqUyVzbK/vdEI+fqNf4pig0AoRYZg1n9Z9MwtfrXFMpkucd8ya7HFeTq99ywmNRFmOhdlscUvU3I33w88RnxwsdxtseJJJZNwoae4qrzd4GM9KTt1hOXCYVWfDHX413N+Jr+j7rCT/R/d8cca2X6jnu0jSa8Fq8WgdFE2yp9rkUJnHqmFeYaimw6ufoy8h16vifGxXpWjcd97GvqqH7GxEiuXWAuVqJzkM+sHl0HAf9CGr6J9Y+q8nI5mMk3AuupwXZusBzcRFY6z4tTi/MWEXH+9Vz3Oy633dTMj0hCQ7zk8kCJHspbl/okXaC9L5bjfrHfFwJ1jNTVu/PDtKUGOFYMQ/uoCiGJeMQoZz8rwbdAEM6w0KKGJPdYGqeUk1LzpNMDYuS7G/ILYRBcFRElhny/OdjtskB0W3opPxArqgoHmAyhKFJi5ZThsHlSWMUQlGf33rAoJu7M23tprId0GEaclcUhVpDsN3U98fYRDkFWGbhgR6e0AUjLiPa8QYJnHZylgRSIMTrpF+gqwEowimJfrVIKIoBCNGK/QrtHoetrqv5Ik61bw96ILs6QcOwQgokiLL8lAWpIEykr6WX64tKiyKLwQx0AXp8y9eFAeK1O/LHCcPByPpa3v9+EWvRQsRgzgtwQjo9n5LLoFpWNGuYsZ0qhqxqscq+GjnfSzedKeu75ccVxu3ZCXX96NqnVlxuOzl/arY6D1ytI84N7k6Sfov/wACRqAz0N3EOLDs1kiXubBIZvc7LhPorQ5JuvCd0l1tNQVydKof9ajSfaFnvqr3+zhehBr25ftWiFKB82cdsrz0dhsOOh31+tJWC1GNA/S3YnUkyB5pFu7KZKfcnuO7uOZMGl+ZtL6e52iztO+rten5vYpq+n6XUG/PzY77Qlo06cHk7Ve352RUdWx1kCdWvGM7TX0b2Gdg0p+LCj9nqTWq/YwweuaewNa+/zTujXc7Xtyj+xvEz0XyL2HUID8VBovF/OZ44w4dCqpuDeBOTqv0LLtxLQl6Zl00ZS7NluDx+NYFRQpZlNOsXcskpDkOQRfQvGrn1SJR/odiuupYuhov2sZTWDL1IwNbnKGSwaxogzrk+31R4PnHD4kCNHs4BwAA',
    newsletterJid: '120363161513685998@newsletter', // Newsletter JID for menu forwarding
    updateZipUrl: 'https://github.com/mruniquehacker/KnightBot-Mini/archive/refs/heads/main.zip', // URL to latest code zip for .update command
    
    // Sticker Configuration
    packname: 'Knight Bot Mini',
    
    // Bot Behavior
    selfMode: false, // Private mode - only owner can use commands
    autoRead: false,
    autoTyping: false,
    autoBio: false,
    autoSticker: false,
    autoReact: false,
    autoReactMode: 'bot', // set bot or all via cmd
    autoDownload: false,
    
    // Group Settings Defaults
    defaultGroupSettings: {
      antilink: false,
      antilinkAction: 'delete', // 'delete', 'kick', 'warn'
      antitag: false,
      antitagAction: 'delete',
      antiall: false, // Owner only - blocks all messages from non-admins
      antiviewonce: false,
      antibot: false,
      anticall: false, // Anti-call feature
      antigroupmention: false, // Anti-group mention feature
      antigroupmentionAction: 'delete', // 'delete', 'kick'
      welcome: false,
      welcomeMessage: '╭╼━≪•𝙽𝙴𝚆 𝙼𝙴𝙼𝙱𝙴𝚁•≫━╾╮\n┃𝚆𝙴𝙻𝙲𝙾𝙼𝙴: @user 👋\n┃Member count: #memberCount\n┃𝚃𝙸𝙼𝙴: time⏰\n╰━━━━━━━━━━━━━━━╯\n\n*@user* Welcome to *@group*! 🎉\n*Group 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*\ngroupDesc\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ botName*',
      goodbye: false,
      goodbyeMessage: 'Goodbye @user 👋 We will never miss you!',
      antiSpam: false,
      antidelete: false,
      nsfw: false,
      detect: false,
      chatbot: false,
      autosticker: false // Auto-convert images/videos to stickers
    },
    
    // API Keys (add your own)
    apiKeys: {
      // Add API keys here if needed
      openai: '',
      deepai: '',
      remove_bg: ''
    },
    
    // Message Configuration
    messages: {
      wait: '⏳ Please wait...',
      success: '✅ Success!',
      error: '❌ Error occurred!',
      ownerOnly: '👑 This command is only for bot owner!',
      adminOnly: '🛡️ This command is only for group admins!',
      groupOnly: '👥 This command can only be used in groups!',
      privateOnly: '💬 This command can only be used in private chat!',
      botAdminNeeded: '🤖 Bot needs to be admin to execute this command!',
      invalidCommand: '❓ Invalid command! Type .menu for help'
    },
    
    // Timezone
    timezone: 'Morroco/Rabat',
    
    // Limits
    maxWarnings: 3,
    
    // Social Links (optional)
    social: {
      github: 'https://github.com/hassanalami',
      instagram: 'https://www.instagram.com/fifa/',
      youtube: 'https://www.youtube.com/@fifa/videos'
    }
};
  
