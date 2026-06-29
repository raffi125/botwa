import { getDatabase } from '../../src/lib/ourin-database.js'
import { addExpWithLevelCheck } from '../../src/lib/ourin-level.js'
import config from '../../config.js'
import path from 'path'
import fs from 'fs'
const pluginConfig = {
    name: 'daily',
    alias: ['harian', 'claim'],
    category: 'rpg',
    description: 'Klaim hadiah harian',
    usage: '.daily',
    example: '.daily',
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

function getContextInfo(title = '?? *?????*', body = 'Hadiah Harian') {
    
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
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const seconds = Math.floor((duration / 1000) % 60)
    return `${hours} jam ${minutes} menit ${seconds} detik`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const isPremium = config.isPremium?.(m.sender) || false
    
    if (!user.rpg) user.rpg = {}
    
    const COOLDOWN = 86400000
    const lastClaim = user.rpg.lastDaily || 0
    const now = Date.now()
    
    if (now - lastClaim < COOLDOWN) {
        const remaining = COOLDOWN - (now - lastClaim)
        return m.reply(
            `? *s???? ?????*\n\n` +
            `> Kamu sudah klaim hadiah harian hari ini\n` +
            `> Kembali dalam: *${msToTime(remaining)}*`
        )
    }
    
    const expReward = isPremium ? 5000 : 1000
    const moneyReward = isPremium ? 25000 : 5000
    const energiReward = isPremium ? 10 : 3
    
    user.rpg.lastDaily = now
    user.koin = (user.koin || 0) + moneyReward
    user.energi = (user.energi || 0) + energiReward
    
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expReward)
    db.save()
    
    await m.react('??')
    
    let txt = `?? *????? ??????*\n\n`
    txt += `????? ?? *??????* ?\n`
    txt += `? ?? Money: *+Rp ${moneyReward.toLocaleString('id-ID')}*\n`
    txt += `? ?? Exp: *+${expReward}*\n`
    txt += `? ? Energi: *+${energiReward}*\n`
    txt += `??????????\n\n`
    txt += `> ${isPremium ? '? Premium Bonus!' : 'Upgrade ke Premium untuk reward lebih!'}`
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

export { pluginConfig as config, handler }
