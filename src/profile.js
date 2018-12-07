import * as jsonio from './jsonio'
import {
    compare
} from 'semver';
// import * as main from './main'
// TEST ONLY
let main = {
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
        rule_contact: {},
        rule_room: {}
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

export const setBot = (username, token, enabled) => {
    let _profile = getProfile()
    let item = _profile.bots[username] || {}
    item = objUpdate(item, 'token', token)
    item = objUpdate(item, 'enabled', enabled)
    //TODO: log
    _profile.bots[username] = item
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

export const setContact = (payload_id, temp_id, name, alias, gender, province, signature) => {
    let _profile = getProfile()
    let item = _profile.contacts[payload_id] || {}
    item = objUpdate(item, 'temp_id', temp_id)
    item = objUpdate(item, 'name', name)
    item = objUpdate(item, 'alias', alias)
    item = objUpdate(item, 'gender', gender)
    item = objUpdate(item, 'province', province)
    item = objUpdate(item, 'signature', signature)
    //TODO: log
    _profile.contacts[payload_id] = item
    setProfile(_profile)
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
