const pluginConfig = {
  name: 'cekcupu',
  alias: ['cupu', 'noob'],
  category: 'cek',
  description: 'Cek tingkat kecupuan kamu',
  usage: '.cekcupu <nama>',
  example: '.cekcupu Budi',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true
}

async function handler(m) {
  const percent = Math.floor(Math.random() * 101)
  const mentioned = m.mentionedJid[0] || m.sender

  let aa
  if (percent >= 90) aa = 'CUPU PARAH! NOOB DETECTED! 🤡'
  else if (percent >= 70) aa = 'Masih newbie nih~ 😅'
  else if (percent >= 50) aa = 'Biasa aja lah 🤔'
  else if (percent >= 30) aa = 'Cukup jago! 💪'
  else aa = 'PRO PLAYER! GG! 🏆'

  let txt = mentioned === m.sender
    ? `Hai @${mentioned.split('@')[0]}\n\nTingkat kecupuan kamu *${percent}%*\n\`\`\`${aa}\`\`\``
    : `Kamu ingin ngecek tingkat kecupuan @${mentioned.split('@')[0]} yak?\n\nTingkat kecupuan dia sebesar *${percent}%*\n\`\`\`${aa}\`\`\``

  await m.reply(txt, { mentions: [mentioned] })
}

export { pluginConfig as config, handler }