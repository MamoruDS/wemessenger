const TelegramBot = require('node-telegram-bot-api')
import * as fs from 'fs'

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
    let options = {}
    let fileOptions = {}
    options.parse_mode = 'HTML'
    fileOptions.filename = msg.options.filename || undefined
    if (msg.isBuffer) {
        data = Buffer.from(msg.msgData)
        fileOptions.contentType = 'application/octet-stream'
    }
    switch (msg.msgType) {
        case 'message':
            bot.sendMessage(msg.chatId, data, options, fileOptions)
            break
        case 'photo':
            bot.sendPhoto(msg.chatId, data, options, fileOptions)
            break
        case 'audio':
            bot.sendAudio(msg.chatId, data, options, fileOptions)
            break
        case 'document':
            bot.sendDocument(msg.chatId, data, options, fileOptions)
            break
        case 'sticker':
            bot.sendSticker(msg.chatId, data, options, fileOptions)
            break
        case 'video':
            bot.sendVideo(msg.chatId, data, options, fileOptions)
            break
        case 'videoNote':
            bot.sendVideoNote(msg.chatId, data, options, fileOptions)
            break
        case 'voice':
            bot.sendVoice(msg.chatId, data, options, fileOptions)
            break
        case 'location':
            // bot.sendLocation(msg.chatId, data)
            break
    }
    if (typeof data == 'string') {
        if (fs.lstatSync(data).isFile()) fs.unlinkSync(data)
    }
})