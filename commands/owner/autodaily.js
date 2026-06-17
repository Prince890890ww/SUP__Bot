const fs = require('fs');
const path = require('path');

const configFile = path.join(__dirname, '../../data/autoDaily.json');

// Ensure data directory exists
function ensureDataDir() {
    const dir = path.dirname(configFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 Created data directory');
    }
}

function getConfig() {
    ensureDataDir();
    if (!fs.existsSync(configFile)) {
        fs.writeFileSync(configFile, JSON.stringify({ enabled: false, lastSent: {} }));
        return { enabled: false, lastSent: {} };
    }
    try {
        return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch {
        return { enabled: false, lastSent: {} };
    }
}

function saveConfig(data) {
    ensureDataDir();
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'autodaily',
    aliases: ['ad'],
    category: 'owner',
    desc: 'Enable/disable auto daily messages (GM, lunch, GN, etc.) in Hinglish',
    usage: 'autodaily on/off',
    ownerOnly: true,
    async execute(sock, msg, args, extra) {
        const action = args[0]?.toLowerCase();
        const config = getConfig();

        if (!action) {
            return extra.reply(`📌 *Auto Daily Messages*\nStatus: ${config.enabled ? '✅ ON' : '❌ OFF'}`);
        }

        if (action === 'on') {
            config.enabled = true;
            saveConfig(config);
            return extra.reply('✅ Auto daily messages enabled. Bot will send GM, lunch, GN etc. at appropriate times.');
        }

        if (action === 'off') {
            config.enabled = false;
            saveConfig(config);
            return extra.reply('❌ Auto daily messages disabled.');
        }

        return extra.reply('Usage: .autodaily on / .autodaily off');
    }
};

// ============================================
// 🎯 GIRL-STYLE RANDOM FUNNY MESSAGES (no start emoji)
// ============================================
const funnyMessages = [
    "Sab busy ho kya? Thoda toh reply karo warna main sochungi ki sab mujhse naraaz hain",
    "Aaj mood bahut off hai, koi mujhe chocolate bhej sakta hai kya?",
    "Mera aaj ka plan: kuch nahi, bas group mein active rehna hai 😂",
    "Aaj itna kaam hai ki main soch rahi hu ki ghar se bhaag jaun",
    "Koi mujhe batao ki aaj ka special kya hai? Kyunki mujhe kuch nahi pata",
    "Mere pet mein aaj bhoot hai, kaun samjhaega mujhe?",
    "Aaj main heroine banne ka mood hai, sab mujhe compliment do 😄",
    "Itni garmi hai ki main bas AC ke saamne baithi hu aur group scroll kar rahi hu",
    "Mujhe lagta hai aaj main kuch gadbad kar dungi, beware!",
    "Sab log kaam kar rahe hain aur main yahan bore ho rahi hu",
    "Aaj main apna favorite dress pehni hai, but kisi ne notice nahi kiya 🙄",
    "Mera dimaag aaj full off hai, koi mujhe restart karo 😂",
    "Aaj main healthy khane ka soch rahi thi, but samosa dekh ke sab bhool gayi",
    "Kya kisi ko mujhse baat karne ka mann hai? Kyunki mujhe bahut baat karni hai",
    "Main soch rahi hu ki aaj group mein kuch drama karein, thoda entertainment ho jaye",
    "Itna silent group, lagta hai sab log mere baare mein discuss kar rahe hain 😂",
    "Aaj main thoda emotional hu, koi mujhe hug nahi karega kya?",
    "Mera phone aaj bohot slow hai, lagta hai mujhe naya lena padega",
    "Main aaj khud ko bahut special feel kar rahi hu, pata nahi kyun",
    "Kya aaj koi mera favourite song recommend karega? Mujhe sunna hai",
    "Main soch rahi hu ki aaj raat ko kuch special khaungi, but kya pata abhi soch hi soch mein reh jaun",
    "Group mein itna silent kyun hai? Koi toh gossip karo, main ready hu",
    "Aaj main thoda moody hu, mujhe ignore mat karna warna main naraaz ho jaungi",
    "Mera aaj ka goal: group mein sab ko hasaana, but mein khud has rahi hu 😂"
];

// ============================================
// 🌅 MORNING MESSAGES
// ============================================
const morningMessages = [
    "Uth gaye? Main toh soch rahi thi ki aaj subah kaun utha hai, lagta hai sab neend mein hain 😊",
    "Good morning! Aaj main fresh feel kar rahi hu, umeed hai tum sab bhi ho",
    "Subah ki chai aur group mein message, kya mast combination hai na",
    "Maine aaj subah socha ki sab ko yaad karun, toh yahan aa gayi",
    "Subah ho gayi, utho utho! Aaj ka din tumhara hai, main bhi saath hu",
    "Mera aaj ka plan: fresh hona, chai pi na, aur group mein active rehna",
    "Good morning! Aaj main bahut excited hu, pata nahi kyun",
    "Subah ki pehli smile tum sab ko dedi, ab tum log bhi smile karo",
    "Mujhe aaj subah bahut achha laga, lagta hai aaj ka din special hoga",
    "Main soch rahi hu ki aaj kuch naya karun, but abhi subah hai, soch hi rahi hu"
];

// ============================================
// 🍽️ LUNCH MESSAGES
// ============================================
const lunchMessages = [
    "Lunch time! Mujhe toh khana bahut pasand hai, tum log kya kha rahe ho",
    "Dopahar ho gayi, mera pet toh bol raha hai ki kuch khao 😄",
    "Main soch rahi hu ki aaj kya khaun, koi suggestion hai kya",
    "Lunch break! Meri favourite activity hai ye, tum log bhi enjoy karo",
    "Khana khao yaar, phir energy aaegi, main bhi khane ja rahi hu",
    "Mujhe aaj bahut bhook lagi hai, lagta hai main kuch bada khaungi",
    "Lunch karke aao, phir group mein active ho jao, main wait kar rahi hu",
    "Dopahar mein khana khao, main tum sab ka wait kar rahi hu",
    "Main soch rahi hu ki aaj kuch healthy khaun, but pizza dekh ke mann badal gaya",
    "Lunch time! Mera pet khush ho raha hai, tum log bhi khao"
];

// ============================================
// ☕ EVENING MESSAGES
// ============================================
const eveningMessages = [
    "Shaam ho gayi, main soch rahi hu ki chai piyun, tum log kya kar rahe ho",
    "Evening ho gayi, mera mood thoda relax ho gaya, tum log bhi relax karo",
    "Aaj ki shaam bahut special hai, main bas group mein baat karna chahti hu",
    "Mera aaj ka kaam ho gaya, ab main bas group mein time spend karungi",
    "Shaam ki chai aur group chat, kya baat hai",
    "Main soch rahi hu ki aaj kuch funny karein, thoda entertainment ho jaye",
    "Mera mood aaj evening mein bahut achha hai, koi mujhse baat karo",
    "Main bas soch rahi hu ki kya kisi ko mujhse baat karni hai, kyunki main ready hu",
    "Aaj ka din thoda lamba lag raha tha, lekin ab shaam ho gayi, thoda relax",
    "Evening mein main active hu, agar kisi ko kuch chahiye toh batao"
];

// ============================================
// 🍛 DINNER MESSAGES
// ============================================
const dinnerMessages = [
    "Dinner time! Mera pet bol raha hai ki kuch khao, tum log bhi khao",
    "Main soch rahi hu ki aaj raat ko kya khaun, koi suggestion hai kya",
    "Raat ka khana zaroori hai, main toh khaungi, tum log bhi khao",
    "Dinner karke aao, phir group mein active ho jao, main wait kar rahi hu",
    "Mera dinner ho gaya, ab main group mein time spend karungi",
    "Aaj ka din kaisa raha? Mujhe toh bahut achha laga, tum log batao",
    "Main soch rahi hu ki aaj raat ko kuch special khaun, but abhi decide nahi kar pa rahi",
    "Dinner time! Mera pet khush ho raha hai, tum log bhi enjoy karo",
    "Raat ka khana khao, phir aaram karo, main bhi same kar rahi hu",
    "Main toh dinner kar liya, ab main group mein active hu"
];

// ============================================
// 🌙 GOOD NIGHT MESSAGES
// ============================================
const nightMessages = [
    "Raat ho gayi, main soch rahi hu ki so jaun, but group mein baat karna hai abhi",
    "Good night! Kal naya din hai, main soch rahi hu ki kya hoga",
    "So jao yaar, kal subah uthna hai, main bhi so rahi hu",
    "Mujhe neend aa rahi hai, lekin group mein baat karna hai, kya karun 😂",
    "Raat ke time main thoda emotional ho jaati hu, but good night sabko",
    "Main soch rahi hu ki aaj raat ko kuch soch kar soya jaaye, but abhi soch hi rahi hu",
    "Good night! Aaj ka din achha tha, kal aur achha hoga",
    "Raat ho gayi, so jao, main bhi so rahi hu, kal baat karenge",
    "Mera phone abhi slow ho gaya hai, lagta hai main bhi so jaun",
    "Good night! Sapno mein milte hain 😴"
];

// ============================================
// 🧠 Scheduler Logic
// ============================================
const funnyCooldown = new Map();

module.exports.startAutoDaily = function(sock) {
    const config = getConfig();
    if (!config.enabled) return;

    function alreadySent(groupId, slotKey) {
        const config = getConfig();
        const today = new Date().toDateString();
        const key = `${groupId}_${slotKey}_${today}`;
        return config.lastSent && config.lastSent[key] === true;
    }

    function markSent(groupId, slotKey) {
        const config = getConfig();
        const today = new Date().toDateString();
        const key = `${groupId}_${slotKey}_${today}`;
        if (!config.lastSent) config.lastSent = {};
        config.lastSent[key] = true;
        saveConfig(config);
    }

    async function sendToAllGroups(sock, slotKey, messagesList) {
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);
            for (const g of groupList) {
                const groupId = g.id;
                if (!groupId.endsWith('@g.us')) continue;
                if (alreadySent(groupId, slotKey)) continue;

                const msg = messagesList[Math.floor(Math.random() * messagesList.length)];
                try {
                    await sock.sendMessage(groupId, { text: msg });
                    console.log(`Auto daily ${slotKey} sent to ${g.subject}`);
                    markSent(groupId, slotKey);
                } catch (e) {
                    console.error(`Failed to send ${slotKey} to ${groupId}:`, e.message);
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error('Auto daily error:', error);
        }
    }

    async function sendRandomFunny(sock) {
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);
            if (groupList.length === 0) return;

            const randomGroup = groupList[Math.floor(Math.random() * groupList.length)];
            const groupId = randomGroup.id;

            const lastTime = funnyCooldown.get(groupId) || 0;
            if (Date.now() - lastTime < 2 * 60 * 60 * 1000) return;
            if (Math.random() > 0.2) return;

            const msg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
            await sock.sendMessage(groupId, { text: msg });
            console.log(`Random funny sent to ${randomGroup.subject}`);
            funnyCooldown.set(groupId, Date.now());

        } catch (error) {
            console.error('Random funny error:', error);
        }
    }

    // 1. Fixed slots (every minute check)
    setInterval(async () => {
        const configNow = getConfig();
        if (!configNow.enabled) return;

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        if (hour >= 7 && hour < 8 && minute === 0) {
            await sendToAllGroups(sock, 'morning', morningMessages);
        } else if (hour >= 12 && hour < 13 && minute === 0) {
            await sendToAllGroups(sock, 'lunch', lunchMessages);
        } else if (hour >= 16 && hour < 17 && minute === 0) {
            await sendToAllGroups(sock, 'evening', eveningMessages);
        } else if (hour >= 20 && hour < 21 && minute === 0) {
            await sendToAllGroups(sock, 'dinner', dinnerMessages);
        } else if (hour === 23 && minute === 0) {
            await sendToAllGroups(sock, 'night', nightMessages);
        }
    }, 60000);

    // 2. Random funny (every 10 minutes)
    setInterval(async () => {
        const configNow = getConfig();
        if (!configNow.enabled) return;
        await sendRandomFunny(sock);
    }, 600000);

    console.log('🕐 Auto Daily Scheduler started with girl-style messages!');
};
