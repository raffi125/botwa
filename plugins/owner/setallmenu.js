import config from '../../config.js'
import { getDatabase } from '../../src/lib/ourin-database.js'
import pkg from 'ourin'
const { generateWAMessageFromContent, proto } = pkg
const pluginConfig = {
    name: 'setallmenu',
    alias: ['allmenuvariant', 'allmenustyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan allmenu',
    usage: '.setallmenu <v1-v5>',
    example: '.setallmenu v2',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const VARIANTS = {
    v1: { id: 1, name: 'Simple Text', desc: 'Text biasa tanpa image/contextInfo', emoji: '📝' },
    v2: { id: 2, name: 'Image + Context', desc: 'Image + full contextInfo + forwardedNewsletter', emoji: '🖼️' },
    v3: { id: 3, name: 'Document', desc: 'Document + jpegThumbnail + contextInfo + verified quoted', emoji: '📄' },
    v4: { id: 4, name: 'Interactive Button', desc: 'Interactive message + single_select kategori + quick_reply', emoji: '🔘' },
    v5: { id: 5, name: 'NativeFlow', desc: 'NativeFlow + limited_time_offer + interactive buttons', emoji: '✨' }
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const variant = args[0]?.toLowerCase()

    if (variant) {
        const selected = VARIANTS[variant]
        if (!selected) {
            await m.reply(`❌ Variant tidak valid!\n\nGunakan: v1 s/d v5`)
            return
        }

        db.setting('allmenuVariant', selected.id)
        await db.save()

        await m.reply(
            `✅ *ᴀʟʟᴍᴇɴᴜ ᴠᴀʀɪᴀɴᴛ ᴅɪᴜʙᴀʜ*\n\n` +
            `> ${selected.emoji} *V${selected.id} — ${selected.name}*\n` +
            `> _${selected.desc}_`
        )
        return
    }

    const current = db.setting('allmenuVariant') || config.ui?.allmenuVariant || 2

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${val.emoji} ${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setallmenu ${key}`
    }))

    const bodyText =
        `📋 *sᴇᴛ ᴀʟʟᴍᴇɴᴜ ᴠᴀʀɪᴀɴᴛ*\n\n` +
        `> Variant aktif: *V${current}*\n` +
        `> _${VARIANTS[`v${current}`]?.name || 'Unknown'}_\n\n` +
        `> Pilih variant dari daftar di bawah`

    // interactive block removed
}

export { pluginConfig as config, handler }
