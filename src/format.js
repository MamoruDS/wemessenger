import * as jsonio from './jsonio'

export const decodeHTML = (string) => {
    if (typeof string !== 'string') return undefined
    return string
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
}

export const parseWechatURL = (text) => {
    text = decodeHTML(text)
    let url = text
        .replace(/(.*?\<url\>)/, '')
        .replace(/(\<\/url\>.*)/, '')
    let title = text
        .replace(/(.*?\<title\>)/, '')
        .replace(/(\<\/title\>.*)/, '')
    let describe = text
        .replace(/(.*?\<des\>)/, '')
        .replace(/(\<\/des\>.*)/, '')
    return `${htmlTagGen('b',title)} ${htmlTagGen('a','click',url)}\n${describe}`
}

const htmlTagGen = (tag, content, href = undefined) => {
    return `<${tag}${href ? ` href="${href}"` : ""}>${content}</${tag}>`
}

export const hashTagFormat = (tagName) => {
    if (tagName === '') return ''
    if (!tagName) return 'NaN'
    tagName = tagName.replace(/[\ |\.|\,|\-|\|]/g, '_')
    tagName = tagName.replace(/[\ |\!|\#|\$|\&|\'|\"|\(|\)|\*|\+|\/|\\|\:|\;|\=|\?|\@\[|\]|\%|\^|\！|\？|\’|\‘|\“|\”|\，|\。|\（|\）|\【|\】]/g, '')
    return `#${tagName}`
}

const nullObjProp = (obj, prop = [], undefinedReturn = '') => {
    for (let i = 0; i < prop.length; i++) {
        obj = obj[prop[i]]
        if (obj === undefined) return undefinedReturn
    }
    return obj
}

export const convertWechatEmoji = (msg, replaceObj = false) => {
    if (replaceObj === true) {
        replaceObj = jsonio.readJSON('res/wechatEmoji.json', {})
        for (let key of Object.keys(nullObjProp(replaceObj, ['withOutTag'], {}))) msg = msg.replace(new RegExp(key, 'g'), nullObjProp(replaceObj, ['withOutTag', key]))
    }
    return msg.replace(/<img class="(\w*?emoji) (\w*?emoji[^"]+?)" text="(.*?)_web" src=[^>]+>/g, (a, b, c, d) => {
        if (replaceObj) {
            if (d.match(/\[.*\]/g)) {
                return nullObjProp(replaceObj, [d], d)
            } else {
                if (c==='emoji1f64d') c = 'emoji1f614' // a wechat emoji coding mistake, replace '🙍' with '😔'
                return unicode2Emoji(`0x${c.replace(/emoji/,'')}`)
            }
        } else return d
    })
}

const unicodeCovert = (code) => {
    const offset = code - 0x10000
    const lead = 0xd800 + (offset >> 10)
    const trail = 0xdc00 + (offset & 0x3ff)
    return [lead.toString(16), trail.toString(16)]
}

const unicode2Emoji = (code) => {
    code = unicodeCovert(code)
    let c = ''
    code.map(u => {
        c += `\\u${u}`
    })
    return JSON.parse(`["${c}"]`)[0]
}