import * as jsonio from './jsonio'

const historyPath = '.msgHistory.json'

const getHistory = () => {
    let defaultProfile = {
        lastMsg: undefined,
        msgQueue: {}
    }
    return jsonio.readJSON(historyPath, defaultProfile)
}

const setHistory = (profileObj) => {
    jsonio.writeJSON(historyPath, profileObj)
}

export const recordMsg = (botId, msgId, msgDate, msgContact) => {
    let _history = getHistory()
    msgId = `${botId}//${msgId}`
    _history['msgQueue'][msgId] = {
        msgDate: msgDate,
        msgContact: msgContact
    }
    setHistory(_history)
}