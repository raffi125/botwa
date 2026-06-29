import { aiodl, aiodownload } from "../../src/scraper/aio.js";
import te from "../../src/lib/ourin-error.js";

const pluginConfig = {
  name: "aio",
  alias: ["allinone", "download", "dl"],
  category: "downloader",
  description: "All in one downloader (IG, TikTok, FB, Twitter, YouTube, dll)",
  usage: ".aio <url>",
  example: ".aio https://instagram.com/p/xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const VIDEO_FORMATS = ["1080", "720", "480", "360"];
const AUDIO_FORMATS = ["mp3", "wav"];

async function handler(m, { sock }) {
  const url = m.text?.trim();

  if (!url) {
    return m.reply(
      `📥 *ᴀʟʟ ɪɴ ᴏɴᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
        `> Download dari berbagai platform!\n\n` +
        `╭┈┈⬡「 🌐 *ᴘʟᴀᴛꜰᴏʀᴍ* 」\n` +
        `┃ • Instagram\n` +
        `┃ • TikTok\n` +
        `┃ • Facebook\n` +
        `┃ • Twitter/X\n` +
        `┃ • YouTube\n` +
        `┃ • Dan lainnya...\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> *Contoh:* ${m.prefix}aio https://instagram.com/p/xxx`,
    );
  }

  if (!url.startsWith("http")) {
    return m.reply(`❌ URL tidak valid! Harus dimulai dengan http/https`);
  }

  await m.react("🕕");

  try {
    const info = await aiodl(url);

    if (!info.token || !info.formats?.length) {
      await m.react("❌");
      return m.reply(`❌ Gagal mengambil data. Pastikan URL valid.`);
    }

    console.log(info);

    const bestVideo = VIDEO_FORMATS.find((f) => info.formats.includes(f));
    const format =
      bestVideo ||
      info.formats.find((f) => !AUDIO_FORMATS.includes(f)) ||
      info.formats[0];

    const dlResult = await aiodownload(info.token, format);

    if (!dlResult?.url && !dlResult?.download && !dlResult?.data?.url) {
      await m.react("❌");
      return m.reply(`❌ Gagal mendapatkan link download`);
    }

    const downloadUrl = dlResult.url || dlResult.download || dlResult.data?.url;

    const isAudio = AUDIO_FORMATS.includes(format);

    const contextInfo = {
      externalAdReply: {
        title: info.title || "Downloaded",
        body: `Format: ${format}`,
        thumbnailUrl: info.thumb,
        sourceUrl: url,
        mediaType: isAudio ? 1 : 2,
      },
    };

    if (isAudio) {
      await sock.sendMessage(
        m.chat,
        {
          audio: { url: downloadUrl },
          mimetype: "audio/mpeg",
          contextInfo,
        },
        { quoted: m },
      );
    } else {
      await sock.sendMedia(m.chat, downloadUrl, info.title || null, m, {
        type: "video",
        contextInfo,
      });
    }

    await m.react("✅");
  } catch (error) {
    await m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
