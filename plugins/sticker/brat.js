import fs from "fs";
import config from "../../config.js";
import te from "../../src/lib/ourin-error.js";
import ScravBotApi from "../../src/lib/ourin-apimanager.js";
import { generateWAMessageFromContent, proto, prepareWAMessageMedia } from "ourin";
const pluginConfig = {
  name: "brat",
  alias: ["bratmenu", "bratimg", "brattext"],
  category: "sticker",
  description: "Menu variant brat dan generator sticker brat",
  usage: ".brat | .bratimg <text>",
  example: ".bratimg Hai semua",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

const BRAT_VARIANTS = [
  {
    title: "Brat Default",
    description: "Sticker brat versi biasa",
    command: "bratimg",
  },
  {
    title: "Brat Green",
    description: "Variant brat warna hijau",
    command: "bratgreen",
  },
  {
    title: "Brat White",
    description: "Variant brat warna putih",
    command: "bratwhite",
  },
  {
    title: "Brat Anime",
    description: "Variant brat anime",
    command: "bratanime",
  },
  {
    title: "Brat Cewek",
    description: "Variant brat cewek",
    command: "bratcewek",
  },
  {
    title: "Brat Bahlil",
    description: "Variant brat bahlil",
    command: "bratbahlil",
  },
  {
    title: "Brat Patrick",
    description: "Variant brat Patrick",
    command: "bratpatrick",
  },
  {
    title: "Brat Squidward",
    description: "Variant brat Squidward",
    command: "bratsquidward",
  },
  {
    title: "Brat Vermeil",
    description: "Variant brat Vermeil",
    command: "bratvermeil",
  },
  { title: "Brat HD", description: "Variant brat HD", command: "brathd" },
  {
    title: "Brat Video",
    description: "Sticker brat animated",
    command: "bratvid",
  },
  {
    title: "Brat Video V2",
    description: "Sticker brat video v2",
    command: "bratvid2",
  },
  {
    title: "Kanna Brat",
    description: "Variant brat Kanna",
    command: "kannabrat",
  },
];

function buildVariantRows(prefix, text) {
  return BRAT_VARIANTS.map((item) => ({
    title: item.title,
    description: `${item.description} • .${item.command} <text>`,
    id: `${prefix}${item.command} ${text}`,
  }));
}

async function sendBratMenu(m, sock, text) {
  const prefix = m.prefix || ".";
  const inputText = text || "Teks kamu";
  
  const categoryRows = BRAT_VARIANTS.map((item) => ({
    title: item.title,
    description: `${item.description} • ${prefix}${item.command}`,
    id: `${prefix}${item.command} ${inputText}`,
  }));

  const buttons = [
    {
      name: "single_select",
      buttonParamsJson: JSON.stringify({
        title: "🎨 ᴘɪʟɪʜ ᴠᴀʀɪᴀɴᴛ",
        sections: [
          {
            title: "📋 VARIANT BRAT",
            rows: categoryRows
          }
        ]
      })
    }
  ];

  let headerMedia = null;
  try {
    const imageBuffer = fs.readFileSync("./assets/images/ourin.jpg");
    headerMedia = await prepareWAMessageMedia({ image: imageBuffer }, { upload: sock.waUploadToServer });
  } catch (e) {
    console.error("Gagal load gambar brat menu", e);
  }

  const msg = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        messageContextInfo: { 
          deviceListMetadata: {}, 
          deviceListMetadataVersion: 2 
        },
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body: proto.Message.InteractiveMessage.Body.fromObject({ text: "🌿 *Silakan pilih variant brat melalui tombol di bawah*" }),
          footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `© ${config.bot?.name || 'Scrav Bot'}` }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            title: `*BRAT GENERATOR*`,
            hasMediaAttachment: !!headerMedia,
            ...(headerMedia || {})
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons
          }),
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true
          }
        })
      }
    }
  }, { userJid: sock.user?.id, quoted: m });

  await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

async function handler(m, { sock }) {
  const text = m.text;
  const command = String(m.command || "").toLowerCase();

  if (command === "brat") {
    await sendBratMenu(m, sock, text);
    return;
  }

  if (!text) {
    return m.reply(
      `🖼️ *ʙʀᴀᴛ ɪᴍᴀɢᴇ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}bratimg Hai semua\``,
    );
  }

  m.react("🕕");

  try {
    const url = ScravBotApi.yupra.url("/api/image/brat", { text });
    await sock.sendImageAsSticker(m.chat, url, m, {
      packname: config.sticker.packname,
      author: config.sticker.author,
    });

    m.react("✅");
  } catch (error) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
