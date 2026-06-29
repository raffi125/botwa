import {
  deleteStickerReply,
  getQuotedStickerReplyHash,
  listStickerReplies,
} from "../../src/lib/ourin-sticker-reply.js";

const pluginConfig = {
  name: "delstikerreply",
  alias: ["delstickerreply", "hapusstikerreply"],
  category: "group",
  description: "Hapus auto reply sticker",
  usage: ".delstikerreply <nomor> atau reply sticker",
  example: ".delstikerreply 1",
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
  const list = listStickerReplies(m.chat);

  if (!text && !m.quoted) {
    if (!list.length) {
      return m.reply(
        `🖼️ *sᴛɪᴋᴇʀ ʀᴇᴘʟʏ*\n\n> Belum ada sticker reply yang terdaftar.`,
      );
    }

    let msg = `🖼️ *sᴛɪᴋᴇʀ ʀᴇᴘʟʏ*\n\n`;
    for (const item of list) {
      msg += `${item.no}. ${item.reply}\n`;
    }
    msg += `\n> Hapus dengan reply sticker atau \`${m.prefix}delstikerreply 1\``;
    return m.reply(msg);
  }

  let stickerHash = null;
  if (m.quoted) {
    stickerHash = getQuotedStickerReplyHash(m);
  } else if (/^\d+$/.test(text || "")) {
    stickerHash = list[Number(text) - 1]?.fullHash || null;
  }

  if (!stickerHash) {
    return m.reply("❌ Sticker reply tidak ditemukan!");
  }

  const success = await deleteStickerReply(m.chat, stickerHash);
  if (!success) {
    return m.reply("❌ Gagal menghapus sticker reply!");
  }

  await m.react("✅");
  return m.reply(`✅ *sᴛɪᴋᴇʀ ʀᴇᴘʟʏ ᴅɪʜᴀᴘᴜs*`);
}

export { pluginConfig as config, handler };
