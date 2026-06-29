import * as botmodePlugin from "../group/botmode.js";
import { generateWAMessageFromContent, proto, prepareWAMessageMedia } from "ourin";
import _sharp from "sharp";
import config from "../../config.js";
import {
  formatUptime,
  getTimeGreeting,
} from "../../src/lib/ourin-formatter.js";
import {
  getCommandsByCategory,
  getCategories,
  getPluginCount,
  getPlugin,
  getPluginsByCategory,
} from "../../src/lib/ourin-plugins.js";
import { getDatabase } from "../../src/lib/ourin-database.js";
import { getCasesByCategory, getCaseCount } from "../../case/ourin.js";
import fs from "fs";
import path from "path";

function getSharp() {
  return _sharp;
}
const pluginConfig = {
  name: "allmenu",
  alias: ["fullmenu", "am", "allcommand", "semua"],
  category: "main",
  description: "Menampilkan semua command lengkap per kategori",
  usage: ".allmenu",
  example: ".allmenu",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};
const CATEGORY_EMOJIS = {
  owner: "👑",
  main: "🏠",
  utility: "🔧",
  fun: "🎮",
  group: "👥",
  download: "📥",
  search: "🔍",
  tools: "🛠️",
  sticker: "🖼️",
  ai: "🤖",
  game: "🎯",
  media: "🎬",
  info: "ℹ️",
  religi: "☪️",
  panel: "🖥️",
  user: "📊",
  linode: "☁️",
  random: "🎲",
  canvas: "🎨",
  vps: "🌊",
  store: "🏪",
  premium: "💎",
  convert: "🔄",
  economy: "💰",
  cek: "📋",
  ephoto: "🎨",
  jpm: "📢",
  pushkontak: "📱",
};
function toSmallCaps(text) {
  return text.toUpperCase();
}
function createBracketBox(emoji, title, lines = []) {
  let text = `╭─〔 ${emoji} \`${title}\`〕─⬣\n`;
  for (const line of lines) {
    text += `│ ✦ *${line}*\n`;
  }
  text += `╰─⬣\n\n`;
  return text;
}
function getCommandSymbols(cmdName) {
  const plugin = getPlugin(cmdName);
  if (!plugin || !plugin.config) return "";
  const symbols = [];
  if (plugin.config.isOwner) symbols.push("Ⓞ");
  if (plugin.config.isPremium) symbols.push("ⓟ");
  if (plugin.config.limit && plugin.config.limit > 0) symbols.push("Ⓛ");
  if (plugin.config.isAdmin) symbols.push("Ⓐ");
  return symbols.length > 0 ? " " + symbols.join(" ") : "";
}
function getContextInfo(botConfig, m, thumbBuffer) {
  return {
    mentionedJid: [m.sender],
  };
}
async function handler(m, { sock, config: botConfig, db, uptime }) {
  const prefix = botConfig.command?.prefix || ".";
  const user = db.getUser(m.sender);
  const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
  const botMode = groupData.botMode || "md";
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
  const casesByCategory = getCasesByCategory();
  let totalCommands = 0;
  for (const category of categories) {
    totalCommands += (commandsByCategory[category] || []).length;
  }
  const totalCases = getCaseCount();
  const totalFeatures = totalCommands + totalCases;
  let userRole = "User",
    roleEmoji = "👤";
  if (m.isOwner) {
    userRole = "Owner";
    roleEmoji = "👑";
  } else if (m.isPremium) {
    userRole = "Premium";
    roleEmoji = "💎";
  }
  const greeting = getTimeGreeting();
  let txt = `Hai *@${m.pushName || "User"}* 🪸
Aku ${botConfig.bot?.name || "SCRAVBOT"}, bot WhatsApp yang siap bantu kamu.  
Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.
`;
  txt += createBracketBox("🤖", "KETERANGAN", [
    "Ⓞ = Owner Only",
    "ⓟ = Premium Only",
    "Ⓛ = Limit Required",
    "Ⓐ = Admin Only",
  ]);
  const categoryOrder = [
    "owner",
    "main",
    "utility",
    "tools",
    "fun",
    "game",
    "download",
    "search",
    "sticker",
    "media",
    "ai",
    "group",
    "religi",
    "info",
    "cek",
    "economy",
    "user",
    "canvas",
    "random",
    "premium",
  ];
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  let modeAllowedMap = {
    md: null,
    store: ["main", "group", "sticker", "owner", "store"],
    pushkontak: ["main", "group", "sticker", "owner", "pushkontak"],
  };
  let modeExcludeMap = {
    md: ["panel", "pushkontak", "store"],
    store: null,
    pushkontak: null,
  };
  try {
    if (botmodePlugin && botmodePlugin.MODES) {
      const modes = botmodePlugin.MODES;
      modeAllowedMap = {};
      modeExcludeMap = {};
      for (const [key, val] of Object.entries(modes)) {
        modeAllowedMap[key] = val.allowedCategories;
        modeExcludeMap[key] = val.excludeCategories;
      }
    }
  } catch (e) {}
  const allowedCategories = modeAllowedMap[botMode];
  const excludeCategories = modeExcludeMap[botMode] || [];
  for (const category of sortedCategories) {
    if (category === "owner" && !m.isOwner) continue;
    if (
      allowedCategories &&
      !allowedCategories.includes(category.toLowerCase())
    )
      continue;
    if (excludeCategories && excludeCategories.includes(category.toLowerCase()))
      continue;
    const pluginCmds = commandsByCategory[category] || [];
    const caseCmds = casesByCategory[category] || [];
    const allCmds = [...pluginCmds, ...caseCmds];
    if (allCmds.length === 0) continue;
    const emoji = CATEGORY_EMOJIS[category] || "📋";
    const categoryName = toSmallCaps(category);
    const commandLines = allCmds.map((cmd) => {
      const symbols = getCommandSymbols(cmd);
      return `${prefix}${cmd}${symbols}`;
    });
    txt += createBracketBox(emoji, categoryName, commandLines);
  }
  txt += `_© ${botConfig.bot?.name || "SCRAVBOT"} | ${new Date().getFullYear()}_\n`;
  txt += `_ᴅᴇᴠᴇʟᴏᴘᴇʀ: ${botConfig.bot?.developer || "Lucky Archz"}_`;
  const imagePath = path.join(process.cwd(), "assets", "images", "ourin.jpg");
  const thumbPath = path.join(process.cwd(), "assets", "images", "ourin2.jpg");
  let imageBuffer = fs.existsSync(imagePath)
    ? fs.readFileSync(imagePath)
    : null;
  let thumbBuffer = fs.existsSync(thumbPath)
    ? fs.readFileSync(thumbPath)
    : null;
  const savedVariant = db.setting("allmenuVariant");
  const allmenuVariant = savedVariant || botConfig.ui?.allmenuVariant || 2;
  const fullContextInfo = {
    mentionedJid: [m.sender],
  };
  try {
    switch (allmenuVariant) {
      case 1:
        await m.reply(txt);
        break;
      case 2:
        if (imageBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              image: imageBuffer,
              caption: txt,
              contextInfo: { mentionedJid: [m.sender] },
            },
            { quoted: m },
          );
        } else {
          await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: fullContextInfo,
            },
            { quoted: m },
          );
        }
        break;
      case 3: {
        let resizedThumb = thumbBuffer;
        if (thumbBuffer) {
          try {
            resizedThumb = await (await getSharp())(thumbBuffer)
              .resize(300, 300, { fit: "cover" })
              .jpeg({ quality: 80 })
              .toBuffer();
          } catch {
            resizedThumb = thumbBuffer;
          }
        }
        await sock.sendMessage(
          m.chat,
          {
            image: imageBuffer || Buffer.from(""),
            caption: txt,
            contextInfo: { mentionedJid: [m.sender] },
          },
          { quoted: m },
        );
        break;
      }
      case 4:
      case 5: {
        try {
          const visibleCategories = [];
          for (const category of sortedCategories) {
            if (category === "owner" && !m.isOwner) continue;
            if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
            if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue;
            
            const pluginCmds = commandsByCategory[category] || [];
            const caseCmds = casesByCategory[category] || [];
            const allCmds = [...pluginCmds, ...caseCmds];
            if (allCmds.length === 0) continue;
            
            visibleCategories.push({
              category,
              total: allCmds.length,
              emoji: CATEGORY_EMOJIS[category] || "📁"
            });
          }

          const rows = [
            {
              title: "📂 SEMUA PERINTAH",
              description: `Menampilkan seluruh ${totalFeatures} perintah`,
              id: `${prefix}allmenu`
            },
            ...visibleCategories.map(({ category, total, emoji }) => ({
              title: `${emoji} ${category.toUpperCase()}`,
              description: `Menampilkan ${total} perintah ${category}`,
              id: `${prefix}menucat ${category}`
            }))
          ];

          const buttons = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "📂 ᴘɪʟɪʜ ᴋᴀᴛᴇɢᴏʀɪ",
                sections: [
                  {
                    title: "ᴅᴀꜰᴛᴀʀ ᴋᴀᴛᴇɢᴏʀɪ ᴍᴇɴᴜ",
                    rows
                  }
                ]
              })
            }
          ];

          let headerMedia = null;
          if (imageBuffer) {
            try {
              let resized = imageBuffer;
              try {
                resized = await (await getSharp())(imageBuffer)
                  .resize(600, 300, { fit: "cover" })
                  .jpeg({ quality: 85 })
                  .toBuffer();
              } catch {}
              headerMedia = await prepareWAMessageMedia({ image: resized }, { upload: sock.waUploadToServer });
            } catch {}
          }

          const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
              message: {
                messageContextInfo: { 
                  deviceListMetadata: {}, 
                  deviceListMetadataVersion: 2 
                },
                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                  body: proto.Message.InteractiveMessage.Body.fromObject({ text: txt }),
                  footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: `© ${botConfig.bot?.name || 'Scrav Bot'}` }),
                  header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: `*${botConfig.bot?.name?.toUpperCase() || 'SCRAV BOT'} MENU*`,
                    hasMediaAttachment: !!headerMedia,
                    ...(headerMedia || {})
                  }),
                  nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons
                  }),
                  contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true
                  }
                })
              }
            }
          }, { userJid: sock.user?.id, quoted: m });

          await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        } catch (e) {
          // Fallback to text
          if (imageBuffer) {
            await sock.sendMessage(m.chat, { image: imageBuffer, caption: txt });
          } else {
            await m.reply(txt);
          }
        }
        break;
      }
      default:
        if (imageBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              image: imageBuffer,
              caption: txt,
              contextInfo: { mentionedJid: [m.sender] },
            },
            { quoted: m },
          );
        } else {
          await m.reply(txt);
        }
    }
  } catch (error) {
    console.error("[AllMenu] Error:", error.message);
    if (imageBuffer) {
      await sock.sendMessage(
        m.chat,
        {
          image: imageBuffer,
          caption: txt,
          contextInfo: { mentionedJid: [m.sender] },
        },
        { quoted: m },
      );
    } else {
      await m.reply(txt);
    }
  }
}
export { pluginConfig as config, handler };
