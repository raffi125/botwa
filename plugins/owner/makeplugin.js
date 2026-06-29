import { chat } from "../../src/scraper/geminiVision.js";
import { generateWAMessageFromContent, jidNormalizedUser, proto } from "ourin";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import te from "../../src/lib/ourin-error.js";
import config from "../../config.js";

const pluginConfig = {
  name: "makeplugin",
  alias: ["mkp", "createplugin"],
  category: "owner",
  description: "Buat plugin baru menggunakan AI",
  usage: ".makeplugin <nama> <deskripsi fitur>",
  example: ".makeplugin quotes Plugin yang mengirimkan quote random dari API",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 30,
  energi: 0,
  isEnabled: true,
};

const PROJECT_CONTEXT = `
Kamu adalah AI code generator untuk bot WhatsApp bernama "Scrav Bot" (versi 2.4.5).
Bot ini menggunakan Baileys (WhatsApp Web API) dengan custom framework.

STRUKTUR PLUGIN:
- File: plugins/<category>/<name>.js
- Export: { config, handler }
- config object: { name, alias, category, description, usage, example, isOwner, isPremium, isGroup, isPrivate, cooldown, energi, isEnabled }
- handler: async function handler(m, { sock, config, db })

PARAMETER m (serialized message):
- m.chat, m.sender, m.pushName, m.body, m.text
- m.args (array), m.fullArgs (string)
- m.prefix, m.command, m.isCommand
- m.isGroup, m.isOwner, m.isPremium, m.isAdmin, m.isBotAdmin
- m.isImage, m.isVideo, m.isAudio, m.quoted
- m.reply(text), m.react(emoji), m.download()
- m.key (message key)

PARAMETER sock (WhatsApp socket):
- sock.sendMessage(jid, content, options)
- sock.relayMessage(jid, message, options)
- sock.waUploadToServer (upload function)
- sock.sendPresenceUpdate(type, jid)

IMPORT YANG TERSEDIA DARI "ScravBot":
- generateWAMessage, generateWAMessageFromContent
- prepareWAMessageMedia, jidNormalizedUser
- proto (WAProto)

IMPORT LIBRARY INTERNAL:
- te from "../../src/lib/ourin-error.js" (error template)
- { f } from "../../src/lib/ourin-http.js" (HTTP helper, returns JSON)
- { getDatabase } from "../../src/lib/ourin-database.js"

IMPORT SCRAPER:
- ../../src/scraper/aio.js (aiodl function)
- ../../src/scraper/seaart.js (live3d function)
- ../../src/scraper/geminiVision.js (chat function for AI)
- ../../src/scraper/topmedia.js (TTS)

IMPORT EXTERNAL (sudah terinstall):
- axios, fs, path, crypto, cheerio
- @google/generative-ai

CONTOH PLUGIN SEDERHANA:
import axios from 'axios'
import te from '../../src/lib/ourin-error.js'

const pluginConfig = {
  name: 'halo',
  alias: ['hello'],
  category: 'main',
  description: 'Menyapa user',
  usage: '.halo',
  example: '.halo',
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
}

async function handler(m, { sock }) {
  m.reply('Halo ' + m.pushName + '!')
}

export { pluginConfig as config, handler }

---------------------------------------
MEDIA & RICH MESSAGE METHODS
---------------------------------------

1. sock.sendMedia(jid, source, caption, quoted, options)
   Kirim media (image/video/audio/document) dengan mudah.
   source: Buffer | URL string | file path | { url: '...' }
   options: { type: 'image'|'video'|'audio'|'document', mimetype, fileName, ...extraFields }

   Contoh kirim gambar dari URL:
   await sock.sendMedia(m.chat, 'https://example.com/img.jpg', 'Caption', m, { type: 'image' })

   Contoh kirim gambar dari buffer:
   const res = await axios.get(url, { responseType: 'arraybuffer' })
   const buf = Buffer.from(res.data)
   await sock.sendMedia(m.chat, buf, 'Caption', m, { type: 'image' })

2. sock.sendButton(jid, source, text, quoted, options)
   Kirim pesan dengan interactiveButtons + media opsional.
   source: Buffer | URL | file path | null (tanpa media)
   options: { type: 'image'|'video'|'document', footer, header, contextInfo, buttons (alias interactiveButtons) }

   Contoh tanpa media:
   await sock.sendButton(m.chat, null, 'Pilih opsi:', m, {
     footer: 'SCRAVBOT',
     buttons: [
       { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Ya', id: m.prefix + 'confirm' }) },
       { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Tidak', id: m.prefix + 'cancel' }) }
     ]
   })

   Contoh dengan gambar:
   await sock.sendButton(m.chat, imageUrl, 'Pilih di bawah:', m, {
     type: 'image',
     footer: 'SCRAVBOT',
     buttons: [
       { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka Link', url: 'https://example.com' }) }
     ]
   })

3. sock.sendTableV2(jid, [title, headerRow, ...dataRows], quoted, { headerText, text, footer })
   Data rows: "Col1 | Col2 | Col3;; Col1 | Col2 | Col3"

4. sock.sendCodeBlockV2(jid, code, quoted, { language, title, text, footer })
   Languages: javascript, python, go, lua, bash

5. sock.sendLinkV2(jid, textWithPlaceholders, urlArray, quoted, { headerText, footer })
   Placeholders: {{IE_0}}display{{/IE_0}} for each URL

6. sock.sendList(jid, title, [[key, value], ...], quoted, { footer })

---------------------------------------
INTERACTIVE BUTTONS (TOMBOL)
---------------------------------------

Gunakan interactiveButtons di sock.sendMessage() atau sock.sendButton().
Cocok untuk: pilihan, konfirmasi, navigasi, copy, buka link.

TIPE BUTTON:

A. quick_reply — Tombol yang mengirim command saat ditekan
   { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Teks Tombol', id: '.command args' }) }

B. cta_url — Tombol yang membuka link di browser
   { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka Link', url: 'https://example.com' }) }

C. cta_copy — Tombol yang copy teks ke clipboard
   { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Kode', copy_code: 'text_to_copy' }) }

D. single_select — Dropdown pilihan (bisa banyak section)
   { name: 'single_select', buttonParamsJson: JSON.stringify({
     title: 'Pilih Opsi',
     sections: [{ title: 'Section Title', rows: [
       { title: 'Opsi 1', rowId: 'id_1', description: 'Deskripsi opsional' },
       { title: 'Opsi 2', rowId: 'id_2' }
     ]}]
   }) }

CONTOH LENGKAP - PESAN TEKS DENGAN TOMBOL:
await sock.sendMessage(m.chat, {
  text: 'Silakan pilih:',
  footer: 'SCRAVBOT',
  interactiveButtons: [
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Ya', id: m.prefix + 'confirm' }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Tidak', id: m.prefix + 'cancel' }) }
  ]
}, { quoted: m })

CONTOH LENGKAP - PESAN GAMBAR DENGAN TOMBOL:
const imgBuf = Buffer.from((await axios.get(imageUrl, { responseType: 'arraybuffer' })).data)
await sock.sendMessage(m.chat, {
  image: imgBuf,
  caption: 'Hasil pencarian:',
  footer: 'SCRAVBOT',
  interactiveButtons: [
    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka', url: linkUrl }) },
    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Lagi', id: m.prefix + 'command lagi' }) }
  ]
}, { quoted: m })

CONTOH LENGKAP - DROPDOWN SELECT:
await sock.sendMessage(m.chat, {
  text: 'Pilih kategori:',
  footer: 'SCRAVBOT',
  interactiveButtons: [
    { name: 'single_select', buttonParamsJson: JSON.stringify({
      title: 'Pilih Kategori',
      sections: [{ title: 'Kategori', rows: [
        { title: 'Anime', rowId: m.prefix + 'cmd anime' },
        { title: 'Film', rowId: m.prefix + 'cmd film' },
        { title: 'Musik', rowId: m.prefix + 'cmd musik' }
      ]}]
    }) }
  ]
}, { quoted: m })

---------------------------------------
ATURAN
---------------------------------------
1. SELALU gunakan ES module (import/export)
2. JANGAN tambahkan komentar
3. Gunakan m.reply() untuk reply pesan
4. Gunakan m.react() untuk reaction emoji
5. Gunakan te(m.prefix, m.command, m.pushName) untuk error template
6. Import hanya yang dibutuhkan
7. Pastikan handler async dan menangani error
8. Jangan hardcode API key, gunakan config.APIkey
9. Untuk kirim gambar/video tanpa tombol: sock.sendMedia(m.chat, url, caption, m, { type: 'image' })
10. Untuk kirim gambar/video DENGAN tombol: gunakan sock.sendMessage dengan { image: buffer, caption, interactiveButtons, footer }
11. Untuk download media dari quoted: m.quoted.download()
12. Jika hasil API punya gambar preview, SELALU tampilkan gambarnya (pakai image: buffer di sendMessage atau sendMedia)
13. Jika ada opsi/pilihan untuk user, GUNAKAN interactiveButtons (quick_reply, cta_url, cta_copy, single_select)
14. SELALU export { pluginConfig as config, handler } di akhir file
15. Buat kode yang clean, readable, dan langsung jalan
16. Jangan gunakan emoji di kode kecuali di string pesan
`;

