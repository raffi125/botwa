import { loadSent, saveSent, loadState, saveState, getOngoingAnimeList, startAutoCheck, stopAutoCheck, runCheck, isRunning } from '../../src/lib/ourin-auto-anime.js'
import config from '../../config.js'
import te from '../../src/lib/ourin-error.js'
const pluginConfig = {
    name: 'autoanimewinbu',
    alias: ['aaw', 'autoanime'],
    category: 'anime',
    description: 'Auto upload ongoing anime & donghua dari winbu.net (720p Pixeldrain)',
    usage: '.autoanimewinbu <start|stop|status|cek|list|reset|addgrup|delgrup>',
    example: '.autoanimewinbu start',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, args }) {
    const sub = m.text
    const state = loadState()


    switch (sub) {
        case 'start': {
            if (isRunning()) {
                return m.reply(`⚠️ AutoAnime sudah berjalan!`)
            }

            const groups = state.groups || []
            if (groups.length === 0) {
                return m.reply(
                    `❌ Belum ada grup target!\n\n` +
                    `> Tambahkan grup dulu:\n` +
                    `> \`${m.prefix}autoanimewinbu addgrup\` (di grup target)\n` +
                    `> \`${m.prefix}autoanimewinbu addgrup 120363xxx@g.us\``
                )
            }

            const interval = state.interval || 5
            startAutoCheck(sock, interval)
            saveState({ ...state, enabled: true })

            return sock.sendMessage(m.chat, {
                text: `✅ *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ sᴛᴀʀᴛᴇᴅ*\n\n` +
                    `> 📲 Grup target: *${groups.length}*\n` +
                    `> ⏱️ Interval: *${interval} menit*\n` +
                    `> 🎞️ Filter: *Pixeldrain 720p+*\n` +
                    `> ⏰ Max age: *24 jam*\n\n` +
                    `Pengecekan pertama dimulai...`,
                interactiveButtons: []
            }, { quoted: m })
        }

        case 'stop': {
            stopAutoCheck()
            saveState({ ...state, enabled: false })
            return m.reply(`🛑 *AutoAnime dihentikan*`)
        }

        case 'status': {
            const sent = loadSent()
            const running = isRunning()
            const groups = state.groups || []

            let txt = `📊 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ sᴛᴀᴛᴜs*\n\n`
            txt += `> 🔄 Status: *${running ? '🟢 ON' : '🔴 OFF'}*\n`
            txt += `> 💾 Auto-start: *${state.enabled ? 'Ya' : 'Tidak'}*\n`
            txt += `> 📋 Sudah terkirim: *${sent.size}* episode\n`
            txt += `> ⏱️ Interval: *${state.interval || 5} menit*\n`
            txt += `> 📲 Grup target: *${groups.length}*\n`

            if (groups.length > 0) {
                txt += `\n*Grup:*\n`
                groups.forEach((g, i) => {
                    txt += `> ${i + 1}. \`${g}\`\n`
                })
            }

            return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
        }

        case 'cek':
        case 'check': {
            if (!isRunning()) {
                startAutoCheck(sock, state.interval || 5)
            }
            await m.reply('🔍 Mengecek anime terbaru...')
            try {
                await runCheck()
                return m.reply('✅ Pengecekan selesai')
            } catch (e) {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }

        case 'list': {
            await m.reply('📺 Mengambil daftar anime...')
            try {
                const list = await getOngoingAnimeList()
                if (list.length === 0) return m.reply('❌ Tidak ada anime ditemukan')

                let txt = `📺 *ᴅᴀꜰᴛᴀʀ ᴀɴɪᴍᴇ ᴛᴇʀʙᴀʀᴜ*\n\n`
                txt += `> Total: *${list.length}* anime\n\n`
                list.slice(0, 15).forEach((a, i) => {
                    txt += `*${i + 1}.* ${a.title}\n`
                })
                if (list.length > 15) txt += `\n> ...dan ${list.length - 15} lainnya`

                return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
            } catch (e) {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }

        case 'reset': {
            const sent = loadSent()
            const count = sent.size
            saveSent(new Set())
            return m.reply(`✅ Reset! *${count}* episode dihapus dari riwayat.\n> Semua episode bisa terkirim ulang.`)
        }

        case 'addgrup':
        case 'addgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(addgrup|addgroup)\s*/i, '').trim()
            let grupId = rest

            if (!grupId && m.isGroup) {
                grupId = m.chat
            }

            if (!grupId || !grupId.includes('@g.us')) {
                return m.reply(
                    `❌ ID grup tidak valid\n\n` +
                    `> Gunakan di dalam grup, atau:\n` +
                    `> \`${m.prefix}autoanimewinbu addgrup 120363xxx@g.us\``
                )
            }

            const groups = state.groups || []
            if (groups.includes(grupId)) {
                return m.reply(`⚠️ Grup sudah ada di daftar target`)
            }

            groups.push(grupId)
            saveState({ ...state, groups })
            return m.reply(`✅ Grup \`${grupId}\` ditambahkan ke target\n> Total: *${groups.length}* grup`)
        }

        case 'delgrup':
        case 'delgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(delgrup|delgroup)\s*/i, '').trim()
            let grupId = rest

            if (!grupId && m.isGroup) {
                grupId = m.chat
            }

            const groups = state.groups || []
            const idx = groups.indexOf(grupId)
            if (idx === -1) {
                return m.reply(`❌ Grup tidak ditemukan di daftar target`)
            }

            groups.splice(idx, 1)
            saveState({ ...state, groups })
            return m.reply(`✅ Grup \`${grupId}\` dihapus dari target\n> Sisa: *${groups.length}* grup`)
        }

        case 'interval': {
            const rest = (typeof args === 'string' ? args : '').replace(/^interval\s*/i, '').trim()
            const mins = parseInt(rest)
            if (!mins || mins < 1 || mins > 60) {
                return m.reply(`❌ Interval harus 1-60 menit\n\n> Contoh: \`${m.prefix}autoanimewinbu interval 10\``)
            }

            saveState({ ...state, interval: mins })

            if (isRunning()) {
                stopAutoCheck()
                startAutoCheck(sock, mins)
            }

            return m.reply(`✅ Interval diubah ke *${mins} menit*`)
        }

        default: {
            const running = isRunning()
            return sock.sendMessage(m.chat, {
                text: `🎬 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ᴡɪɴʙᴜ*\n\n` +
                    `> Status: *${running ? '🟢 ON' : '🔴 OFF'}*\n\n` +
                    `*ᴄᴏᴍᴍᴀɴᴅs:*\n` +
                    `> \`${m.prefix}aaw start\` — Mulai auto-check\n` +
                    `> \`${m.prefix}aaw stop\` — Hentikan\n` +
                    `> \`${m.prefix}aaw status\` — Lihat status\n` +
                    `> \`${m.prefix}aaw cek\` — Manual check sekarang\n` +
                    `> \`${m.prefix}aaw list\` — Daftar anime terbaru\n` +
                    `> \`${m.prefix}aaw addgrup\` — Tambah grup target\n` +
                    `> \`${m.prefix}aaw delgrup\` — Hapus grup target\n` +
                    `> \`${m.prefix}aaw interval 10\` — Ubah interval\n` +
                    `> \`${m.prefix}aaw reset\` — Reset riwayat terkirim`,
                interactiveButtons: []
            }, { quoted: m })
        }
    }
}

export { pluginConfig as config, handler }
