const pluginConfig = {
  name: 'stopbcgc',
  alias: ['stopbroadcastgc'],
  category: 'owner',
  description: 'Hentikan broadcast grup yang sedang berjalan',
  usage: '.stopbcgc',
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energi: 0,
  isEnabled: true
}

async function handler(m) {
  if (!global.statusBcgc) {
    return m.reply('❌ Tidak ada broadcast grup yang sedang berjalan.')
  }
  global.stopBcgc = true
  return m.reply('⏹️ Menghentikan broadcast grup...')
}

export { pluginConfig as config, handler }
