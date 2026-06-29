import axios from "axios";
import FormData from "form-data";
import config from "../../config.js";
import { downloadMediaMessage } from "ourin";
import path from "path";
import fs from "fs";
import te from "../../src/lib/ourin-error.js";
import ScravBotApi from "../../src/lib/ourin-apimanager.js";

const pluginConfig = {
  name: "musikapaini",
  alias: ["whatmusic", "shazam", "recognizemusic", "mai"],
  category: "tools",
  description: "Identifikasi lagu dari audio",
  usage: ".musikapaini (reply audio)",
  example: ".musikapaini",
  cooldown: 20,
  energi: 2,
  isEnabled: true,
};

let thumbTools = null;
try {
  const p = path.join(process.cwd(), "assets/images/ourin-tools.jpg");
  if (fs.existsSync(p)) thumbTools = fs.readFileSync(p);
} catch {}

function getContextInfo(title, body) {

  const ctx = {
  };

  if (thumbTools) {
    ctx.externalAdReply = {
      title,
      body,
      thumbnail: thumbTools,
      mediaType: 1,
      renderLargerThumbnail: false,
    };
  }

  return ctx;
}

async function uploadTo0x0(buffer, filename) {
  const form = new FormData();
  form.append("file", buffer, {
    filename,
    contentType: "application/octet-stream",
  });

  const res = await axios.post(
    "https://c.termai.cc/api/upload?key=AIzaBj7z2z3xBjsk",
    form,
    {
      headers: form.getHeaders(),
      timeout: 60000,
    },
  );

  if (!res.data?.status ? res.data.path : "") throw new Error("Upload gagal");
  return res.data;
}

async function handler(m, { sock }) {
  let audioBuffer = null;
  let filename = "audio.mp3";

  if (m.quoted?.message) {
    const quotedMsg = m.quoted.message;
    const audioMsg = quotedMsg.audioMessage || quotedMsg.documentMessage;

    if (audioMsg) {
      try {
        audioBuffer = await downloadMediaMessage(
          { key: m.quoted.key, message: quotedMsg },
          "buffer",
          {},
        );
        filename = audioMsg.fileName || "audio.mp3";
      } catch {}
    }
  }

  if (!audioBuffer && m.message) {
    const audioMsg = m.message.audioMessage || m.message.documentMessage;
    if (audioMsg) {
      try {
        audioBuffer = await m.download();
        filename = audioMsg.fileName || "audio.mp3";
      } catch {}
    }
  }

  if (!audioBuffer) {
    return m.reply(
      `?? *??s?? ??? ????*\n\n` +
        `> Identifikasi lagu dari audio\n\n` +
        `*Cara pakai:*\n` +
        `> Reply audio dengan \`${m.prefix}musikapaini\`\n` +
        `> Atau kirim audio + caption command`,
    );
  }

  m.react("??");

  try {
    await m.reply("?? *??????????...*\n\n> Mengupload audio...");

    const audioUrl = await uploadTo0x0(audioBuffer, filename);

    await m.reply("?? *??????????????s?...*\n\n> Mencari info lagu...");

    const data = await ScravBotApi.neoxr.whatMusic(
      {
        url: audioUrl,
        apikey: config.APIkey?.neoxr || "Milik-Bot-ScravBotMD",
      },
      {
        timeout: 60000,
      },
    );

    if (!data?.status || !data?.data) {
      m.react("?");
      return m.reply("? *?????*\n\n> Lagu tidak dikenali atau API error");
    }

    const music = data.data;
    const links = music.links || {};

    let text = `?? *???? ?????????!*\n\n`;
    text += `????? ?? *????* ?\n`;
    text += `? ?? Title: ${music.title || "-"}\n`;
    text += `? ?? Artist: ${music.artist || "-"}\n`;
    text += `? ?? Album: ${music.album || "-"}\n`;
    text += `? ?? Release: ${music.release || "-"}\n`;
    text += `??????????\n\n`;

    const buttons = [];

    if (links.spotify?.track?.id) {
      buttons.push({});
    }

    if (links.youtube?.vid) {
      buttons.push({});
    }

    if (links.deezer?.track?.id) {
      buttons.push({});
    }

    const msgContent = {
      text,
      footer: "?? Music Recognition",
      contextInfo: getContextInfo(
        "?? MUSIK APA INI",
        music.title || "Music Found",
      ),
    };

    if (buttons.length > 0) {
      msgContent.interactiveButtons = buttons;
    }

    await sock.sendMessage(m.chat, msgContent, { quoted: m });

    m.react("?");
  } catch (error) {
    m.react("?");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
