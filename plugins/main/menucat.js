import * as botmodePlugin from '../group/botmode.js'
import { getCasesByCategory } from '../../case/ourin.js'
import { generateWAMessageFromContent, proto } from 'ourin'
import config from "../../config.js";
import {
  getCommandsByCategory,
  getCategories,
} from "../../src/lib/ourin-plugins.js";
import { getDatabase } from "../../src/lib/ourin-database.js";
import fs from "fs";
import path from "path";
const pluginConfig = {
  name: "menucat",
  alias: ["mc", "category", "cat"],
  category: "main",
  description: "Menampilkan commands dalam kategori tertentu",
  usage: ".menucat <kategori>",
  example: ".menucat tools",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
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
  jpm: "📢",
  pushkontak: "📱",
  ephoto: "🎨",
  store: "🛒",
};
function toMonoUpperBold(text) {
  return text.toUpperCase()
}
function toSmallCaps(text) {
  return text.toUpperCase()
}
let cachedThumb = null;
try {
  const thumbPath = path.join(process.cwd(), "assets", "images", "ourin2.jpg");
  if (fs.existsSync(thumbPath)) cachedThumb = fs.readFileSync(thumbPath);
} catch (e) {}
function getContextInfo() {
  const botName = config.bot?.name || "SCRAVBOT";
  return {
  };
}
async function handler(m, { sock, db }) {
  const prefix = config.command?.prefix || ".";
  const args = m.args || [];
  const categoryArg = args[0]?.toLowerCase();
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
  const casesByCategory = getCasesByCategory();
  const savedVariant = db.setting("menucatVariant");
  const menucatVariant = savedVariant || config.ui?.menucatVariant || 2;
  const botName = config.bot?.name || "SCRAVBOT";
  const imagePath = path.join(process.cwd(), "assets", "images", "ourin.jpg");
  const thumbPath = path.join(process.cwd(), "assets", "images", "ourin2.jpg");
  let imageBuffer = fs.existsSync(imagePath)
    ? fs.readFileSync(imagePath)
    : null;
  let thumbBuffer = fs.existsSync(thumbPath)
    ? fs.readFileSync(thumbPath)
    : null;
  function buildFullContextInfo(title, body) {
    return {
      mentionedJid: [m.sender],
    };
  }
  function buildMediaContextInfo() {
    return {
      mentionedJid: [m.sender],
    };
  }
  if (!categoryArg) {
    const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
    const botMode = groupData.botMode || "md";
    let modeExcludeMap = {
      md: ["panel", "pushkontak", "store"],
      store: ["panel", "pushkontak", "jpm", "ephoto", "cpanel"],
      pushkontak: ["panel", "store", "jpm", "ephoto", "cpanel"],
      cpanel: ["pushkontak", "store", "jpm", "ephoto"],
    };
    try {
      if (botmodePlugin && botmodePlugin.MODES) {
        const modes = botmodePlugin.MODES;
        modeExcludeMap = {};
        for (const [key, val] of Object.entries(modes)) {
          if (val.excludeCategories)
            modeExcludeMap[key] = val.excludeCategories;
        }
      }
    } catch (e) {}
    const excludeCategories = modeExcludeMap[botMode] || modeExcludeMap.md;
    let txt = `📂 *${toMonoUpperBold("DAFTAR KATEGORI")}*\n\n`;
    txt += `> Ketik \`${prefix}menucat <kategori>\`\n\n`;
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
      "jpm",
      "pushkontak",
      "panel",
      "ephoto",
      "store",
    ];
    const allCats = [
      ...new Set([...categories, ...Object.keys(casesByCategory)]),
    ];
    const sortedCats = allCats.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    const visibleCats = sortedCats.filter((cat) => {
      if (cat === "owner" && !m.isOwner) return false;
      if (excludeCategories.includes(cat.toLowerCase())) return false;
      const total =
        (commandsByCategory[cat] || []).length +
        (casesByCategory[cat] || []).length;
      return total > 0;
    });
    txt += `╭─〔 📋 *KATEGORI* 〕───⬣\n`;
    for (const cat of visibleCats) {
      const pluginCmds = commandsByCategory[cat] || [];
      const caseCmds = casesByCategory[cat] || [];
      const totalCmds = pluginCmds.length + caseCmds.length;
      const emoji = CATEGORY_EMOJIS[cat] || "📁";
      txt += ` │ ${emoji} ${cat.toUpperCase()} │ \`${totalCmds}\` cmds\n`;
    }
    txt += `╰───────⬣\n\n`;
    txt += `_Contoh: \`${prefix}menucat tools\`_`;
    try {
      switch (menucatVariant) {
        case 1:
          return await m.reply(txt);
        case 2:
          return await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildFullContextInfo(
                "Daftar Kategori",
                `${visibleCats.length} kategori tersedia`,
              ),
            },
            { quoted: m },
          );
        case 3:
          if (imageBuffer) {
            return await sock.sendMessage(
              m.chat,
              {
                image: imageBuffer,
                caption: txt,
                contextInfo: buildMediaContextInfo(),
              },
              { quoted: m },
            );
          }
          return await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildFullContextInfo(
                "Daftar Kategori",
                `${visibleCats.length} kategori tersedia`,
              ),
            },
            { quoted: m },
          );
        case 4: {
          const catRows = visibleCats.map((cat) => {
            const total =
              (commandsByCategory[cat] || []).length +
              (casesByCategory[cat] || []).length;
            const emoji = CATEGORY_EMOJIS[cat] || "📁";
            return {
              title: `${emoji} ${cat.toUpperCase()}`,
              description: `${total} commands`,
              id: `${prefix}menucat ${cat}`,
            };
          });
          // buttons array removed
          // interactiveMessage removed
          break;
        }
        default:
          return await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildFullContextInfo(
                "Daftar Kategori",
                `${visibleCats.length} kategori tersedia`,
              ),
            },
            { quoted: m },
          );
      }
    } catch (err) {
      console.error("[MenuCat] List error:", err.message);
      return await sock.sendMessage(
        m.chat,
        {
          text: txt,
          contextInfo: getContextInfo(),
        },
        { quoted: m },
      );
    }
  }
  const allCategories = [
    ...new Set([...categories, ...Object.keys(casesByCategory)]),
  ];
  const matchedCat = allCategories.find((c) => c.toLowerCase() === categoryArg);
  if (!matchedCat) {
    return m.reply(
      `❌ *KATEGORI TIDAK DITEMUKAN*\n\n> Kategori \`${categoryArg}\` tidak ada.\n> Ketik \`${prefix}menucat\` untuk list kategori.`,
    );
  }
  if (matchedCat === "owner" && !m.isOwner) {
    return m.reply(`❌ *AKSES DITOLAK*\n\n> Kategori ini hanya untuk owner.`);
  }
  const pluginCommands = commandsByCategory[matchedCat] || [];
  const caseCommands = casesByCategory[matchedCat] || [];
  const allCommands = [...pluginCommands, ...caseCommands];
  if (allCommands.length === 0) {
    return m.reply(
      `❌ *KOSONG*\n\n> Kategori \`${matchedCat}\` tidak memiliki command.`,
    );
  }
  const emoji = CATEGORY_EMOJIS[matchedCat] || "📁";
  let txt = `╭─〔 ${emoji} *${matchedCat.toUpperCase()}* 〕───⬣\n`;
  for (const cmd of allCommands) {
    txt += ` │ \`${prefix}${cmd}\`\n`;
  }
  txt += `╰───────⬣\n\n`;
  txt += `Total: \`${allCommands.length}\` commands\n`;
  if (caseCommands.length > 0) {
    txt += `(${pluginCommands.length} plugin + ${caseCommands.length} case)`;
  }
  try {
    switch (menucatVariant) {
      case 1:
        await m.reply(txt);
        break;
      case 2:
        await sock.sendMessage(
          m.chat,
          {
            text: txt,
            contextInfo: buildFullContextInfo(
              `${emoji} ${matchedCat}`,
              `${allCommands.length} commands`,
            ),
          },
          { quoted: m },
        );
        break;
      case 3:
        if (imageBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              image: imageBuffer,
              caption: txt,
              contextInfo: buildMediaContextInfo(),
            },
            { quoted: m },
          );
        } else {
          await sock.sendMessage(
            m.chat,
            {
              text: txt,
              contextInfo: buildFullContextInfo(
                `${emoji} ${matchedCat}`,
                `${allCommands.length} commands`,
              ),
            },
            { quoted: m },
          );
        }
        break;
      case 4:
        if (imageBuffer) {
          await sock.sendMessage(m.chat, { image: imageBuffer, caption: txt });
        } else {
          await m.reply(txt);
        }
        break;
      default:
        await sock.sendMessage(
          m.chat,
          {
            text: txt,
            contextInfo: buildFullContextInfo(
              `${emoji} ${matchedCat}`,
              `${allCommands.length} commands`,
            ),
          },
          { quoted: m },
        );
    }
  } catch (err) {
    console.error("[MenuCat] Detail error:", err.message);
    await sock.sendMessage(
      m.chat,
      {
        text: txt,
        contextInfo: getContextInfo(),
      },
      { quoted: m },
    );
  }
}
export { pluginConfig as config, handler };
