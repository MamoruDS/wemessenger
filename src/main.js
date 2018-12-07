import * as messenger from './messenger'
import * as colors from 'colors'

const qrTerm = require('qrcode-terminal')
const {
    Contact,
    log,
    Wechaty,
} = require('wechaty')

export const profile_path = './profile.json'

const bot = new Wechaty({
    puppet: 'wechaty-puppet-puppeteer',
    profile: 'mamoru'
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
}

const main = () => {

}

bot.on('scan', onScan)
bot.on('login', onLogin)
bot.on('logout', onLogout)
bot.on('error', onError)
bot.on('message', onMessage)

bot.start()
    .catch(console.error)