import axios from 'axios'

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