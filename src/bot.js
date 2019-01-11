process.env.NTBA_FIX_319 = true
process.env.NTBA_FIX_350 = true

const TelegramBot = require('node-telegram-bot-api')
import * as fs from 'fs'
import * as msgHistory from './msgHistory'
import {
    argv
} from 'yargs'

const token = argv['token']
const botId = argv['id']
const polling = argv['polling']

if (!token) {
    // console.error('')
    process.exit(1)
}

process.on('message', async (msg) => {
    W2TMsg(msg)
})

process.on('exit', () => {
    console.log(`bot: ${botId} is exiting...`)
})

const bot = new TelegramBot(token, {
    polling: polling
})

bot.on('message', async (msg) => {
    T2WMsg(msg)
})

/**
 * @typedef pendingMsg
 * @type {Object}
 * @property {Array.<String>} botId array of pending bot id
 * @property {String} chatId message recipient's telegram id
 * @property {String} contactId current chat's contact id
 * @property {(String|Buffer)} msgData
 * @property {String} msgType
 * @property {Boolean} isBuffer
 * @property {Object} options telegram api options
 * @property {String} options.reply_markup
 * @property {String} options.filename
 * @property {String} prefixStr
 */

/**
 * replyPrefix
 * @param {String} prefix 
 * @returns {String} return prefix with 'sent this'
 */
const replyPrefix = prefix => {
    if (prefix.match(/.*<code\>to\<\/code\>.*/)) {
        return prefix.replace(/(.*)\s\<code\>to\<\/code\>\s(.*)$/g, (prefixStr, send, recv) => {
            return `${send} <i>sent this</i> <code>to</code> ${recv}`
        })
    } else {
        return `${prefix} <i>sent this</i>`
    }
}

/**
 * reqErrorCatch
 * @param {Object} res 
 * @param {Object} res.response
 * @param {pendingMsg} msg
 */
const reqErrorCatch = (res, msg) => {
    const resInfo = res.response.body
    if (!resInfo.ok && msg) {
        if (resInfo.description === 'Bad Request: chat not found') {
            reqNextBot(msg)
        } else if (resInfo.description === 'Bad Request: chat not found' || resInfo.error_code === 403) {
            reqNextBot(msg)
        }
    }
}

/**
 * reqEnd
 * @param {Object} res 
 * @param {String} contactId 
 * @param {Boolean} needReply
 * @param {Object} replyPrefix 
 */
const reqEnd = (res, contactId, needReply = false, replyPrefix = {
    chatId: undefined,
    prefix: undefined,
    options: undefined,
    fileOptions: undefined
}) => {
    if (res) {
        if (contactId) {
            msgRecord(res, contactId)
        }
        if (replyPrefix.prefix && needReply && res.message_id) {
            let prefix = replyPrefix.prefix
            if (prefix.match(/.*<code\>to\<\/code\>.*/)) {
                prefix =  prefix.replace(/(.*)\s\<code\>to\<\/code\>\s(.*)$/g, (prefixStr, send, recv) => {
                    return `${send} <i>sent this</i> <code>to</code> ${recv}`
                })
            } else {
                prefix = `${prefix} <i>sent this</i>`
            }
            replyPrefix.options.reply_to_message_id = res.message_id
            bot.sendMessage(replyPrefix.chatId, prefix, replyPrefix.options, replyPrefix.fileOptions).then((res) => {
                if (contactId) {
                    msgRecord(res, contactId)
                }
            })
        }
    }
}

/**
 * reqNextBot
 * @param {pendingMsg} msg 
 */
const reqNextBot = (msg) => {
    if (msg.botId.length > 1) {
        console.log('[INFO] request new bot.')
        // msg.botId.shift()
        msg.botId = msg.botId.slice(1)
        // msg.prefixStr.shift()
        msg.prefixStr = msg.prefixStr.slice(1)
        process.send({
            code: 'ETELEGRAM',
            fromBotId: botId,
            retry: true,
            msg: msg
        })
    } else {
        console.log('[INFO] no more bot.')
    }
}

/**
 * msgRecord
 * @param {Object} res telegram API request's response object
 * @param {(Number|String)} res.message_id telegram message id
 * @param {(Number|String)} res.date telegram message timestamp
 * @param {String} contactId current chat's contact id
 */
const msgRecord = (res, contactId) => {
    // TODO: record bot msg for reply
    // msgHistory.recordMsg(botId, res.message_id, res.date, contactId)
    return
}

/**
 * W2TMsg
 * @param {pendingMsg} msg 
 */
const W2TMsg = (msg) => {
    const contactId = msg.contactId
    let data = msg.msgData
    let options = {}
    let fileOptions = {}
    let prefix = msg.prefixStr[0] || ''
    if (prefix) {
        options.caption = prefix
    }
    options.parse_mode = 'HTML'
    options.reply_markup = msg.options.reply_markup
    fileOptions.filename = msg.options.filename || undefined
    if (msg.isBuffer) {
        data = Buffer.from(msg.msgData)
        fileOptions.contentType = 'application/octet-stream'
    }
    switch (msg.msgType) {
        case 'message':
            if (prefix) data = `${msg.prefixStr}\n${data}`
            bot.sendMessage(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, false, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'photo':
            bot.sendPhoto(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, false, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'audio':
            bot.sendAudio(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, true, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'document':
            options.caption = undefined
            bot.sendDocument(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, true, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'sticker':
            bot.sendSticker(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, true, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'video':
            bot.sendVideo(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, false, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'videoNote':
            bot.sendVideoNote(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, false, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'voice':
            bot.sendVoice(msg.chatId, data, options, fileOptions)
                .catch((err) => {
                    reqErrorCatch(err, msg)
                })
                .then((res) => {
                    reqEnd(res, contactId, true, {
                        chatId: msg.chatId,
                        prefix: prefix,
                        options: options,
                        fileOptions: fileOptions
                    })
                })
            break
        case 'location':
            // bot.sendLocation(msg.chatId, data)
            break
    }
    if (typeof data == 'string') {
        if (fs.existsSync(data)) fs.unlinkSync(data)
    }
}

/**
 * T2WMsg
 * @param {Object} msg 
 */
const T2WMsg = (msg) => {
    process.send(msg)
}