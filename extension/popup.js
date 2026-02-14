chrome.storage.local.get({ requests: [] }, (result) => {
  const count = result.requests.length;
  document.getElementById("count").textContent =
    count + " request" + (count !== 1 ? "s" : "") + " tracked";
});

document.getElementById("view").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("timeline.html") });
});

document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.set({ requests: [], summary: {} }, () => {
    document.getElementById("count").textContent = "0 requests tracked";
  });
});
