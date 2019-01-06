import * as fs from 'fs'
import * as convert from 'xml-js'
import * as jsonio from './jsonio'

export const decodeHTML = (string) => {
    if (typeof string !== 'string') return undefined
    return string.replace(/&apos;/g, "'")
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