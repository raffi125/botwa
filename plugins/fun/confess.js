import config from '../../config.js'
import te from '../../src/lib/ourin-error.js'
const pluginConfig = {
    name: 'confess',
    alias: ['confession', 'menfess', 'anonim'],
    category: 'fun',
    description: 'Kirim pesan anonim ke seseorang',
    usage: '.confess nomor|pesan',
    example: '.confess 6281234567890|Hai, aku suka kamu!',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 1,
    isEnabled: true
}

if (!global.confessData) global.confessData = new Map()

async function handler(m, { sock }) {
    const input = m.fullArgs?.trim() || m.text?.trim()
    
    if (!input || !input.includes('|')) {
        return m.reply(
            `?? *????????s ?????ss*\n\n` +
            `> Kirim pesan anonim ke seseorang!\n\n` +
            `????? ?? *???? ?????* ?\n` +
            `? Format:\n` +
            `? \`${m.prefix}confess nomor|pesan\`\n` +
            `?\n` +
            `? Contoh:\n` +
            `? \`${m.prefix}confess 6281234567890|Hai kamu!\`\n` +
            `??????????\n\n` +
            `> ?? Identitasmu akan dirahasiakan!`
        )
    }
    
    const [rawNumber, ...messageParts] = input.split('|')
    const message = messageParts.join('|').trim()
    
    if (!rawNumber || !message) {
        return m.reply(`? Format salah!\n\n> Gunakan: \`${m.prefix}confess nomor|pesan\``)
    }
    
    let targetNumber = rawNumber.trim().replace(/[^0-9]/g, '')
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`? Nomor tidak valid!`)
    }
    
    const targetJid = targetNumber + '@s.whatsapp.net'
    
    const senderNumber = m.sender.split('@')[0]
    if (targetNumber === senderNumber) {
        return m.reply(`? Tidak bisa mengirim confess ke diri sendiri!`)
    }
    
    try {
        const [onWa] = await sock.onWhatsApp(targetNumber)
        if (!onWa?.exists) {
            return m.reply(`? Nomor \`${targetNumber}\` tidak terdaftar di WhatsApp!`)
        }
    } catch (e) {}
    
    if (message.length < 5) {
        return m.reply(`? Pesan terlalu pendek! Minimal 5 karakter.`)
    }
    
    if (message.length > 1000) {
        return m.reply(`? Pesan terlalu panjang! Maksimal 1000 karakter.`)
    }

    const confessText = 
        `?? *??? ??s?? ???? s?s?????? ?????*\n\n` +
        `? ?? *??s??: ???? s?s??????* ?\n` +
        ` ?? *?s? ??s??:*\n` +
        `\`\`\`${message}\`\`\`\n` +
        `> ?? _Identitas pengirim dirahasiakan_\n` +
        `> ?? _Reply pesan ini untuk membalas!_`
    
    try {
        const sentMsg = await sock.sendMessage(targetJid, {
            text: confessText
        })
        
        global.confessData.set(sentMsg.key.id, {
            senderJid: m.sender,
            senderChat: m.chat,
            targetJid: targetJid,
            createdAt: Date.now()
        })
        
        setTimeout(() => {
            global.confessData.delete(sentMsg.key.id)
        }, 24 * 60 * 60 * 1000)
        
        await m.reply(
            `? *?????ss ????????!*\n\n` +
            `> Pesan dikirim ke: \`${targetNumber}\`\n` +
            `> Identitasmu terjaga aman! ??\n\n` +
            `> ?? Jika dia membalas, balasannya akan dikirim ke sini!`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

async function replyHandler(m, { sock }) {
    if (!m.quoted) return false
    
    const quotedId = m.quoted?.id || m.quoted?.key?.id
    if (!quotedId) return false
    
    const confessInfo = global.confessData.get(quotedId)
    if (!confessInfo) return false
    
    if (m.sender !== confessInfo.targetJid) return false
    
    const replyMessage = m.body?.trim()
    if (!replyMessage) return false
    
    
    const replyText = 
        `?? *????s?? ???? ????? ???? ???? ?????ss!*\n\n` +
        `? ?? *????s??* ?\n` +
        ` ?? *?s? ??s??:*\n` +
        `\`\`\`${replyMessage}\`\`\`\n` +
        `> ?? _Identitas tetap dirahasiakan_`
    
    try {
        await sock.sendMessage(confessInfo.senderChat, {
            text: replyText
        })
        
        await sock.sendMessage(m.chat, {
            text: `? Balasanmu telah terkirim secara anonim!`
        })
        
        global.confessData.delete(quotedId)
        
        return true
    } catch (error) {
        return false
    }
}

export { pluginConfig as config, handler, replyHandler }
