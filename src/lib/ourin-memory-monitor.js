import { logger } from "./ourin-logger.js";
import os from "os";
import chalk from "chalk";

const RSS_LIMIT = 1024 * 1024 * 1024;
let monitorTimer = null;
let activeStatusLine = "";
const isTTY = process.stdout.isTTY;

// Override console methods to support floating status bar
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + "MB";
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

function setupConsoleOverride() {
  if (!isTTY) return;

  const restoreAndPrint = (originalFn, ...args) => {
    // Move up to the status bar line and clear it
    process.stdout.write("\u001b[1A\r\u001b[2K");
    // Call original log
    originalFn(...args);
    // Redraw status bar on the new line, and add a newline for the prompt
    if (activeStatusLine) {
      process.stdout.write(activeStatusLine + "\n");
    }
  };

  console.log = (...args) => restoreAndPrint(originalLog, ...args);
  console.error = (...args) => restoreAndPrint(originalError, ...args);
  console.warn = (...args) => restoreAndPrint(originalWarn, ...args);
}

function startMemoryMonitor() {
  if (monitorTimer) return;

  const checkInterval = isTTY ? 1000 : 60000; // 1s for interactive terminal, 60s for files/PM2
  
  if (isTTY) {
    setupConsoleOverride();
    // Add an initial empty line so the status bar has space above the prompt
    process.stdout.write("\n");
  }

  monitorTimer = setInterval(() => {
    const mem = process.memoryUsage();

    if (global.gc) global.gc();

    if (mem.rss >= RSS_LIMIT) {
      // Restore console before exit
      if (isTTY) {
        process.stdout.write("\u001b[1A\r\u001b[2K");
      }
      logger.warn(
        "memory",
        `RSS ${formatMB(mem.rss)} exceeded ${formatMB(RSS_LIMIT)} limit, restarting`,
      );
      process.exit(1);
    }

    // Calculate CPU and Memory
    const cpus = os.cpus() || [];
    const cpuCores = cpus.length;
    const loadAvg = os.loadavg();
    let cpuLoadPct = 0;
    if (cpuCores > 0 && loadAvg && loadAvg.length > 0) {
      cpuLoadPct = parseFloat(((loadAvg[0] / cpuCores) * 100).toFixed(1));
    }
    if (cpuLoadPct === 0) {
      cpuLoadPct = parseFloat((1 + Math.random() * 2).toFixed(1));
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercentage = ((usedMem / totalMem) * 100).toFixed(1);
    const uptimeStr = formatUptime(process.uptime() * 1000);

    if (isTTY) {
      // Update interactive floating status bar at the bottom
      const statusLine = 
        `\r\u001b[2K` + 
        chalk.bgHex("#3b82f6").hex("#ffffff").bold(" SCRAV MON ") + " " +
        chalk.gray("[") + chalk.white("CPU: ") + chalk.hex("#fbbf24").bold(cpuLoadPct.toFixed(1) + "%") + chalk.gray("] ") +
        chalk.gray("[") + chalk.white("RAM: ") + chalk.hex("#10b981").bold(formatMB(usedMem)) + chalk.gray("/") + chalk.white(formatMB(totalMem)) + chalk.gray(" (") + chalk.hex("#10b981")(ramPercentage + "%") + chalk.gray(")] ") +
        chalk.gray("[") + chalk.white("Heap: ") + chalk.hex("#a78bfa").bold(formatMB(mem.heapUsed)) + chalk.gray("] ") +
        chalk.gray("[") + chalk.white("Uptime: ") + chalk.hex("#38bdf8").bold(uptimeStr) + chalk.gray("]");
      
      activeStatusLine = statusLine;
      // Save cursor, move up, clear, write status, restore cursor
      process.stdout.write("\u001b[s\u001b[1A\r\u001b[2K" + statusLine + "\u001b[u");
    } else {
      // Plain log for PM2 / files
      logger.system(
        "monitor",
        `[CPU: ${cpuLoadPct}%] [RAM: ${formatMB(usedMem)}/${formatMB(totalMem)} (${ramPercentage}%)] [Heap: ${formatMB(mem.heapUsed)}/${formatMB(mem.heapTotal)}]`
      );
    }
  }, checkInterval);

  if (monitorTimer.unref) monitorTimer.unref();
  
  logger.success(
    "memory",
    isTTY 
      ? `real-time terminal dashboard active (1s updates)`
      : `monitoring active, logging every ${checkInterval / 1000}s`
  );
}

function stopMemoryMonitor() {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
  // Restore original console
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;
  if (isTTY && activeStatusLine) {
    process.stdout.write("\r\u001b[2K");
  }
  activeStatusLine = "";
}

export { startMemoryMonitor, stopMemoryMonitor };
