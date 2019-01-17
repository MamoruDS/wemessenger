import * as profile from './profile'
import * as format from './format'

// const setLinkWechatContact = (contactId, botId) => {
//     let res = {
//         error: false,
//         msg: undefined
//     }
//     const botInfo = profile.getBot(botId)
//     if (botInfo.mode === 'bind') {
//         let links = profile.getLinks()
//         for (let i in links) {
//             if (links[i] === botId) {
//                 res.error = true
//                 res.msg = profile.msgLang('ERR', '4001')
//             }
//         }
//     }
//     if (!res.error) profile.setLinkedBot(contactId, botId)
//     return res
// }

const getLinkByWechatContact = (contactId) => {
    return profile.getLinkedBot(contactId)
}

const getSelfChatId = () => {
    return profile.getSelf().telegramId
}

const getDefaultBotId = (isPublicMsg) => {
    return profile.getDefaultBotId(isPublicMsg)
}

const getRoomInfo = (roomId) => {
    if (!roomId) return undefined
    return profile.getContact(roomId)
}

const getUserInfo = (userId) => {
    return profile.getContact(userId)
}

export const getTelegramMessengerBotRe = (sendId, recvId, roomId, isSelf) => {
    let res = {
        botId: [],
        bindChatId: undefined,
        contactId: undefined,
        muted: false,
        prefix: []
    }
    let prefix = {
        sendInfo: getUserInfo(sendId),
        recvInfo: getUserInfo(recvId),
        roomInfo: undefined
    }
    let sendBot = prefix.sendInfo ? getLinkByWechatContact(sendId) : undefined
    if (isSelf && !roomId) sendBot = undefined
    if (sendBot) res.botId = [sendBot, ...res.botId]
    const userId = isSelf ? recvId : sendId
    const userBot = getLinkByWechatContact(userId)
    const userInfo = getUserInfo(userId)
    res.contactId = userId
    if (roomId) {
        res.contactId = roomId
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
        if (roomBot) res.botId = [...res.botId, roomBot]
        if (roomInfo.bindChatId) res.bindChatId = roomInfo.bindChatId
    } else {
        if (userInfo.mute) {
            res.muted = true
        }
        if (userBot) {
            res.botId = [...res.botId, userBot]
            res = profile.objUpdate(res, 'bindChatId', userInfo.bindChatId)
        }
        if (userInfo.bindChatId) res.bindChatId = userInfo.bindChatId
    }
    const isPublicMsg = userInfo ? userInfo.isPublic ? true : false : false
    if (res.botId.length > 0) {
        for (let botIndex in res.botId) {
            res.prefix[botIndex] = genMessagePrefix(res.botId[botIndex], res.bindChatId, sendBot, isSelf, prefix)
        }
    }
    res.prefix = [...res.prefix, genMessagePrefix(undefined, res.bindChatId, undefined, isSelf, prefix)]
    res.botId = [...res.botId, getDefaultBotId(isPublicMsg)]
    if (!res.bindChatId) res.bindChatId = getSelfChatId()
    return res
}

const genMessagePrefix = (hasChatBot, hasBindChat, hasSendBot, isSelf = false, fieldInfo = {
    sendInfo: undefined,
    recvInfo: undefined,
    roomInfo: undefined
}) => {
    const _options = profile.getOptions()
    const enableHashTag = _options['enableHashTag']
    const tagUserWithAlias = _options['tagUserWithAlias']
    const selfAlias = _options['selfAlias']
    const sendField = isSelf ? selfAlias : getAliasNameByInfo(fieldInfo.sendInfo, tagUserWithAlias)
    const recvField = isSelf ? fieldInfo.roomInfo ? '' : getAliasNameByInfo(fieldInfo.recvInfo, tagUserWithAlias) : ''
    const roomField = fieldInfo.roomInfo ? fieldInfo.roomInfo['topic'] : ''
    let sendTag = enableHashTag ? format.hashTagFormat(sendField) : sendField
    let recvTag = enableHashTag ? format.hashTagFormat(recvField) : recvField
    let roomTag = enableHashTag ? format.hashTagFormat(roomField) : roomField
    // TODO: read style from options
    sendTag = sendTag ? `<b>${sendTag}</b>` : sendTag
    recvTag = recvTag ? `<b>${recvTag}</b>` : recvTag
    recvTag = recvTag ? ` <code>to</code> ${recvTag}` : recvTag
    roomTag = roomTag ? `<b>${roomTag}</b>` : roomTag
    roomTag = roomTag ? ` <code class='123'>@</code> ${roomTag}` : roomTag
    if (hasSendBot) {
        if (hasBindChat) {
            return ``
        } else {
            return `${roomTag}`
        }
    } else if (hasBindChat || hasChatBot) {
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