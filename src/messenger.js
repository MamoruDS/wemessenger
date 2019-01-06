import * as profile from './profile'
import * as format from './format'
import * as main from './main'
import * as alternative from './alternative'
import * as rule from './rule'
import {
    fork
} from 'child_process'
const gm = require('gm').subClass({
    imageMagick: true
})

let msgConflict = {}
let telegramBots = {}

export const initBots = () => {
    const bots = profile.getBots()
    for (let botId in bots) {
        telegramBots[botId] = spawnBot(botId)
    }
}

const spawnBot = (botId) => {
    const info = profile.getBot(botId)
    if (info.token) {
        const bot = fork('dist/bot.js', [info.token, botId])
        bot.on('message', (msg) => {
            // TODO: receive message from telegram bot
            if (msg.from.id == profile.getSelf().telegramId) {
                telegramMsgHandle(msg)
            }
        })
        bot.on('exit', () => {
            telegramBots[botId] = 'shutdown'
        })
        return bot
    }
}

const killBot = (botId) => {
    const bot = telegramBots[botId]
    if (bot) {
        bot.kill()
    } else {
        // console.error('bot not exist')
    }
}

const commandBot = (botId, chatId, contactId, prefixStr, dataInfo = {
    msgData: undefined,
    msgType: undefined,
    options: {}
}) => {
    const bot = telegramBots[botId]
    if (bot) {
        let msg = {
            chatId: chatId,
            contactId: contactId,
            msgData: undefined,
            msgType: undefined,
            isBuffer: false,
            options: dataInfo.options,
            prefixStr: prefixStr
        }
        if (Buffer.isBuffer(dataInfo.msgData)) {
            msg.msgData = JSON.parse(JSON.stringify(dataInfo.msgData)).data
            msg.isBuffer = true
        } else if (typeof dataInfo.msgData == 'string') {
            msg.msgData = dataInfo.msgData
        } else {
            return
        }
        const typeSet = ['message', 'photo', 'audio', 'document', 'sticker', 'video', 'videoNote', 'voice', 'location']
        if (typeSet.indexOf(dataInfo.msgType) !== -1) {
            msg.msgType = dataInfo.msgType
        } else {
            return
        }
        if (bot === 'shutdown') {
            // TODO: if shutdown?
            return
        }
        // bot.send(JSON.stringify(msg))
        bot.send(msg)
    }
}

const getTelegramBotByMessage = (msg) => {
    let sendId = undefined
    let recvId = undefined
    let roomId = undefined
    let isSelf = false
    if (msg.self()) {
        isSelf = true
        sendId = profile.getContactIdByWechatInfo(profile.getSelf().wechatId)
        if (!msg.room()) {
            recvId = profile.getContactIdByWechatInfo(msg.to().id, {
                wechatName: msg.to().payload.name,
                wechatAlias: msg.to().payload.alias,
                wechatType: msg.to().payload.type
            })
        }
    } else {
        sendId = profile.getContactIdByWechatInfo(msg.from().id, {
            wechatName: msg.from().payload.name,
            wechatAlias: msg.from().payload.alias,
            wechatType: msg.from().payload.type
        })
    }
    if (msg.room()) {
        roomId = profile.getContactIdByWechatInfo(msg.room().id, {
            wechatTopic: msg.room().payload.topic
        }, {
            isRoom: true,
            addContact: true
        })
    }
    return rule.getTelegramMessengerBotRe(sendId, recvId, roomId, isSelf)
}

