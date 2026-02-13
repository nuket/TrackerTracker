function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;

    const requestedDomain = extractDomain(details.url);
    if (!requestedDomain) return;

    chrome.tabs.get(details.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab || !tab.url) return;

      const tabDomain = extractDomain(tab.url);
      if (!tabDomain) return;

      const entry = {
        tabTitle: tab.title || tabDomain,
        tabDomain: tabDomain,
        requestedDomain: requestedDomain,
        timestamp: Date.now()
      };

      chrome.storage.local.get({ requests: [] }, (result) => {
        const requests = result.requests;
        requests.push(entry);
        // Keep last 10000 entries to avoid unbounded growth
        if (requests.length > 10000) {
          requests.splice(0, requests.length - 10000);
        }
        chrome.storage.local.set({ requests });
      });
    });
  },
  { urls: ["<all_urls>"] }
);
