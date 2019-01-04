import * as profile from './profile'
import * as format from './format'

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

export const getTelegramMessengerBot = (userId, roomId, isSelf) => {
    const isRoom = roomId ? true : false
    const userBot = getLinkByWechatContact(userId)
    const roomBot = getLinkByWechatContact(roomId)
    const userInfo = getUserInfo(userId)
    const roomInfo = getRoomInfo(roomId)
    let res = {
        botId: undefined,
        chatId: getSelfChatId(),
        muted: false,
        prefix: messagePrefix(isSelf, userInfo, userBot, roomInfo, roomBot, {
            enableHashTag: true,
            tagUserBy: 'alias',
            selfAlias: 'you(wechat)',
            spaceReplace: '.'
        })
    }
    if (isRoom) {
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
                    // TODO: if userBot not in group getChatMembersCount
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
    if (!roomId) return undefined
    return profile.getContact(roomId)
}

const getUserInfo = (userId) => {
    return profile.getContact(userId)
}

const messagePrefix = (isSelf, chatInfo, chatBot, roomInfo, roomBot, options = {
    tagUserBy: 'alias',
    selfAlias: 'you_wechat'
}) => {
    // chat(user) should be 'self' 
    const hasChatBot = chatBot ? true : false
    const isRoom = roomInfo ? true : false
    const hasRoomBot = roomBot ? true : false
    let userTag = undefined
    let roomTag = undefined

    if (isSelf) {
        userTag = format.hashTagFormat(options.selfAlias)
    } else {
        // TODO: support group alias
        userTag = chatInfo[options.tagUserBy]
    }
    if (roomInfo) {
        roomTag = format.hashTagFormat(roomInfo.topic)
    } else {
        roomTag = ''
    }

    let prefixWho = ''
    let prefixWhere = ''
    if (!hasChatBot || isRoom) prefixWho = `${userTag} `
    if (isRoom && !hasRoomBot) prefixWhere = `@ ${roomTag}`
    return `${prefixWho}${prefixWhere}`
}

export const getTelegramMessengerBotRe = (sendId, recvId, roomId, isSelf) => {
    let res = {
        botId: undefined,
        chatId: undefined,
        muted: false,
        prefix: undefined
    }
    let prefix = {
        sendInfo: getUserInfo(sendId),
        recvInfo: getUserInfo(recvId),
        roomInfo: undefined
    }
    const userId = isSelf ? recvId : sendId
    const userBot = getLinkByWechatContact(userId)
    const userInfo = getUserInfo(userId)
    if (roomId) {
        const roomInfo = getRoomInfo(roomId)
        const roomBot = getLinkByWechatContact(roomId)
        prefix.roomInfo = roomInfo
        if (roomInfo.mute) {
            res.muted = true
        } else if (roomInfo.mode === 'blacklist' && roomInfo.blacklist.indexOf(userId) !== -1) {
            res.muted = true
        } else if (roomInfo.mode === 'whitelist' && roomInfo.whitelist.indexOf(userId) === -1) {
            res.muted = true
        }
        if (roomBot) res.botId = roomBot
        if (roomInfo.bindChatId) res.chatId = roomInfo.bindChatId
    } else {
        if (userInfo.mute) {
            res.muted = true
        }
        if (userBot) {
            res.botId = userBot
            res = profile.objUpdate(res, 'chatId', userInfo.bindChatId)
        }
        if (userInfo.bindChatId) res.chatId = userInfo.bindChatId
    }
    res.prefix = genMessagePrefix(prefix, res.botId ? true : false, res.chatId ? true : false, isSelf)
    if (!res.chatId) res.chatId = getSelfChatId()
    if (!res.botId) res.botId = getDefaultBotId()
    // console.log(res)
    return res
}

const genMessagePrefix = (fieldInfo = {
    sendInfo: undefined,
    recvInfo: undefined,
    roomInfo: undefined
}, hasChatBot = false, hasBindChat = false, isSelf = false) => {
    const _options = profile.getOptions()
    const enableHashTag = _options['enableHashTag']
    const tagUserWithAlias = _options['tagUserWithAlias']
    const selfAlias = _options['selfAlias']
    const sendField = isSelf ? selfAlias : getAliasNameByInfo(fieldInfo.sendInfo, tagUserWithAlias)
    const recvField = isSelf ? fieldInfo.roomInfo ? '' : getAliasNameByInfo(fieldInfo.recvInfo, tagUserWithAlias) : ''
    const roomField = fieldInfo.roomInfo ? fieldInfo.roomInfo['topic'] : ''
    const sendTag = enableHashTag ? format.hashTagFormat(sendField) : sendField
    let recvTag = enableHashTag ? format.hashTagFormat(recvField) : recvField
    let roomTag = enableHashTag ? format.hashTagFormat(roomField) : roomField
    recvTag = recvTag ? ` to ${recvTag}` : recvTag
    roomTag = roomTag ? ` @ ${roomTag}` : roomTag
    if (hasBindChat || hasChatBot) {
        return `${sendTag}`
    } else {
        return `${sendTag}${recvTag}${roomTag}`
    }
}

const getAliasNameByInfo = (userInfo, tagUserWithAlias) => {
    let nameStr = undefined
    if (tagUserWithAlias) nameStr = userInfo['alias']
    if (!nameStr) nameStr = userInfo['name']
    return nameStr
}