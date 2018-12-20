import axios from 'axios'
import {
    spawnSync
} from 'child_process'
import {
    unlinkSync
} from 'fs'

export const wechatVideoBuffer = async (reqInfo) => {
    const url = reqInfo.remoteUrl.replace('http://', 'https://')
    const cookie = reqInfo.headers.Cookie
    const res = await axios({
        url: url.toString(),
        method: 'get',
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Ranges': 'bytes',
            'Accept': 'video/mp4',
            'Range': 'bytes=0-',
            'Cookie': cookie.toString(),
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=0'
        },
        proxy: false,
        timeout: 5000,
        responseType: 'arraybuffer'
    })
    return res.data
}

export const mp32opus = (path, removeTemp = true) => {
    const pathMp3 = path
    const pathWav = path.replace(/\.mp3$/, '.wav')
    const pathOpus = path.replace(/\.mp3$/, '.opus')
    spawnSync('mpg123', ['-w', pathWav, pathMp3])
    spawnSync('opusenc', ['--rate', '8000', pathWav, pathOpus])
    if (removeTemp) {
        unlinkSync(pathMp3)
        unlinkSync(pathWav)
    }
    return pathOpus
}