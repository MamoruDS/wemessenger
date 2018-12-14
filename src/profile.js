import * as jsonio from './jsonio'
import * as crypto from 'crypto'
import * as main from './main'

const getUniqueId = (prefix = 'unknown') => {
    return `${prefix}_${Date.now()}${crypto.randomBytes(4).toString('hex')}`
}

export const objUpdate = (obj, item, value, defaultValue) => {
    if (typeof obj === 'object') {
        let oldValue = obj[item]
        if (value || value === false) {
            obj[item] = value
        } else {
            if (obj[item] === undefined) {
                obj[item] = defaultValue
            } else {
                obj[item] = oldValue
            }
        }
    }
    return obj
}

const getProfile = () => {
    let defaultProfile = {
        self: {},
        bots: {},
        contacts: {},
        links: {}
    }
    return jsonio.readJSON(main.profilePath, defaultProfile)
}

const setProfile = (profileObj) => {
    jsonio.writeJSON(main.profilePath, profileObj)
}

export const checkSelf = () => {}

export const getSelf = () => {
    let _profile = getProfile()
    return _profile.self
}

export const setSelf = (info = {
    wechatId: undefined,
    contactId: undefined,
    telegramId: undefined
}, updateContact = false) => {
    let _profile = getProfile()
    let self = _profile.self || {}
    self = objUpdate(self, 'wechatId', info.wechatId)
    self = objUpdate(self, 'contactId', info.contactId, getUniqueId('contact'))
    self = objUpdate(self, 'telegramId', info.telegramId)
    _profile.self = self
    setProfile(_profile)
    if (updateContact) {
        setContactUser(self.contactId, {
            tempId: self.wechatId,
            bindTelegramId: self.telegramId,
            publicBool: false
        })
    }
}

export const getBot = (botId) => {
    let _profile = getProfile()
    let bot = _profile.bots[botId]
    return bot
}

export const getBots = () => {
    return getProfile().bots
}

export const setBot = (botId, mode, token, enabled) => {
    let _profile = getProfile()
    let bot = _profile.bots[botId] || {}
    bot = objUpdate(bot, 'mode', mode)
    bot = objUpdate(bot, 'token', token)
    bot = objUpdate(bot, 'enabled', enabled)
    //TODO: log
    _profile.bots[botId] = bot
    setProfile(_profile)
}

export const getDefaultBot = () => {
    let _profile = getProfile()
    let bots = _profile.bots
    let bot = undefined
    for (let i in bots) {
        if (bots[i].default) bot = bots[i]
    }
    return bot
}

export const getContact = (contactId) => {
    let _profile = getProfile()
    return _profile.contacts[contactId]
}

export const setContactUser = (contactId, info = {
    tempId: undefined,
    name: undefined,
    alias: undefined,
    bindTelegramId: undefined,
    bindChatId: undefined,
    mute: undefined,
    publicBool: undefined
}) => {
    let _profile = getProfile()
    let item = _profile.contacts[contactId] || {}
    if (!contactId) contactId = getUniqueId('contact')
    item = objUpdate(item, 'tempId', info.tempId)
    item = objUpdate(item, 'name', info.name)
    item = objUpdate(item, 'alias', info.alias)
    item = objUpdate(item, 'bindTelegramId', info.bindTelegramId)
    item = objUpdate(item, 'bindChatId', info.bindChatId)
    item = objUpdate(item, 'mute', info.mute)
    item = objUpdate(item, 'roomBool', false)
    item = objUpdate(item, 'publicBool', info.publicBool)
    //TODO: log
    _profile.contacts[contactId] = item
    setProfile(_profile)
    return contactId
}

