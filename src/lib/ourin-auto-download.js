import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";
import {
  generateWAMessage,
  generateWAMessageFromContent,
  jidNormalizedUser,
} from "ourin";
import { f } from "./ourin-http.js";
import { getDatabase } from "./ourin-database.js";
import { logger } from "./ourin-logger.js";
import { aiodl, aiodownload } from "../scraper/aio.js";

const VIDEO_FORMATS = ["1080", "720", "480", "360"];
const AUDIO_FORMATS = ["mp3", "wav"];

const PLATFORM_RULES = [
  {
    key: "youtube",
    patterns: ["youtube.com", "youtu.be"],
    handler: downloadYoutube,
  },
  {
    key: "tiktok",
    patterns: ["tiktok.com", "vt.tiktok.com"],
    handler: downloadTiktok,
  },
  {
    key: "facebook",
    patterns: ["facebook.com", "fb.watch", "fb.com"],
    handler: downloadFacebook,
  },
  { key: "instagram", patterns: ["instagram.com"], handler: downloadInstagram },
  {
    key: "aio",
    patterns: [
      "twitter.com",
      "x.com",
      "pinterest.com",
      "reddit.com",
      "threads.net",
      "capcut.com",
      "snapchat.com",
      "likee.video",
    ],
    handler: downloadAio,
  },
];

function detectPlatform(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const rule of PLATFORM_RULES) {
    if (rule.patterns.some((p) => lower.includes(p))) return rule;
  }
  return null;
}

function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

async function downloadYoutube(url, sock, m) {
  const { data } = await f(
    `https://api.ourin.my.id/api/ytmp4?url=${encodeURIComponent(url)}`,
  );
  if (!data?.download) throw new Error("No download URL");

  await sock.sendMedia(m.chat, data.download, data.title || null, m, {
    type: "video",
    contextInfo: { },
  });
}

const SAVETT_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  Origin: "https://savett.cc",
  Referer: "https://savett.cc/en1/download",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
};

async function savettGetToken() {
  const res = await axios.get("https://savett.cc/en1/download");
  return {
    csrf: res.data.match(/name="csrf_token" value="([^"]+)"/)?.[1],
    cookie: res.headers["set-cookie"].map((v) => v.split(";")[0]).join("; "),
  };
}

async function savettFetch(url, csrf, cookie) {
  const res = await axios.post(
    "https://savett.cc/en1/download",
    `csrf_token=${encodeURIComponent(csrf)}&url=${encodeURIComponent(url)}`,
    { headers: { ...SAVETT_HEADERS, Cookie: cookie } },
  );
  return res.data;
}

function savettParse(html) {
  const $ = cheerio.load(html);
  const stats = [];
  $("#video-info .my-1 span").each((_, el) => stats.push($(el).text().trim()));

  const data = {
    username: $("#video-info h3").first().text().trim(),
    views: stats[0] || null,
    likes: stats[1] || null,
    duration:
      $("#video-info p.text-muted")
        .first()
        .text()
        .replace(/Duration:/i, "")
        .trim() || null,
    type: null,
    downloads: { nowm: [], wm: [] },
    mp3: [],
    slides: [],
  };

  const slides = $(".carousel-item[data-data]");
  if (slides.length) {
    data.type = "photo";
    slides.each((_, el) => {
      try {
        const json = JSON.parse(
          $(el)
            .attr("data-data")
            .replace(/&quot;/g, '"'),
        );
        if (Array.isArray(json.URL)) {
          json.URL.forEach((u) =>
            data.slides.push({ index: data.slides.length + 1, url: u }),
          );
        }
      } catch {}
    });
    return data;
  }

  data.type = "video";
  $("#formatselect option").each((_, el) => {
    const label = $(el).text().toLowerCase();
    const raw = $(el).attr("value");
    if (!raw) return;
    try {
      const json = JSON.parse(raw.replace(/&quot;/g, '"'));
      if (!json.URL) return;
      if (label.includes("mp4") && !label.includes("watermark"))
        data.downloads.nowm.push(...json.URL);
      if (label.includes("watermark")) data.downloads.wm.push(...json.URL);
      if (label.includes("mp3")) data.mp3.push(...json.URL);
    } catch {}
  });
  return data;
}

async function savett(url) {
  const { csrf, cookie } = await savettGetToken();
  const html = await savettFetch(url, csrf, cookie);
  return savettParse(html);
}

async function downloadTiktok(url, sock, m) {
  const result = await savett(url);

  if (result.type === "video" && result.downloads.nowm.length > 0) {
    const videoRes = await axios.get(result.downloads.nowm[0], {
      responseType: "arraybuffer",
      timeout: 60000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        Referer: "https://www.tiktok.com/",
      },
    });

    await sock.sendMessage(
      m.chat,
      { video: Buffer.from(videoRes.data), mimetype: "video/mp4" },
      { quoted: m },
    );
    return;
  }

  if (result.type === "photo" && result.slides.length > 0) {
    const mediaList = [];
    for (let i = 0; i < result.slides.length; i++) {
      const imgUrl = result.slides[i].url;
      if (!imgUrl) continue;
      try {
        const res = await axios.get(imgUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        });
        mediaList.push({ image: Buffer.from(res.data) });
      } catch (e) {
        logger.error("AutoDL", `[tiktok] slide ${i} failed: ${e.message}`);
      }
    }

    if (mediaList.length === 0) throw new Error("Failed to download slides");

    const opener = generateWAMessageFromContent(
      m.chat,
      {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        albumMessage: {
          expectedImageCount: mediaList.length,
          expectedVideoCount: 0,
        },
      },
      {
        userJid: jidNormalizedUser(sock.user.id),
        quoted: m,
        upload: sock.waUploadToServer,
      },
    );

    // relayMessage removed
