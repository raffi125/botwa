import config from "../../config.js";
import { getDatabase } from "../../src/lib/ourin-database.js";

const pluginConfig = {
  name: "pelayan",
  alias: ["autoguide", "panduan", "bothelper"],
  category: "group",
  description: "Mode panduan — bot auto-respon untuk memandu cara pakai bot",
  usage: ".pelayan <on/off/list>",
  example: ".pelayan on",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: true,
  isAdmin: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const GUIDE_REPLIES = [
  {
    trigger: "assalamualaikum",
    reply: "Waalaikumsalam 🙏 Ada yang bisa saya bantu? Silakan ketik *.menu* untuk lihat daftar fitur bot.",
  },
  {
    trigger: "menu",
    reply: "Ketik *.allmenu* atau *.menu* untuk melihat daftar lengkap semua fitur bot ya!",
  },
  {
    trigger: "help",
    reply: "Butuh bantuan? Berikut panduan:\n• *.menu* — Lihat daftar fitur\n• *.allmenu* — Semua fitur detail\n• *.donasi* — Info donasi\nAtau tanya langsung tentang command tertentu!",
  },
  {
    trigger: "tolong",
    reply: "Ada yang bisa saya bantu? Coba jelaskan apa yang kamu butuhkan, atau ketik *.menu* untuk lihat fitur yang tersedia.",
  },
  {
    trigger: "panduan",
    reply: "Panduan Penggunaan Bot:\n• Semua command pakai prefix *{prefix}*\n• Contoh: *{prefix}menu* untuk lihat menu\n• *{prefix}allmenu* untuk semua fitur\n• Ada fitur AI, download, grup, game, dan banyak lagi!",
  },
  {
    trigger: "cara pakai",
    reply: "Cara pakai bot:\n1. Ketik *{prefix}menu* lihat kategori fitur\n2. Ketik command sesuai kebutuhan\n3. Bot akan memproses dan merespon\n\nKalau bingung, tanya aja ya!",
  },
  {
    trigger: "cara gunakan",
    reply: "Cara menggunakan bot gampang kok:\n1. Gunakan prefix *{prefix}* diikuti nama command\n2. Contoh: *{prefix}menu* atau *{prefix}sticker*\n3. Beberapa fitur perlu argumen tambahan\n\nAda yang ingin ditanyakan?",
  },
  {
    trigger: "bot",
    reply: "Hadir! 👋 Ada yang bisa dibantu?\n\nBot ini punya banyak fitur:\n• 🤖 *AI Chat* — .9router, .ai\n• 📥 *Downloader* — .ytmp4, .tiktok\n• 👥 *Grup* — .welcome, .antilink\n• 🎮 *Game* — .tebakgambar, .suit\n• ⚙️ *Utility* — .sticker, .nulis\n\nKetik *.menu* untuk lihat semua!",
  },
  {
    trigger: "hallo",
    reply: "Halo! 👋 Ada yang bisa saya bantu?\nKetik *.menu* untuk lihat daftar fitur bot.",
  },
  {
    trigger: "halo",
    reply: "Halo juga! 👋 Ada yang bisa saya bantu?\nKetik *.menu* untuk lihat daftar fitur bot.",
  },
  {
    trigger: "hai",
    reply: "Hai! 🙌 Selamat datang! Mau lihat fitur bot? Ketik *.menu* aja ya!",
  },
  {
    trigger: "makasih",
    reply: "Sama-sama! 😊 Kalau ada yang perlu ditanyakan lagi, bilang aja ya. Happy exploring!",
  },
  {
    trigger: "terima kasih",
    reply: "Sama-sama! Senang bisa membantu 😊 Jangan sungkan kalau ada pertanyaan lain~",
  },
  {
    trigger: "thanks",
    reply: "You're welcome! 🙏 Feel free to ask if you need anything else about the bot~",
  },
  {
    trigger: "p",
    reply: "Hai! Mau panggil bot? Ketik *.menu* untuk lihat daftar command atau tanya langsung aja ya! 😊",
  },
  {
    trigger: "fitur",
    reply: "Fitur yang tersedia:\n• AI Chat & Gambar\n• Download Video/Music\n• Sticker & Media Tools\n• Group Management\n• Games & Fun\n• Info & Utility\n\nKetik *.menu* untuk lengkapnya!",
  },
  {
    trigger: "command",
    reply: "Daftar command bisa dilihat dengan:\n• *{prefix}menu* — Menu utama\n• *{prefix}allmenu* — Semua command detail\n• *{prefix}menucat* — Per kategori\n\nAda command tertentu yang mau ditanyakan?",
  },
  {
    trigger: "perintah",
    reply: "Berikut cara pakai command:\n{prefix}<nama command> [argumen]\n\nContoh:\n• {prefix}sticker — buat sticker dari gambar\n• {prefix}ytmp4 https://youtu.be/xxx — download video\n• {prefix}ai siapa kamu? — chat AI\n\nKetik *.menu* untuk semua!",
  },
  {
    trigger: "cara",
    reply: "Mau tahu cara pakai fitur apa? Coba sebutkan nama fiturnya, atau ketik *.menu* untuk lihat semua yang tersedia!",
  },
  {
    trigger: "nggak tau",
    reply: "Gapapa! Coba ketik *.menu* untuk lihat apa aja yang bisa bot ini lakuin. Pasti ada yang berguna buat kamu!",
  },
  {
    trigger: "gabut",
    reply: "Gabut? Cobain fitur-fitur seru ini:\n• *.cerpen* — Baca cerpen random\n• *.quote* — Dapat quotes\n• *.game* — Main game seru\n• *.ai* — Ngobrol dengan AI\n\nAtau download video favoritmu dengan *.ytmp4*!",
  },
  {
    trigger: "kenalan",
    reply: "Halo! Saya adalah bot WhatsApp serbaguna 🤖\nSaya bisa bantu download, bikin sticker, chat AI, manage grup, dan banyak lagi!\nKetik *.menu* untuk lihat semua kemampuanku 😊",
  },
  {
    trigger: "siapa",
    reply: "Saya bot WhatsApp dengan berbagai fitur canggih:\n• AI Chat (9Router)\n• Downloader (YT, TikTok, IG)\n• Sticker Maker\n• Group Management\n• Games\nDan masih banyak lagi! Ketik *.menu* untuk lihat.",
  },
  {
    trigger: "nama",
    reply: "Nama bot ini {botname} versi {version}! 🎉\nDikembangkan oleh {developer}.\nAda yang bisa dibantu? Ketik *.menu* ya!",
  },
  {
    trigger: "owner",
    reply: "Owner bot adalah {ownerName}.\nKalau ada masalah atau mau lapor bug, bisa chat owner ya.",
  },
  {
    trigger: "error",
    reply: "Maaf ada error ya 😅 Coba ulangi perintahnya pelan-pelan.\nKalau tetap error, laporkan ke owner ya!",
  },
  {
    trigger: "gagal",
    reply: "Sepertinya ada yang salah. Coba periksa:\n1. Format command sudah benar?\n2. Link/argumen sudah valid?\n3. Koneksi internet stabil?\n\nKalau terus gagal, hubungi owner.",
  },
  {
    trigger: "lambat",
    reply: "Maaf kalau responnya lama 🙏 Mungkin server sedang sibuk. Coba ulangi lagi nanti ya!",
  },
  {
    trigger: "bisa",
    reply: "Bot ini bisa melakukan banyak hal!\n\n🤖 AI Chat & Image\n📥 Download Video/Audio\n🎨 Sticker & Media\n👥 Group Tools\n🎮 Games & Fun\n📊 Info & Utility\n\nMau coba yang mana?",
  },
  {
    trigger: "aktif",
    reply: "Bot aktif! ✅ Ada yang bisa saya bantu?\nJangan lupa gunakan prefix *{prefix}* sebelum command.\nContoh: *{prefix}menu*",
  },
  {
    trigger: "hidup",
    reply: "Hidup! 🔥 Siap membantu!\nAda yang bisa saya lakukan untukmu hari ini?",
  },
  {
    trigger: "tes",
    reply: "Bot berfungsi dengan baik! ✅\nSilakan gunakan command yang kamu butuhkan.\nKetik *.menu* untuk daftar fitur.",
  },
  {
    trigger: ".",
    reply: "APAA ? Command apa yang kamu maksud?\nCoba ketik *.menu* untuk lihat pilihan yang tersedia!",
  },
  {
    trigger: "test",
    reply: "Bot is online and working! ✅\nType *.menu* to see available commands.",
  },
  {
    trigger: "1",
    reply: "Nomor 1? Command apa yang kamu maksud?\nCoba ketik *.menu* untuk lihat pilihan yang tersedia!",
  }
];

export function getGuideReplies(prefix) {
  const ownerName = config.owner?.name || "Owner";
  const botName = config.bot?.name || "ScravBot";
  const version = config.bot?.version || "1.0";
  const developer = config.bot?.developer || "Developer";

  return GUIDE_REPLIES.map((item) => ({
    trigger: item.trigger,
    reply: item.reply
      .replace(/{prefix}/g, prefix)
      .replace(/{ownerName}/g, ownerName)
      .replace(/{botname}/g, botName)
      .replace(/{version}/g, version)
      .replace(/{developer}/g, developer),
  }));
}

async function handler(m, { sock }) {
  if (m.isGroup) {
    await m.reply("❌ Fitur pelayan sekarang hanya tersedia untuk Private Chat dengan bot saja.");
    return;
  }

  const db = getDatabase();
  const args = m.args || [];
  const sub = args[0]?.toLowerCase();
  const groupData = db.getGroup(m.chat) || {};
  const currentStatus = groupData.pelayan === true;

  async function reply(msg) {
    await m.reply(msg);
  }

  if ((sub === "on" || sub === "off") && !m.isOwner) {
    await reply("❌ Maaf, fitur ini hanya dapat diaktifkan atau dinonaktifkan oleh pemilik bot.");
    return;
  }

  if (sub === "on") {
    db.setGroup(m.chat, {
      pelayan: true,
      autoreply: true,
    });

    if (currentStatus) {
      await reply(
        `🤖 *PELAYAN MODE DIPERBARUI* ✅\n\n` +
          `> Mode panduan aktif.\n` +
          `_Gunakan *${m.prefix}pelayan list* untuk melihat._`
      );
      return;
    }

    const replies = getGuideReplies(m.prefix);
    await reply(
      `🤖 *PELAYAN MODE AKTIF* ✅\n\n` +
        `> Bot akan auto-respon memandu cara pakai bot.\n` +
        `> *${replies.length}* respon panduan siap.\n\n` +
        `_Gunakan *${m.prefix}pelayan list* untuk lihat daftar._\n` +
        `_Gunakan *${m.prefix}pelayan off* untuk mematikan._`,
    );
    return;
  }

  if (sub === "off") {
    if (!currentStatus) {
      await reply(
        `⚠️ *PELAYAN MODE SUDAH NONAKTIF*\n\n` +
          `> Status: *❌ OFF*\n` +
          `> Mode panduan sudah nonaktif.`,
      );
      return;
    }

    db.setGroup(m.chat, { pelayan: false });
    await reply(
      `🤖 *PELAYAN MODE DINONAKTIFKAN* ❌\n\n` +
        `> Bot tidak lagi auto-respon panduan di chat ini.`,
    );
    return;
  }

  if (sub === "list") {
    const replies = getGuideReplies(m.prefix);
    const enabled = currentStatus;

    let txt = `🤖 *PELAYAN MODE* ${enabled ? "✅" : "❌"}\n\n`;
    txt += `> Status: *${enabled ? "AKTIF" : "NONAKTIF"}*\n`;
    txt += `> Total respon: *${replies.length}*\n\n`;

    if (replies.length > 0) {
      txt += `*Daftar Trigger kata kunci:*\n`;
      const seen = new Set();
      for (const r of replies) {
        if (!r?.trigger || seen.has(r.trigger)) continue;
        seen.add(r.trigger);
        txt += `> • \`${r.trigger}\`\n`;
      }
    }

    txt += `\n_Gunakan *${m.prefix}pelayan on* untuk mengaktifkan._\n`;
    txt += `_Gunakan *${m.prefix}pelayan off* untuk menonaktifkan._`;

    await reply(txt);
    return;
  }

  const current = currentStatus;
  const replyCount = getGuideReplies(m.prefix).length;

  await reply(
    `🤖 *PELAYAN MODE*\n\n` +
      `> Status: *${current ? "✅ AKTIF" : "❌ NONAKTIF"}*\n` +
      `> Total respon: *${replyCount || "\u2014"}*\n\n` +
      `*Pilihan:*\n` +
      `> *${m.prefix}pelayan on* — Aktifkan\n` +
      `> *${m.prefix}pelayan off* — Nonaktifkan\n` +
      `> *${m.prefix}pelayan list* — Lihat daftar trigger`,
  );
}

export { pluginConfig as config, handler };
