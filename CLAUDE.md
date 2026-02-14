# Project: CookieMonitor

Chrome extension that tracks the domains that different tabs access while browsing.

## Instructions

* Create a Chrome extension that receives events when a tab opens a webpage
* Each time this happens
    * Record the name and domain of the tab that made the web request
    * Record the full domain being requested
    * Record the gTLD or country TLD and the next to last component of the domain being requested
    * Record the timestamp when this happened
    * Do not record requests made by the extension itself
* Make a summary of the request data
    * For each requested base domain
        * Add the timestamp of the request to an array
    * For each requested base domain
        * Count up and store the number of times the domain was requested
* Make a visualization webpage that shows a timeline of requests
    * Make a histogram of the number of times the requested base domain was requested using the counted up data
    * Make a timeline with the base domains and when they were requested
    * Under that, make a timeline with the full domains of the websites that were opened
    * Make it possible to zoom in and out of both timelines
    * Make a button that can clear the extension's local storage
    * Make a button that can toggle the histogram between alphabetical order or most-requested order