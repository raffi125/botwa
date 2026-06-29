import config from '../../config.js'
import { getDatabase } from '../../src/lib/ourin-database.js'
import pkg from 'ourin'
const { generateWAMessageFromContent, proto } = pkg
const pluginConfig = {
    name: 'setmenucat',
    alias: ['menucatvariant', 'menucatstyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan menucat',
    usage: '.setmenucat <v1-v4>',
    example: '.setmenucat v2',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const VARIANTS = {
    v1: { id: 1, name: 'Simple Text', desc: 'Text biasa tanpa contextInfo', emoji: '📝' },
    v2: { id: 2, name: 'Context + Newsletter', desc: 'Text + contextInfo + forwardedNewsletter + externalAdReply', emoji: '🖼️' },
    v3: { id: 3, name: 'Image + Caption', desc: 'Image + caption + contextInfo + forwardedNewsletter', emoji: '📸' },
    v4: { id: 4, name: 'Interactive Button', desc: 'Interactive message + single_select commands + quick_reply back', emoji: '🔘' }
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const variant = args[0]?.toLowerCase()

    if (variant) {
        const selected = VARIANTS[variant]
        if (!selected) {
            await m.reply(`❌ Variant tidak valid!\n\nGunakan: v1 s/d v4`)
            return
        }

        db.setting('menucatVariant', selected.id)
        await db.save()

        await m.reply(
            `✅ *ᴍᴇɴᴜᴄᴀᴛ ᴠᴀʀɪᴀɴᴛ ᴅɪᴜʙᴀʜ*\n\n` +
            `> ${selected.emoji} *V${selected.id} — ${selected.name}*\n` +
            `> _${selected.desc}_`
        )
        return
    }

    const current = db.setting('menucatVariant') || config.ui?.menucatVariant || 2

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${val.emoji} ${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setmenucat ${key}`
    }))

    const bodyText =
        `📂 *sᴇᴛ ᴍᴇɴᴜᴄᴀᴛ ᴠᴀʀɪᴀɴᴛ*\n\n` +
        `> Variant aktif: *V${current}*\n` +
        `> _${VARIANTS[`v${current}`]?.name || 'Unknown'}_\n\n` +
        `> Pilih variant dari daftar di bawah`

    // interactive block removed
}

export { pluginConfig as config, handler }