const tempDir = path.join(process.cwd(), "temp");

function cleanupPending() {
  if (!fs.existsSync(tempDir)) return;
  const now = Date.now();
  for (const f of fs.readdirSync(tempDir)) {
    if (!f.startsWith("makeplugin_") || !f.endsWith(".json")) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(tempDir, f), "utf-8"));
      if (now - meta.createdAt > 10 * 60 * 1000) {
        const id = f.replace("makeplugin_", "").replace(".json", "");
        try {
          fs.unlinkSync(path.join(tempDir, `makeplugin_${id}.js`));
        } catch {}
        try {
          fs.unlinkSync(path.join(tempDir, f));
        } catch {}
      }
    } catch {}
  }
}

async function handler(m, { sock }) {
  const args = m.args || [];
  const name = args[0]?.toLowerCase();
  const description = args.slice(1).join(" ");

  if (!name || !description) {
    return m.reply(
      `?? *???? ??????*\n\n` +
        `> Buat plugin baru menggunakan AI\n\n` +
        `*Penggunaan:*\n` +
        `\`${m.prefix}makeplugin <nama> <deskripsi fitur>\`\n\n` +
        `*Contoh:*\n` +
        `\`${m.prefix}makeplugin quotes Kirim quote random dari API\``,
    );
  }

  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    return m.reply(
      "? Nama plugin hanya boleh huruf kecil, angka, dan underscore. Harus dimulai huruf.",
    );
  }

  m.react("??");

  try {
    const categories = fs.readdirSync("./plugins").filter((f) => {
      const p = path.join("./plugins", f);
      return fs.statSync(p).isDirectory();
    });

    const categoryList = categories.join(", ");

    const prompt = `Buatkan plugin WhatsApp bot dengan detail berikut:

Nama plugin: ${name}
Deskripsi fitur: ${description}

Kategori yang tersedia: ${categoryList}
Pilih kategori yang paling sesuai.

${PROJECT_CONTEXT}

HASILKAN HANYA KODE JAVASCRIPT LENGKAP yang bisa langsung di-save sebagai file .js. Jangan tambahkan penjelasan atau markdown code block wrapper.`;

    const result = await chat({
      message: prompt,
      instruction:
        "Kamu adalah expert JavaScript developer. Hasilkan kode plugin yang lengkap, fungsional, dan langsung bisa dijalankan. Hanya output kode, tanpa penjelasan.",
    });

    let code = result.text || result.raw || "";

    code = code
      .replace(/^```(?:javascript|js)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    if (!code.includes("export") || !code.includes("handler")) {
      m.react("?");
      return m.reply(
        "? AI gagal membuat plugin yang valid. Coba deskripsi yang lebih detail.",
      );
    }

    const configMatch = code.match(/category:\s*['"](\w+)['"]/);
    const category = configMatch ? configMatch[1] : "main";

    const pluginDir = path.join(process.cwd(), "plugins", category);
    const filePath = path.join(pluginDir, `${name}.js`);

    if (fs.existsSync(filePath)) {
      m.react("??");
      return m.reply(
        `?? Plugin \`${name}.js\` sudah ada di kategori \`${category}\`!\n\nHapus dulu atau ganti nama.`,
      );
    }

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const pendingId = crypto.randomBytes(8).toString("hex");
    fs.writeFileSync(
      path.join(tempDir, `makeplugin_${pendingId}.js`),
      code,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(tempDir, `makeplugin_${pendingId}.json`),
      JSON.stringify({
        name,
        category,
        filePath,
        description,
        createdAt: Date.now(),
      }),
      "utf-8",
    );

    cleanupPending();

    await sock.sendCodeBlockV2(m.chat, code, m, {
      language: "javascript",
      title: `${name}.js`,
      text: `?? Plugin: ${name} | Kategori: ${category} | ${(code.length / 1024).toFixed(1)}KB`,
      footer: "Scrav Bot • MakePlugin",
    });

    const codeMsgKey = {
      remoteJid: m.chat,
      fromMe: true,
      id: crypto.randomUUID(),
    };

    const prefix = m.prefix || ".";
    const interactiveButtons = [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "? Ya, sudah sesuai",
          id: `${prefix}makepluginsave ${pendingId}`,
        }),
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "?? Enggak, ulangi lagi",
          id: `${prefix}makeplugin ${name} ${description}`,
        }),
      },
    ];


    await m.reply(`Plugin *${name}* sudah dibuat! Apakah sudah sesuai?

Ketik: \`${prefix}makeplugin ${name} ${description}\` untuk konfirmasi.`);

    m.react("?");
  } catch (err) {
    console.error("[MakePlugin] Error:", err.message);
    m.react("?");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
