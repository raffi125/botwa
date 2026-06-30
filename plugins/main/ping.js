import fs from "fs";
import { performance } from "perf_hooks";
import os from "os";
import { execSync } from "child_process";
import config from "../../config.js";
import { getDatabase } from "../../src/lib/ourin-database.js";
import te from "../../src/lib/ourin-error.js";
import moment from "moment-timezone";

const pluginConfig = {
  name: "ping",
  alias: ["speed", "p", "latency", "sys", "status"],
  category: "main",
  description: "Cek performa dan status sistem bot secara real-time",
  usage: ".ping",
  example: ".ping",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

const fmtSize = (b) => {
  if (!b || b === 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / Math.pow(1024, i)).toFixed(1) + " " + u[i];
};

const fmtUp = (s) => {
  s = Number(s);
  const d = Math.floor(s / 86400),
    h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60),
    sc = Math.floor(s % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sc}s`;
  return `${m}m ${sc}s`;
};

function getNetwork() {
  try {
    const ifaces = os.networkInterfaces();
    let active = "N/A";
    for (const [name, addrs] of Object.entries(ifaces)) {
      if (name.toLowerCase().includes("lo")) continue;
      for (const a of addrs) {
        if (a.family === "IPv4" && !a.internal) {
          active = name;
          break;
        }
      }
    }
    let rx = 0,
      tx = 0;
    try {
      if (process.platform === "linux") {
        const netDev = fs.readFileSync("/proc/net/dev", "utf8");
        for (const line of netDev.split("\n")) {
          if (line.includes(":") && !line.includes("lo:")) {
            const p = line.trim().split(/\s+/);
            if (p.length >= 10) {
              const n = p[0].replace(":", "");
              if (n === active || (active === "N/A" && parseInt(p[1]) > 0)) {
                rx = parseInt(p[1]) || 0;
                tx = parseInt(p[9]) || 0;
                if (active === "N/A") active = n;
                break;
              }
            }
          }
        }
      } else if (process.platform === "win32") {
        const ns = execSync("netstat -e", { encoding: "utf-8" });
        for (const l of ns.split("\n")) {
          if (l.toLowerCase().includes("bytes")) {
            const p = l.trim().split(/\s+/);
            if (p.length >= 3) {
              rx = parseInt(p[1]) || 0;
              tx = parseInt(p[2]) || 0;
            }
            break;
          }
        }
        if (active === "N/A") {
          const f = Object.keys(ifaces).find(
            (n) => !n.toLowerCase().includes("loopback")
          );
          if (f) active = f;
        }
      }
    } catch {}
    return { rx, tx, iface: active };
  } catch {
    return { rx: 0, tx: 0, iface: "N/A" };
  }
}

async function handler(m, { sock }) {
  const execStart = performance.now();
  await m.react("⏱️");

  try {
    sock.sendPresenceUpdate("composing", m.chat).catch(() => {});
    const t0 = m.messageTimestamp ? m.messageTimestamp * 1000 : Date.now();
    const waRoundtrip = Math.max(1, Date.now() - t0);

    const cpus = os.cpus();
    const totalMem = os.totalmem(),
      freeMem = os.freemem();

    const cpuStart = performance.now();
    let cpuPct = 0;
    try {
      const c1 = os.cpus().reduce(
        (a, c) => {
          const t = Object.values(c.times).reduce((x, y) => x + y, 0);
          a.total += t;
          a.idle += c.times.idle;
          return a;
        },
        { total: 0, idle: 0 }
      );
      await new Promise((r) => setTimeout(r, 400));
      const c2 = os.cpus().reduce(
        (a, c) => {
          const t = Object.values(c.times).reduce((x, y) => x + y, 0);
          a.total += t;
          a.idle += c.times.idle;
          return a;
        },
        { total: 0, idle: 0 }
      );
      const td = c2.total - c1.total,
        id = c2.idle - c1.idle;
      cpuPct =
        td > 0
          ? (((td - id) / td) * 100).toFixed(1)
          : Math.min(100, (os.loadavg()[0] / cpus.length) * 100).toFixed(1);
      if (parseFloat(cpuPct) <= 0)
        cpuPct = Math.max(
          1,
          Math.min(100, (os.loadavg()[0] / cpus.length) * 100)
        ).toFixed(1);
    } catch {
      cpuPct = Math.max(
        1,
        Math.min(100, (os.loadavg()[0] / cpus.length) * 100)
      ).toFixed(1);
    }
    const cpuSample = Math.round(performance.now() - cpuStart);

    let diskTotal = 0,
      diskUsed = 0;
    try {
      if (process.platform === "win32") {
        const w = execSync(
          'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:value',
          { encoding: "utf-8" }
        );
        const fm = w.match(/FreeSpace=(\d+)/),
          sm = w.match(/Size=(\d+)/);
        if (sm && fm) {
          diskTotal = parseInt(sm[1]);
          diskUsed = diskTotal - parseInt(fm[1]);
        }
      } else {
        const df = execSync("df -k --output=size,used / 2>/dev/null")
          .toString()
          .trim()
          .split("\n");
        if (df.length > 1) {
          const p = df[1].trim().split(/\s+/).map(Number);
          if (p.length >= 2) {
            diskTotal = p[0] * 1024;
            diskUsed = p[1] * 1024;
          }
        }
      }
    } catch {
      diskTotal = 500e9;
      diskUsed = 250e9;
    }

    const gcStart = performance.now();
    if (global.gc) global.gc();
    const gcPause = Math.round(performance.now() - gcStart);

    const net = getNetwork();
    const heap = process.memoryUsage();

    let dbUsers = 0,
      dbGroups = 0,
      dbPremium = 0;
    try {
      const db = getDatabase();
      if (db?.data) {
        dbUsers = Object.keys(db.data.users || {}).length;
        dbGroups = Object.keys(db.data.groups || {}).length;
        dbPremium = Object.values(db.data.users || {}).filter(
          (u) => u.isPremium
        ).length;
      }
    } catch {}

    const s = {
      ping: waRoundtrip,
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptimeBot: fmtUp(process.uptime()),
      uptimeServer: fmtUp(os.uptime()),
      cpuModel: cpus[0]?.model?.trim() || "Unknown",
      cpuCores: cpus.length,
      cpuLoad: cpuPct,
      ramTotal: totalMem,
      ramUsed: totalMem - freeMem,
      diskTotal,
      diskUsed,
      networkRx: net.rx,
      networkTx: net.tx,
      networkInterface: net.iface,
      heapUsed: heap.heapUsed,
      rss: heap.rss,
      dbUsers,
      dbGroups,
      dbPremium,
    };

    const totalExec = Math.round(performance.now() - execStart);

    const osL =
      {
        linux: "Linux",
        darwin: "macOS",
        win32: "Windows",
        android: "Android",
      }[s.platform] || s.platform;
      
    // Excel-like / Table-like format
    const caption = 
      `📊 *STATISTIK SERVER & BOT*\n` +
      `│ \n` +
      `├ ⚡ *RESPON*\n` +
      `│ ├ Latency / Ping : ${s.ping} ms\n` +
      `│ ├ CPU Sample     : ${cpuSample} ms\n` +
      `│ ├ GC Pause       : ${gcPause} ms\n` +
      `│ └ Total Eksekusi : ${totalExec} ms\n` +
      `│ \n` +
      `├ 💻 *SISTEM*\n` +
      `│ ├ Hostname   : ${s.hostname}\n` +
      `│ ├ Platform   : ${osL} (${s.arch})\n` +
      `│ ├ Node.js    : ${s.nodeVersion}\n` +
      `│ ├ Uptime Bot : ${s.uptimeBot}\n` +
      `│ └ Uptime PC  : ${s.uptimeServer}\n` +
      `│ \n` +
      `├ ⚙️ *HARDWARE*\n` +
      `│ ├ CPU Model : ${s.cpuModel.substring(0, 24)}\n` +
      `│ ├ CPU Cores : ${s.cpuCores} Cores\n` +
      `│ ├ CPU Load  : ${s.cpuLoad}%\n` +
      `│ ├ RAM Used  : ${fmtSize(s.ramUsed)} / ${fmtSize(s.ramTotal)} (${((s.ramUsed/s.ramTotal)*100).toFixed(1)}%)\n` +
      `│ ├ Disk Used : ${fmtSize(s.diskUsed)} / ${fmtSize(s.diskTotal)} (${s.diskTotal > 0 ? ((s.diskUsed/s.diskTotal)*100).toFixed(1) : 0}%)\n` +
      `│ ├ Heap Used : ${fmtSize(s.heapUsed)}\n` +
      `│ └ RSS Mem   : ${fmtSize(s.rss)}\n` +
      `│ \n` +
      `├ 🌐 *NETWORK (${s.networkInterface})*\n` +
      `│ ├ Download : ${fmtSize(s.networkRx)}\n` +
      `│ └ Upload   : ${fmtSize(s.networkTx)}\n` +
      `│ \n` +
      `└ 📦 *DATABASE*\n` +
      `  ├ Users    : ${s.dbUsers}\n` +
      `  ├ Premium  : ${s.dbPremium}\n` +
      `  └ Groups   : ${s.dbGroups}\n`;

    await sock.sendMessage(
      m.chat,
      { text: caption },
      { quoted: m }
    );

    await m.react("✅");
  } catch (error) {
    console.log(error);
    await m.react("❌");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };
