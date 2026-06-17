const fs = require('fs');
const path = require('path');

const configFile = path.join(__dirname, '../../data/autoDaily.json');

function getConfig() {
    if (!fs.existsSync(configFile)) {
        fs.writeFileSync(configFile, JSON.stringify({ enabled: false, lastSent: {} }, null, 2));
        return { enabled: false, lastSent: {} };
    }
    try {
        return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch {
        return { enabled: false, lastSent: {} };
    }
}

function saveConfig(data) {
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
}

const morningMsgs = [
    "Uth gaye? Main toh soch rahi thi ki aaj subah kaun utha hai 😊",
    "Good morning! Aaj main fresh feel kar rahi hu",
    "Subah ki chai aur group mein message, kya mast combination hai",
    "Subah ho gayi, utho utho! Aaj ka din tumhara hai",
    "Main aaj subah bahut excited hu, pata nahi kyun",
    "Utho ji utho! Suraj nikla hai, aapko dekhne ke liye 🌅",
    "Aaj ki shuruaat mast karo, positivity lekar aao"
];

const lunchMsgs = [
    "Lunch time! Mujhe toh khana bahut pasand hai, tum log kya kha rahe ho",
    "Dopahar ho gayi, mera pet bol raha hai ki kuch khao 😄",
    "Main soch rahi hu ki aaj kya khaun, koi suggestion hai kya",
    "Lunch break! Meri favourite activity hai ye",
    "Khana khao yaar, phir energy aaegi",
    "🍽️ Khana khao, pet bharo, phir group mein active ho jao",
    "Bhook lagi? Khana khao, lunch break lo!"
];

const eveningMsgs = [
    "Shaam ho gayi, main soch rahi hu ki chai piyun, tum log kya kar rahe ho",
    "Evening ho gayi, mera mood thoda relax ho gaya",
    "Shaam ki chai aur group chat, kya baat hai",
    "Aaj ki shaam bahut special hai, main bas group mein baat karna chahti hu",
    "Mera aaj ka kaam ho gaya, ab main bas group mein time spend karungi",
    "☕ Chai ki chuski aur friends ke sath group chat. Kya baat!",
    "Shaam ki masti, chai aur group chat. Best combo!"
];

const dinnerMsgs = [
    "Dinner time! Mera pet bol raha hai ki kuch khao, tum log bhi khao",
    "Main soch rahi hu ki aaj raat ko kya khaun, koi suggestion hai kya",
    "Raat ka khana zaroori hai, main toh khaungi",
    "Dinner karke aao, phir group mein active ho jao",
    "Mera dinner ho gaya, ab main group mein time spend karungi",
    "🍛 Dinner ki plate aur group mein active rehna. Dono sath mein!",
    "Khana khao, pet bharo, aur phir raat bhar group mein gaadi chalao 😄"
];

const nightMsgs = [
    "Raat ho gayi, main soch rahi hu ki so jaun, but group mein baat karna hai 😂",
    "Good night! Kal naya din hai",
    "So jao yaar, kal subah uthna hai, main bhi so rahi hu",
    "Raat ke time main thoda emotional ho jaati hu",
    "Good night! Sapno mein milte hain 😴",
    "🌙 So jao ab, kal bahut kaam hai. Sweet dreams!",
    "GN! Aaj ka din shandar tha, kal aur shandar hoga"
];

const funnyMsgs = [
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
    "Group mein itna silent kyun hai? Koi toh gossip karo, main ready hu",
    "Aaj main thoda moody hu, mujhe ignore mat karna warna main naraaz ho jaungi",
    "Mera aaj ka goal: group mein sab ko hasaana, but mein khud has rahi hu 😂",
    "😆 Kya haal hai sabke? Group mein toh masti chal rahi hai!"
];

module.exports = {
    name: 'autodaily',
    aliases: ['ad'],
    category: 'owner',
    desc: 'Enable/disable auto daily messages',
    usage: 'autodaily on/off',
    ownerOnly: true,
    async execute(sock, msg, args, extra) {
        const action = args[0]?.toLowerCase();
        const config = getConfig();

        if (!action) {
            return extra.reply(`Status: ${config.enabled ? 'ON' : 'OFF'}`);
        }

        if (action === 'on') {
            config.enabled = true;
            saveConfig(config);
            startScheduler(sock);
            return extra.reply('Auto daily enabled. Test message coming...');
        }

        if (action === 'off') {
            config.enabled = false;
            saveConfig(config);
            return extra.reply('Auto daily disabled.');
        }

        return extra.reply('Usage: .autodaily on / off');
    }
};

function startScheduler(sock) {
    console.log('AutoDaily scheduler started');
    
    setInterval(async () => {
        const config = getConfig();
        if (!config.enabled) return;

        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        if (m !== 0) return;

        let slot = null, msgs = null;
        if (h >= 7 && h < 8) { slot = 'morning'; msgs = morningMsgs; }
        else if (h >= 12 && h < 13) { slot = 'lunch'; msgs = lunchMsgs; }
        else if (h >= 16 && h < 17) { slot = 'evening'; msgs = eveningMsgs; }
        else if (h >= 20 && h < 21) { slot = 'dinner'; msgs = dinnerMsgs; }
        else if (h === 23) { slot = 'night'; msgs = nightMsgs; }
        else return;

        try {
            const groups = await sock.groupFetchAllParticipating();
            const list = Object.values(groups);
            const today = new Date().toDateString();

            for (const g of list) {
                const key = g.id + '_' + slot + '_' + today;
                if (config.lastSent && config.lastSent[key]) continue;

                const msg = msgs[Math.floor(Math.random() * msgs.length)];
                await sock.sendMessage(g.id, { text: msg });
                console.log('Sent ' + slot + ' to ' + g.subject);
                
                config.lastSent = config.lastSent || {};
                config.lastSent[key] = true;
                saveConfig(config);
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (e) {
            console.log('Scheduler error:', e.message);
        }
    }, 60000);

    setInterval(async () => {
        const config = getConfig();
        if (!config.enabled) return;

        try {
            const groups = await sock.groupFetchAllParticipating();
            const list = Object.values(groups);
            if (list.length === 0) return;

            for (const g of list) {
                const msg = funnyMsgs[Math.floor(Math.random() * funnyMsgs.length)];
                await sock.sendMessage(g.id, { text: msg });
                console.log('Funny sent to ' + g.subject);
                await new Promise(r => setTimeout(r, 1500));
            }
        } catch (e) {
            console.log('Funny error:', e.message);
        }
    }, 40 * 60 * 1000);
}
