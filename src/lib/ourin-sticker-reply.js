import { getDatabase } from "./ourin-database.js";
import {
  getStickerHash,
  getQuotedStickerHash,
} from "./ourin-sticker-command.js";

function normalizeStickerReplies(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  return data;
}

function getStickerReplyMap(chatId) {
  const db = getDatabase();
  const groupData = db.getGroup(chatId) || {};
  return normalizeStickerReplies(groupData.stickerReplies);
}

function listStickerReplies(chatId) {
  return Object.entries(getStickerReplyMap(chatId)).map(([hash, data], index) => ({
    no: index + 1,
    hash: `${hash.slice(0, 10)}...`,
    fullHash: hash,
    reply: data.reply,
    addedBy: data.addedBy,
    addedAt: data.addedAt,
  }));
}

async function addStickerReply(chatId, stickerHash, reply, addedBy) {
  if (!chatId || !stickerHash || !reply) return false;
  const db = getDatabase();
  const groupData = db.getGroup(chatId) || {};
  const stickerReplies = normalizeStickerReplies(groupData.stickerReplies);
  stickerReplies[stickerHash] = {
    reply: String(reply).trim(),
    addedBy,
    addedAt: Date.now(),
  };
  db.setGroup(chatId, { stickerReplies });
  await db.save();
  return true;
}

async function deleteStickerReply(chatId, stickerHash) {
  if (!chatId || !stickerHash) return false;
  const db = getDatabase();
  const groupData = db.getGroup(chatId) || {};
  const stickerReplies = normalizeStickerReplies(groupData.stickerReplies);
  if (!stickerReplies[stickerHash]) return false;
  delete stickerReplies[stickerHash];
  db.setGroup(chatId, { stickerReplies });
  await db.save();
  return true;
}

function getStickerReply(chatId, stickerHash) {
  if (!chatId || !stickerHash) return null;
  return getStickerReplyMap(chatId)[stickerHash] || null;
}

function getQuotedStickerReplyHash(m) {
  return getQuotedStickerHash(m);
}

async function handleStickerReply(m, sock) {
  if (!m || !sock || !m.isGroup || m.isCommand || m.fromMe) return false;
  const db = getDatabase();
  const groupData = db.getGroup(m.chat) || {};
  if (!groupData.autoreplystiker) return false;
  const stickerHash = getStickerHash(m);
  if (!stickerHash) return false;
  const stickerReply = getStickerReply(m.chat, stickerHash);
  if (!stickerReply?.reply) return false;
  await sock.sendMessage(
    m.chat,
    { text: stickerReply.reply },
    { quoted: m },
  );
  return true;
}

export {
  addStickerReply,
  deleteStickerReply,
  getQuotedStickerReplyHash,
  getStickerReply,
  handleStickerReply,
  listStickerReplies,
};
