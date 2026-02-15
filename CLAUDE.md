# Project: TrackerTracker

Chrome extension that tracks the advertising domains that different tabs access while browsing.

Maybe some false positives for Contend Distribution Networks (CDNs) in the current version.

## Instructions

* Create a Chrome extension that receives events when a tab opens a webpage
* Each time this happens
    * Record the name and domain of the tab that made the web request
    * Record the full domain being requested
    * Record the gTLD or country TLD and the next to last component of the domain being requested
    * Record the timestamp when this happened
    * Do not record requests made by "newtab"
    * Do not record requests made by the extension itself
* Make a summary of the request data
    * For each requested base domain
        * Add the timestamp of the request to an array
    * For each requested base domain
        * Count up and store the number of times the domain was requested
    * For each requested base domain
        * Save the unique set of tab domains that requested it
* Make a visualization webpage
    * Make a chart with the tab domains on the Y axis and the requested base domains on the X axis
        * The chart header is "Cross-Website Trackers"
        * Under the chart header, make an explanation paragraph with single linebreaks between sentences that says:
          "This chart shows the domains that follow you from one website to another, as you are browsing.
          Columns with more than one colored dot are tracking you across the websites named at the beginning of each row, these are either ad-tracking domains or Content Distribution Networks (CDNs).
          Rows show the total number of trackers that a website sets on you (in parentheses), so more dots = more trackers, and lots of dots is bad.
          Interesting patterns emerge.
          For example, if you browse `nypost.com` and `theguardian.com`, you see that both use `bidswitch.net` and `doubleclick.net` for tracking."
        * Freeze the Y axis labels so that scrolling always shows the domains
        * Freeze the X axis labels so that scrolling always shows the domains
        * Place a dot at the intersection when the requested base domain was requested by the tab domain
        * For each row, show the dot count in parentheses
        * Do not allow ellipses in the row labels, always show the full text
        * Make a button that can toggle both axes between alphabetical order or sorted by "most dots"
    * Make a histogram of the number of times the requested base domain was requested using the counted up data
        * The chart header is "Request Counts by Tracking Domain"
        * Under the chart header, make an explanation paragraph with single linebreaks between sentences that says:
          "The Cross-Website Trackers chart above only shows that the webpage you are looking at makes requests to the tracking domains.
           In other words, it takes all of those requests (however many there are!) and folds them into a single dot.
           This histogram shows the actual number of requests to the tracking domains.
           Requests to subdomains are folded into the tracking domain, i.e. `subdomain.doubleclick.net` -> `doubleclick.net` count.
    * Make a timeline with the base domains and when they were requested
    * Under that, make a timeline with the full domains of the websites that were opened
    * Make it possible to zoom in and out of both timelines
    * Make a button called "Test" that opens "nypost.com, videocardz.net, vilimpoc.org, www.channelnewsasia.com, www.nytimes.com, www.phoronix.com, www.reddit.com, www.theguardian.com, www.theregister.com" in tabs
        * This button should be visible in the extension popup window
    * Make a button that can clear the extension's local storage
    * Make a button that can toggle the histogram between alphabetical order or most-requested order
