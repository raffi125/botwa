import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } from 'ourin'
import config from '../../config.js'
import te from '../../src/lib/ourin-error.js'
const execAsync = promisify(exec)
const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-ScravBotMD'

const pluginConfig = {
    name: 'pinvid',
    alias: ['pinvideo', 'pinterestv', 'pinv'],
    category: 'search',
    description: 'Search video Pinterest (album)',
    usage: '.pinvid <query>',
    example: '.pinvid anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

async function convertM3u8ToMp4(m3u8Url, outputPath) {
    const cmd = `ffmpeg -y -i "${m3u8Url}" -c copy -bsf:a aac_adtstoasc "${outputPath}"`
    await execAsync(cmd, { timeout: 120000 })
    return fs.existsSync(outputPath)
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `📌 *ᴘɪɴᴛᴇʀᴇsᴛ ᴠɪᴅᴇᴏ sᴇᴀʀᴄʜ*\n\n` +
            `> Masukkan query pencarian\n\n` +
            `\`${m.prefix}pinvid anime\``
        )
    }
    
    m.react('🕕')
    
    // interactive block removed
}

export { pluginConfig as config, handler }
