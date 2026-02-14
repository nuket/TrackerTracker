function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// Common two-part country-code TLDs
const TWO_PART_TLDS = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "net.uk",
  "co.jp", "or.jp", "ne.jp", "ac.jp", "go.jp",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "net.nz", "org.nz", "govt.nz",
  "co.in", "net.in", "org.in", "gov.in", "ac.in",
  "com.br", "net.br", "org.br", "gov.br",
  "co.za", "org.za", "net.za", "gov.za",
  "co.kr", "or.kr", "go.kr", "ac.kr",
  "com.cn", "net.cn", "org.cn", "gov.cn",
  "com.tw", "net.tw", "org.tw", "gov.tw",
  "com.hk", "net.hk", "org.hk", "gov.hk",
  "com.sg", "net.sg", "org.sg", "gov.sg",
  "com.mx", "net.mx", "org.mx", "gob.mx",
  "com.ar", "net.ar", "org.ar", "gov.ar",
  "co.il", "org.il", "net.il", "ac.il", "gov.il",
  "co.th", "or.th", "ac.th", "go.th",
  "com.tr", "net.tr", "org.tr", "gov.tr",
  "co.id", "or.id", "ac.id", "go.id",
  "com.my", "net.my", "org.my", "gov.my",
  "com.ph", "net.ph", "org.ph", "gov.ph",
  "com.pl", "net.pl", "org.pl", "gov.pl",
  "com.ua", "net.ua", "org.ua", "gov.ua",
  "co.ke", "or.ke", "ac.ke", "go.ke",
  "com.ng", "net.ng", "org.ng", "gov.ng",
  "com.eg", "net.eg", "org.eg", "gov.eg",
  "co.de", "com.de"
]);

// Extract the registrable domain: gTLD/country TLD + next-to-last component
// e.g. "cdn.assets.example.co.uk" -> "example.co.uk"
// e.g. "www.example.com" -> "example.com"
function extractBaseDomain(hostname) {
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;

  // Check if the last two parts form a known two-part TLD
  const lastTwo = parts.slice(-2).join(".");
  if (TWO_PART_TLDS.has(lastTwo)) {
    // Need at least 3 parts for a valid domain with a two-part TLD
    return parts.length >= 3 ? parts.slice(-3).join(".") : hostname;
  }

  // Standard single-part TLD: take last two components
  return parts.slice(-2).join(".");
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
        requestedBaseDomain: extractBaseDomain(requestedDomain),
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
