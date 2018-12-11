import * as jsonio from './jsonio'
// import * as main from './main'
// TEST ONLY
let main = {
    id_mode: 'TEMP',
    profile_path: './profile.json'
}

const objUpdate = (obj, item, value) => {
    if (typeof obj === 'object') {
        let value_old = obj[item]
        if (value || value === false) {
            obj[item] = value
        } else {
            obj[item] = value_old
        }
    }
    return obj
}

const getProfile = () => {
    let profile_default = {
        self: {},
        bots: {},
        contacts: {},
        links: {},
        rule_personal: {
            mode: "whitelist",
            mute_list: [],
            forward_list: []
        },
        rule_public: {
            mode: "whitelist",
            mute_list: [],
            forward_list: []
        },
        rule_room: {
            mode: "whitelist",
            mute_list: [],
            forward_list: []
        }
    }
    return jsonio.readJSON(main.profile_path, profile_default)
}

const setProfile = (profile_data) => {
    jsonio.writeJSON(main.profile_path, profile_data)
}

export const setSelf = (wechat_id, telegram_id, bot_id) => {
    let _profile = getProfile()
    let _self = {
        wechat_id: wechat_id,
        telegram_id: telegram_id,
        bot_id: bot_id
    }
    _profile.self = _self
    setProfile(_profile)
}

export const getBot = (bot_id) => {
    let _profile = getProfile()
    let _bot = _profile.bots[bot_id]
    return _bot
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

export const setContactUser = (payload_id, temp_id, name, alias, bind_tg_id, bind_group_chat, mute, roomBool, publicBool) => {
    let _profile = getProfile()
    let item = _profile.contacts[payload_id] || {}
    item = objUpdate(item, 'temp_id', temp_id)
    item = objUpdate(item, 'name', name)
    item = objUpdate(item, 'alias', alias)
    item = objUpdate(item, 'bind_tg_id', bind_tg_id)
    item = objUpdate(item, 'bind_group_chat', bind_group_chat)
    item = objUpdate(item, 'mute', mute)
    item = objUpdate(item, 'roomBool', roomBool)
    item = objUpdate(item, 'publicBool', publicBool)
    //TODO: log
    _profile.contacts[payload_id] = item
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
        res = [...res, contact]
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

// export const checkContact = (id, name, alias) => {

// }

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