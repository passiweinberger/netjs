var feedparser = require('feedparser');     //https://github.com/danmactough/node-feedparser
var request = require('request');
var _ = require('underscore');

var minUrlFetchPeriod = 60*10;
var rssCyclePeriod = 15 * 1000;

exports.plugin = function($N) { return {
        name: 'RSS Feeds (Really Simple Syndication)',	
		description: 'Periodically monitors RSS Feeds for new content',
		options: { },
        version: '1.0',
        author: 'http://netention.org',
        
		start: function() { 
            
           $N.addTags([
                {
                    uri: 'RSSFeed', name: 'RSS Feed', 
                    properties: {
                        'url': { name: 'URL', type: 'text' /* url */, min: 1, default: 'http://' },
                        'urlFetchPeriod': { name: 'Fetch Period (seconds)', type: 'real' /* number */, default: "3600", min: 1, max: 1 },
                        'addArticleTag': { name: 'Add Tag to Articles', type: 'text' },
                        'lastRSSUpdate': { name: 'Last RSS Update',  type: 'timepoint' }
                    }
                },
                {
                    uri: 'RSSItem', name: 'RSS Item',
                    properties: {
                        'rssItemURL': { name: 'RSS Item URL', type: 'url' }
                    }
                }
            ], [ 'Internet' ]);
            
            
            this.feeds = { };

            var that = this;
            
            this.update = _.throttle(function(f) {
                
                that.feeds = { };                
                
                $N.getObjectsByTag('RSSFeed', function(x) {
                    that.feeds[x.id] = x;
                    
                    if (f)
                        f();
                });                    
                
            }, 5000 /* Increase longer */);
            
            this.update();
            
            var ux = function() {
                
                that.update(function() {
                    
                    for (var k in that.feeds) {
                        var f = that.feeds[k];
                        
                        
                        if (!f)
                            continue; //???
                            
                        var needsFetch = false;
                                            
                        if (!$N.objFirstValue(f, 'lastRSSUpdate')) {
                            needsFetch = true;
                        }
                        else {
                            var age = (Date.now() - $N.objFirstValue(f, 'lastRSSUpdate'))/1000.0;
                            
                            var fp = $N.objFirstValue(f, 'urlFetchPeriod');
                            fp = Math.max(fp, minUrlFetchPeriod);
                            
                            if (fp < age) {
                                needsFetch = true;
                            }                        
                            else {
                                //console.log(fp - age, 'seconds to go');
                            }
                        }
                        
                        if (needsFetch) {
                        
                            var furi = $N.objValues(f, 'url');
                            
                            if (furi) {
                                for (var ff = 0; ff < furi.length; ff++) {
                                    RSSFeed($N, furi[ff], function(a) {            
                                        //TODO add extra tags from 'f'
                                        $N.pub(a);
                                        return a;
                                    });
                                }
                            }
                            else {
                                //set error message as f property
                            }
                            
                            $N.objSetFirstValue(f, 'lastRSSUpdate', Date.now());                        
                            $N.pub(f);
                        }
                    }
                    
                });
                
            };
            
            this.loop = setInterval(ux, rssCyclePeriod);
            ux();
        },
                
        onPub: function(x) {
            if (x.HasTag('web.RSSFeed'))
                this.update();
        },
        
		stop: function() {
            if (this.loop) {
                clearInterval(this.loop);
                this.loop = null;
            }   
		}
}; }; 

var RSSFeed = function($N, url, perArticle) {

	if (!process)
		process = function(x) { return x; };
	

	function onArticle(a) {
		var maxlen = a['title'].length;
		if (a['description']!=undefined)
			maxlen = Math.max(maxlen, a['description'].length);
		
        var w;
        if (a['date'])
            w = new Date(a['date']).getTime();
        else
            w = Date.now();
            
        var x = $N.objNew( $N.MD5(a['guid']), a['title'] );
        x.createdAt = w;
        
        $N.objAddDescription(x, a['description']);        
        
		if (a['georss:point']) {
			var pp = a['georss:point'];
			if (pp.length == 2)
	            $N.objAddGeoLocation(x, pp[0], pp[1] );
			else {
				pp = pp['#'].split(' ');
	            $N.objAddGeoLocation(x, pp[0], pp[1] );
			}
		}
		if (a['geo:lat']) {
            $N.objAddGeoLocation(x, parseFloat(a['geo:lat']['#']), parseFloat(a['geo:long']['#']) );
		}
        $N.objAddTag(x, 'RSSItem');
        $N.objAddValue(x, 'rssItemURL', a['link']);


		perArticle(x, a);
		
	}	


		
	var fp = new feedparser();

	request(url).pipe(fp)
	  .on('error', function(error) {
		// always handle errors
		console.log('RSS request error: ' + url + ' :' + error);
	}).on('meta', function(data) {
		// always handle errors
		//onArticle(data);
		//console.log(data, 'META');
	}).on('readable', function() {
		var stream = this, item;
		while (item = stream.read()) {
			//console.log('Got article: %s', item.title || item.description);
			onArticle(item);
		}
    }).resume();
/*
	}).on('end', function() {
		console.log('got feed', fp.articles);

		var articles = fp.articles;
		for (var i = 0; i < articles.length; i++) {
			onArticle(articles[i]);
		}
	}).resume();
*/

	
}

exports.RSSFeed = RSSFeed;

