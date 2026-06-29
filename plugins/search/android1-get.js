import axios from 'axios'
import config from '../../config.js'
import te from '../../src/lib/ourin-error.js'
const pluginConfig = {
    name: 'android1-get',
    alias: ['an1get', 'an1dl'],
    category: 'search',
    description: 'Download APK dari Android1',
    usage: '.android1-get <url>',
    example: '.android1-get https://an1.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-ScravBotMD'

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url || !url.includes('an1.com')) {
        return m.reply(`? URL tidak valid! Harus URL dari an1.com`)
    }
    
    m.react('??')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/an1-get?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!data?.status || !data?.data) {
            throw new Error('Gagal mengambil detail APK')
        }
        
        const app = data.data
        if (app.url) {
            await sock.sendMessage(m.chat, {
                document: { url: app.url },
                fileName: app.name,
                mimetype: 'application/vnd.android.package-archive'
            }, { quoted: m })
            
            m.react('?')
        } else {
            let caption = `> ?? Download URL tidak tersedia`
            
            await sock.sendMessage(m.chat, {
                text: caption,
                interactiveButtons: []
            }, { quoted: m })
            
            m.react('??')
        }
        
    } catch (err) {
        console.log(err)
        m.react('?')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }
