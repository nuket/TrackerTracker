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

chrome.storage.local.get({ requests: [] }, (result) => {
  const requests = result.requests;

  if (requests.length === 0) {
    document.getElementById("timeline").innerHTML =
      '<div class="no-data">No requests recorded yet. Browse some websites and check back.</div>';
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

  // Build summary
  document.getElementById("summary").textContent =
    requests.length + " requests across " +
    groups.length + " site(s), from " +
    formatDateTime(globalMin) + " to " + formatDateTime(globalMax);

  // Zoom state
  let zoomLevel = 1;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 10;
  const ZOOM_STEP = 0.25;

  function renderTimeline() {
    const barWidth = Math.round(BASE_BAR_WIDTH * zoomLevel);
    const timelineEl = document.getElementById("timeline");

    // Build time axis
    let axisHTML = '<div class="timeline-axis"><div class="timeline-label"></div><div class="timeline-bar-area" style="min-width:' + barWidth + 'px;position:relative;">';
    for (let i = 0; i <= TICK_COUNT; i++) {
      const t = globalMin + (span * i) / TICK_COUNT;
      const left = (i / TICK_COUNT) * 100;
      axisHTML += '<span class="tick" style="position:absolute;left:' + left + '%;transform:translateX(-50%)">' + formatTime(t) + "</span>";
    }
    axisHTML += "</div></div>";

    // Build rows
    let rowsHTML = "";
    groups.forEach((group) => {
      let label = group.tabTitle;
      if (label.length > 30) label = label.substring(0, 28) + "...";

      let segmentsHTML = "";
      // Draw tick lines
      for (let i = 0; i <= TICK_COUNT; i++) {
        const left = (i / TICK_COUNT) * 100;
        segmentsHTML += '<div class="timeline-tick-line" style="left:' + left + '%"></div>';
      }

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

      rowsHTML +=
        '<div class="timeline-row" data-domain="' + group.tabDomain + '">' +
        '<div class="timeline-label" title="' + group.tabDomain + '">' + label + "</div>" +
        '<div class="timeline-bar-area" style="min-width:' + barWidth + 'px;position:relative;">' +
        segmentsHTML +
        "</div></div>";
    });

    timelineEl.innerHTML = axisHTML + rowsHTML;

    // Re-attach click handlers on rows
    for (const row of document.querySelectorAll(".timeline-row")) {
      row.style.cursor = "pointer";
      row.addEventListener("click", () => {
        const domain = row.dataset.domain;
        const heading = [...document.querySelectorAll("#details h3")].find(
          (h) => h.textContent.includes(domain)
        );
        if (heading) heading.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // Update zoom label
    document.getElementById("zoom-level").textContent = Math.round(zoomLevel * 100) + "%";
  }

  function setZoom(newLevel) {
    const timelineEl = document.getElementById("timeline");
    const oldScrollLeft = timelineEl.scrollLeft;
    const oldBarWidth = BASE_BAR_WIDTH * zoomLevel;
    const scrollCenter = oldScrollLeft + timelineEl.clientWidth / 2;
    const scrollRatio = oldBarWidth > 0 ? scrollCenter / oldBarWidth : 0;

    zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newLevel));
    renderTimeline();

    // Maintain scroll position relative to the center of the viewport
    const newBarWidth = BASE_BAR_WIDTH * zoomLevel;
    timelineEl.scrollLeft = scrollRatio * newBarWidth - timelineEl.clientWidth / 2;
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

  // Ctrl + scroll to zoom
  document.getElementById("timeline").addEventListener("wheel", (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(zoomLevel + delta);
  }, { passive: false });

  // Clear data button
  document.getElementById("clear-data").addEventListener("click", () => {
    if (!confirm("Clear all recorded data? This cannot be undone.")) return;
    chrome.storage.local.remove(["requests", "summary"], () => {
      location.reload();
    });
  });

  // Initial render
  renderTimeline();

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
