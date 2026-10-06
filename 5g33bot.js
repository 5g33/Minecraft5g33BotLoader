const readline = require('readline');
const mineflayer = require('mineflayer');

const MAX_BOTS = 20;
const JUMP_INTERVAL_MS = 30000;
const RECONNECT_DELAY_MS = 5000;
const JOIN_DELAY_MS = 5000;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ASCII_ART = `
╔════════════════════════════════════════════════════╗
 /$$$$$$$             /$$$$$$   /$$$$$$ 
| $$____/            /$$__  $$ /$$__  $$
| $$        /$$$$$$ |__/  \ $$|__/  \ $$
| $$$$$$$  /$$__  $$   /$$$$$/   /$$$$$/
|_____  $$| $$  \ $$  |___  $$  |___  $$
 /$$  \ $$| $$  | $$ /$$  \ $$ /$$  \ $$
|  $$$$$$/|  $$$$$$$|  $$$$$$/|  $$$$$$/
 \______/  \____  $$ \______/  \______/ 
           /$$  \ $$                    
          |  $$$$$$/                    
           \______/                     
    Minecraft Botloader to your own server
╚════════════════════════════════════════════════════╝

[!] UYARI / DISCLAIMER
────────────────────────────────────────────────────
Bu proje sadece eğlence amaçlıdır. Bir saldırı aracı
DEĞİLDİR Herhangi bir proxyye bağlı değildir ve
herhangi bir bot saldırısında kullanılamaz. Çok eski
bir projedir github sayfası boş kalmasın diye konulmuştur
Kodun ne olduğunu bilmiyorsanız
bununla bir saldırı yapamassınız yapmayın.
────────────────────────────────────────────────────
`;

const BOTS = [];

function createBots(count, nameType) {
    return Array.from({ length: count }, (_, index) => {
        const id = index + 1;

        let username;

        if (nameType === 'same') {
            username = id === 1 ? '5g33bot' : `5g33bot${id}`;
        } else {
            username = `5g33BotLoader_${id}`;
        }

        return { id, username };
    });
}

function showBots() {
    console.log('\n\x1b[36m[5g33BotLoader] Bot listesi:\x1b[0m\n');
    for (const bot of BOTS) {
        console.log(`\x1b[35m[${bot.id}]\x1b[0m ${bot.username}`);
    }
    console.log('');
}

function formatReason(reason) {
    if (!reason) return 'bilinmeyen sebep';

    if (typeof reason === 'string') return reason;

    if (reason.toString) {
        try {
            const parsed = JSON.parse(reason.toString());
            if (parsed.text) return parsed.text;
            if (parsed.extra) return JSON.stringify(parsed.extra);
        } catch (e) {}
        return reason.toString();
    }

    return String(reason);
}

function spawnBot(botInfo, options) {
    const { host, port, version } = options;

    console.log(`\x1b[36m[5g33BotLoader] ${botInfo.username} bağlanıyor...\x1b[0m`);

    const bot = mineflayer.createBot({
        host,
        port,
        username: botInfo.username,
        version: version || false
    });

    bot.on('spawn', () => {
        console.log(`\x1b[32m[5g33BotLoader] ${botInfo.username} sunucuya girdi.\x1b[0m`);

        bot._jumpInterval = setInterval(() => {
            try {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 300);
            } catch (e) {}
        }, JUMP_INTERVAL_MS);
    });

    bot.on('kicked', reason => {
        const text = formatReason(reason);
        console.log(`\x1b[31m[5g33BotLoader] ${botInfo.username} ATILDI → Sebep: ${text}\x1b[0m`);
    });

    bot.on('error', err => {
        console.log(`\x1b[31m[5g33BotLoader] ${botInfo.username} HATA → ${err.message}\x1b[0m`);
    });

    bot.on('end', reason => {
        const text = reason || 'bağlantı kapatıldı';

        if (bot._jumpInterval) clearInterval(bot._jumpInterval);

        console.log(`\x1b[33m[5g33BotLoader] ${botInfo.username} düştü → Sebep: ${text}\x1b[0m`);
        console.log(`\x1b[33m[5g33BotLoader] ${botInfo.username} ${RECONNECT_DELAY_MS / 1000}sn sonra yeniden bağlanacak...\x1b[0m`);

        setTimeout(() => spawnBot(botInfo, options), RECONNECT_DELAY_MS);
    });

    return bot;
}

function start() {
    console.clear();
    console.log(ASCII_ART);

    rl.question('\x1b[32m[?] Sunucu IP: \x1b[0m', host => {
        rl.question('\x1b[32m[?] Port (varsayılan 25565): \x1b[0m', portInput => {
            const port = Number.parseInt(portInput.trim(), 10) || 25565;

            rl.question('\x1b[32m[?] Sürüm (boş = otomatik): \x1b[0m', versionInput => {
                const version = versionInput.trim() || false;

                rl.question('\x1b[32m[?] Kaç bot? (1-20): \x1b[0m', countInput => {
                    const count = Number.parseInt(countInput.trim(), 10);

                    if (!Number.isInteger(count) || count < 1 || count > MAX_BOTS) {
                        console.log('\x1b[31m[!] Bot sayısı 1-20 arası olmalı.\x1b[0m');
                        rl.close();
                        return;
                    }

                    rl.question('\x1b[32m[?] İsim modu (normal / same): \x1b[0m', nameTypeInput => {
                        const nameType = nameTypeInput.trim().toLowerCase();

                        if (nameType !== 'normal' && nameType !== 'same') {
                            console.log('\x1b[31m[!] normal veya same.\x1b[0m');
                            rl.close();
                            return;
                        }

                        BOTS.push(...createBots(count, nameType));
                        showBots();

                        console.log(`\x1b[36m[5g33BotLoader] ${host}:${port} sunucusuna bağlanılıyor...\x1b[0m`);
                        console.log(`\x1b[36m[5g33BotLoader] Her bot ${JOIN_DELAY_MS / 1000} saniye arayla girecek.\x1b[0m\n`);

                        BOTS.forEach((botInfo, index) => {
                            setTimeout(() => {
                                spawnBot(botInfo, { host, port, version });
                            }, index * JOIN_DELAY_MS);
                        });

                        rl.close();
                    });
                });
            });
        });
    });
}

start();
