node-rssparser
----------------

rssparser is a RSS/ATOM feed parser that returns the requested feed urls in a simple json object 

[![build status](https://secure.travis-ci.org/tk120404/node-rssparser.png)](http://travis-ci.org/tk120404/node-rssparser)

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

Change log
----------

0.0.3 thumbnails added
0.0.2 atom parser changes
0.0.1 initial

License
-------

http://wtfpl.org/

