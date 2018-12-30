import * as profile from './profile'
import * as messenger from './messenger'
import * as colors from 'colors'

const qrTerm = require('qrcode-terminal')
const {
    Contact,
    log,
    Wechaty,
} = require('wechaty')

export const profilePath = './profile.json'
export const isTempId = true

export const bot = new Wechaty({
    puppet: 'wechaty-puppet-puppeteer',
    profile: 'mamoruds'
})

export const messageType = {
    Attachment: bot.Message.Type.Attachment,
    Audio: bot.Message.Type.Audio,
    Contact: bot.Message.Type.Contact,
    Emoticon: bot.Message.Type.Emoticon,
    Image: bot.Message.Type.Image,
    Text: bot.Message.Type.Text,
    Video: bot.Message.Type.Video,
    Url: bot.Message.Type.Url
}

const onScan = (qrcode, status) => {
    if (status == 0) {
        qrTerm.generate(qrcode, {
            small: true
        })
    }
    console.log('status: ' + status)
}

const onLogin = (user) => {
    console.log(`${user} login`)
    profile.expireContacts()
    profile.setSelf({
        wechatId: user.id
    }, true)
    main()
}

const onLogout = (user) => {
    console.log(`${user} logout`)
}

const onError = (e) => {
    console.error(e)
}

const onMessage = async (msg) => {
    messenger.wechatMsgHandle(msg)
    // messenger.telegramMessenger(msg)
}

const main = () => {
    messenger.initBots()
}

bot.on('scan', onScan)
bot.on('login', onLogin)
bot.on('logout', onLogout)
bot.on('error', onError)
bot.on('message', onMessage)

bot.start()
    .catch(console.error)