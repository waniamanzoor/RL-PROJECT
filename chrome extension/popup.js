chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    try {
      const url = new URL(tabs[0].url);
      document.getElementById("current-tab").textContent = url.hostname;
    } catch {
      document.getElementById("current-tab").textContent = "—";
    }
  }
});

chrome.storage.local.get("pending_logs", (result) => {
  const logs = result.pending_logs || [];
  document.getElementById("pending").textContent = logs.length;
});

// Use /report/weekly since there's no "today" endpoint
fetch("https://rl-project-api.onrender.com/report/weekly")
  .then(r => r.json())
  .then(data => {
    document.getElementById("total-time").textContent =
      `${data.completed_tasks} done / ${data.pending_tasks} pending`;
  })
  .catch(() => {
    document.getElementById("total-time").textContent = "Offline";
  });

document.getElementById("sync-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "sync" });
  window.close();
});