import { getDatabase } from "../../src/lib/ourin-database.js";
import { listStickerReplies } from "../../src/lib/ourin-sticker-reply.js";

const pluginConfig = {
  name: "autoreplystiker",
  alias: ["autoreplysticker", "arstiker"],
  category: "group",
  description: "Toggle auto reply untuk sticker yang sudah didaftarkan",
  usage: ".autoreplystiker on/off",
  example: ".autoreplystiker on",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m) {
  const db = getDatabase();
  const args = m.args || [];
  const groupData = db.getGroup(m.chat) || {};
  const current = groupData.autoreplystiker ?? false;
  const total = listStickerReplies(m.chat).length;
  const arg = args[0]?.toLowerCase();

  if (!arg) {
    const status = current ? "✅ Aktif" : "❌ Nonaktif";
    return m.reply(
      `🖼️ *ᴀᴜᴛᴏʀᴇᴘʟʏ sᴛɪᴋᴇʀ*\n\n` +
        `> Status: ${status}\n` +
        `> Total reply: ${total}\n\n` +
        `> Gunakan:\n` +
        `> \`${m.prefix}autoreplystiker on\`\n` +
        `> \`${m.prefix}autoreplystiker off\``,
    );
  }

  if (["on", "1", "aktif"].includes(arg)) {
    if (current) {
      return m.reply(`🖼️ *ᴀᴜᴛᴏʀᴇᴘʟʏ sᴛɪᴋᴇʀ*\n\n> Sudah aktif!`);
    }
    db.setGroup(m.chat, { autoreplystiker: true });
    await db.save();
    return m.reply(
      `🖼️ *ᴀᴜᴛᴏʀᴇᴘʟʏ sᴛɪᴋᴇʀ*\n\n> ✅ Berhasil diaktifkan!\n> Sticker yang terdaftar akan membalas pesan otomatis`,
    );
  }

  if (["off", "0", "nonaktif"].includes(arg)) {
    if (!current) {
      return m.reply(`🖼️ *ᴀᴜᴛᴏʀᴇᴘʟʏ sᴛɪᴋᴇʀ*\n\n> Sudah nonaktif!`);
    }
    db.setGroup(m.chat, { autoreplystiker: false });
    await db.save();
    return m.reply(`🖼️ *ᴀᴜᴛᴏʀᴇᴘʟʏ sᴛɪᴋᴇʀ*\n\n> ❌ Berhasil dinonaktifkan!`);
  }

  return m.reply(`❌ Gunakan: \`${m.prefix}autoreplystiker on/off\``);
}

export { pluginConfig as config, handler };
