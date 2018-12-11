const TelegramBot = require('node-telegram-bot-api')
import * as profile from './profile'
import * as format from './format'
import * as main from './main'
import * as testProfile from './test_profile'
import * as alternative from './alternative'
import * as fs from 'fs'
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

let msgConflict = {

}

const getTgBot = (contact_id, room_id) => {
    let contact = profile.getContact(contact_id)
    let bot_id = profile.getLinkedBot(contact_id)
    if (!bot_id) {
        if (contact.publicBool) {
            bot_id = profile.getBotByRule('public')
        } else if (contact.roomBool) {
            bot_id = profile.getBotByRule('room', room_id)
        } else {
            bot_id = profile.getBotByRule('personal')
        }
    }
    return bot_id
}

export const tgMessenger = (contact_id, room_id) => {
    let bot_id = getTgBot(contact_id, room_id)
    let bot = profile.getBot(bot_id)

    if (bot) {
        if (bot.enabled) {
            // let tgBot = new TelegramBot(bot.token, {
            // polling: false
            // })
        }
    }
}

export const wechatMsgHandle = async (msg) => {
    let text = msg.text()
    if (await checkConflict(msg)) return

    if (msg.type() === main.messageType.Attachment) {
        // attachment & subscription & url-share
        // console.log('MessageType: ' + 'Attachment'.red)
        console.log(text)
        let text_test = format.decodeHTML(text)
        let url = text_test
            .replace(/(.*?\<url\>)/, '')
            .replace(/(\<\/url\>.*)/, '')
        if (url) {
            tbot.sendMessage(tgUser, format.parseWechatURL(text), {
                parse_mode: 'HTML'
            })
        } else {
            let file = await msg.toFileBox()
            let stream = await file.toStream()
            tbot.sendDocument(tgUser, stream, {}, {
                filename: file.name,
                contentType: 'application/octet-stream'
            })
        }
    } else if (msg.type() === main.messageType.Audio) {
        // voice note message
        // TODO: show sound wave on telegram macos/android/ios
        let file = await msg.toFileBox()
        let stream = await file.toStream()
        tbot.sendVoice(tgUser, stream)
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
                let sticker_file_id = file.name
                sticker_file_id = sticker_file_id.replace(/(tg_sticker_unique_file_id_.*?)/g, '')
                sticker_file_id = sticker_file_id.replace(/\.gif$/g, '')
                tbot.sendSticker(tgUser, sticker_file_id)
            } else {
                let image = gm(buf, file.name)
                let tmp_name = Date.now().toString()
                image.identify(async (err, info) => {
                    if (!info.Scene) {
                        console.log('MessageType: ' + 'Image-gif-sticker'.red)
                        image.setFormat('WebP').write(`tmp/${tmp_name}.webp`, async (err) => {
                            if (err) {
                                console.log(err)
                            }
                            tbot.sendDocument(tgUser, `tmp/${tmp_name}.webp`)
                            fs.unlinkSync(`tmp/${tmp_name}.webp`)
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
                        //             tbot.sendDocument(tgUser, buffer)
                        //         }
                        //     })
                        tbot.sendDocument(tgUser, buf, {}, {
                            filename: file.name
                        })
                    }
                })
            }
        } else {
            console.log('MessageType: ' + 'Image-photo'.red)
            let stream = await file.toStream()
            tbot.sendPhoto(tgUser, stream)
        }
    } else if (msg.type() === main.messageType.Text) {
        // text message
        console.log('MessageType: ' + 'Text'.red)
        tbot.sendMessage(tgUser, text)
    } else if (msg.type() === main.messageType.Video) {
        // video message
        console.log('MessageType: ' + 'Video'.red)
        let file = await msg.toFileBox()
        let buf = await alternative.wechatVideoBuffer(file)
        tbot.sendVideo(tgUser, buf)
    } else if (msg.type() === main.messageType.Url) {
        // unknown type of message
        console.log('MessageType: ' + 'Url'.red)
        tbot.sendMessage(tgUser, format.parseWechatURL(text), {
            parse_mode: 'HTML'
        })
    } else {
        // unknown type of message
        console.log('MessageType: ' + 'Other'.red)
        // tbot.sendMessage(tgUser, text)
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
            let file_link = await tbot.getFileLink(sticker.file_id)
            let file = await FileBox.fromUrl(file_link)
            let buf = await file.toBuffer()
            gm(buf).toBuffer('gif', async (err, buffer) => {
                if (err) console.error(err)
                file = await FileBox.fromBuffer(buffer, `tg_sticker_unique_file_id_${sticker.file_id}.gif`)
                wcUser.say(file)
                setMsgConflict(wcUser.id, 'sticker', `tg_sticker_unique_file_id_${sticker.file_id}.gif`)
            })
        }
        let animation = msg.animation
        if (animation) {
            let file_link = await tbot.getFileLink(animation.file_id)
            let file = await FileBox.fromUrl(file_link, animation.file_name)
            wcUser.say(file)
            file.toFile('tmp/' + animation.file_name)
            setMsgConflict(wcUser.id, 'gif', animation.file_name)
        }
        let video_note = msg.video_note
        if (video_note) {
            // TODO: file & video sending issue
            // let file_link = await tbot.getFileLink(video_note.file_id)
            // console.log(file_link)
            // let file = await FileBox.fromUrl(file_link)
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

const checkConflict = async (msg) => {
    if (msg.self()) {
        let id = (msg.to().id || null) || msg.room().id
        let msgCheck = msgConflict[id]
        msgConflict[id] = undefined
        if (msgCheck) {
            if (msg.type() === msgCheck.type) {
                //TYPE CHECK
                let type = msg.type()
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
                }
            } else {
                console.log('no conflict: ' + 'different type.'.green)
            }
        } else {
            console.log('no conflict: ' + 'null exist.'.white)
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