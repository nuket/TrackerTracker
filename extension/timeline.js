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

chrome.storage.local.get({ requests: [], summary: {}, domainCounts: {}, domainRequestors: {} }, (result) => {
  const requests = result.requests;
  const summary = result.summary;
  const domainCounts = result.domainCounts;
  const domainRequestors = result.domainRequestors;

  if (requests.length === 0) {
    document.getElementById("timeline-base").innerHTML =
      '<div class="no-data">No requests recorded yet. Browse some websites and check back.</div>';
    document.getElementById("timeline-full").innerHTML =
      '<div class="no-data">No data to display.</div>';
    document.getElementById("details").innerHTML =
      '<div class="no-data">No data to display.</div>';
    document.getElementById("summary").textContent = "No data recorded.";
    document.getElementById("zoom-controls").style.display = "none";
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

  // Zoom state
  let zoomLevel = 1;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 10;
  const ZOOM_STEP = 0.25;

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
    const barWidth = Math.round(BASE_BAR_WIDTH * zoomLevel);
    renderBaseTimeline(barWidth);
    renderFullTimeline(barWidth);
    document.getElementById("zoom-level").textContent = Math.round(zoomLevel * 100) + "%";
  }

  function setZoom(newLevel) {
    const containers = [
      document.getElementById("timeline-base"),
      document.getElementById("timeline-full")
    ];
    // Save scroll ratios for both containers
    const scrollData = containers.map((el) => {
      const oldBarWidth = BASE_BAR_WIDTH * zoomLevel;
      const scrollCenter = el.scrollLeft + el.clientWidth / 2;
      return oldBarWidth > 0 ? scrollCenter / oldBarWidth : 0;
    });

    zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newLevel));
    renderTimelines();

    // Restore scroll positions
    const newBarWidth = BASE_BAR_WIDTH * zoomLevel;
    containers.forEach((el, i) => {
      el.scrollLeft = scrollData[i] * newBarWidth - el.clientWidth / 2;
    });
  }

  // Zoom controls
  document.getElementById("zoom-in").addEventListener("click", () => {
    setZoom(zoomLevel + ZOOM_STEP);
  });
  document.getElementById("zoom-out").addEventListener("click", () => {
    setZoom(zoomLevel - ZOOM_STEP);
  });
  document.getElementById("zoom-reset").addEventListener("click", () => {
    setZoom(1);
  });

  // Ctrl + scroll to zoom on either timeline
  for (const id of ["timeline-base", "timeline-full"]) {
    document.getElementById(id).addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(zoomLevel + delta);
    }, { passive: false });
  }

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
    chrome.storage.local.remove(["requests", "summary", "domainCounts", "domainRequestors"], () => {
      location.reload();
    });
  });

  // Initial render
  renderTimelines();

  // Dot chart: tab domains (Y) vs requested base domains (X)
  const dotChartEl = document.getElementById("dot-chart");
  const tabDomains = [...new Set(requests.map((r) => r.tabDomain))].sort();
  const reqBaseDomains = Object.keys(domainRequestors).sort();

  if (tabDomains.length > 0 && reqBaseDomains.length > 0) {
    // Build lookup set for quick intersection check
    const intersections = {};
    for (const [baseDomain, tabs] of Object.entries(domainRequestors)) {
      for (const tab of tabs) {
        intersections[tab + "|" + baseDomain] = true;
      }
    }

    let dotHTML = '<div class="dot-chart-scroll"><table class="dot-chart-table">';
    // Header row with base domain labels
    dotHTML += "<thead><tr><th></th>";
    for (const bd of reqBaseDomains) {
      dotHTML += '<th class="dot-chart-col-header" title="' + bd + '"><div>' + bd + "</div></th>";
    }
    dotHTML += "</tr></thead><tbody>";

    // One row per tab domain
    for (const td of tabDomains) {
      dotHTML += "<tr>";
      dotHTML += '<td class="dot-chart-row-header" title="' + td + '">' + td + "</td>";
      for (const bd of reqBaseDomains) {
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
  } else {
    dotChartEl.innerHTML = '<div class="no-data">No data for dot chart yet.</div>';
  }

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
