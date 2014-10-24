//feed.js
var xml2js = require('xml2js'),
    _ = require('underscore'),
    request = require('request'),
    URL = require('url'),
    Iconv = require('iconv').Iconv;
/**
 All you need to do is send a feed URL that can be opened via fs
 Options are optional, see xml2js for extensive list
 And a callback of course

 The returned formats will be structurally the same, but you should still check the 'format' property
 **/
function parseURL(feedURL, options, callback) {
    if (typeof options === 'function' && !callback) {
        callback = options;
        options = {};
    }
    var defaults = {
        uri: feedURL,
        jar: false,
        proxy: false,
        followRedirect: true,
        timeout: 1000 * 30,
        encoding: null,
        rssEncoding: 'UTF-8'
    };
    options = _.extend(defaults, options);
    //check that the protocal is either http or https
    var u = URL.parse(feedURL);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
        //make sure to have a 30 second timeout
        var req = request(options, function(err, response, xml) {
            if (err || xml === null) {
                if (err) {
                    callback(err, null);
                } else {
                    callback('Failed to retrieve source!', null);
                }
            } else {
                if ((typeof response !== "undefined" && response !== null ? response.statusCode : void 0) != null) {
                    if (response.statusCode >= 400) {
                        callback("Failed to retrieve source! Invalid response code (" + response.statusCode + ")!", null);
                    } else {
                        var iconv = new Iconv(options.rssEncoding, 'UTF-8');
                        xml = iconv.convert(xml).toString();
                        parseString(xml, options, callback);
                    }
                } else {
                    callback("Failed to retrieve source! No response code!!", null);
                }
            }
        });
    } else {
        callback({
            error: "Only http or https protocols are accepted"
        }, null);
    }
}
module.exports.parseURL = parseURL;

