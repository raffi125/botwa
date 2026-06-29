import config from '../../config.js'
import { getDatabase } from '../../src/lib/ourin-database.js'
import { addJadibotPremium, removeJadibotPremium, getJadibotPremiums } from '../../src/lib/ourin-jadibot-database.js'
const pluginConfig = {
    name: 'addprem',
    alias: ['addpremium', 'setprem', 'delprem', 'delpremium', 'listprem', 'premlist'],
    category: 'owner',
    description: 'Kelola premium users',
    usage: '.addprem <nomor/@tag> [hari]\n.delprem <nomor/@tag>\n.listprem\n.cekprem <nomor/@tag>',
    example: '.addprem 6281234567890 30',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    if (m.mentionedJid?.length) return m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    if (m.args?.length) return m.args[0].replace(/[^0-9]/g, '')
    return ''
}

async function handler(m, { sock, jadibotId, isJadibot }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()

    const isAdd = ['addprem', 'addpremium', 'setprem'].includes(cmd)
    const isDel = ['delprem', 'delpremium'].includes(cmd)
    const isList = ['listprem', 'premlist'].includes(cmd)

    if (!db.data.premium) db.data.premium = []

    if (isList) {
        if (isJadibot && jadibotId) {
            const jbPremiums = getJadibotPremiums(jadibotId)
            if (jbPremiums.length === 0) {
                return m.reply(`💎 Belum ada premium di jadibot ini\nGunakan \`${m.prefix}addprem\` untuk menambah`)
            }
            let txt = `💎 *DAFTAR PREMIUM JADIBOT* — ${jadibotId}\n\n`
            jbPremiums.forEach((p, i) => {
                const num = typeof p === 'string' ? p : p.jid
                txt += `${i + 1}. \`${num}\`\n`
            })
            txt += `\nTotal: *${jbPremiums.length}* premium`
            return m.reply(txt)
        }

        if (db.data.premium.length === 0) {
            return m.reply(`💎 Belum ada premium terdaftar`)
        }
        let txt = `💎 *DAFTAR PREMIUM*\n\n`
        const now = Date.now()
        db.data.premium.forEach((p, i) => {
            const num = typeof p === 'string' ? p : p.id
            const remaining = typeof p === 'object' && p.expired
                ? Math.ceil((p.expired - now) / (1000 * 60 * 60 * 24))
                : null
            const status = remaining === null ? 'Permanent' : (remaining > 0 ? remaining + 'd' : 'Expired')
            txt += `${i + 1}. \`${num}\` — ${status}\n`
        })
        txt += `\nTotal: *${db.data.premium.length}* premium`
        return m.reply(txt)
    }

    let targetNumber = await extractTarget(m)

    if (!targetNumber) {
        return m.reply(`💎 *${isAdd ? 'ADD' : 'DEL'} PREMIUM*\n\nMasukkan nomor atau tag user\n\`Contoh: ${m.prefix}${cmd} 6281234567890\``)
    }

    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }

    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ Format nomor tidak valid`)
    }

    if (isJadibot && jadibotId) {
        if (isAdd) {
            if (addJadibotPremium(jadibotId, targetNumber)) {
                await m.react('💎')
                return m.reply(`✅ Berhasil menambahkan *${targetNumber}* sebagai premium jadibot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` sudah premium di Jadibot ini`)
            }
        } else if (isDel) {
            if (removeJadibotPremium(jadibotId, targetNumber)) {
                await m.react('✅')
                return m.reply(`✅ Berhasil menghapus *${targetNumber}* dari premium jadibot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` bukan premium di Jadibot ini`)
            }
        }
        return
    }

    if (isAdd) {
        const existingIndex = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        const days = parseInt(m.args?.find(a => /^\d+$/.test(a) && a.length <= 4)) || 30
        const pushName = m.quoted?.pushName || m.pushName || 'Unknown'
        const now = Date.now()

        let newExpired

        if (existingIndex !== -1) {
            const currentData = db.data.premium[existingIndex]
            const currentExpired = typeof currentData === 'string' ? now : (currentData.expired || now)
            const baseTime = currentExpired > now ? currentExpired : now
            newExpired = baseTime + (days * 24 * 60 * 60 * 1000)

            if (typeof currentData === 'string') {
                db.data.premium[existingIndex] = {
                    id: targetNumber,
                    expired: newExpired,
                    name: pushName,
                    addedAt: now
                }
            } else {
                db.data.premium[existingIndex].expired = newExpired
                db.data.premium[existingIndex].name = pushName
            }
        } else {
            newExpired = now + (days * 24 * 60 * 60 * 1000)
            db.data.premium.push({
                id: targetNumber,
                expired: newExpired,
                name: pushName,
                addedAt: now
            })
        }

        const jid = targetNumber + '@s.whatsapp.net'
        const user = db.getUser(jid) || db.setUser(jid)

        if (user.energi !== -1) {
            user.energi = config.energi?.premium || 999999
        }
        user.isPremium = true

        db.setUser(jid, user)
        db.updateExp(jid, 200000)
        db.updateKoin(jid, 20000)

        db.save()

        await m.react('💎')
        return m.reply(`✅ Berhasil ${existingIndex !== -1 ? 'memperpanjang' : 'menambahkan'} premium *${targetNumber}* selama *${days} hari*\nExpired: *${formatDate(newExpired)}*`)
    } else if (isDel) {
        const index = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        if (index === -1) {
            return m.reply(`❌ *${targetNumber}* bukan premium`)
        }

        db.data.premium.splice(index, 1)

        const jid = targetNumber + '@s.whatsapp.net'
        const user = db.getUser(jid)
        if (user) {
            user.isPremium = false
            db.setUser(jid, user)
        }

        db.save()
        await m.react('✅')
        return m.reply(`✅ Berhasil menghapus *${targetNumber}* dari premium`)
    }
}

export { pluginConfig as config, handler }
