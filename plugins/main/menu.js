import { getCaseCount, getCasesByCategory } from "../../case/ourin.js";
import {
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  proto,
} from "ourin";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import _sharp from "sharp";
import config from "../../config.js";
import {
  formatUptime,
  getTimeGreeting,
} from "../../src/lib/ourin-formatter.js";
import {
  getCommandsByCategory,
  getCategories,
} from "../../src/lib/ourin-plugins.js";
import { getDatabase } from "../../src/lib/ourin-database.js";
import fs from "fs";
import path from "path";

function getSharp() {
  return _sharp;
}
import axios from "axios";
const pluginConfig = {
  name: "menu",
  alias: ["help", "bantuan", "commands", "m"],
  category: "main",
  description: "Menampilkan menu utama bot",
  usage: ".menu",
  example: ".menu",
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
};
function toSmallCaps(text) {
  const smallCaps = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ꜰ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "s",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => smallCaps[c] || c)
    .join("");
}
const toMonoUpperBold = (text) => {
  const chars = {
    A: "𝗔",
    B: "𝗕",
    C: "𝗖",
    D: "𝗗",
    E: "𝗘",
    F: "𝗙",
    G: "𝗚",
    H: "𝗛",
    I: "𝗜",
    J: "𝗝",
    K: "𝗞",
    L: "𝗟",
    M: "𝗠",
    N: "𝗡",
    O: "𝗢",
    P: "𝗣",
    Q: "𝗤",
    R: "𝗥",
    S: "𝗦",
    T: "𝗧",
    U: "𝗨",
    V: "𝗩",
    W: "𝗪",
    X: "𝗫",
    Y: "𝗬",
    Z: "𝗭",
  };
  return text
    .toUpperCase()
    .split("")
    .map((c) => chars[c] || c)
    .join("");
};
function getSortedCategories(m, botMode) {
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
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
    "ephoto",
    "jpm",
    "pushkontak",
    "panel",
    "store",
  ];
  let modeAllowedMap = {
    md: null,
    cpanel: ["main", "group", "sticker", "owner", "tools", "panel"],
    store: ["main", "group", "sticker", "owner", "store"],
    pushkontak: ["main", "group", "sticker", "owner", "pushkontak"],
  };
  let modeExcludeMap = {
    md: ["panel", "pushkontak", "store"],
    cpanel: null,
    store: null,
    pushkontak: null,
  };
  const allowedCats = modeAllowedMap[botMode];
  const excludeCats = modeExcludeMap[botMode] || [];
  const sortedCats = [...categories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  const result = [];
  let totalCmds = 0;
  for (const cat of sortedCats) {
    if (cat === "owner" && !m.isOwner) continue;
    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
    const cmds = commandsByCategory[cat] || [];
    if (cmds.length === 0) continue;
    const emoji = CATEGORY_EMOJIS[cat] || "📁";
    result.push({ cat, cmds, emoji });
  }
  for (const cat of categories) {
    totalCmds += (commandsByCategory[cat] || []).length;
  }
  return { sorted: result, totalCmds, commandsByCategory };
}
async function formatTime(date) {
  const timeHelper = await import("../../src/lib/ourin-time.js");
  return timeHelper.formatTime("HH:mm");
}
async function formatDateShort(date) {
  const timeHelper = await import("../../src/lib/ourin-time.js");
  return timeHelper.formatFull("dddd, DD MMMM YYYY");
}
async function buildMenuText(
  m,
  botConfig,
  db,
  uptime,
  botMode = "md",
  useBracketBoxStyle = false,
) {
  const prefix = botConfig.command?.prefix || ".";
  const user = db.getUser(m.sender);
  const timeHelper = await import("../../src/lib/ourin-time.js");
  const timeStr = timeHelper.formatTime("HH:mm");
  const dateStr = timeHelper.formatFull("dddd, DD MMMM YYYY");
  const categories = getCategories();
  const commandsByCategory = getCommandsByCategory();
  let totalCommands = 0;
  for (const category of categories) {
    totalCommands += (commandsByCategory[category] || []).length;
  }
  const totalCases = getCaseCount();
  const casesByCategory = getCasesByCategory();
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
  const uptimeFormatted = formatUptime(uptime);
  const totalUsers = db.getUserCount();
  let txt = `Hai *@${m.pushName || "User"}* 🪸
Aku ${botConfig.bot?.name || "BOT FYU"}, bot WhatsApp yang siap bantu kamu.  
Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.`;
  const botInfoLines = [
    `🖐 ɴᴀᴍᴀ     : ${botConfig.bot?.name || "BOT FYU"}`,
    `🔑 ᴠᴇʀsɪ    : v${botConfig.bot?.version || "1.2.0"}`,
    `⚙️ ᴍᴏᴅᴇ     : ${(botConfig.mode || "public").toUpperCase()}`,
    `🧶 ᴘʀᴇꜰɪx    : [ ${prefix} ]`,
    `⏱ ᴜᴘᴛɪᴍᴇ   : ${uptimeFormatted}`,
    `👥 ᴛᴏᴛᴀʟ    : ${totalUsers} Users`,
    `🏷 ɢʀᴏᴜᴘ     : ${botMode.toUpperCase()}`,
    `👑 ᴏᴡɴᴇʀ    : ${botConfig.owner?.name || "BOT FYU"}`,
  ];
  const userInfoLines = [
    `🙋 ɴᴀᴍᴀ     : ${m.pushName}`,
    `🎭 ʀᴏʟᴇ     : ${roleEmoji} ${userRole}`,
    `🎟 ᴇɴᴇʀɢɪ   : ${m.isOwner || m.isPremium ? "∞ Unlimited" : (user?.energi ?? 25)}`,
    `⚡ ʟᴇᴠᴇʟ    : ${Math.floor((user?.exp || 0) / 20000) + 1}`,
    `✨ ᴇxᴘ       : ${(user?.exp ?? 0).toLocaleString()}`,
    `💰 ᴋᴏɪɴ      : ${(user?.koin ?? 0).toLocaleString()}`,
  ];
  const rpg = user?.rpg || {};
  if (rpg.health !== undefined) {
    userInfoLines.push(
      `❤️ ʜᴘ        : ${rpg.health}/${rpg.maxHealth || rpg.health}`,
    );
    userInfoLines.push(`🔮 ᴍᴀɴᴀ      : ${rpg.mana}/${rpg.maxMana || rpg.mana}`);
    userInfoLines.push(
      `🏃 sᴛᴀᴍɪɴᴀ   : ${rpg.stamina}/${rpg.maxStamina || rpg.stamina}`,
    );
  }
  const inv = user?.inventory || {};
  const invCount = Object.values(inv).reduce(
    (a, b) => a + (typeof b === "number" ? b : 0),
    0,
  );
  if (invCount > 0) userInfoLines.push(`🎒 ɪɴᴠᴇɴᴛᴏʀʏ : ${invCount} items`);
  userInfoLines.push(`🕒 ᴡᴀᴋᴛᴜ    : ${timeStr} WIB`);
  userInfoLines.push(`📅 ᴛᴀɴɢɢᴀʟ  : ${dateStr}`);

  if (useBracketBoxStyle) {
    txt += `\n\n`;
    txt += createBracketBox("BOT INFO", botInfoLines);
    txt += createBracketBox("USER INFO", userInfoLines);
  } else {
    txt += `\n\n╭─〔 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 〕\n`;
    txt += `*│* 🖐 ɴᴀᴍᴀ     : *${botConfig.bot?.name || "BOT FYU"}*\n`;
    txt += `*│* 🔑 ᴠᴇʀsɪ    : *v${botConfig.bot?.version || "1.2.0"}*\n`;
    txt += `*│* ⚙️ ᴍᴏᴅᴇ     : *${(botConfig.mode || "public").toUpperCase()}*\n`;
    txt += `*│* 🧶 ᴘʀᴇꜰɪx    : *[ ${prefix} ]*\n`;
    txt += `*│* ⏱ ᴜᴘᴛɪᴍᴇ   : *${uptimeFormatted}*\n`;
    txt += `*│* 👥 ᴛᴏᴛᴀʟ    : *${totalUsers} Users*\n`;
    txt += `*│* 🏷 ɢʀᴏᴜᴘ     : *${botMode.toUpperCase()}*\n`;
    txt += `*│* 👑 ᴏᴡɴᴇʀ    : *${botConfig.owner?.name || "BOT FYU"}*\n`;
    txt += `╰────────────────⬣\n\n`;
    txt += `╭─〔 👤 *ᴜsᴇʀ ɪɴꜰᴏ* 〕\n`;
    txt += `*│* 🙋 ɴᴀᴍᴀ     : *${m.pushName}*\n`;
    txt += `*│* 🎭 ʀᴏʟᴇ     : *${roleEmoji} ${userRole}*\n`;
    txt += `*│* 🎟 ᴇɴᴇʀɢɪ   : *${m.isOwner || m.isPremium ? "∞ Unlimited" : (user?.energi ?? 25)}*\n`;
    txt += `*│* ⚡ ʟᴇᴠᴇʟ    : *${Math.floor((user?.exp || 0) / 20000) + 1}*\n`;
    txt += `*│* ✨ ᴇxᴘ       : *${(user?.exp ?? 0).toLocaleString()}*\n`;
    txt += `*│* 💰 ᴋᴏɪɴ      : *${(user?.koin ?? 0).toLocaleString()}*\n`;
    if (rpg.health !== undefined) {
      txt += `*│* ❤️ ʜᴘ        : *${rpg.health}/${rpg.maxHealth || rpg.health}*\n`;
      txt += `*│* 🔮 ᴍᴀɴᴀ      : *${rpg.mana}/${rpg.maxMana || rpg.mana}*\n`;
      txt += `*│* 🏃 sᴛᴀᴍɪɴᴀ   : *${rpg.stamina}/${rpg.maxStamina || rpg.stamina}*\n`;
    }
    if (invCount > 0) txt += `*│* 🎒 ɪɴᴠᴇɴᴛᴏʀʏ : *${invCount} items*\n`;
    txt += `*│* 🕒 ᴡᴀᴋᴛᴜ    : *${timeStr} WIB*\n`;
    txt += `*│* 📅 ᴛᴀɴɢɢᴀʟ  : *${dateStr}*\n`;
    txt += `╰────────────────⬣\n\n`;
  }
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
    "ephoto",
    "jpm",
    "pushkontak",
    "panel",
    "store",
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
    const botmodePlugin = await import("../group/botmode.js");
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
  const categoryLines = [];
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
    const totalCmds = pluginCmds.length + caseCmds.length;
    if (totalCmds === 0) continue;
    const emoji = CATEGORY_EMOJIS[category] || "📁";
    categoryLines.push(`${prefix}menucat ${category} ${emoji}`);
  }
  if (useBracketBoxStyle) {
    txt += createBracketBox("LIST CATEGORY", categoryLines);
  } else {
    txt += `📂 *ᴅᴀꜰᴛᴀʀ ᴍᴇɴᴜ*\n`;
    for (const line of categoryLines) {
      txt += `- \`◦\` ${toSmallCaps(line)}\n`;
    }
  }
  return txt;
}

