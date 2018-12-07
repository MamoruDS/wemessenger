import * as jsonio from './jsonio'
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
    let bot = _profile.bots[username] || {}
    bot = objUpdate(bot, 'token', token)
    bot = objUpdate(bot, 'enabled', enabled)
    console.log(bot)
    _profile.bots[username] = bot
    setProfile(_profile)
}
