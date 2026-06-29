import axios from 'axios'
const pluginConfig = {
    name: 'instagramdl',
    alias: ['igdl', 'ig', 'instagram'],
    category: 'download',
    description: 'Download video/foto Instagram',
    usage: '.instagramdl <url>',
    example: '.instagramdl https://www.instagram.com/reel/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const IG_REGEX = /instagram\.com\/(p|reel|reels|stories|tv)\//i

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `📸 *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `> \`${m.prefix}igdl <url>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/reel/xxx\`\n` +
            `> \`${m.prefix}igdl https://www.instagram.com/p/xxx\``
        )
    }

    if (!IG_REGEX.test(url)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Instagram (reel/post/story).`)
    }

    await m.react('🕕')

    try {
        const { data } = await axios.get(`https://api.nexray.web.id/downloader/v2/instagram?url=${url}`)
        const result = data?.result
        
        if (!data.status) {
            await m.react('❌')
            return m.reply(`❌ Gagal mengambil media. Coba link lain.`)
        }

        const ctxInfo = {
        }
        
        const media = Array.isArray(result.media)
    ? result.media.map(({ type, url }) => {
        return type === "mp4"
            ? { video: { url } }
            : { image: { url } }
    })
    : []
        
            await sock.sendMessage(
    m.chat, 
    { 
        albumMessage: media,
        contextInfo: ctxInfo
    }, { quoted: m })
        

        await m.react('✅')
    } catch (err) {
        await m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

export { pluginConfig as config, handler }