function createBracketBox(title, lines = [], emoji = "🤖") {
  let text = `╭─〔 ${emoji} \`${title}\`〕─⬣\n`;
  for (const line of lines) {
    text += `│ ✦ *${line}*\n`;
  }
  text += `╰─⬣\n\n`;
  return text;
}

function getContextInfo(
  botConfig,
  m,
  thumbBuffer,
  renderLargerThumbnail = false,
  isMedia = false,
) {
  const ctx = {
    mentionedJid: [m.sender],
  };
  return ctx;
}
function getVerifiedQuoted(botConfig) {
  return null;
}
async function sendFallback(
  m,
  sock,
  text,
  imageBuffer,
  thumbBuffer,
  botConfig,
  errorName,
) {
  if (errorName) console.error(`[Menu Error] ${errorName}`);
  const fallbackMsg = {
    contextInfo: getContextInfo(botConfig, m, thumbBuffer, false, !!imageBuffer),
  };
  let fallbackText = text;
  if (errorName === "V5") {
    const { sorted } = getSortedCategories(m, "md");
    let catText = `📋 *ᴋᴀᴛᴇɢᴏʀɪ ᴍᴇɴᴜ*\n\n`;
    for (const { cat, cmds, emoji } of sorted)
      catText += `> ${emoji} \`${botConfig.command?.prefix || "."}menucat ${cat}\` - ${toMonoUpperBold(cat)} (${cmds.length})\n`;
    catText += `\n_Ketik perintah kategori untuk melihat command_`;
    fallbackText = text + "\n\n" + catText;
  }
  if (imageBuffer) {
    fallbackMsg.image = imageBuffer;
    fallbackMsg.caption = fallbackText;
  } else {
    fallbackMsg.text = fallbackText;
  }
  await sock.sendMessage(m.chat, fallbackMsg, {
    quoted: getVerifiedQuoted(botConfig),
  });
}
async function handler(m, { sock, config: botConfig, db, uptime }) {
  const savedVariant = db.setting("menuVariant");
  const menuVariant = savedVariant || botConfig.ui?.menuVariant || 1;
  const groupData = m.isGroup ? db.getGroup(m.chat) || {} : {};
  const botMode = groupData.botMode || "md";
  const text = await buildMenuText(
    m,
    botConfig,
    db,
    uptime,
    botMode,
    menuVariant === 9,
  );

  const imagePath = path.join(process.cwd(), "assets", "images", "ourin.jpg");
  const thumbPath = path.join(process.cwd(), "assets", "images", "ourin2.jpg");
  const videoPath = path.join(process.cwd(), "assets", "video", "ourin.mp4");
  let imageBuffer = fs.existsSync(imagePath)
    ? fs.readFileSync(imagePath)
    : null;
  let thumbBuffer = fs.existsSync(thumbPath)
    ? fs.readFileSync(thumbPath)
    : null;
  let videoBuffer = fs.existsSync(videoPath)
    ? fs.readFileSync(videoPath)
    : null;
  const prefix = botConfig.command?.prefix || ".";

  const {
    sorted: menuSorted,
    totalCmds,
    commandsByCategory,
  } = getSortedCategories(m, botMode);
  const greeting = getTimeGreeting();
  const uptimeFormatted = formatUptime(uptime);
  try {
    switch (menuVariant) {
      case 1:
        if (imageBuffer) {
          await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
        } else {
          await m.reply(text);
        }
        break;
      case 2:
        const msgV2 = {
          contextInfo: getContextInfo(botConfig, m, thumbBuffer, false, !!imageBuffer),
        };
        if (imageBuffer) {
          msgV2.image = imageBuffer;
          msgV2.caption = text;
        } else {
          msgV2.text = text;
        }
        await sock.sendMessage(m.chat, msgV2, {
          quoted: getVerifiedQuoted(botConfig),
        });
        break;
      case 3:
        let resizedThumb = thumbBuffer;
        if (thumbBuffer) {
          try {
            resizedThumb = await (await getSharp())(thumbBuffer)
              .resize(300, 300, { fit: "cover" })
              .jpeg({ quality: 80 })
              .toBuffer();
          } catch (e) {
            resizedThumb = thumbBuffer;
          }
        }
        let contextThumb = thumbBuffer;
        try {
          const ScravBotPath = path.join(
            process.cwd(),
            "assets",
            "images",
            "ourin.jpg",
          );
          if (fs.existsSync(ScravBotPath)) {
            contextThumb = fs.readFileSync(ScravBotPath);
          }
        } catch (e) {}
        await sock.sendMessage(
          m.chat,
          {
            image: imageBuffer || Buffer.from(""),
            caption: text,
            contextInfo: getContextInfo(botConfig, m, contextThumb, true, true),
          },
          { quoted: getVerifiedQuoted(botConfig) },
        );
        break;
      case 4:
        if (videoBuffer) {
          await sock.sendMessage(
            m.chat,
            {
              video: videoBuffer,
              caption: text,
              gifPlayback: true,
              contextInfo: getContextInfo(botConfig, m, thumbBuffer, false, true),
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } else {
          const fallback = {
            contextInfo: getContextInfo(botConfig, m, thumbBuffer, false, !!imageBuffer),
          };
          if (imageBuffer) {
            fallback.image = imageBuffer;
            fallback.caption = text;
          } else {
            fallback.text = text;
          }
          await sock.sendMessage(m.chat, fallback, {
            quoted: getVerifiedQuoted(botConfig),
          });
        }
        break;
      case 5:
      case 9: {
        try {
          const timeHelper = await import("../../src/lib/ourin-time.js");
          const time = timeHelper.formatTime("HH:mm");
          const date = timeHelper.formatFull("DD/MM/YYYY");
          const user = db.getUser(m.sender);
          let role = "User";
          if (m.isOwner) role = "Owner";
          else if (m.isPremium) role = "Premium";

          let bodyText = `Hai *@${m.pushName || "User"}* 🪸\n\n`;
          bodyText += `Aku *${botConfig.bot?.name || 'Scrav Bot'}*, bot WhatsApp yang siap bantu kamu.  \n`;
          bodyText += `Kamu bisa pakai aku buat cari info, ambil data, atau bantu hal-hal sederhana langsung lewat WhatsApp — praktis tanpa ribet.\n\n`;
          bodyText += `╭┈┈⬡「 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 」\n`;
          bodyText += `┃ \`◦\` ɴᴀᴍᴀ: *${botConfig.bot?.name || 'Scrav Bot'}*\n`;
          bodyText += `┃ \`◦\` ᴠᴇʀsɪ: *v${botConfig.bot?.version || '1.7.0'}*\n`;
          bodyText += `┃ \`◦\` ᴍᴏᴅᴇ: *${(botConfig.mode || 'public').toUpperCase()}*\n`;
          bodyText += `┃ \`◦\` ᴜᴘᴛɪᴍᴇ: *${uptimeFormatted}*\n`;
          bodyText += `┃ \`◦\` ᴛᴏᴛᴀʟ ᴄᴍᴅ: *${totalCmds}*\n`;
          bodyText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
          bodyText += `╭┈┈⬡「 👤 *ᴜsᴇʀ ɪɴꜰᴏ* 」\n`;
          bodyText += `┃ \`◦\` ʀᴏʟᴇ: *${role}*\n`;
          bodyText += `┃ \`◦\` ʟɪᴍɪᴛ: *${m.isOwner || m.isPremium ? '∞ Unlimited' : (user?.energi ?? 25)}*\n`;
          bodyText += `┃ \`◦\` ᴡᴀᴋᴛᴜ: *${time} WIB*\n`;
          bodyText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
          bodyText += `📋 *Pilih kategori di bawah untuk melihat daftar command*`;

          const categoryRows = menuSorted.map(({ cat, cmds, emoji }) => ({
            title: `${emoji} ${toMonoUpperBold(cat)}`,
            description: `${cmds.length} commands`,
            id: `${prefix}menucat ${cat}`
          }));

          const buttons = [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "📁 ᴘɪʟɪʜ ᴍᴇɴᴜ",
                sections: [
                  {
                    title: "📋 PILIH CATEGORY",
                    rows: categoryRows
                  }
                ]
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "📊 TOTAL FITUR",
                id: `${prefix}totalfitur`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "📊 SEMUA MENU",
                id: `${prefix}allmenu`
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
                  body: proto.Message.InteractiveMessage.Body.fromObject({ text: bodyText }),
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
          await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig, e.message);
        }
        break;
      }
      case 6:
        const thumbPathV6 = path.join(
          process.cwd(),
          "assets",
          "images",
          "ourin3.jpg",
        );

        let bannerThumbV6 = null;
        try {
          const sourceBuffer = fs.existsSync(thumbPathV6)
            ? fs.readFileSync(thumbPathV6)
            : thumbBuffer || imageBuffer;
          if (sourceBuffer) {
            bannerThumbV6 = await (await getSharp())(sourceBuffer)
              .resize(200, 200, { fit: "inside" })
              .jpeg({ quality: 90 })
              .toBuffer();
          }
        } catch (resizeErr) {
          console.error("[Menu V6] Resize error:", resizeErr.message);
          bannerThumbV6 = thumbBuffer;
        }
        const contextInfoV6 = {
          mentionedJid: [m.sender],
        };
        try {
          await sock.sendMessage(
            m.chat,
            {
              image: imageBuffer || Buffer.from(""),
              caption: text,
              contextInfo: contextInfoV6,
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } catch (v6Error) {
          console.error("[Menu V6] Error:", v6Error.message);
          const fallbackV6 = {
            contextInfo: getContextInfo(botConfig, m, thumbBuffer, false, !!imageBuffer),
          };
          if (imageBuffer) {
            fallbackV6.image = imageBuffer;
            fallbackV6.caption = text;
          } else {
            fallbackV6.text = text;
          }
          await sock.sendMessage(m.chat, fallbackV6, {
            quoted: getVerifiedQuoted(botConfig),
          });
        }
        break;
      case 7:
        await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig);
        break;
      case 8: {
        const timeHelper = await import("../../src/lib/ourin-time.js");
        const time = timeHelper.formatTime("HH:mm");
        const date = timeHelper.formatFull("DD/MM/YYYY");
        const user = db.getUser(m.sender);
        let role = "𝙐𝙨𝙚𝙧",
          emojiRole = "◈";
        if (m.isOwner) {
          role = "𝙊𝙬𝙣𝙚𝙧";
          emojiRole = "♚";
        } else if (m.isPremium) {
          role = "𝙋𝙧𝙚𝙢𝙞𝙪𝙢";
          emojiRole = "✦";
        }
        let menuText = ``;
        const sparkles = ["✦", "✧", "⋆", "˚", "✵", "⊹"];
        const randomSparkle = () =>
          sparkles[Math.floor(Math.random() * sparkles.length)];
        menuText += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n`;
        menuText += `*${botConfig.bot?.name || "𝗢𝗨𝗥𝗜𝗡-𝗔𝗜"}*\n`;
        menuText += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n\n`;
        menuText += `┏━━━〔 ${emojiRole} *𝗣𝗥𝗢𝗙𝗜𝗟𝗘* 〕━━━┓\n`;
        menuText += `┃ 👤 *${m.pushName}*\n`;
        menuText += `┃ 🏷️ ${role}\n`;
        menuText += `┃ 🎫 Energi  ➤ ${m.isOwner || m.isPremium ? "∞ Unlimited" : (user?.energi ?? 25)}\n`;
        menuText += `┃ ⚡ Level   ➤ ${Math.floor((user?.exp || 0) / 20000) + 1}\n`;
        menuText += `┃ ✨ Exp     ➤ ${(user?.exp ?? 0).toLocaleString()}\n`;
        menuText += `┃ 💰 Koin    ➤ ${(user?.koin ?? 0).toLocaleString()}\n`;
        const v8rpg = user?.rpg || {};
        if (v8rpg.health !== undefined) {
          menuText += `┃ ❤️ HP      ➤ ${v8rpg.health}/${v8rpg.maxHealth}\n`;
          menuText += `┃ 🔮 Mana    ➤ ${v8rpg.mana}/${v8rpg.maxMana}\n`;
          menuText += `┃ 🏃 Stamina ➤ ${v8rpg.stamina}/${v8rpg.maxStamina}\n`;
        }
        menuText += `┃ ⏰ ${time} WIB\n`;
        menuText += `┃ 📅 ${date}\n`;
        menuText += `┗━━━━━━━━━━━━━━━┛\n\n`;
        menuText += `┏━━〔 ⚡ *𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗧𝗦* 〕━━┓\n`;
        menuText += `┃ ⏱️ Uptime  ➤ ${uptimeFormatted}\n`;
        menuText += `┃ 🔧 Mode    ➤ ${botMode.toUpperCase()}\n`;
        menuText += `┃ 📊 Total   ➤ ${totalCmds} Commands\n`;
        menuText += `┃ 👥 Users   ➤ ${db.getUserCount()} Aktif\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
        menuText += `╭══════════════════════╮\n`;
        menuText += `║  📋 *𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧*    ║\n`;
        menuText += `╰══════════════════════╯\n\n`;
        for (const { cat, cmds, emoji } of menuSorted) {
          menuText += `┌─────「 ${emoji} *${cat.toUpperCase()}* 」\n`;
          menuText += `│ ✦ Total: ${cmds.length} commands\n`;
          menuText += `│\n`;
          for (const cmd of cmds) {
            menuText += `│ ├➤ ${prefix}${cmd}\n`;
          }
          menuText += `│\n`;
          menuText += `└───────────────────\n\n`;
        }

        menuText += `> ${randomSparkle()} *${botConfig.bot?.name || "ScravBot"}* v${botConfig.bot?.version || "1.7.1"} ${randomSparkle()}`;
        let thumbV8 = thumbBuffer;
        if (thumbBuffer) {
          try {
            thumbV8 = await (await getSharp())(thumbBuffer)
              .resize(300, 300, { fit: "cover" })
              .jpeg({ quality: 80 })
              .toBuffer();
          } catch (e) {
            thumbV8 = thumbBuffer;
          }
        }
        const ftroliQuoted = {
          key: {
            fromMe: false,
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
          },
          message: {
            orderMessage: {
              orderId: "1337",
              thumbnail: thumbV8 || null,
              itemCount: totalCmds,
              status: "INQUIRY",
              surface: "CATALOG",
              message: `${botConfig.bot?.name || "BOT FYU"} Menu`,
              orderTitle: `📋 ${totalCmds} Commands`,
              sellerJid: botConfig.botNumber
                ? `${botConfig.botNumber}@s.whatsapp.net`
                : m.sender,
              token: "ourin-menu-v8",
              totalAmount1000: 0,
              totalCurrencyCode: "IDR",
            },
          },
        };
        await sock.sendMessage(
          m.chat,
          {
            image: fs.existsSync("assets/images/ourin-v8.jpg")
              ? fs.readFileSync("assets/images/ourin-v8.jpg")
              : imageBuffer || thumbBuffer,
            caption: menuText,
            contextInfo: getContextInfo(botConfig, m, imageBuffer, true, true),
          },
          { quoted: ftroliQuoted },
        );
        break;
      }

      case 10:
        await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig);
        break;
      case 11:
        await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig);
        break;
      case 12:
        await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig);
        break;
      case 13: {
        const thumbPathV13 = path.join(
          process.cwd(),
          "assets",
          "images",
          "ourin3.jpg",
        );

        let totalCmdsV13 = totalCmds;
        let bannerThumbV13 = null;
        const user = db.getUser(m.sender);
        try {
          /**
           * Fungsi untuk membuat gambar profil menggunakan @napi-rs/canvas
           * @param {Object} data Data user
           * @returns {Promise<Buffer>} Buffer gambar PNG
           */
          async function createProfileCard(data) {
            // Ukuran kanvas
            const canvas = createCanvas(800, 250);
            const ctx = canvas.getContext("2d");
            // Tema Warna "Edgy Graphic Design"
            const accentColor = "#CCFF00"; // Volt Green (Hijau stabilo/kuning)
            const fgColor = "#FFFFFF";
            // 1. Background Image dengan Kontras Tinggi (Object-fit Cover)
            ctx.fillStyle = "#09090B"; // Mencegah background putih transparan WA
            ctx.fillRect(0, 0, 800, 250);
            try {
              const bgImage = await loadImage(data.backgroundUrl);
              const canvasRatio = 800 / 250;
              const imgRatio = bgImage.width / bgImage.height;
              let drawW, drawH, drawX, drawY;
              if (imgRatio > canvasRatio) {
                drawH = 250;
                drawW = bgImage.width * (250 / bgImage.height);
                drawX = (800 - drawW) / 2;
                drawY = 0;
              } else {
                drawW = 800;
                drawH = bgImage.height * (800 / bgImage.width);
                drawX = 0;
                drawY = (250 - drawH) / 2;
              }
              ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
            } catch (error) {
              ctx.fillStyle = "#09090B";
              ctx.fillRect(0, 0, 800, 250);
            }
            // Overlay gelap pekat agar terkesan misterius & solid
            ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
            ctx.fillRect(0, 0, 800, 250);
            // 2. Bentuk Asimetris (Sentuhan "Human Design")
            // Alih-alih kotak rapi, kita buat bidang miring di latar belakang
            ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(400, 0);
            ctx.lineTo(320, 250);
            ctx.lineTo(0, 250);
            ctx.fill();
            // Garis miring aksen
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(410, 0);
            ctx.lineTo(330, 250);
            ctx.stroke();
            // 3. Tipografi "Watermark" Super Besar di Background
            ctx.fillStyle = "rgba(204, 255, 0, 0.05)";
            ctx.font = "900 150px sans-serif";
            ctx.fillText(`LV${data.level}`, 300, 220);
            // 4. Elemen Dekoratif Mikro (Khas Desain Grafis)
            // Teks sistem kecil di pojok kiri atas
            ctx.fillStyle = "#666666";
            ctx.font = "10px monospace";
            ctx.fillText("// SYS_ONLINE : USER_PROFILE", 30, 25);
            ctx.fillText(
              "ID_HASH: " +
                Math.random().toString(36).substring(2, 10).toUpperCase(),
              30,
              40,
            );
            // Garis "Barcode" di pojok kanan atas
            ctx.fillStyle = accentColor;
            ctx.fillRect(770, 20, 6, 40);
            ctx.fillRect(760, 20, 2, 40);
            ctx.fillRect(752, 20, 3, 40);
            // 5. Konfigurasi Avatar (Bentuk Lingkaran Rapi)
            const avatarSize = 130;
            const avatarX = 50;
            const avatarY = 60;
            const centerX = avatarX + avatarSize / 2;
            const centerY = avatarY + avatarSize / 2;
            const radius = avatarSize / 2;
            // Memotong area avatar menjadi lingkaran
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            // Memuat gambar avatar
            try {
              const avatar = await loadImage(data.avatarUrl);
              ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            } catch (error) {
              ctx.fillStyle = "#333333";
              ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
            }
            ctx.restore();
            // Bingkai Lingkaran yang Rapi
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
            ctx.lineWidth = 4; // Ketebalan border
            ctx.strokeStyle = accentColor;
            ctx.stroke();
            // ==========================================
            // AREA TEKS DAN BADGE
            // ==========================================
            // 6. Nama Pengguna (Besar & Tegas, Jangan di toUpperCase() agar Emoji aman)
            ctx.fillStyle = fgColor;
            ctx.font = "900 42px sans-serif";
            let displayName = data.name || "User";
            if (displayName.length > 15)
              displayName = displayName.substring(0, 15) + "...";
            ctx.fillText(displayName, 230, 100);
            // 7. Badge Rank Miring (Slanted Badge)
            ctx.save();
            ctx.translate(230, 115);
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(120, 0); // Lebar atas
            ctx.lineTo(110, 24); // Miring ke kiri bawah
            ctx.lineTo(-10, 24); // Miring ke kiri bawah
            ctx.fill();
            ctx.fillStyle = "#000000"; // Teks hitam di dalam badge Volt Green
            ctx.font = "bold 14px sans-serif";
            ctx.fillText(data.rank.toUpperCase(), 10, 17);
            ctx.restore();
            // ==========================================
            // AREA PROGRESS BAR (Gaya Segmented/Terputus-putus)
            // ==========================================
            const barX = 230;
            const barY = 172; // Posisi bar disesuaikan agar panel teks di bawah lega
            const barWidth = 500;
            const segments = 25; // Dibagi 25 kotak kecil
            const gap = 3;
            const segmentWidth = (barWidth - gap * (segments - 1)) / segments;
            const xpRatio = Math.min(data.currentXp / data.requiredXp, 1);
            const activeSegments = Math.floor(xpRatio * segments);
            // Background Bar (Kotak-kotak kosong)
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            for (let i = 0; i < segments; i++) {
              ctx.fillRect(
                barX + i * (segmentWidth + gap),
                barY,
                segmentWidth,
                8,
              );
            }
            // Foreground Bar (Kotak-kotak terisi)
            ctx.fillStyle = accentColor;
            for (let i = 0; i < activeSegments; i++) {
              ctx.fillRect(
                barX + i * (segmentWidth + gap),
                barY,
                segmentWidth,
                8,
              );
            }
            // ==========================================
            // AREA DETAIL EXP & LEVEL (HUD STYLE)
            // ==========================================
            const dataY = barY + 18; // Jarak turun dari progress bar
            // 1. PANEL EXP (Kiri)
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; // Background transparan putih
            ctx.beginPath();
            ctx.moveTo(barX, dataY);
            ctx.lineTo(barX + 210, dataY); // Ujung atas kanan
            ctx.lineTo(barX + 198, dataY + 26); // Ujung bawah kanan (miring ke dalam)
            ctx.lineTo(barX, dataY + 26); // Ujung bawah kiri
            ctx.fill();
            // Aksen Garis Volt Green di kiri Panel EXP
            ctx.fillStyle = accentColor;
            ctx.fillRect(barX, dataY, 4, 26);
            // Teks Label "EXP"
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("EXP", barX + 15, dataY + 18);
            // Teks Angka EXP Current (Warna Volt Green agar menyala)
            ctx.fillStyle = accentColor;
            ctx.font = "bold 14px monospace";
            ctx.fillText(data.currentXp.toString(), barX + 50, dataY + 18);
            // Pemisah & Angka EXP Max (Warna Abu-abu netral)
            const currentXpWidth = ctx.measureText(
              data.currentXp.toString(),
            ).width;
            ctx.fillStyle = "#888888";
            ctx.font = "14px monospace";
            ctx.fillText(
              ` / ${data.requiredXp}`,
              barX + 50 + currentXpWidth,
              dataY + 18,
            );
            // 2. BADGE LEVEL (Kanan)
            const badgeW = 90;
            ctx.save();
            ctx.translate(barX + barWidth - badgeW, dataY);
            // Bentuk Badge: Kiri miring (konsisten), kanan lurus (sejajar ujung bar)
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(badgeW, 0);
            ctx.lineTo(badgeW, 26);
            ctx.lineTo(0, 26);
            ctx.fill();
            // Teks "LVL X" warna hitam pekat di dalam badge
            ctx.fillStyle = "#000000";
            ctx.font = "900 16px sans-serif";
            ctx.textAlign = "center";
            // Titik X diatur ke 48 agar teks berada tepat di tengah visual panel miring
            ctx.fillText(`LVL ${data.level}`, 48, 19);
            ctx.restore();
            return canvas.toBuffer("image/jpeg");
          }
          const levelHelper = await import("../../src/lib/ourin-level.js");
          const profileUser = db.getUser(m.sender) || {};
          const exp = profileUser.exp || 0;
          const level = levelHelper.calculateLevel(exp);
          const currentLevelExp = levelHelper.expForLevel(level);
          const nextLevelExp = levelHelper.expForLevel(level + 1);
          let resolvedAvatarUrl = "https://i.ibb.co/3Fh9Q6M/empty-profile.png";
          try {
            const ppUrl = await sock.profilePictureUrl(m.sender, "image");
            if (ppUrl) resolvedAvatarUrl = ppUrl;
          } catch (e) {}
          bannerThumbV13 = await createProfileCard({
            name: m.pushName || profileUser.name || "User",
            level: level,
            currentXp: exp - currentLevelExp,
            requiredXp: nextLevelExp - currentLevelExp,
            rank: levelHelper.getRole(level),
            avatarUrl: resolvedAvatarUrl,
            backgroundUrl: "https://i.ibb.co/4YZnk48/default-bg.jpg",
          });
        } catch (canvasErr) {
          console.error("[Menu V13] Canvas error:", canvasErr.message);
          bannerThumbV13 = thumbBuffer || imageBuffer;
        }
        const contextInfoV13 = {
          mentionedJid: [m.sender],
        };
        try {
          const formatNumber = (number) => {
            if (number >= 1e9) {
              return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
            }
            if (number >= 1e6) {
              return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
            }
            if (number >= 1e3) {
              return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
            }
            return number.toString();
          };
          await sock.sendMessage(
            m.chat,
            {
              image: bannerThumbV13,
              caption: `🎄 ʜᴀʟʟᴏ *${m.pushName}*
╭─ *✦* \`${toMonoUpperBold("biodata bot")}\` *✦*
│ ʙᴏᴛ : *${botConfig.bot?.name || "BOT FYU"}*
│ ᴠᴇʀsɪᴏɴ : *${botConfig.bot?.version || "2.1.0"}*
╰───
╭─ *✦* \`${toMonoUpperBold(`list category`)}\` *✦*
${menuSorted.map(({ cat }) => `│ *${prefix}menucat ${cat}*`).join("\n")}
╰─────────────`,
              contextInfo: contextInfoV13,
              footer: `${botConfig.bot?.name || "BOT FYU"}`,
            },
            { quoted: getVerifiedQuoted(botConfig) },
          );
        } catch (v13Error) {
          console.error("[Menu V13] Error:", v13Error.message);
          const fallbackV13 = {
            contextInfo: getContextInfo(botConfig, m, thumbBuffer, false, !!imageBuffer),
          };
          if (imageBuffer) {
            fallbackV13.image = imageBuffer;
            fallbackV13.caption = text;
          } else {
            fallbackV13.text = text;
          }
          await sock.sendMessage(m.chat, fallbackV13, {
            quoted: getVerifiedQuoted(botConfig),
          });
        }
        break;
      }
      case 14:
        await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig);
        break;
      case 15:
        await sendFallback(m, sock, text, imageBuffer, thumbBuffer, botConfig);
        break;
      default:
        await m.reply(text);
    }
    // audio menu disabled
  } catch (error) {
    console.error("[Menu] Error on command execution:", error.message);
  }
}
export default {
  config: pluginConfig,
  handler,
};
