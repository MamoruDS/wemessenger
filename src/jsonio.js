import fs from 'fs'
import beautify from 'js-beautify'

export const readJSON = (json_path, expect_format = {}) => {
    if (fs.existsSync(json_path)) {
        return JSON.parse(fs.readFileSync(json_path, 'utf8'))
    }
    writeJSON(json_path, expect_format)
    return false
}

export const writeJSON = (json_path, data, empty_format = {}) => {
    if (!data) {
        data = empty_format
    }
    data = JSON.stringify(data)
    data = beautify(data, {
        indent_size: 4
    })
    fs.writeFileSync(json_path, data, 'utf8')
}