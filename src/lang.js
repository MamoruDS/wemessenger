import * as jsonio from './jsonio'

const lang_path = './res/lang.json'
const lang_obj = jsonio.readJSON(lang_path, {})
const lang_code = 1
export const msgLang = (msg_type, msg_code) => {
    return lang_obj[msg_type][msg_code][lang_code] || lang_obj[msg_type][msg_code][0]
}