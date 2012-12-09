node-rssparser
----------------

rssparser is a RSS/ATOM feed parser that returns the requested feed urls in a json object that is formatted so that you will not have to worry (much) about the format of the requested feed.

Motivation
----------

RSS and ATOM feeds are both trying to deliver similar content, but are different enough with their structure to be aggravating. The purpose of rssparser is to allow for the important parts of the feeds (article titles, links, etc) to be returned in a standard format, but to also return the rest of the feed in a reasonable way.

Installing
----------

Like all node.js modules, just use npm!

```
npm install rssparser
```

Usage
-----

Using rss parser is easy, just call:

```
var parser = require('rssparser');
var options = {};
//rss feeds
parser.parseURL('http://laymansite.com/feed', options, function(err, out){
	console.log(out);
});
//atom feeds
parser.parseURL('http://www.blogger.com/feeds/10861780/posts/default', options, function(err, out){
	console.log(out);
});
```

Output
------

The point of `rssparser` is to try and hide the format of the originally requested feed. Thus RSS and ATOM feeds are returned in a common format. Similar fields (pubDate vs update) will be mapped to the same field in the output.

The 'minimal' output format is:

```
{
	type:"rss" or "atom"
	title: Title of the feed
	description: description or subtitle
	url: url of the feed
	last_modified: pubDate or update time of the feed
	items:[
		{
			title: Title of article
			summary	: Summary or content of article
			url	: Url of the article
			categories : Categories of the article
			published_at: published date in relative
			time_ago: time in words
			author:	name of the author	
			guid		
			{
				link : link of the article
				isPermaLink	: isPermaLink true or false
			}	
		}...
	]
```

Tests
-----

Tests for rssparser can be run using the command:

```
npm test
```

Make sure that you machine has an internet connection before running the
tests.