export const setContactRoom = (contactId, info = {
    tempId: undefined,
    topic: undefined,
    mode: undefined,
    blacklist: undefined,
    whitelist: undefined,
    bindChatId: undefined,
    mention: undefined,
    mute: undefined
}) => {
    let _profile = getProfile()
    let item = _profile.contacts[contactId] || {}
    if (!contactId) contactId = getUniqueId('room')
    item = objUpdate(item, 'tempId', info.tempId)
    item = objUpdate(item, 'topic', info.topic)
    item = objUpdate(item, 'mode', info.mode)
    item = objUpdate(item, 'blacklist', info.blacklist)
    item = objUpdate(item, 'whitelist', info.whitelist)
    item = objUpdate(item, 'bindChatId', info.bindChatId)
    item = objUpdate(item, 'mention', info.mention)
    item = objUpdate(item, 'mute', info.mute)
    item = objUpdate(item, 'roomBool', true)
    //TODO: log
    _profile.contacts[contactId] = item
    setProfile(_profile)
    return contactId
}

export const searchContact = (filter = {
    name: undefined,
    aliasCheck: false,
    alias: undefined,
    topic: undefined,
    members: undefined,
    exact: false
}) => {
    let _profile = getProfile()
    let res = []
    let contacts = _profile.contacts
    for (let i in contacts) {
        let contact = contacts[i]
        if (filter.name) {
            if (filter.exact && (contact.name !== filter.name)) continue
            else if (contact.name.indexOf(filter.name) === -1) continue
        }
        if (filter.aliasCheck) {
            if (filter.exact && (contact.alias !== filter.alias)) continue
            else if (contact.alias) {
                if (contact.alias.indexOf(filter.alias) === -1) continue
            } else if (!contact.alias && filter.alias) continue
        }
        if (filter.topic) {
            if (filter.exact && (contact.topic !== filter.topic)) continue
            else if (contact.topic.indexOf(filter.topic) === -1) continue
            // TODO: check members
        }
        if (!filter.name && !filter.alias && !filter.topic && !filter.members) continue
        res = [...res, i]
    }
    return res
}

export const existContact = (wechatId) => {
    let _profile = getProfile()
    let contactId = undefined
    let contacts = _profile.contacts
    if (main.isTempId) {
        for (let i in contacts) {
            if (contacts[i].tempId === wechatId) contactId = i
        }
    } else {
        if (contacts[wechatId]) contactId = wechatId
    }
    return contactId
}

export const compareContact = (name1, name2, alias1, alias2) => {
    if (alias1 === alias2) {
        if (name1 === name2) return true
        else {
            //TODO: add conflit
            return true
        }
    } else {
        if (name1 === name2) {
            //TODO: add conflit
            return true
        } else {
            //TODO: add conflit
            return false
        }
    }
}

export const expireContacts = () => {
    let _profile = getProfile()
    let contacts = _profile.contacts
    for (let i in contacts) {
        contacts[i] = objUpdate(contacts[i], 'tempId', undefined)
    }
    _profile.contacts = contacts
    setProfile(_profile)
}

export const checkLocalContact = (wechatId, info = {
    name: undefined,
    alias: undefined,
    topic: undefined,
    members: undefined
}, updateTempId = false) => {
    if (main.isTempId) {
        let contactId = existContact(wechatId)
        if (contactId) {
            return contactId
        } else {
            let localContact = searchContact({
                name: info.name,
                aliasCheck: true,
                alias: info.alias,
                topic: info.topic,
                members: info.members,
                exact: true,
            })
            if (localContact) {
                let contactId = localContact[0]
                if (updateTempId && contactId) {
                    setContactRoom(contactId, {
                        tempId: wechatId
                    })
                }
                return contactId
            } else {
                return false
            }
        }
    } else {
        // TODO: if not TEMP id
        return false
    }
}

export const getLinks = () => {
    let _profile = getProfile()
    return _profile.links
}

export const getLinkedBot = (contactId) => {
    let _profile = getProfile()
    return _profile.links[contactId]
}

export const setLinkedBot = (contactId, botId) => {
    let _profile = getProfile()
    _profile.links[contactId] = botId
    setProfile(_profile)
}