# Project: CookieMonitor

Chrome extension that tracks the domains that different tabs access while browsing.

## Instructions

* Create a Chrome extension that receives events when a tab opens a webpage
* Each time this happens
    * Record the name and domain of the tab that made the web request
    * Record the full domain being requested
    * Record the gTLD or country TLD and the next to last component of the domain being requested
    * Record the timestamp when this happened
* Make a visualization webpage that shows a timeline of requests
    * Make a timeline at the top of the page that shows the name of the websites that were opened
    * Make it possible to zoom in and out of the timeline
    * Make a button that can clear the extension's local storage