chrome.storage.local.get({ requests: [] }, (result) => {
  const count = result.requests.length;
  document.getElementById("count").textContent =
    count + " request" + (count !== 1 ? "s" : "") + " tracked";
});

document.getElementById("view").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("timeline.html") });
});

const TEST_URLS = [
  "https://nypost.com",
  "https://videocardz.net",
  "https://vilimpoc.org",
  "https://www.channelnewsasia.com",
  "https://www.nytimes.com",
  "https://www.phoronix.com",
  "https://www.reddit.com",
  "https://www.theguardian.com",
  "https://www.theregister.com"
];
document.getElementById("test-btn").addEventListener("click", () => {
  for (const url of TEST_URLS) {
    chrome.tabs.create({ url, active: false });
  }
});

document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.set({ requests: [], summary: {}, domainCounts: {}, domainRequestors: {} }, () => {
    document.getElementById("count").textContent = "0 requests tracked";
  });
});