function parseString(xml, options, callback) {
    // we need to check that the input in not a null input
    if (xml.split('<').length >= 3) {
        var parser = new xml2js.Parser({
            trim: false,
            normalize: true,
            mergeAttrs: true
        });
        parser.addListener('end', function(jsonDOM) {
            if (jsonDOM) {
                //console.log(jsonDOM.rss.channel[0]);
                jsonDOM = normalize(jsonDOM);
                var err, output;
                if (isRSS(jsonDOM)) {
                    output = formatRSS(jsonDOM, options);
                } else {
                    output = formatATOM(jsonDOM, options);
                }
                callback(null, output);
            } else {
                callback("failed to parse xml", null);
            }
        });
        parser.addListener("error", function(err) {
            callback(err, null);
        });
        parser.parseString(xml);
    } else {
        callback('malformed xml', null);
    }
}
module.exports.parseString = parseString;
//detects if RSS, otherwise assume atom
function isRSS(json) {
    return (json.channel != null);
}
// normalizes input to make feed burner work
function normalize(json) {
    if (json.rss) {
        return json.rss;
    }
    return json;
}
//xml2js will return commented material in a # tag which can be a pain
//this will remove the # tag and set its child text in it's place
//ment to work on a feed item, so will iterate over json's and check
function flattenComments(json) {
    for (key in json) {
        if (json[key]['#']) {
            json[key] = json[key]['#'];
        }
    }
    return json;
}
//formats the RSS feed to the needed outpu
//also parses FeedBurner
function formatRSS(json, options) {
    var output = {
        'type': 'rss',
        items: []
    };
    var channel = json.channel;
    if (_.isArray(json.channel)) {
        channel = json.channel[0];
    }
    if (channel.title) {
        output.title = channel.title[0];
    }
    if (channel.description) {
        output.description = channel.description[0];
    }
    if (channel.link) {
        output.url = channel.link[0];
    }
    if (channel.lastBuildDate) {
        output.last_modified = channel.lastBuildDate[0];
    }
    if (channel.pubDate) {
        output.update = channel.pubDate[0];
    }
    if (channel.ttl) {
        output.ttl = channel.ttl[0];
    }
    //ok, now lets get into the meat of the feed
    //just double check that it exists
    if (channel.item) {
        if (!_.isArray(channel.item)) {
            channel.item = [channel.item];
        }
        _.each(channel.item, function(val, index) {
            val = flattenComments(val);
            var obj = {}, _ref;
            //Tx PaulFreund
            if ((options || {}).pipeOriginal) {
              obj.original = val;
            }
            obj.title = (_ref = val.title) != undefined && _ref.length > 0 ? _ref[0] : void 0;
            obj.summary = (_ref = val.description) != undefined && _ref.length > 0 ? _ref[0] : void 0;
            obj.url = (_ref = val.link) != undefined && _ref.length > 0 ? _ref[0] : void 0;
            obj.categories = (_ref = val.category) != undefined && _ref.length > 0 ? _ref[0] : void 0;
            // Put the comments instead of the description if there is no description
            if (!(obj.summary != null) || obj.summary === '') {
                obj.summary = (_ref = (val.comments && val.comments[0])) ? _ref : '';
            }
            //since we are going to format the date, we want to make sure it exists
            if (val.pubDate) {
                //lets try basis js date parsing for now
                obj.published_at = Date.parse(val.pubDate[0]);
                obj.time_ago = DateHelper.time_ago_in_words(obj.published_at);
            }
            ///wordpress author
            if (val['dc:creator']) {
                obj.author = val['dc:creator'][0];
            }
            if (val.author) {
                obj.author = val.author[0];
            }
            //now lets handle the GUID
            if (val.guid) {
                //xml2js parses this kina odd...
                var link = val.guid[0]._;
                var param = val.guid[0].isPermaLink;
                var isPermaLink = true;
                obj.guid = {
                    'link': link,
                    isPermaLink: param
                };
            }
            if (val['media:content']) {
                obj.media = val.media || {};
                obj.media.content = val['media:content'];
            }
            if (val['media:thumbnail']) {
                obj.media = val.media || {};
                obj.media.thumbnail = val['media:thumbnail'];
            }
            //now push the obj onto the stack
            output.items.push(obj);
        });
    }
    return output;
}
//formats the ATOM feed to the needed output
function formatATOM(json, options) {
    var output = {
        'type': 'atom',
        items: []
    };
    var channel = json.feed || json;
    if (channel.title) {
        output.title = channel.title[0]._;
    }
    if (channel.subtitle)
        if (_.isArray(channel.subtitle)) {
            if (channel.subtitle[0]._) {
                output.desc = channel.subtitle[0]._;
            }
        } else {
            output.desc = channel.subtitle;
        }
    if (channel.link)
        if (_.isArray(channel.link)) {
            _.each(channel.link, function(val, index) {
                if (val.type && val.type.indexOf("html") > 0) {
                    output.link = val.href;
                }
                if (val.rel === "hub") {
                    output.hub = val.href;
                }
            });
        }
    if (channel.id) {
        output.id = channel.id[0];
    }
    if (channel.updated) {
        output.last_modified = new Date(channel.updated[0]).toString();
    }
    if (channel.author) {
        output.author = channel.author[0].name[0];
    }
    //just double check that it exists and that it is an array
    if (channel.entry) {
        if (!_.isArray(channel.entry)) {
            channel.entry = [channel.entry];
        }
        _.each(channel.entry, function(val, index) {
            val = flattenComments(val);
            var obj = {}, _ref;
            if ((options || {}).pipeOriginal) {
              obj.original = val;
            }
            obj.id = val.id[0];
            obj.title = (_ref = val.title) != undefined && _ref.length > 0 ? _ref[0]._ : void 0;
            obj.summary = (_ref = val.content[0]) != undefined && _ref.length > 0 ? _ref[0]._ : void 0;
            var categories = [];
            //just grab the category text
            if (val.category) {
                if (_.isArray(val.category)) {
                    _.each(val.category, function(val, i) {
                        categories.push(val['term']);
                    });
                } else {
                    categories.push(val.category);
                }
            }
            obj.category = categories;
            var link = '';
            //just get the alternate link
            if (val.link) {
                if (_.isArray(val.link)) {
                    _.each(val.link, function(val, i) {
                        if (val.rel === 'self') {
                            link = val.href;
                        }
                    });
                } else {
                    link = val.link.href;
                }
            }
            obj.link = link;
            //since we are going to format the date, we want to make sure it exists
            if (val.published) {
                //lets try basis js date parsing for now
                obj.published_at = Date.parse(val.published[0]);
                obj.time_ago = DateHelper.time_ago_in_words(obj.published_at);
            }
            if (val['media:content']) {
                obj.media = val.media || {};
                obj.media.content = val['media:content'];
            }
            if (val['media:thumbnail']) {
                obj.media = val.media || {};
                obj.media.thumbnail = val['media:thumbnail'];
            }
            //now push the obj onto the stack
            output.items.push(obj);
        });
    }
    return output;
}
var DateHelper = {
    // Takes the format of "Jan 15, 2007 15:45:00 GMT" and converts it to a relative time
    // Ruby strftime: %b %d, %Y %H:%M:%S GMT
    time_ago_in_words_with_parsing: function(from) {
        var date = new Date();
        date.setTime(Date.parse(from));
        return this.time_ago_in_words(date);
    },
    // Takes a timestamp and converts it to a relative time
    // DateHelper.time_ago_in_words(1331079503000)
    time_ago_in_words: function(from) {
        return this.distance_of_time_in_words(new Date(), from);
    },
    distance_of_time_in_words: function(to, from) {
        var distance_in_seconds = ((to - from) / 1000);
        var distance_in_minutes = Math.floor(distance_in_seconds / 60);
        var tense = distance_in_seconds < 0 ? " from now" : " ago";
        distance_in_minutes = Math.abs(distance_in_minutes);
        if (distance_in_minutes === 0) {
            return 'less than a minute' + tense;
        }
        if (distance_in_minutes === 1) {
            return 'a minute' + tense;
        }
        if (distance_in_minutes < 45) {
            return distance_in_minutes + ' minutes' + tense;
        }
        if (distance_in_minutes < 90) {
            return 'about an hour' + tense;
        }
        if (distance_in_minutes < 1440) {
            return 'about ' + Math.floor(distance_in_minutes / 60) + ' hours' + tense;
        }
        if (distance_in_minutes < 2880) {
            return 'a day' + tense;
        }
        if (distance_in_minutes < 43200) {
            return Math.floor(distance_in_minutes / 1440) + ' days' + tense;
        }
        if (distance_in_minutes < 86400) {
            return 'about a month' + tense;
        }
        if (distance_in_minutes < 525960) {
            return Math.floor(distance_in_minutes / 43200) + ' months' + tense;
        }
        if (distance_in_minutes < 1051199) {
            return 'about a year' + tense;
        }
        return 'over ' + Math.floor(distance_in_minutes / 525960) + ' years';
    }
};
