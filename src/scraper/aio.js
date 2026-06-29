import * as cheerio from "cheerio";

const BASE_URL = "https://savefbs.com/api/v1/aio";
const HEADERS = {
  accept: "*/*",
  "content-type": "application/json",
  referer: "https://savefbs.com/all-in-one-video-downloader/",
  "user-agent":
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
};

async function aiodl(link) {
  const response = await fetch(`${BASE_URL}/html`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      vid: link,
      prefix: "savefbs.com",
      ex: "",
      format: "",
    }),
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $("h3.text-sm").text().trim();
  const thumb = $("img.aio-thumbnail").attr("src");
  const token = $(".aio-format-btn").first().attr("data-loader-id");

  const formats = [];
  $(".aio-format-btn").each((_, el) => {
    const onclick = $(el).attr("onclick");
    const match = onclick?.match(/'([^']+)'/);
    if (match) formats.push(match[1]);
  });

  return {
    title,
    thumb,
    token,
    formats: [...new Set(formats)],
  };
}

async function aiodownload(token, format) {
  const response = await fetch(`${BASE_URL}/download`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ token, format }),
  });

  const data = await response.json();
  return data;
}

export { aiodl, aiodownload };
