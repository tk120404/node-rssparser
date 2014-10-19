// string test.js
// why does this not work?

var vows = require('vows');
var assert = require('assert');

var parser = require('../lib/feed.js');

vows.describe('bindparser').addBatch({

  'rss tests':{
    topic:function(){
      parser.parseURL('http://rss.cnn.com/rss/cnn_topstories.rss', {}, this.callback);
    },
    'response is not null':function(err, docs){
      assert.isNull(err);
      assert.isNotNull(docs);
    },
    'response is properly formatted':function(err, docs){
      assert.equal(docs.type, 'rss');
      assert.isArray(docs.items);
    }
  },
  'atom tests':{
    topic:function(){
      parser.parseURL('http://brandthinkmarketingdo.com/feed/atom/', {}, this.callback);
    },
    'response is not null':function(err, docs){
      assert.isNull(err);
      assert.isNotNull(docs);
    },
    'response is properly formatted':function(err, docs){
      assert.equal(docs.type, 'atom');
      assert.isArray(docs.items);
    }
  },
  'feedburner tests': {
    topic: function() {
      parser.parseURL('http://feeds.feedburner.com/TechCrunch', this.callback);
    },
    'response is not null':function(err, docs){
      assert.isNull(err);
      assert.isNotNull(docs);
    },
    'response is formatted as rss':function(err, docs){
      assert.equal(docs.type, 'rss');
      assert.isArray(docs.items);
    }
  },
  'oddities':{
    'empty xml':{
      topic:function(){
        parser.parseString('<?xml version="1.0" ecoding="UTF-8"?>', {}, this.callback);
      },
      'returns an error && docs is null':function(err, docs){
        assert.isNotNull(err);
        assert.isNull(docs);
      }
    }
  },
  'verbose mode': {
    'it adds the original items': {
      topic: function () {
        parser.parseURL(
          'http://www.espnscrum.com/rss/rugby/rss/headlines_fantasy.rss',
          { pipeOriginal: true },
          this.callback
        );
      },
      'returns the complete item': function (err, docs) {
        assert.isNull(err);
        assert.isObject(docs.items[0].original);
      }
    }
  }
}).export(module);
