const COLORS = [
  "#4285f4", "#ea4335", "#fbbc04", "#34a853", "#ff6d01",
  "#46bdc6", "#7baaf7", "#f07b72", "#fcd04f", "#71c287",
  "#ab47bc", "#5c6bc0", "#26a69a", "#ef5350", "#66bb6a"
];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatDateTime(ts) {
  return new Date(ts).toLocaleString();
}

chrome.storage.local.get({ requests: [], summary: {}, domainCounts: {}, domainRequestors: {}, browsedDomains: [] }, (result) => {
  const requests = result.requests;
  const summary = result.summary;
  const domainCounts = result.domainCounts;
  const domainRequestors = result.domainRequestors;
  const browsedDomains = result.browsedDomains;

  // Test button - open test websites in new tabs
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

  // Clear data button
  document.getElementById("clear-data").addEventListener("click", () => {
    if (!confirm("Clear all recorded data? This cannot be undone.")) return;
    chrome.storage.local.remove(["requests", "summary", "domainCounts", "domainRequestors", "browsedDomains"], () => {
      location.reload();
    });
  });

  if (requests.length === 0) {
    document.getElementById("timeline-base").innerHTML =
      '<div class="no-data">No requests recorded yet. Browse some websites and check back.</div>';
    document.getElementById("timeline-full").innerHTML =
      '<div class="no-data">No data to display.</div>';
    document.getElementById("details").innerHTML =
      '<div class="no-data">No data to display.</div>';
    document.getElementById("summary").textContent = "No data recorded.";
    return;
  }

  // Group requests by tab domain, preserving first-seen order
  const domainOrder = [];
  const domainMap = {};
  for (const r of requests) {
    if (!domainMap[r.tabDomain]) {
      domainMap[r.tabDomain] = {
        tabTitle: r.tabTitle,
        tabDomain: r.tabDomain,
        requests: []
      };
      domainOrder.push(r.tabDomain);
    }
    domainMap[r.tabDomain].requests.push(r);
    // Update title to latest
    domainMap[r.tabDomain].tabTitle = r.tabTitle;
  }

  const groups = domainOrder.map((d) => domainMap[d]);

  const globalMin = requests[0].timestamp;
  const globalMax = requests[requests.length - 1].timestamp;
  const span = Math.max(globalMax - globalMin, 1000); // at least 1s

  const BASE_BAR_WIDTH = 800;
  const TICK_COUNT = 8;

  // Assign colors to requested domains
  const domainSet = [...new Set(requests.map((r) => r.requestedDomain))].sort();
  const domainColorMap = {};
  domainSet.forEach((d, i) => {
    domainColorMap[d] = COLORS[i % COLORS.length];
  });

  // Assign colors to base domains
  const baseDomainSet = Object.keys(summary).sort();
  const baseDomainColorMap = {};
  baseDomainSet.forEach((d, i) => {
    baseDomainColorMap[d] = COLORS[i % COLORS.length];
  });

  // Build summary text
  document.getElementById("summary").textContent =
    requests.length + " requests across " +
    groups.length + " site(s), from " +
    formatDateTime(globalMin) + " to " + formatDateTime(globalMax);

  function buildTimeAxis(barWidth) {
    let html = '<div class="timeline-axis"><div class="timeline-label"></div><div class="timeline-bar-area" style="min-width:' + barWidth + 'px;position:relative;">';
    for (let i = 0; i <= TICK_COUNT; i++) {
      const t = globalMin + (span * i) / TICK_COUNT;
      const left = (i / TICK_COUNT) * 100;
      html += '<span class="tick" style="position:absolute;left:' + left + '%;transform:translateX(-50%)">' + formatTime(t) + "</span>";
    }
    html += "</div></div>";
    return html;
  }

  function buildTickLines() {
    let html = "";
    for (let i = 0; i <= TICK_COUNT; i++) {
      const left = (i / TICK_COUNT) * 100;
      html += '<div class="timeline-tick-line" style="left:' + left + '%"></div>';
    }
    return html;
  }

  // Render the base domains timeline (from summary data)
  function renderBaseTimeline(barWidth) {
    const el = document.getElementById("timeline-base");
    let html = buildTimeAxis(barWidth);

    baseDomainSet.forEach((baseDomain) => {
      const timestamps = summary[baseDomain] || [];
      let label = baseDomain;
      if (label.length > 30) label = label.substring(0, 28) + "...";

      let segmentsHTML = buildTickLines();
      const color = baseDomainColorMap[baseDomain];
      for (const ts of timestamps) {
        const pos = ((ts - globalMin) / span) * 100;
        segmentsHTML +=
          '<div class="timeline-segment" ' +
          'style="left:' + pos + "%;width:6px;background:" + color + '" ' +
          'title="' + baseDomain + " at " + formatTime(ts) + '"' +
          "></div>";
      }

      html +=
        '<div class="timeline-row">' +
        '<div class="timeline-label" title="' + baseDomain + '">' + label + "</div>" +
        '<div class="timeline-bar-area" style="min-width:' + barWidth + 'px;position:relative;">' +
        segmentsHTML +
        "</div></div>";
    });

    el.innerHTML = html;
  }

  // Render the full domains timeline (grouped by tab domain)
  function renderFullTimeline(barWidth) {
    const el = document.getElementById("timeline-full");
    let html = buildTimeAxis(barWidth);

    groups.forEach((group) => {
      let label = group.tabTitle;
      if (label.length > 30) label = label.substring(0, 28) + "...";

      let segmentsHTML = buildTickLines();
      for (const r of group.requests) {
        const pos = ((r.timestamp - globalMin) / span) * 100;
        const color = domainColorMap[r.requestedDomain];
        segmentsHTML +=
          '<div class="timeline-segment" ' +
          'style="left:' + pos + "%;width:6px;background:" + color + '" ' +
          'data-domain="' + r.tabDomain + '" ' +
          'title="' + r.requestedDomain + " at " + formatTime(r.timestamp) + '"' +
          "></div>";
      }

      html +=
        '<div class="timeline-row" data-domain="' + group.tabDomain + '">' +
        '<div class="timeline-label" title="' + group.tabDomain + '">' + label + "</div>" +
        '<div class="timeline-bar-area" style="min-width:' + barWidth + 'px;position:relative;">' +
        segmentsHTML +
        "</div></div>";
    });

    el.innerHTML = html;

    // Click handlers on full timeline rows
    for (const row of document.querySelectorAll("#timeline-full .timeline-row")) {
      row.style.cursor = "pointer";
      row.addEventListener("click", () => {
        const domain = row.dataset.domain;
        const heading = [...document.querySelectorAll("#details h3")].find(
          (h) => h.textContent.includes(domain)
        );
        if (heading) heading.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function renderTimelines() {
    renderBaseTimeline(BASE_BAR_WIDTH);
    renderFullTimeline(BASE_BAR_WIDTH);
  }

  // Initial render
  renderTimelines();

  // Dot chart: browsed domains (Y) vs requested base domains (X)
  const dotChartEl = document.getElementById("dot-chart");
  const tabDomainsAlpha = [...browsedDomains].sort();
  const reqBaseDomainsAlpha = Object.keys(domainRequestors).sort();
  let dotChartSortByDots = false;

  // Build lookup set for quick intersection check
  const intersections = {};
  // Count dots per column (base domain)
  const colDotCounts = {};
  for (const [baseDomain, tabs] of Object.entries(domainRequestors)) {
    colDotCounts[baseDomain] = tabs.length;
    for (const tab of tabs) {
      intersections[tab + "|" + baseDomain] = true;
    }
  }

  // Count dots per row (tab domain)
  const rowDotCounts = {};
  for (const td of tabDomainsAlpha) {
    let count = 0;
    for (const bd of reqBaseDomainsAlpha) {
      if (intersections[td + "|" + bd]) count++;
    }
    rowDotCounts[td] = count;
  }

  function renderDotChart() {
    if (tabDomainsAlpha.length === 0 || reqBaseDomainsAlpha.length === 0) {
      dotChartEl.innerHTML = '<div class="no-data">No data for dot chart yet.</div>';
      return;
    }

    const sortedBaseDomains = dotChartSortByDots
      ? [...reqBaseDomainsAlpha].sort((a, b) => (colDotCounts[b] || 0) - (colDotCounts[a] || 0))
      : reqBaseDomainsAlpha;

    const sortedTabDomains = dotChartSortByDots
      ? [...tabDomainsAlpha].sort((a, b) => (rowDotCounts[b] || 0) - (rowDotCounts[a] || 0))
      : tabDomainsAlpha;

    let dotHTML = '<div class="dot-chart-scroll"><table class="dot-chart-table">';
    // Header row with base domain labels
    dotHTML += "<thead><tr><th></th>";
    for (const bd of sortedBaseDomains) {
      dotHTML += '<th class="dot-chart-col-header" title="' + bd + '"><div>' + bd + "</div></th>";
    }
    dotHTML += "</tr></thead><tbody>";

    // One row per tab domain
    for (const td of sortedTabDomains) {
      const dotCount = rowDotCounts[td] || 0;
      dotHTML += "<tr>";
      dotHTML += '<td class="dot-chart-row-header" title="' + td + '">' + td + " (" + dotCount + ")</td>";
      for (const bd of sortedBaseDomains) {
        const hasDot = intersections[td + "|" + bd];
        const color = baseDomainColorMap[bd] || "#4285f4";
        dotHTML += "<td>" + (hasDot
          ? '<span class="dot" style="background:' + color + '"></span>'
          : "") + "</td>";
      }
      dotHTML += "</tr>";
    }
    dotHTML += "</tbody></table></div>";
    dotChartEl.innerHTML = dotHTML;

    document.getElementById("dot-chart-sort-btn").textContent =
      dotChartSortByDots ? "Sort: Most Dots" : "Sort: Alphabetical";
  }

  document.getElementById("dot-chart-sort-btn").addEventListener("click", () => {
    dotChartSortByDots = !dotChartSortByDots;
    renderDotChart();
  });

  renderDotChart();

  // Histogram of base domain request counts
  const histogramEl = document.getElementById("histogram");
  const countEntries = Object.entries(domainCounts);
  const maxCount = countEntries.reduce((max, e) => Math.max(max, e[1]), 1);
  let histSortByCount = true;

  function renderHistogram() {
    const sorted = histSortByCount
      ? [...countEntries].sort((a, b) => b[1] - a[1])
      : [...countEntries].sort((a, b) => a[0].localeCompare(b[0]));

    let html = "";
    for (const [domain, count] of sorted) {
      const pct = (count / maxCount) * 100;
      const color = baseDomainColorMap[domain] || "#4285f4";
      html +=
        '<div class="hist-row">' +
        '<div class="hist-label" title="' + domain + '">' + domain + "</div>" +
        '<div class="hist-bar-area">' +
        '<div class="hist-bar" style="width:' + pct + "%;background:" + color + '"></div>' +
        "</div>" +
        '<div class="hist-count">' + count + "</div>" +
        "</div>";
    }
    histogramEl.innerHTML = html || '<div class="no-data">No domain count data yet.</div>';

    document.getElementById("hist-sort-btn").textContent =
      histSortByCount ? "Sort: Most Requested" : "Sort: Alphabetical";
  }

  document.getElementById("hist-sort-btn").addEventListener("click", () => {
    histSortByCount = !histSortByCount;
    renderHistogram();
  });

  renderHistogram();

  // Legend
  let legendHTML = "<h2>Domains Legend</h2><div style='display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px'>";
  for (const d of domainSet) {
    legendHTML +=
      "<span style='display:inline-flex;align-items:center;gap:4px;font-size:12px'>" +
      "<span style='width:12px;height:12px;border-radius:2px;background:" + domainColorMap[d] + ";display:inline-block'></span>" +
      d + "</span>";
  }
  legendHTML += "</div>";

  // Details area - show table per site
  const detailsEl = document.getElementById("details");
  let detailsHTML = legendHTML + "<h2>Requests by Site</h2>";

  for (const group of groups) {
    detailsHTML += "<h3 style='margin:16px 0 8px;font-size:14px'>" +
      group.tabTitle + " <span style='color:#999;font-weight:normal'>(" + group.tabDomain + ")</span></h3>";
    detailsHTML += '<table class="detail-table"><thead><tr><th>Requested Domain</th><th>Base Domain</th><th>Time</th></tr></thead><tbody>';
    for (const r of group.requests) {
      detailsHTML += "<tr><td>" + r.requestedDomain + "</td><td>" + (r.requestedBaseDomain || r.requestedDomain) + "</td><td>" + formatDateTime(r.timestamp) + "</td></tr>";
    }
    detailsHTML += "</tbody></table>";
  }

  detailsEl.innerHTML = detailsHTML;
});