for (const content of mediaList) {
      const msg = await generateWAMessage(opener.key.remoteJid, content, {
        upload: sock.waUploadToServer,
      });
      msg.message.messageContextInfo = {
        messageSecret: crypto.randomBytes(32),
        messageAssociation: {
          associationType: 1,
          parentMessageKey: opener.key,
        },
      };
      // relayMessage removed
}
    return;
  }

  if (result.mp3.length > 0) {
    await sock.sendMessage(
      m.chat,
      { audio: { url: result.mp3[0] }, mimetype: "audio/mpeg" },
      { quoted: m },
    );
    return;
  }

  throw new Error("No media found");
}

async function downloadFacebook(url, sock, m) {
  const { fbdown } = await import("btch-downloader");
  const data = await fbdown(url);
  if (!data?.status) throw new Error("Facebook API returned no data");

  const videoUrl = data.HD || data.Normal_video;
  if (!videoUrl) throw new Error("No video URL");

  await sock.sendMedia(m.chat, videoUrl, null, m, {
    type: "video",
    contextInfo: { },
  });
}

async function downloadInstagram(url, sock, m) {
  const { data } = await axios.get(
    `https://api.nexray.web.id/downloader/v2/instagram?url=${encodeURIComponent(url)}`,
  );
  if (!data?.status || !data?.result)
    throw new Error("Instagram API returned no data");

  const result = data.result;

  if (Array.isArray(result.media) && result.media.length > 0) {
    const mediaList = result.media.map(({ type, url }) => {
      return type === "mp4" ? { video: { url } } : { image: { url } };
    });

    const opener = generateWAMessageFromContent(
      m.chat,
      {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        albumMessage: {
          expectedImageCount: mediaList.filter((a) => "image" in a).length,
          expectedVideoCount: mediaList.filter((a) => "video" in a).length,
        },
      },
      {
        userJid: jidNormalizedUser(sock.user.id),
        quoted: m,
        upload: sock.waUploadToServer,
      },
    );

    // relayMessage removed
for (const content of mediaList) {
      const msg = await generateWAMessage(opener.key.remoteJid, content, {
        upload: sock.waUploadToServer,
      });
      msg.message.messageContextInfo = {
        messageSecret: crypto.randomBytes(32),
        messageAssociation: {
          associationType: 1,
          parentMessageKey: opener.key,
        },
      };
      // relayMessage removed
}
  } else if (result.url) {
    const isVideo = result.type === "mp4" || result.type === "video";
    await sock.sendMedia(m.chat, result.url, null, m, {
      type: isVideo ? "video" : "image",
      contextInfo: { },
    });
  } else {
    throw new Error("No media found");
  }
}

async function downloadAio(url, sock, m) {
  const info = await aiodl(url);
  if (!info.token || !info.formats?.length) throw new Error("No data from AIO");

  const bestVideo = VIDEO_FORMATS.find((f) => info.formats.includes(f));
  const format =
    bestVideo ||
    info.formats.find((f) => !AUDIO_FORMATS.includes(f)) ||
    info.formats[0];

  const dlResult = await aiodownload(info.token, format);
  const downloadUrl =
    dlResult?.url || dlResult?.download || dlResult?.data?.url;
  if (!downloadUrl) throw new Error("No download URL");

  const isAudio = AUDIO_FORMATS.includes(format);
  const contextInfo = {
    externalAdReply: {
      title: info.title || "Downloaded",
      body: `Format: ${format}`,
      thumbnailUrl: info.thumb,
      sourceUrl: url,
      mediaType: isAudio ? 1 : 2,
    },
  };

  if (isAudio) {
    await sock.sendMessage(
      m.chat,
      { audio: { url: downloadUrl }, mimetype: "audio/mpeg", contextInfo },
      { quoted: m },
    );
  } else {
    await sock.sendMedia(m.chat, downloadUrl, info.title || null, m, {
      type: "video",
      contextInfo,
    });
  }
}

async function handleAutoDownload(m, sock, text) {
  if (!m.isGroup) return;

  const db = getDatabase();
  const groupData = db.getGroup(m.chat);
  if (!groupData?.autodl) return;

  const platform = detectPlatform(text);
  if (!platform) return;

  const extractedUrl = extractUrl(text);
  if (!extractedUrl) return;

  m.react("🕕");

  try {
    await platform.handler(extractedUrl, sock, m);
    m.react("✅");
  } catch (err) {
    m.react("😳");
    logger.error("AutoDL", `[${platform.key}] ${err.message}`);
  }
}

function containsSupportedLink(text) {
  return detectPlatform(text) !== null;
}

const SUPPORTED_PLATFORMS = PLATFORM_RULES.map((r) => r.patterns).flat();

export { handleAutoDownload, containsSupportedLink, SUPPORTED_PLATFORMS };
