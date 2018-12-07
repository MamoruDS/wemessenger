const TelegramBot = require('node-telegram-bot-api')
import * as profile from './profile'

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
            let tgBot = new TelegramBot(bot.token, {
                polling: false
            })
            //TODO:
        }
    }
}