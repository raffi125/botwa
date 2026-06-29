import {
  addStickerReply,
  getQuotedStickerReplyHash,
  listStickerReplies,
} from "../../src/lib/ourin-sticker-reply.js";

const pluginConfig = {
  name: "addstikerreply",
  alias: ["addstickerreply", "addsikerreply"],
  category: "group",
  description: "Tambahkan balasan custom untuk sticker",
  usage: ".addstikerreply <pesan> (reply sticker)",
  example: ".addstikerreply halo juga",
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
  const text = m.text?.trim();
  if (!text) {
    const total = listStickerReplies(m.chat).length;
    return m.reply(
      `🖼️ *ᴀᴅᴅ sᴛɪᴋᴇʀ ʀᴇᴘʟʏ*\n\n` +
        `> Reply sticker lalu kirim:\n` +
        `> \`${m.prefix}addstikerreply halo juga\`\n\n` +
        `> Total reply aktif: ${total}`,
    );
  }

  if (!m.quoted) {
    return m.reply("⚠️ Reply sticker yang ingin dijadikan auto reply!");
  }

  const stickerHash = getQuotedStickerReplyHash(m);
  if (!stickerHash) {
    return m.reply("⚠️ Pesan yang di-reply bukan sticker!");
  }

  const success = await addStickerReply(m.chat, stickerHash, text, m.sender);
  if (!success) {
    return m.reply("❌ Gagal menyimpan sticker reply!");
  }

  await m.react("✅");
  return m.reply(
    `✅ *sᴛɪᴋᴇʀ ʀᴇᴘʟʏ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
      `> Pesan: ${text}\n\n` +
      `_Kirim sticker tersebut untuk memunculkan balasan otomatis_`,
  );
}

export { pluginConfig as config, handler };
