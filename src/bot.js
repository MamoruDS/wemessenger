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
    let options = msg.options
    options.parse_mode = 'HTML'
    if (msg.isBuffer) {
        data = Buffer.from(msg.msgData)
        options.contentType = 'application/octet-stream'
    }
    switch (msg.msgType) {
        case 'message':
            bot.sendMessage(msg.chatId, data, options)
            break
        case 'photo':
            bot.sendPhoto(msg.chatId, data, options)
            break
        case 'audio':
            bot.sendAudio(msg.chatId, data, options)
            break
        case 'document':
            bot.sendDocument(msg.chatId, data, options)
            break
        case 'sticker':
            bot.sendSticker(msg.chatId, data, options)
            break
        case 'video':
            bot.sendVideo(msg.chatId, data, options)
            break
        case 'videoNote':
            bot.sendVideoNote(msg.chatId, data, options)
            break
        case 'voice':
            bot.sendVoice(msg.chatId, data, options)
            break
        case 'location':
            // bot.sendLocation(msg.chatId, data)
            break
    }
})