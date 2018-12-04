import fs from 'fs'
import beautify from 'js-beautify'

export const readJSON = (json_path) => {
    return JSON.parse(fs.readFileSync(json_path, 'utf8'))
}

export const writeJSON = (json_path, data, default_data = {}) => {
    if (!data) {
        data = default_data
    }
    data = JSON.stringify(data)
    data = beautify(data, {
        indent_size: 4
    })
    fs.writeFileSync(json_path, data, 'utf8')
}