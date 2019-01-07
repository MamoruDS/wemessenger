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

const getDefaultBotId = () => {
    return profile.getDefaultBotId()
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
        botId: undefined,
        bindChatId: undefined,
        contactId: undefined,
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
        if (roomBot) res.botId = roomBot
        if (roomInfo.bindChatId) res.bindChatId = roomInfo.bindChatId
    } else {
        if (userInfo.mute) {
            res.muted = true
        }
        if (userBot) {
            res.botId = userBot
            res = profile.objUpdate(res, 'bindChatId', userInfo.bindChatId)
        }
        if (userInfo.bindChatId) res.bindChatId = userInfo.bindChatId
    }
    res.prefix = genMessagePrefix(res.botId, res.bindChatId, isSelf, prefix)
    if (!res.bindChatId) res.bindChatId = getSelfChatId()
    if (!res.botId) res.botId = getDefaultBotId(userInfo.isPublic)
    // console.log(res)
    return res
}

const genMessagePrefix = (hasChatBot, hasBindChat, isSelf = false, fieldInfo = {
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