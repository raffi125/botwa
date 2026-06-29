import te from '../../src/lib/ourin-error.js'
const pluginConfig = {
    name: 'inspect',
    alias: ['cekgrup', 'groupinfo', 'channelinfo'],
    category: 'utility',
    description: 'Inspect info grup WhatsApp via link',
    usage: '.inspect <link grup>',
    example: '.inspect https://chat.whatsapp.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(
            `🔍 *ɪɴsᴘᴇᴄᴛ*\n\n` +
            `> Cek info grup via link\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}inspect https://chat.whatsapp.com/xxx\``
        )
    }

    const grupPattern = /chat\.whatsapp\.com\/([\w\d]*)/

    m.react('🔍')

    try {
        if (grupPattern.test(text)) {
            const inviteCode = text.match(grupPattern)[1]
            
            const groupInfo = await sock.groupGetInviteInfo(inviteCode)
            
            let teks = 
                `📋 *ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ ɢʀᴏᴜᴘ*\n\n` +
                `╭┈┈⬡「 📊 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ɴᴀᴍᴇ: *${groupInfo.subject}*\n` +
                `┃ 🆔 ɪᴅ: \`${groupInfo.id}\`\n` +
                `┃ 📅 ᴄʀᴇᴀᴛᴇᴅ: ${new Date(groupInfo.creation * 1000).toLocaleString('id-ID')}\n`

            if (groupInfo.owner) {
                teks += `┃ 👑 ᴄʀᴇᴀᴛᴏʀ: @${groupInfo.owner.split('@')[0]}\n`
            }

            teks += 
                `┃ 🔗 ʟɪɴᴋᴇᴅ ᴘᴀʀᴇɴᴛ: ${groupInfo.linkedParent || 'None'}\n` +
                `┃ 🔒 ʀᴇsᴛʀɪᴄᴛ: ${groupInfo.restrict ? '✅' : '❌'}\n` +
                `┃ 📢 ᴀɴɴᴏᴜɴᴄᴇ: ${groupInfo.announce ? '✅' : '❌'}\n` +
                `┃ 🏘️ ɪs ᴄᴏᴍᴍᴜɴɪᴛʏ: ${groupInfo.isCommunity ? '✅' : '❌'}\n` +
                `┃ 📣 ᴄᴏᴍᴍᴜɴɪᴛʏ ᴀɴɴᴏᴜɴᴄᴇ: ${groupInfo.isCommunityAnnounce ? '✅' : '❌'}\n` +
                `┃ ✅ ᴊᴏɪɴ ᴀᴘᴘʀᴏᴠᴀʟ: ${groupInfo.joinApprovalMode ? '✅' : '❌'}\n` +
                `┃ ➕ ᴍᴇᴍʙᴇʀ ᴀᴅᴅ ᴍᴏᴅᴇ: ${groupInfo.memberAddMode ? '✅' : '❌'}\n` +
                `┃ 👥 ᴘᴀʀᴛɪᴄɪᴘᴀɴᴛs: ${groupInfo.participants?.length || 0}\n` +
                `╰┈┈⬡\n\n`

            if (groupInfo.desc) {
                teks += `📝 *ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:*\n${groupInfo.desc}\n\n`
            }

            if (groupInfo.participants?.length > 0) {
                const admins = groupInfo.participants.filter(p => p.admin)
                if (admins.length > 0) {
                    teks += `👑 *ᴀᴅᴍɪɴs:*\n`
                    admins.forEach(a => {
                        teks += `├ @${a.id.split('@')[0]} [${a.admin}]\n`
                    })
                    teks += `╰┈┈⬡`
                }
            }

            const mentions = []
            if (groupInfo.owner) mentions.push(groupInfo.owner)
            if (groupInfo.participants) {
                groupInfo.participants.filter(p => p.admin).forEach(a => mentions.push(a.id))
            }

            m.react('✅')
            return sock.sendMessage(m.chat, { text: teks, mentions }, { quoted: m })

        } else {
            return m.reply('❌ Hanya support URL Grup WhatsApp!')
        }

    } catch (error) {
        m.react('❌')
        
        if (error.data) {
            if ([400, 406].includes(error.data)) {
                return m.reply('❌ Grup tidak ditemukan!')
            }
            if (error.data === 401) {
                return m.reply('❌ Bot di-kick dari grup tersebut!')
            }
            if (error.data === 410) {
                return m.reply('❌ URL grup telah di-reset!')
            }
        }
        
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

export { pluginConfig as config, handler }
