# TrackerTracker 🧐

A Chrome extension that tracks the advertising domains that different tabs access while browsing
and visualizes them using a scatter plot.

This shows the user how they are being tracked across websites, as each website fires off requests
to the same ad networks, loading tracking pixels and Javascript stubs.

There are some false positives for Content Distribution Networks (CDNs) in the current version,
and alternative domains hosting content for the browsed address, e.g. `phoronix.com` fetches
content from `phoronix.net`, `nytimes.com` pulls from `nyt.com`, etc.

Obviously these aren't advertising domains, but they'll show up anyways for now.
I'm not going to look too closely at this yet.

## Visualization

Here's what the scatter plot looks like.

Alphabetical Sort shows the browsed websites list sorted from A-Z.

![Scatter Plot Alphabetical Sort](images/sort-scatter-alphabetical-1.png)

Most-Dots Sort shows the browsed websites list sorted on both axes:

* by the most-to-least total number of trackers requested by a domain and
* by the most-to-least seen tracking domains

In this example, some kind of Google tracking was requested by 6 of the domains
on the left, and as you look to the right, those sites are less and less commonly
used for tracking.

![Scatter Plot Most-Dots Sort](images/sort-scatter-most-dots-1.png)

## Histograms

Tracking Domains sorted by Most Requested

![Histogram Most Requested Sort](images/sort-histogram-most-requested-1.png)

Tracking Domains sorted Alphabetically

![Histogram Alphabetical Sort](images/sort-histogram-alphabetical-1.png)

## Time Series

A time series that shows how Tracking Domains are called repeatedly and often.

![Time Series of Tracking Domain accesses](images/time-series-trackers-1.png)

## Browser Tab Time Series

A time series that shows how each Browser Tab accesses various Tracking Domains.

![Time Series of Browser Tabs accessing Tracking Domains](images/browser-tab-timeline-1.png)

## Installation

To install the plugin in Chrome, go to `chrome://extensions` turn on Developer Mode, and
use the `Load unpacked` button.

![Installation](images/installing-extension-1.png)

## License

No idea what license this thing belongs to, since it was all vibe coded with Claude.
