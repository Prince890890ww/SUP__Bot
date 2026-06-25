/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['584167880480'], // Add your number without + or spaces (e.g., 919876543210)
    ownerName: ['AHMED LAMTALSSI', 'Ahmed Lamtalssi'], // Owner names corresponding to ownerNumber array
    
    // Bot Configuration
    botName: 'SUP BOT',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || 'KnightBot!H4sIAAAAAAAAA5VU25KiSBD9lY16lRhBkFtERwwgeEFBRRt1Yx9KKKAECoQCpSf89w3s6Zl52J3tfatKqMyT55zMb4AUuEY26oD6DZQVbiFF/ZF2JQIq0JsoQhVgQAgpBCow5vNE8+qrjQux9Tbmfc8SzkftWcyd8esqnM5uQyRvjwMreAEPBpTNOcPBbxIuxSuv8exlaMpza6qbGb7xcpm+hoPajqL2LpTjdCyRhMtvL+DRZ4S4wiQ2ywTlqIKZjbo1xNXn4KerVPQtyOX8MGLTgUXT0SVOumkjwsO+DPMFfL2YImt1ufA5+A198wZRlWrTkj8qfCc7njAwtlReHiRjOFjtF0PHb3l+q2vv8GscExTOQ0Qopt3nebdDjzYkH6GxNQj2eztw07zC3lK3jvViq9iclyzCAZmmn+R9vXWaoPIvXkmy6+TeJs7CCZbGXTDWLhvMb57edhtxsw069lfg6+rDK+n/4b2ZSbP6cHY9zrp24ZGDQ23urw4nL6ZWxd5s7RJ6CstnN27+Ofgm2rPzu6/ry+C8teyw7Qa+8drxgXnuhIjEDrestROZdgfhJ3xIm+p3KMlmI+DdMBsnnn6iUzhpLCdvNocTlNZXpJl50AmeHWfCMtTJRhSVjJW1S5Z63UkuxBUXQbNaCHtPCGapIkeaEh5drL08O0pRNw+Byj0YUKEY17SCFBfkGeN5BsCw9VBQIfqkF+jEydyO17bZWZmX4j3xi5DQJB+gU5fL3B2n1bGx9F18Ob4ABpRVEaC6RuEM17SouhWqaxijGqh//sUAgu70Xbi+HM8xIMJVTfekKbMChh+qfnyEQVA0hHodCYz+gCqgsj/DiFJM4rrnsSGwChLcIiOBtAZqBLMa/egQVSgEKq0a9GNqjSLsibcU/fVwmPmAAflTEBwCFYxlgRMlWWYFmVW5r/WXW58VluUXgihgAIH9z2AL6wT/sWkQIoAB2fMpJ0nsiBf4sTSSWE5Wua99/PEDdF8jRBTirO6HyT3sriJrmCtflBVzOtXMWDNiDfxs8sMt72pspk7ZiUtXHjTn0ZRfd/I9PrmnUro5tPM7UTRmo7phFXNTvPxDEqCCUi/Flc9S1EWaFxtKLEsLI1lAeS0iKbPHbsrvbaeIdsLdGUnSwHyV3NK20rc3Wri7bL92ndFCP0nb9qbPOl80JqWo9dZiQIhaHKBfi13b5jDRxNzEcOiw2+XOyN4mhSxPeFKLkMAbEmOy44LTvajOwwK1nJXJ1yUdISVzzzyxRctdtcieOPkinUU4Tyw/vr37+DlH2ff9hZ8O6+XrrxFGz3XwXaf/kvMdd2869sH8kuL7fvmXGdX3+gUGDX5r11WuJPRNblfH6S6HSJ6cg6xumjhRqiVdb00bPB5/MaDMII2KKgcqqPMzBAyoiqa38JxExe9WrjafTzbxvO86gzXVfo7FDueopjAvgcpJ8oiXeIkVH38Df/ntFUwHAAA=',
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
      welcomeMessage: '_W3LLC0M3 H0 GY4 APK4 J4NU KHUSHBU L4G4 KE 🥹💋_ @user',   // ✅ Sirf ye line change ki hai
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
