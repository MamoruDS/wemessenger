const TelegramBot = require('node-telegram-bot-api')

const token = process.argv[2]
if (!token) {
    // console.error('')
    process.exit(1)
}

const bot = new TelegramBot(token, {
    polling: true
})

process.on('message', async (msg) => {
    let data = msg.msgData
    if (msg.isBuffer) {
        data = Buffer.from(msg.msgData)
    }
    switch (msg.msgType) {
        case 'message':
            bot.sendMessage(msg.chatId, data)
            break
        case 'photo':
            bot.sendVideo(msg.chatId, data)
            break
        case 'audio':
            bot.sendVideo(msg.chatId, data)
            break
        case 'document':
            bot.sendVideo(msg.chatId, data)
            break
        case 'sticker':
            bot.sendVideo(msg.chatId, data)
            break
        case 'video':
            bot.sendVideo(msg.chatId, data)
            break
        case 'videoNote':
            bot.sendVideo(msg.chatId, data)
            break
        case 'location':
            bot.sendVideo(msg.chatId, data)
            break
    }
})