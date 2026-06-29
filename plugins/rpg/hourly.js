import { getDatabase } from '../../src/lib/ourin-database.js'
import { addExpWithLevelCheck } from '../../src/lib/ourin-level.js'
import config from '../../config.js'
import path from 'path'
import fs from 'fs'
const pluginConfig = {
    name: 'hourly',
    alias: ['jam', 'perjam'],
    category: 'rpg',
    description: 'Klaim hadiah per jam',
    usage: '.hourly',
    example: '.hourly',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

let thumbRpg = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-rpg.jpg')
    if (fs.existsSync(thumbPath)) thumbRpg = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '? *??????*', body = 'Hadiah Per Jam') {
    
    const contextInfo = {
    }
    
    if (thumbRpg) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbRpg,
            mediaType: 1,
            renderLargerThumbnail: false,
        }
    }
    
    return contextInfo
}

function msToTime(duration) {
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const seconds = Math.floor((duration / 1000) % 60)
    return `${minutes} menit ${seconds} detik`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const isPremium = config.isPremium?.(m.sender) || false
    
    if (!user.rpg) user.rpg = {}
    
    const COOLDOWN = 3600000
    const lastClaim = user.rpg.lastHourly || 0
    const now = Date.now()
    
    if (now - lastClaim < COOLDOWN) {
        const remaining = COOLDOWN - (now - lastClaim)
        return m.reply(
            `? *s???? ?????*\n\n` +
            `> Kamu sudah klaim hadiah jam ini\n` +
            `> Kembali dalam: *${msToTime(remaining)}*`
        )
    }
    
    const expReward = isPremium ? 1000 : 200
    const moneyReward = isPremium ? 5000 : 1000
    
    user.rpg.lastHourly = now
    user.koin = (user.koin || 0) + moneyReward
    
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expReward)
    db.save()
    
    await m.react('?')
    
    let txt = `? *?????? ??????*\n\n`
    txt += `????? ?? *??????* ?\n`
    txt += `? ?? Money: *+Rp ${moneyReward.toLocaleString('id-ID')}*\n`
    txt += `? ?? Exp: *+${expReward}*\n`
    txt += `??????????\n\n`
    txt += `> Klaim lagi dalam 1 jam!`
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

export { pluginConfig as config, handler }
