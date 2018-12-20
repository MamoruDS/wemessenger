import * as profile from './profile'

const setLinkWechatContact = (contactId, botId) => {
    let res = {
        error: false,
        msg: undefined
    }
    const botInfo = profile.getBot(botId)
    if (botInfo.mode === 'bind') {
        let links = profile.getLinks()
        for (let i in links) {
            if (links[i] === botId) {
                res.error = true
                res.msg = profile.msgLang('ERR', '4001')
            }
        }
    }
    if (!res.error) profile.setLinkedBot(contactId, botId)
    return res
}

const getLinkByWechatContact = (contactId) => {
    return profile.getLinkedBot(contactId)
}

const getSelfChatId = () => {
    return profile.getSelf().telegramId
}

export const getTelegramMessengerBot = (userId, roomId) => {
    const isRoom = roomId ? true : false
    const userBot = getLinkByWechatContact(userId)
    const roomBot = getLinkByWechatContact(roomId)
    const userInfo = getUserInfo(userId)
    let res = {
        botId: undefined,
        chatId: getSelfChatId(),
        muted: false
    }
    if (isRoom) {
        const roomInfo = getRoomInfo(roomId)
        if (roomInfo.mute) {
            res.muted = true
        } else if (roomInfo.mode === 'blacklist') {
            if (roomInfo.blacklist.indexOf(userId) !== -1) {
                res.muted = true
            }
        } else if (roomInfo.mode === 'whitelist') {
            if (roomInfo.blacklist.indexOf(userId) === -1) {
                res.muted = true
            }
        }
        if (roomBot) {
            if (roomInfo.bindChatId) {
                if (userBot) {
                    res.botId = userBot
                    res.chatId = roomInfo.bindChatId
                    //TODO: if userBot not in group getChatMembersCount
                } else {
                    res.botId = roomBot
                    res.chatId = roomInfo.bindChatId
                }
            } else {
                res.botId = roomBot
            }
        } else {
            res.botId = getDefaultBotId()
        }
    } else {
        if (userBot) {
            res.botId = userBot
            res = profile.objUpdate(res, 'chatId', userInfo.bindChatId)
        } else {
            res.botId = getDefaultBotId()
        }
    }
    console.log(res)
    return res
}

const getDefaultBotId = () => {
    return profile.getDefaultBotId()
}

const getBotInfo = (botId) => {
    return profile.getBot(botId)
}

const getRoomInfo = (roomId) => {
    return profile.getContact(roomId)
}

const getUserInfo = (userId) => {
    return profile.getContact(userId)
}