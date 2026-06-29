import { listStickerReplies } from "../../src/lib/ourin-sticker-reply.js";

const pluginConfig = {
  name: "liststikerreply",
  alias: ["liststickerreply", "stikerreplylist"],
  category: "group",
  description: "Lihat daftar auto reply sticker",
  usage: ".liststikerreply",
  example: ".liststikerreply",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m) {
  const list = listStickerReplies(m.chat);
  if (!list.length) {
    return m.reply(
      `🖼️ *sᴛɪᴋᴇʀ ʀᴇᴘʟʏ*\n\n> Belum ada sticker reply yang terdaftar.`,
    );
  }

  let msg = `🖼️ *ᴅᴀꜰᴛᴀʀ sᴛɪᴋᴇʀ ʀᴇᴘʟʏ*\n\n`;
  for (const item of list) {
    msg += `( ${item.no} ) *${item.reply}*\n`;
  }
  return m.reply(msg.trim());
}

export { pluginConfig as config, handler };
