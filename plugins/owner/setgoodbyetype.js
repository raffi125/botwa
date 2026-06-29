import fs from 'fs'
import config from '../../config.js'
import { getDatabase } from '../../src/lib/ourin-database.js'
const pluginConfig = {
    name: 'setgoodbyetype',
    alias: ['goodbyetype', 'goodbyevariant', 'goodbyestyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan goodbye message',
    usage: '.setgoodbyetype',
    example: '.setgoodbyetype',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}
const VARIANTS = {
    1: { name: 'Canvas Image', desc: 'Gambar canvas dengan foto profil' },
    2: { name: 'Carousel Cards', desc: 'Kartu interaktif dengan tombol ( NOTE: setgoodbye tidak memengaruhi ini )' },
    3: { name: 'Text Only', desc: 'Pesan teks minimalis tanpa gambar' },
    4: { name: 'Group', desc: 'ExternalAdReply group ( NOTE: setgoodbye tidak memengaruhi ini )' },
    5: { name: 'Simple', desc: 'Pesan teks simple + poto profile' }
}
async function handler(m, { sock, db }) {
    const args = m.args || []
    const variant = args[0]?.toLowerCase()
    const current = db.setting('goodbyeType') || 1
    if (variant && /^v?[1-5]$/.test(variant)) {
        const id = parseInt(variant.replace('v', ''))
        db.setting('goodbyeType', id)
        await db.save()
        await m.reply(
            `✅ Goodbye type diubah ke *V${id}*\n` +
            `*${VARIANTS[id].name}*\n` +
            `_${VARIANTS[id].desc}_`
        )
        return
    }
    const buttons = []
    for (const [id, val] of Object.entries(VARIANTS)) {
        const mark = parseInt(id) === current ? ' ✓' : ''
        buttons.push({})
    }
    await sock.sendMessage(m.chat, { image: fs.readFileSync('./assets/images/ourin.jpg'), caption: `🥗 *TIPE GOODBYE*\n\Tipe saat ini adalah versi *${current}*\n_${VARIANTS[current].name}_\n\nSilahkan pilih variant goodbye:` }, { quoted: m })
}
export { pluginConfig as config, handler }