export const wechatMsgHandle = async (msg) => {
    // TODO: improve wechatMsgHandle return a Promise
    if (await checkConflict(msg)) return
    const messenger = getTelegramBotByMessage(msg)
    const messengerId = messenger.botId
    const bindChatId = messenger.bindChatId
    const contactId = messenger.contactId
    const prefixStr = messenger.prefix
    if (messenger.muted || !messengerId || !bindChatId || !contactId) return
    let dataInfo = {
        msgData: undefined,
        msgType: undefined,
        options: {}
    }
    const callBot = () => {
        commandBot(messengerId, bindChatId, contactId, prefixStr, dataInfo)
    }
    if (msg.type() === main.messageType.Attachment) {
        // attachment & subscription & url-share
        const text = msg.text()
        console.log(text)
        let textDecode = format.decodeHTML(text)
        let url = textDecode
            .replace(/(.*?\<url\>)/, '')
            .replace(/(\<\/url\>.*)/, '')
        if (url) {
            dataInfo.msgData = format.parseWechatURL(text)
            dataInfo.msgType = 'message'
            callBot()
        } else {
            let file = await msg.toFileBox()
            let buf = await file.toBuffer()
            dataInfo.msgData = buf
            dataInfo.msgType = 'document'
            dataInfo.options.filename = file.name
            callBot()
        }
    } else if (msg.type() === main.messageType.Audio) {
        // voice note message
        let file = await msg.toFileBox()
        await file.toFile(`temp/${file.name}`)
        dataInfo.msgData = alternative.mp32opus(`temp/${file.name}`)
        dataInfo.msgType = 'voice'
        callBot()
    } else if (msg.type() === main.messageType.Contact) {
        // unknown type of message
        console.log('MessageType: ' + 'Contact'.red)
    } else if (msg.type() === main.messageType.Emoticon) {
        // unknown type of message
        console.log('MessageType: ' + 'Emoticon'.red)
    } else if (msg.type() === main.messageType.Image) {
        // normal image & custom sticker & gif & telegram sticker with file_id
        let file = await msg.toFileBox()
        let buf = await file.toBuffer()
        if (/\.gif$/.test(file.name)) {
            if (/(tg_sticker_unique_file_id_.*?)/.test(file.name)) {
                let stickerFileId = file.name
                stickerFileId = stickerFileId.replace(/(tg_sticker_unique_file_id_.*?)/g, '')
                stickerFileId = stickerFileId.replace(/\.gif$/g, '')
                dataInfo.msgData = stickerFileId
                dataInfo.msgType = 'sticker'
                callBot()
            } else {
                let image = gm(buf, file.name)
                let tempame = Date.now().toString()
                await image.identify(async (err, info) => {
                    if (!info.Scene) {
                        await image.setFormat('WebP').write(`temp/${tempame}.webp`, async (err) => {
                            if (err) console.error(err)
                            dataInfo.msgData = `temp/${tempame}.webp`
                            dataInfo.msgType = 'document'
                            callBot()
                        })
                    } else {
                        // TODO: gif with small size will shown as an attachment on telegram
                        // image.coalesce()
                        //     .resize(200, 200)
                        //     .toBuffer('gif', async (err, buffer) => {
                        //         if (err) {
                        //             console.log('[ERR]'.red + err)
                        //         } else {
                        //             messenger.sendDocument(tgUser, buffer)
                        //         }
                        //     })
                        dataInfo.msgData = buf
                        dataInfo.msgType = 'document'
                        dataInfo.options.filename = file.name
                        callBot()
                    }
                })
            }
        } else {
            let buf = await file.toBuffer()
            dataInfo.msgData = buf
            dataInfo.msgType = 'photo'
            callBot()
        }
    } else if (msg.type() === main.messageType.Text) {
        // text message
        const text = format.convertWechatEmoji(msg.text(), true)
        dataInfo.msgData = text
        dataInfo.msgType = 'message'
        callBot()
    } else if (msg.type() === main.messageType.Video) {
        // video message
        let file = await msg.toFileBox()
        let buf = await alternative.wechatVideoBuffer(file)
        dataInfo.msgData = buf
        dataInfo.msgType = 'video'
        callBot()
    } else if (msg.type() === main.messageType.Url) {
        // unknown type of message
        const text = msg.text()
        console.log('MessageType: ' + 'Url'.red)
        dataInfo.msgData = format.parseWechatURL(text)
        dataInfo.msgType = 'message'
        callBot()
    } else {
        // unknown type of message
        console.log('MessageType: ' + 'Other'.red)
        console.log(msg)
    }
}

export const telegramMsgHandle = async (msg) => {
    console.log(msg)
}

const setMsgConflict = (id, type, content) => {
    if (type === 'text') {
        type = main.messageType.Text
    } else if (type === 'sticker') {
        type = main.messageType.Image
    } else if (type === 'gif') {
        type = main.messageType.Video
    } else if (type === 'photo') {
        type = main.messageType.Image
    } else if (type === 'audio') {
        type = main.messageType.Attachment
    } else {
        type = main.messageType.Text
        content = 'unknown telegram message'
    }
    msgConflict[id] = {
        type: type,
        content: content
    }
}

const checkConflict = async (msg, log = false) => {
    if (msg.self()) {
        let conflictId = undefined
        if (msg.room()) {
            conflictId = msg.room().id
        } else {
            conflictId = msg.to().id
        }
        let msgCheck = msgConflict[conflictId]
        msgConflict[conflictId] = undefined
        if (msgCheck) {
            let type = msg.type()
            if (log) {
                const _file = await msg.toFileBox()
                const _check = {
                    type: type,
                    content: _file.name
                }
                console.log('[stored]'.white)
                console.log(msgCheck)
                console.log('[received]'.white)
                console.log(_check)
            }
            if (type === msgCheck.type) {
                //TYPE CHECK
                if (type === main.messageType.Text) {
                    if (msg.text() === msgCheck.content) {
                        return true
                    }
                } else if (type === main.messageType.Image) {
                    return await filenameCheck(msg, msgCheck.content)
                } else if (type === main.messageType.Video) {
                    return await filenameCheck(msg, msgCheck.content)
                } else if (type === main.messageType.Attachment) {
                    return await filenameCheck(msg, msgCheck.content)
                } else {
                    // console.log('no conflict: ' + 'different content.'.green)
                }
            } else {
                // console.log('no conflict: ' + 'different type.'.green)
            }
        } else {
            // console.log('no conflict: ' + 'null exist.'.white)
        }
    }
    return false
}

const filenameCheck = async (msg, content) => {
    let file = await msg.toFileBox()
    if (content === file.name) {
        return true
    } else {
        return false
    }
}