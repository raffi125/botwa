import { getDatabase } from "./src/lib/ourin-database.js";
import fs from "fs";

// Mock environment
process.on = () => {};

// Ensure db is ready
const db = getDatabase();
db.ready = true;
db.data = { users: {}, groups: {} };

import * as handlerModule from "./src/handler.js";

const sock = {
  user: { id: "1234567890:1@s.whatsapp.net" },
  readMessages: async () => {},
  sendPresenceUpdate: async () => {},
  sendMessage: async (chat, content, options) => {
    console.log("SEND_MESSAGE:", content);
  },
  groupMetadata: async () => ({ subject: "Test Group" }),
};

const msg = {
  key: {
    remoteJid: "123@s.whatsapp.net",
    fromMe: false,
    id: "3EB0TEST1234",
  },
  message: {
    conversation: ".ping",
  },
  pushName: "TestUser",
};

async function run() {
  try {
    const messageHandler = handlerModule.messageHandler;
    await messageHandler(msg, sock);
  } catch (e) {
    console.error("Test failed", e);
  }
}
run();
