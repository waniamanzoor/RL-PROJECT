// background.js

let activeTab = null;
let startTime = null;
const BACKEND_URL = "https://rl-project-api.onrender.com";

// Simple productivity categorization by hostname
function categorize(hostname) {
  const productive = ["github.com", "stackoverflow.com", "docs.", "notion.so",
                      "linear.app", "figma.com", "localhost", "claude.ai"];
  const distracting = ["youtube.com", "twitter.com", "x.com", "reddit.com",
                       "instagram.com", "facebook.com", "tiktok.com", "netflix.com"];
  if (productive.some(d => hostname.includes(d))) return "productive";
  if (distracting.some(d => hostname.includes(d))) return "distracting";
  return "neutral";
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await logCurrentTab();
  const tab = await chrome.tabs.get(activeInfo.tabId);
  activeTab = tab;
  startTime = Date.now();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    activeTab = tab;
    startTime = Date.now();
  }
});

async function logCurrentTab() {
  if (!activeTab || !startTime) return;

  const duration = Math.round((Date.now() - startTime) / 1000);
  if (duration < 3) return;

  let hostname = "";
  try {
    hostname = new URL(activeTab.url).hostname;
  } catch (e) {
    return; // skip chrome:// and other non-http URLs
  }

  const interval = {
    hostname: hostname,
    durationSeconds: duration,          // matches main.py: interval.get("durationSeconds")
    category: categorize(hostname),     // matches main.py: interval.get("category")
    startTimestamp: startTime,          // matches main.py: interval.get("startTimestamp")
  };

  try {
    await fetch(`${BACKEND_URL}/timelog`, {           // ← correct endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervals: [interval] }) // ← correct shape
    });
  } catch (e) {
    chrome.storage.local.get("pending_logs", (result) => {
      const logs = result.pending_logs || [];
      logs.push(interval);
      chrome.storage.local.set({ pending_logs: logs });
    });
  }

  startTime = Date.now();
}

chrome.alarms.create("sync", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "sync") {
    await logCurrentTab();
    syncPendingLogs();
  }
});

async function syncPendingLogs() {
  chrome.storage.local.get("pending_logs", async (result) => {
    const logs = result.pending_logs || [];
    if (logs.length === 0) return;
    try {
      await fetch(`${BACKEND_URL}/timelog`, {           // ← correct endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervals: logs })        // ← correct shape
      });
      chrome.storage.local.set({ pending_logs: [] });
    } catch (e) {}
  });
}
