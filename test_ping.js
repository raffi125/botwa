import { handler } from "./plugins/main/ping.js";

const m = {
  react: async (e) => console.log("REACT:", e),
  reply: (t) => console.log("REPLY:", t),
  chat: "123@s.whatsapp.net",
  pushName: "User",
  prefix: ".",
  command: "ping",
  messageTimestamp: Date.now() / 1000
};

const sock = {
  sendPresenceUpdate: async () => {},
  sendMessage: async (chat, content) => console.log("SEND_MESSAGE:", content)
};

async function test() {
  try {
    await handler(m, { sock });
  } catch (e) {
    console.error("CRITICAL ERROR:", e);
  }
}

test();
