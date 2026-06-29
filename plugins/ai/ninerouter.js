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
  if (baseURL === "http://192.168.100.59/v1" || baseURL === "http://192.168.100.59:20128/v1") {
    baseURL = "http://100.102.247.119:20128/v1"; // bypass cache lama
  }
  const apiKey = config?.APIkey?.ninerouter || "";

  try {
    const res = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages: [{ role: "user", content: promptText }],
        stream: true
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
        timeout: 30000,
      }
    );

    let fullText = "";
    res.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const parsed = JSON.parse(line.replace("data: ", ""));
            const content = parsed.choices?.[0]?.delta?.content || "";
            fullText += content;
          } catch (e) {}
        }
      }
    });

    await new Promise((resolve, reject) => {
      res.data.on("end", resolve);
      res.data.on("error", reject);
    });

    if (!fullText) {
      throw new Error("Stream selesai tapi tidak ada teks balasan dari 9Router.");
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
