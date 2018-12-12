import * as jsonio from './jsonio'
import * as crypto from 'crypto'
import * as main from './main'

const getUniqueId = (prefix = 'unknown') => {
    return `${prefix}_${Date.now()}${crypto.randomBytes(4).toString('hex')}`
}

const objUpdate = (obj, item, value, default_value) => {
    if (typeof obj === 'object') {
        let value_old = obj[item]
        if (value || value === false) {
            obj[item] = value
        } else {
            if (default_value || value === false) {
                obj[item] = default_value
            } else {
                obj[item] = value_old
            }
        }
    }
    return obj
}

const getProfile = () => {
    let profile_default = {
        self: {},
        bots: {},
        contacts: {},
        links: {}
    }
    return jsonio.readJSON(main.profile_path, profile_default)
}

const setProfile = (profile_data) => {
    jsonio.writeJSON(main.profile_path, profile_data)
}

export const checkSelf = () => {}

export const getSelf = () => {
    let _profile = getProfile()
    return _profile.self
}

export const setSelf = (info = {
    wechat_id: undefined,
    contact_id: undefined,
    telegram_id: undefined
}, updateContact = false) => {
    let _profile = getProfile()
    let self = _profile.self || {}
    self = objUpdate(self, 'wechat_id', info.wechat_id)
    self = objUpdate(self, 'contact_id', info.contact_id, getUniqueId('contact'))
    self = objUpdate(self, 'telegram_id', info.telegram_id)
    _profile.self = self
    setProfile(_profile)
    if (updateContact) {
        setContactUser(self.contact_id, {
            temp_id: self.wechat_id,
            bind_tg_id: self.telegram_id,
            publicBool: false
        })
    }
}

export const getBot = (bot_id) => {
    let _profile = getProfile()
    let _bot = _profile.bots[bot_id]
    return _bot
}

export const getBots = () => {
    return getProfile().bots
}

export const setBot = (bot_id, mode, token, enabled) => {
    let _profile = getProfile()
    let item = _profile.bots[bot_id] || {}
    item = objUpdate(item, 'mode', mode)
    item = objUpdate(item, 'token', token)
    item = objUpdate(item, 'enabled', enabled)
    //TODO: log
    _profile.bots[bot_id] = item
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

export const getContact = (contact_id) => {
    let _profile = getProfile()
    return _profile.contacts[contact_id]
}

export const setContactUser = (contact_id, info = {
    temp_id: undefined,
    name: undefined,
    alias: undefined,
    bind_tg_id: undefined,
    bind_group_chat: undefined,
    mute: undefined,
    publicBool: undefined
}) => {
    let _profile = getProfile()
    let item = _profile.contacts[contact_id] || {}
    item = objUpdate(item, 'temp_id', info.temp_id)
    item = objUpdate(item, 'name', info.name)
    item = objUpdate(item, 'alias', info.alias)
    item = objUpdate(item, 'bind_tg_id', info.bind_tg_id)
    item = objUpdate(item, 'bind_group_chat', info.bind_group_chat)
    item = objUpdate(item, 'mute', info.mute)
    item = objUpdate(item, 'roomBool', false)
    item = objUpdate(item, 'publicBool', info.publicBool)
    //TODO: log
    _profile.contacts[contact_id] = item
    setProfile(_profile)
}

export const setContactRoom = (payload_id, temp_id, topic, mode, blacklist, whitelist, bind_group_chat, mention, mute, roomBool) => {
    let _profile = getProfile()
    let item = _profile.contacts[payload_id] || {}
    item = objUpdate(item, 'temp_id', temp_id)
    item = objUpdate(item, 'topic', topic)
    item = objUpdate(item, 'mode', mode)
    item = objUpdate(item, 'blacklist', blacklist)
    item = objUpdate(item, 'whitelist', whitelist)
    item = objUpdate(item, 'bind_group_chat', bind_group_chat)
    item = objUpdate(item, 'mention', mention)
    item = objUpdate(item, 'mute', mute)
    item = objUpdate(item, 'roomBool', roomBool)
    //TODO: log
    _profile.contacts[payload_id] = item
    setProfile(_profile)
}

export const searchContact = (filter = {
    name: undefined,
    aliasCheck: false,
    alias: undefined,
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
        res = [...res, i]
    }
    return res
}

export const existContact = (wechat_id) => {
    let _profile = getProfile()
    let contact_id = undefined
    let contacts = _profile.contacts
    if (main.id_mode === 'TEMP') {
        for (let i in contacts) {
            if (contacts[i].temp_id === wechat_id) contact_id = i
        }
    } else {
        if (contacts[wechat_id]) contact_id = wechat_id
    }
    return contact_id
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
        contacts[i] = objUpdate(contacts[i], 'temp_id', undefined)
    }
    _profile.contacts = contacts
    setProfile(_profile)
}

export const checkLocalContact = (wechat_id, name, alias) => {
    if (main.id_mode === 'TEMP') {
        let contact_id = existContact(wechat_id)
        if (contact_id) {
            return contact_id
        } else {
            let local_contact = searchContact({
                name: name,
                aliasCheck: true,
                alias: alias,
                exact: true
            })
            if (local_contact) {
                return local_contact[0]
            } else {
                return false
            }
        }
    } else {
        //TODO: if not TEMP id
        return false
    }
}

export const getLinks = () => {
    let _profile = getProfile()
    return _profile.links
}

export const getLinkedBot = (contact_id) => {
    let _profile = getProfile()
    return _profile.links[contact_id]
}

export const setLinkedBot = (contact_id, bot_id) => {
    let _profile = getProfile()
    _profile.links[contact_id] = bot_id
    setProfile(_profile)
}