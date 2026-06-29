import axios from "axios";
import config from "../../config.js";

const pluginConfig = {
  name: "ai",
  alias: ["9router", "nine", "router9"],
  category: "ai",
  description: "Chat dengan AI Model via 9Router gateway",
  usage: ".ai [model |] <pertanyaan>",
  example: ".ai Apa kabar?\natau\n.ai ag/claude-sonnet-4-6 | buatkan puisi",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

async function handler(m) {
  const query = m.args.join(" ");

  if (!query) {
    return m.reply(
      `🤖 *ᴀɪ 𝟿ʀᴏᴜᴛᴇʀ*\n\n` +
      `> Chat dengan AI Model via 9Router\n\n` +
      `*Cara Pakai:*\n` +
      `> \`${m.prefix}ai <pertanyaan>\` (Default: combo 9router)\n` +
      `> \`${m.prefix}ai <model> | <pertanyaan>\` (Custom Model)\n\n` +
      `*Contoh:*\n` +
      `> \`${m.prefix}ai halo, siapa kamu?\`\n` +
      `> \`${m.prefix}ai ag/claude-sonnet-4-6 | buatkan puisi tentang laut\``
    );
  }

  m.react("🕕");

  let model = "9router"; // nama combo di dashboard 9Router
  let promptText = query;

  if (query.includes("|")) {
    const parts = query.split("|");
    model = parts[0].trim();
    promptText = parts.slice(1).join("|").trim();
  }

  let baseURL = config?.APIkey?.ninerouterBase || "http://100.102.247.119:20128/v1";

  const apiKey = config?.APIkey?.ninerouter || "";

  try {
    const res = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [{ role: "user", content: promptText }],
        stream: false
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const fullText = res.data?.choices?.[0]?.message?.content || "";

    if (!fullText) {
      throw new Error("Tidak ada balasan dari 9Router.");
    }

    m.react("✅");
    await m.reply(`🤖 *ᴀɪ* _(${model})_\n\n${fullText}`);
  } catch (error) {
    console.error("[9Router] Error:", error.response?.data || error.message);
    m.react("☢");
    const errorMsg =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan internal.";
    await m.reply(
      `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴜʙᴜɴɢɪ ᴀɪ*\n\n> *Error:* ${errorMsg}`
    );
  }
}

export { pluginConfig as config, handler };
