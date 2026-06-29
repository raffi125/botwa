import moment from 'moment-timezone'
import config from '../../config.js'
import { getDatabase } from '../../src/lib/ourin-database.js'
import path from 'path'
import fs from 'fs'
const pluginConfig = {
    name: 'kudeta',
    alias: ['coup', 'takeover'],
    category: 'owner',
    description: 'Kudeta grup - kick semua member kecuali whitelist',
    usage: '.kudeta',
    example: '.kudeta',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true,
    isAdmin: false,
    isBotAdmin: true
}

if (!global.kudetaWhitelist) global.kudetaWhitelist = {}

let thumbOwner = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-owner.jpg')
    if (fs.existsSync(thumbPath)) thumbOwner = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '?? *??????*', body = 'Coup in progress!') {
    
    const contextInfo = {
    }
    
    if (thumbOwner) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbOwner,
            mediaType: 1,
            renderLargerThumbnail: true,
        }
    }
    
    return contextInfo
}

function getOwnerNumbers() {
    const owners = []
    
    if (config.owner?.number) {
        if (Array.isArray(config.owner.number)) {
            config.owner.number.forEach(num => {
                const clean = String(num).replace(/[^0-9]/g, '')
                if (clean) owners.push(clean + '@s.whatsapp.net')
            })
        } else {
            const clean = String(config.owner.number).replace(/[^0-9]/g, '')
            if (clean) owners.push(clean + '@s.whatsapp.net')
        }
    }
    
    return owners
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const botName = config.bot?.name || sock.user?.name || 'Bot'
    
    if (args[0]?.toLowerCase() === 'confirm') {
        let groupMeta
        try {
            groupMeta = await sock.groupMetadata(m.chat)
        } catch (e) {
            return m.reply('? *?????*\n\n> Tidak bisa mengambil data grup!')
        }
        
        const participants = groupMeta.participants || []
        const ownerNumbers = getOwnerNumbers()
        const whitelist = global.kudetaWhitelist[m.chat] || []
        
        const protectedJids = [
            botNumber,
            ...ownerNumbers,
            ...whitelist
        ]
        
        const toKick = participants
            .map(p => p.jid || p.id)
            .filter(jid => {
                if (!jid) return false
                const num = jid.replace(/[^0-9]/g, '')
                return !protectedJids.some(pJid => {
                    const pNum = pJid.replace(/[^0-9]/g, '')
                    return pNum === num || pNum.includes(num) || num.includes(pNum)
                })
            })
        
        if (toKick.length === 0) {
            return m.reply('?? *????? ??? ??????*\n\n> Semua member sudah di-whitelist!')
        }
        
        await m.reply(
            `?? *?????? ???????*\n\n` +
            `> Target: *${toKick.length}* member\n` +
            `> Proses dimulai...`
        )
        
        let kicked = 0
        let failed = 0
        
        for (const jid of toKick) {
            try {
                await sock.groupParticipantsUpdate(m.chat, [jid], 'remove')
                kicked++
                await new Promise(r => setTimeout(r, 1000))
            } catch (e) {
                failed++
            }
        }
        
        try {
            await sock.groupUpdateSubject(m.chat, `DONE KUDET BY ${botName.toUpperCase()}`)
        } catch (e) {}

        try {
            await sock.groupSettingUpdate(m.chat, 'announcement')
        } catch (y) {}
        
        try {
            const desc = `?? KUDETA BERHASIL ??\n\n` +
                `Grup ini telah di-kudeta oleh ${botName}\n` +
                `Tanggal: ${moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')}\n\n` +
                `-- ${botName} --`
            await sock.groupUpdateDescription(m.chat, desc)
        } catch (e) {}
        
        await sock.sendMessage(m.chat, {
            text: `?? *?????? s???s??*\n\n` +
                `????? ?? *??s??* ?\n` +
                `? ? Berhasil: *${kicked}*\n` +
                `? ? Gagal: *${failed}*\n` +
                `? ??? Dilindungi: *${protectedJids.length}*\n` +
                `??????????\n\n` +
                `> Grup telah dikuasai!`,
            contextInfo: getContextInfo('?? KUDETA', 'Mission Complete!')
        }, { quoted: m })
        
        return
    }
    
    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(m.chat)
    } catch (e) {
        return m.reply('? *?????*\n\n> Tidak bisa mengambil data grup!')
    }
    
    const participants = groupMeta.participants || []
    const ownerNumbers = getOwnerNumbers()
    const whitelist = global.kudetaWhitelist[m.chat] || []
    
    const protectedJids = [botNumber, ...ownerNumbers, ...whitelist]
    
    const toKick = participants
        .map(p => p.jid || p.id)
        .filter(jid => {
            if (!jid) return false
            const num = jid.replace(/[^0-9]/g, '')
            return !protectedJids.some(pJid => {
                const pNum = pJid.replace(/[^0-9]/g, '')
                return pNum === num || pNum.includes(num) || num.includes(pNum)
            })
        })
    
    let text = `?? *?????? ???????*\n\n`
    text += `????? ?? *????* ?\n`
    text += `? ?? Total Member: *${participants.length}*\n`
    text += `? ?? Target Kick: *${toKick.length}*\n`
    text += `? ??? Dilindungi: *${protectedJids.length}*\n`
    text += `??????????\n\n`
    text += `> ?? *PERINGATAN*\n`
    text += `> Semua member (kecuali whitelist)\n`
    text += `> akan di-kick dari grup!\n\n`
    text += `> Ketik \`${m.prefix}kudeta confirm\`\n`
    text += `> untuk melanjutkan\n\n`
    text += `> Whitelist: \`${m.prefix}blkudeta @tag\``
    
    await sock.sendMessage(m.chat, {
        text,
        contextInfo: getContextInfo('?? KUDETA', 'Preview Mode')
    }, { quoted: m })
}

export { pluginConfig as config, handler }
