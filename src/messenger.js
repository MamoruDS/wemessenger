const TelegramBot = require('node-telegram-bot-api')
import * as axios from 'axios'
import * as profile from './profile'
import * as format from './format'
import * as main from './main'
import * as testProfile from './test_profile'
import {
    FileBox
} from 'file-box'
const gm = require('gm').subClass({
    imageMagick: true
})

const token = testProfile.token
const tgUser = testProfile.tgUser
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
            //TODO:
        }
    }
}

export const wechatMsgHandle = async (msg) => {
    let contact = msg.from()
    let text = msg.text()
    let room = msg.room()

    if (await checkConflict(msg)) return

    console.log('\n')
    console.log(JSON.stringify(contact).white)
    console.log(JSON.stringify(room).blue)

    if (msg.type() === main.messageType.Attachment) {
        console.log('MessageType: ' + 'Attachment'.red)
        console.log(text)
        let text_test = format.decodeHTML(text)
        let url = text_test
            .replace(/(.*?\<url\>)/, '')
            .replace(/(\<\/url\>.*)/, '')
        // .replace(/(\.*&lt;\/url&gt;)/, '')
        // .replace(/(&lt;url&gt;.*?)/, '')
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
        console.log('MessageType: ' + 'Audio'.red)
        //do not show wave diagram on mobile
        let file = await msg.toFileBox()
        let stream = await file.toStream()
        tbot.sendVoice(tgUser, stream)
    } else if (msg.type() === main.messageType.Contact) {
        //NOT AVAILABLE FOR NOW
        console.log('MessageType: ' + 'Contact'.red)
    } else if (msg.type() === main.messageType.Emoticon) {
        //NOT AVAILABLE FOR NOW
        console.log('MessageType: ' + 'Emoticon'.red)
    } else if (msg.type() === main.messageType.Image) {
        // smail size gif not working
        // console.log('MessageType: ' + 'Image'.red)
        let file = await msg.toFileBox()
        let stream = await file.toStream()
        if (/\.gif$/.test(file.name)) {
            if (/(tg_sticker_unique_file_id_.*?)/.test(file.name)) {
                console.log('MessageType: ' + 'Image-sticker'.red)
                let sticker_file_id = file.name
                sticker_file_id = sticker_file_id.replace(/(tg_sticker_unique_file_id_.*?)/g, '')
                sticker_file_id = sticker_file_id.replace(/\.gif$/g, '')
                tbot.sendSticker(tgUser, sticker_file_id)
            } else {
                console.log('MessageType: ' + 'Image-gif-normal'.red)
                // console.log(file)
                // console.log('length: '.green + file.toBuffer().toString().length)
                // await file.toFile('tmp/test.gif')
                tbot.sendDocument(tgUser, stream, {}, {
                    filename: file.name
                })
            }
        } else {
            console.log('MessageType: ' + 'Image-photo'.red)
            let stream = await file.toStream()
            tbot.sendPhoto(tgUser, stream)
        }
    } else if (msg.type() === main.messageType.Text) {
        console.log('MessageType: ' + 'Text'.red)
        tbot.sendMessage(tgUser, text)
    } else if (msg.type() === main.messageType.Video) {
        console.log('MessageType: ' + 'Video'.red)
        // Unhandled rejection Error: ETELEGRAM: 400 Bad Request: file must be non-empty
        let file = await msg.toFileBox()
        let stream = await file.toBuffer()
        // tbot.sendVideo(tgUser, file.remoteUrl)
        console.log(stream.toString().length)
        axios.request(file.remoteUrl, {
                headers: file.headers,
                proxy: false
            })
            .then((res) => {
                console.log(res.data)
                console.log(typeof res.data)
                tbot.sendVideo(tgUser, Buffer.from(res.data))
            })
    } else if (msg.type() === main.messageType.Url) {
        console.log('MessageType: ' + 'Url'.red)
        tbot.sendMessage(tgUser, format.parseWechatURL(text), {
            parse_mode: 'HTML'
        })
    } else {
        console.log('MessageType: ' + 'Other'.red)
        // tbot.sendMessage(tgUser, text)
        console.log(msg)
    }
}

tbot.on('message', async (msg) => {
    // console.log(msg)
    let text = msg.text
    if (text) {
        let mamoru = await main.bot.Contact.find({
            alias: 'mamoru-test'
        })
        if (mamoru) {
            mamoru.say(text)
            setMsgConflict(mamoru.id, 'text', text)
        }
    }
    let sticker = msg.sticker
    if (sticker) {
        // let file_link = await tbot.getFileLink(sticker.file_id)
        // console.log(file_link)
        // let file = await FileBox.fromUrl(file_link)
        let mamoru = await main.bot.Contact.find({
            alias: 'mamoru-test'
        })
        let file_link = await tbot.getFileLink(sticker.file_id)
        console.log(file_link)
        let file = await FileBox.fromUrl(file_link)
        let buf = await file.toBuffer()

        gm(buf).toBuffer('gif', async (err, buffer) => {
            if (err) console.error(err)
            file = await FileBox.fromBuffer(buffer, `tg_sticker_unique_file_id_${sticker.file_id}.gif`)
            if (mamoru) {
                mamoru.say(file)
                setMsgConflict(mamoru.id, 'sticker', `tg_sticker_unique_file_id_${sticker.file_id}.gif`)
            }
        })
    }

})

export const telegramMsgHandle = () => {

}

const setMsgConflict = (id, type, content) => {
    if (type === 'text') {
        type = main.messageType.Text
    } else if (type === 'sticker') {
        type = main.messageType.Image
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