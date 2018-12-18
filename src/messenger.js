const TelegramBot = require('node-telegram-bot-api')
import * as profile from './profile'
import * as format from './format'
import * as main from './main'
import * as testProfile from './test_profile'
import * as alternative from './alternative'
import * as fs from 'fs'
import {
    fork
} from 'child_process'
import {
    FileBox
} from 'file-box'
const gm = require('gm').subClass({
    imageMagick: true
})

const token = testProfile.token
const tgUser = testProfile.tgUser
const wcUserAlias = testProfile.wcUser
const tbot = new TelegramBot(token, {
    polling: true
})

let msgConflict = {}
let telegramBots = {}

const initBots = () => {
    const bots = profile.getBots()
    for (let botId in bots) {
        telegramBots[botId] = spawnBot(botId)
    }
}

const spawnBot = (botId) => {
    const info = profile.getBot(botId)
    const bot = fork('./bot.js', [info.token])
    bot.on('message', (msg) => {
        // TODO: receive message from telegram bot
    })
    bot.on('exit', () => {
        telegramBots[botId] = undefined
    })
    return bot
}

const killBot = (botId) => {
    const bot = telegramBots[botId]
    if (bot) {
        bot.kill()
    } else {
        // console.error('bot not exist')
    }
}

const getTgBot = (contactId, roomId) => {
    // TODO: prepare to remove this function
    let contact = profile.getContact(contactId)
    let botId = profile.getLinkedBot(contactId)
    if (!botId) {
        if (contact.publicBool) {
            botId = profile.getBotByRule('public')
        } else if (contact.roomBool) {
            botId = profile.getBotByRule('room', roomId)
        } else {
            botId = profile.getBotByRule('personal')
        }
    }
    return botId
}

export const tgMessenger = (contactId, roomId) => {
    // TODO: prepare to remove this function
    let botId = getTgBot(contactId, roomId)
    let bot = profile.getBot(botId)

    if (bot) {
        // do something
    }
}

export const wechatMsgHandle = async (msg) => {
    let text = msg.text()
    if (await checkConflict(msg)) return

    if (msg.type() === main.messageType.Attachment) {
        // attachment & subscription & url-share
        // console.log('MessageType: ' + 'Attachment'.red)
        console.log(text)
        let textDecode = format.decodeHTML(text)
        let url = textDecode
            .replace(/(.*?\<url\>)/, '')
            .replace(/(\<\/url\>.*)/, '')
        if (url) {
            messenger.sendMessage(tgUser, format.parseWechatURL(text), {
                parse_mode: 'HTML'
            })
        } else {
            let file = await msg.toFileBox()
            let stream = await file.toStream()
            messenger.sendDocument(tgUser, stream, {}, {
                filename: file.name,
                contentType: 'application/octet-stream'
            })
        }
    } else if (msg.type() === main.messageType.Audio) {
        // voice note message
        // TODO: show sound wave on telegram macos/android/ios
        let file = await msg.toFileBox()
        let stream = await file.toStream()
        messenger.sendVoice(tgUser, stream)
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
                messenger.sendSticker(tgUser, stickerFileId)
            } else {
                let image = gm(buf, file.name)
                let tempame = Date.now().toString()
                image.identify(async (err, info) => {
                    if (!info.Scene) {
                        console.log('MessageType: ' + 'Image-gif-sticker'.red)
                        image.setFormat('WebP').write(`tmp/${tempame}.webp`, async (err) => {
                            if (err) {
                                console.log(err)
                            }
                            messenger.sendDocument(tgUser, `tmp/${tempame}.webp`)
                            fs.unlinkSync(`tmp/${tempame}.webp`)
                        })
                    } else {
                        console.log('MessageType: ' + 'Image-gif-gif'.red)
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
                        messenger.sendDocument(tgUser, buf, {}, {
                            filename: file.name
                        })
                    }
                })
            }
        } else {
            console.log('MessageType: ' + 'Image-photo'.red)
            let stream = await file.toStream()
            messenger.sendPhoto(tgUser, stream)
        }
    } else if (msg.type() === main.messageType.Text) {
        // text message
        console.log('MessageType: ' + 'Text'.red)
        messenger.sendMessage(tgUser, text)
    } else if (msg.type() === main.messageType.Video) {
        // video message
        console.log('MessageType: ' + 'Video'.red)
        let file = await msg.toFileBox()
        let buf = await alternative.wechatVideoBuffer(file)
        messenger.sendVideo(tgUser, buf)
    } else if (msg.type() === main.messageType.Url) {
        // unknown type of message
        console.log('MessageType: ' + 'Url'.red)
        messenger.sendMessage(tgUser, format.parseWechatURL(text), {
            parse_mode: 'HTML'
        })
    } else {
        // unknown type of message
        console.log('MessageType: ' + 'Other'.red)
        // messenger.sendMessage(tgUser, text)
        console.log(msg)
    }
}

tbot.on('message', async (msg) => {
    console.log(msg)
    let wcUser = await main.bot.Contact.find({
        alias: wcUserAlias
    })
    if (wcUser) {
        let text = msg.text
        if (text) {
            wcUser.say(text)
            setMsgConflict(wcUser.id, 'text', text)
        }
        let sticker = msg.sticker
        if (sticker) {
            let fileLink = await tbot.getFileLink(sticker.file_id)
            let file = await FileBox.fromUrl(fileLink)
            let buf = await file.toBuffer()
            gm(buf).toBuffer('gif', async (err, buffer) => {
                if (err) console.error(err)
                file = await FileBox.fromBuffer(buffer, `tg_sticker_unique_file_id_${sticker.file_id}.gif`)
                wcUser.say(file)
                setMsgConflict(wcUser.id, 'sticker', `tg_sticker_unique_file_id_${sticker.file_id}.gif`)
            })
        }
        let photo = msg.photo
        if (photo) {
            if (photo.length) {
                photo = photo[photo.length - 1]
            }
            let photoName = `photo_${Date.now()}.jpg`
            let fileLink = await tbot.getFileLink(photo.file_id)
            let file = await FileBox.fromUrl(fileLink, photoName)
            wcUser.say(file)
            setMsgConflict(wcUser.id, 'photo', photoName)
        }
        let animation = msg.animation
        if (animation) {
            let fileLink = await tbot.getFileLink(animation.file_id)
            let file = await FileBox.fromUrl(fileLink, animation.file_name)
            wcUser.say(file)
            file.toFile('tmp/' + animation.file_name)
            // setMsgConflict(wcUser.id, 'gif', animation.file_name)
        }
        let video_note = msg.video_note
        if (video_note) {
            // TODO: file & video sending issue
            // let fileLink = await tbot.getFileLink(video_note.file_id)
            // console.log(fileLink)
            // let file = await FileBox.fromUrl(fileLink)
            // // let buf = await file.toBuffer()
            // wcUser.say(file)
            // // file.toFile('tmp/' + video_note.file_name)
            // // setMsgConflict(wcUser.id, 'gif', video_note.file_name)
        }
        let voice = msg.voice
        if (voice) {
            // TODO: web wechat doesn't support voice message sending, waiting for windows-client puppet(?)
        }
    }
})

export const telegramMsgHandle = () => {

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
        let id = (msg.to().id || null) || msg.room().id
        let msgCheck = msgConflict[id]
        msgConflict[id] = undefined
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