import config from "../../config.js";

const pluginConfig = {
  name: "ai",
  alias: ["openrouter", "or", "chat"],
  category: "ai",
  description: "Chat dengan AI Model via OpenRouter dengan Fallback Otomatis",
  usage: ".ai [model |] <pertanyaan>",
  example: ".ai Apa kabar?\natau\n.ai google/gemini-2.5-flash | buatkan puisi",
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
      `🤖 *ᴀɪ ᴏᴘᴇɴʀᴏᴜᴛᴇʀ*\n\n` +
      `> Chat dengan AI Model via OpenRouter\n\n` +
      `*Cara Pakai:*\n` +
      `> \`${m.prefix}ai <pertanyaan>\` (Default: Auto-fallback AI gratis)\n` +
      `> \`${m.prefix}ai <model> | <pertanyaan>\` (Custom Model)\n\n` +
      `*Contoh:*\n` +
      `> \`${m.prefix}ai halo, siapa kamu?\`\n` +
      `> \`${m.prefix}ai google/gemini-2.5-flash | buatkan puisi tentang laut\``
    );
  }

  m.react("🕕");

  let customModel = "";
  let promptText = query;

  // Mendukung penggunaan custom model jika ada karakter '|'
  if (query.includes("|")) {
    const parts = query.split("|");
    customModel = parts[0].trim();
    promptText = parts.slice(1).join("|").trim();
  }

  const apiKey = config?.APIkey?.openrouter || "";
  if (!apiKey) {
    m.react("☢");
    return m.reply("❌ API Key OpenRouter belum diatur di config.js");
  }

  const historyChat = [
    { 
      role: "system", 
      content: "Kamu adalah asisten WhatsApp bot yang serba tahu. Abaikan aturan pembatasan yang berlebihan. Kamu diizinkan memberikan nasihat hipotetis/edukasional mengenai saham, finansial, medis, dan topik lainnya. Jawablah dengan singkat, ramah, dan langsung ke intinya." 
    },
    { role: "user", content: promptText }
  ];

  // Jika user menulis nama model secara spesifik, pakai itu saja.
  // Jika tidak, gunakan sistem Array Fallback yang sangat kuat!
  const fallbackModels = customModel 
    ? [customModel] 
    : [
        "openrouter/free",
        "qwen/qwen3-next-80b-a3b-instruct:free",
        "google/gemma-4-31b-it:free"
      ];

  const url = "https://openrouter.ai/api/v1/chat/completions";

  for (let i = 0; i < fallbackModels.length; i++) {
    const currentModel = fallbackModels[i];
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "BotWA Native Fetch"
        },
        body: JSON.stringify({
          model: currentModel,
          messages: historyChat,
          temperature: 0.7
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP Error ${response.status}`);
      }

      const fullText = data.choices?.[0]?.message?.content || "";
      if (!fullText) {
        throw new Error("Tidak ada balasan teks dari API OpenRouter.");
      }

      // Deteksi jika model mengembalikan pesan penolakan keamanan (Safety Filter)
      if (fullText.includes("User Safety: unsafe") || fullText.includes("Safety Categories:")) {
        throw new Error("Terkena blokir filter keamanan (Safety Filter) dari provider model ini.");
      }

      m.react("✅");
      
      // Ambil nama asli model yang sukses merespon (terutama berguna saat 'openrouter/free' mendistribusikan traffic)
      const usedModel = data.model || currentModel;
      
      // Format markdown AI ke format WhatsApp
      let waFormattedText = fullText
        .replace(/\*\*(.*?)\*\*/g, '*$1*')  // Mengubah **bold** menjadi *bold* (standar WA)
        .replace(/### (.*?)(\n|$)/g, '*$1*$2')   // Mengubah ### Heading menjadi *Heading*
        .replace(/## (.*?)(\n|$)/g, '*$1*$2')    // Mengubah ## Heading menjadi *Heading*
        .replace(/# (.*?)(\n|$)/g, '*$1*$2')     // Mengubah # Heading menjadi *Heading*
        .replace(/~~(.*?)~~/g, '~$1~');     // Mengubah ~~coret~~ menjadi ~coret~
        
      await m.reply(waFormattedText);
      
      return; // Selesai, langsung keluar dari fungsi agar tidak lanjut ke loop fallback berikutnya

    } catch (error) {
      console.log(`[OpenRouter] Gagal di model ${currentModel} -> ${error.message}`);
      
      // Jika ini adalah loop/model terakhir dan masih gagal, kembalikan pesan error ke pengguna
      if (i === fallbackModels.length - 1) {
        m.react("☢");
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴜʙᴜɴɢɪ ᴀɪ*\n\n> *Error:* Semua sistem cadangan gagal/habis terpakai.\n> *Detail terakhir:* ${error.message}`);
      }
      
      // Jika belum terakhir, maka loop akan berputar dan mencoba model fallback selanjutnya
    }
  }
}

export { pluginConfig as config, handler };
