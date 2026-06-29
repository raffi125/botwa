import config from '../../config.js'
import path from 'path'
import fs from 'fs'
import te from '../../src/lib/ourin-error.js'
const pluginConfig = {
    name: 'ipwho',
    alias: ['ip', 'iplookup', 'ipinfo'],
    category: 'tools',
    description: 'Lookup informasi IP address',
    usage: '.ipwho <ip>',
    example: '.ipwho 8.8.8.8',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

let thumbTools = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-games.jpg')
    if (fs.existsSync(thumbPath)) thumbTools = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '?? *?? ??????*', body = 'IP Information') {
    
    const contextInfo = {
    }
    
    if (thumbTools) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbTools,
            mediaType: 1,
            renderLargerThumbnail: true,
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const ip = m.args?.[0]
    
    if (!ip) {
        return m.reply(
            `?? *???? ?????*\n\n` +
            `> \`${m.prefix}ipwho <ip>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}ipwho 8.8.8.8\``
        )
    }
    
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
        return m.reply(`? *?????? ????? ?????*\n\n> Contoh: \`8.8.8.8\``)
    }
    
    await m.react('??')
    await m.reply(`?? *??????? ???? ??...*`)
    
    try {
        const res = await fetch(`https://ipwho.is/${ip}`)
        const data = await res.json()
        
        if (!data.success) {
            await m.react('?')
            return m.reply(`? *?? ????? ?????????*\n\n> IP ${ip} tidak valid`)
        }
        
        if (data.latitude && data.longitude) {
            await sock.sendMessage(m.chat, {
                location: {
                    degreesLatitude: data.latitude,
                    degreesLongitude: data.longitude
                }
            }, { quoted: m })
        }
        
        const text = `?? *?? ??????*\n\n` +
            `????? ?? *????s?* ?\n` +
            `? ?? IP: ${data.ip}\n` +
            `? ?? Country: ${data.country} ${data.country_code}\n` +
            `? ??? City: ${data.city || '-'}\n` +
            `? ?? Region: ${data.region || '-'}\n` +
            `? ?? Continent: ${data.continent || '-'}\n` +
            `? ?? Postal: ${data.postal || '-'}\n` +
            `? ? Timezone: ${data.timezone?.id || '-'}\n` +
            `??????????\n\n` +
            `????? ?? *?????s?* ?\n` +
            `? ?? ISP: ${data.connection?.isp || '-'}\n` +
            `? ?? ORG: ${data.connection?.org || '-'}\n` +
            `? ?? ASN: ${data.connection?.asn || '-'}\n` +
            `??????????\n\n` +
            `????? ??? *s???????* ?\n` +
            `? ?? VPN: ${data.security?.vpn ? '? Yes' : '? No'}\n` +
            `? ?? Proxy: ${data.security?.proxy ? '? Yes' : '? No'}\n` +
            `? ?? Tor: ${data.security?.tor ? '? Yes' : '? No'}\n` +
            `??????????`
        
        await m.react('?')
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: getContextInfo('?? *?? ??????*', data.country)
        }, { quoted: m })
        
    } catch (e) {
        await m.react('?')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }
