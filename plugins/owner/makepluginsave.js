import fs from "fs";
import path from "path";

const pluginConfig = {
  name: "makepluginsave",
  alias: ["mkpsave", "saveplugin"],
  category: "owner",
  description: "Simpan plugin dari pending makeplugin",
  usage: ".makepluginsave <id>",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 0,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const pendingId = m.args?.[0];
  if (!pendingId) {
    return m.reply("❌ ID pending tidak valid.");
  }

  const tempDir = path.join(process.cwd(), "temp");
  const metaPath = path.join(tempDir, `makeplugin_${pendingId}.json`);
  const codePath = path.join(tempDir, `makeplugin_${pendingId}.js`);

  if (!fs.existsSync(metaPath) || !fs.existsSync(codePath)) {
    return m.reply(
      "❌ Pending plugin tidak ditemukan atau sudah expired. Coba buat ulang.",
    );
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  } catch {
    return m.reply("❌ Data pending rusak. Coba buat ulang.");
  }

  const { name, category, filePath } = meta;

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(metaPath);
    } catch {}
    try {
      fs.unlinkSync(codePath);
    } catch {}
    return m.reply(
      `⚠️ Plugin \`${name}.js\` sudah ada di kategori \`${category}\`!`,
    );
  }

  const code = fs.readFileSync(codePath, "utf-8");
  const pluginDir = path.dirname(filePath);
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
  }

  fs.writeFileSync(filePath, code, "utf-8");

  try {
    fs.unlinkSync(metaPath);
  } catch {}
  try {
    fs.unlinkSync(codePath);
  } catch {}

  m.react("✅");
  await m.reply(
    `✅ *ᴘʟᴜɢɪɴ ᴅɪsɪᴍᴘᴀɴ*\n\n` +
      `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n` +
      `┃ 📁 File: plugins/${category}/${name}.js\n` +
      `┃ 🏷️ Kategori: ${category}\n` +
      `┃ 📏 Ukuran: ${(code.length / 1024).toFixed(1)}KB\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `> Ketik \`${m.prefix}${name}\` untuk test\n` +
      `> Restart bot jika plugin tidak langsung ke-load`,
  );
}

export { pluginConfig as config, handler };
