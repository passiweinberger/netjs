function newUserView(v, userid) {
	var d = newDiv().appendTo(v);

	if (userid) {
		var user = $N.getObject(userid);
		if (!user) {
			d.append('User ' + userid + ' not found.');
			return;
		}
		user = objectify(user);

		var operatorTags = getOperatorTags();

		function getKnowledgeCodeTags(userid) {
		
			var tags = $N.getIncidentTags(userid, operatorTags);
				    
			for (var k in tags) {
				var l = tags[k];
				tags[k] = _.map(tags[k], function(o) {
					var O = $N.getObject(o);
					var strength = objTagStrength(O, false);
					var firstNonOperatorTag = null;
					var allTags = objTags(O, false);
					for (var m = 0; m < allTags.length; m++) {
						var s = allTags[m];
						if (operatorTags.indexOf(s)==-1) {
							firstNonOperatorTag = s;
							break;
						}
					}
					return [O.name, strength[k], o, firstNonOperatorTag];
				});
				tags[k] = tags[k].sort(function(a, b) {
					return b[1] - a[1];
				});

				/*for (var i = 0; i < l.length; i++) {
				    l[i] = l[i].substring(l[i].indexOf('-')+1, l[i].length);
				}*/
			}
		
			var user = $N.object(userid);
			tags['@'] = objSpacePointLatLng(user);
			tags['name'] = user.name;

			return tags;
		}

		var tags = getKnowledgeCodeTags(userid);
		var x = '';


		x += '<h1>' + user.name + '</h1>';

		delete tags['name'];

		var location = tags['@'];
		if (location) {
			x += '<div class="Location">' + _n(location[0],3) + ',' + _n(location[1],3) + '</div>';
			delete tags['@'];
		}


		var desc = objDescription(user);
		if (desc) {
			x += '<h3>' + desc + '</h3>';
		}

		x += '<hr/>';

	
		for (var j = 0; j < operatorTags.length; j++) {
		   	var i = operatorTags[j];
			if (!tags[i]) continue;

		    var il = i;
		    var stt = $N.getTag(i);
		    if (stt)
		        il = stt.name;

		    var color = 'black'; 
		        
		    //x += '<b style="color: ' + color + '">' + il + '</b>: ';
			x += '<div class="tagSection ' + i + '_section">';

			var icon = getTagIcon(i);
			var iconString = '';
			if (icon)
				iconString = '<img src="' + icon + '" style="height: 1em"/>';

			x += '<h2 class="' + i + '_heading">' + iconString + il + '</h2><ul>';

			if (tags[i])
				for (var y = 0; y < tags[i].length; y++) {
				    var tt = tags[i][y][0];
					var name = tags[i][y][0];
					var strength = tags[i][y][1];
					var tagID = tags[i][y][3];
					var fs = parseInt((strength * 100) + 50);
				    x += '<li><a href="' + getENWikiURL(tagID) + '" style="font-size: ' + fs + '%">' + name + '</a></li>';
				}

			x += '</ul></div>';
		}

		d.append(x);
	
		var textCode = getUserTextCode(tags, user);
		if (textCode.length > 0) {
			d.append('<h2>Tag Summary (Text)</h2><pre>' + textCode + '</pre><br/>');			
		}

		var jsonCode = getUserJSONCode(userid);

		function simplifyJSON(j) {
			//http://stackoverflow.com/questions/11233498/json-stringify-without-quotes-on-properties
			return j.replace(/\"([^(\")"]+)\":/g,"$1:");  //This will remove all the quotes to make more compact
		}

		d.append('<h2>Tag Code (JSON)</h2><pre class="UserTagCode">' + simplifyJSON(JSON.stringify(jsonCode, null, 4)) + '</pre><br/>');			

		var jsonCodeCompact = simplifyJSON(JSON.stringify(jsonCode));
		d.append('<h2>Tag Code (JSON Compact)</h2>' + jsonCodeCompact + '<br/>');

		/*var jsonCodeJSONH = JSONH.stringify(jsonCode);
		d.append('<h2>Tag Code (JSONH)</h2>' + jsonCodeJSONH + '<br/>');*/

		/*var url = document.location.origin + '/code/' + encodeURIComponent(jsonCodeCompact);
		d.append('<br/><a href="' + url + '">URL</a>')*/

		/*
		var jid = uuid();
		d.append('<h2>QR Code</h2>');
		d.append(newDiv(jid));
		new QRCode(document.getElementById(jid), { text: jsonCodeCompact,
			width : 512, 
			height : 512,
			typeNumber : 40,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : 1
		});
		*/

		if (configuration.connection === 'websocket') {
			var jsonProfileLink = $('<a href="/object/author/' + userid + '/json">Download Profile (JSON)</a>' );
			d.append('<hr/>', jsonProfileLink, '<br/>');
		}
		
		/*{
			var email = "email address"
			var subject = "subject"
			var body = encodeURIComponent(jsonCodeCompact);

			d.append('<form name="form" action=\"mailto:' + email + '\?subject='+ subject +'\&body='+ body + '\" method=\"post\" enctype=\"text/plain\"><input type="submit"/></form>');
		}*/

	}

	else {
		d.append('index of users');
	}
	
	return d;
}

function isKnowledgeTag(t) {
	return ['Do','DoTeach','DoLearn','LearnDo','TeachDo', 'Teach', 'Learn'].indexOf(t)!=-1;
}

function getUserJSONCode(user) { 
	var objects = _.filter($N.objects(), function(v, k) {
		if (!objIsPublic(v)) return false;

		return (v.author == user);
	});	
	objects = _.map(objects, function(o) {
		var n = objCompact(o);
		delete n.author;
		return n;
	});
	return objects;
}

function getUserJSONCodeOLD(tags, user) {
	var jc = { };

	jc['name'] = user.name;
	var location = user.earthPoint();
	if (location)
		jc['where'] = dloc(location);

	var operatorTags = getOperatorTags();
	var operatorObjects = [];
	for (var j = 0; j < operatorTags.length; j++) {
	   	var i = operatorTags[j];
		if (!tags[i]) continue;
		for (var y = 0; y < tags[i].length; y++) {
			var oid = tags[i][y][2];
			operatorObjects.push(oid);
		}
	}

	jc['objects'] = [];

	operatorObjects = _.unique(operatorObjects);
	_.each(operatorObjects, function(o) {
		var O = $N.getObject(o);
		var Oc = objCompact(O);
		jc['objects'].push(Oc);	
	});

	/*var operatorTags = getOperatorTags();
	var processed = {};
	for (var j = 0; j < operatorTags.length; j++) {
	   	var i = operatorTags[j];
		if (isKnowledgeTag(i)) {
			if (!jc['Know']) jc['Know'] = { };

			if (!tags[i]) continue;			
			for (var y = 0; y < tags[i].length; y++) {
				var oid = tags[i][y][2];
				var O = $N.getObject(oid);

				if (processed[oid]) continue;
				processed[oid] = true;
				jc['Know'][tags[i][y][3]] = knowTagsToRange(O);

			}
		}
		else {

			if (!tags[i]) continue;							

			jc[i] = [];
			for (var y = 0; y < tags[i].length; y++) {
				var oid = tags[i][y][2];
				var O = $N.getObject(oid);
				jc[i].push(tags[i][y][3]);
			}
		}
	}*/


	return jc;
}
function dloc(l) {
	return [parseFloat(l[0].toFixed(3)), parseFloat(l[1].toFixed(3))];
}

function objIsPublic(o) {
	return (o.scope || configuration.defaultScope) >= ObjScope.Global;
}

function getUserTextCode(tags, user) {
	var s = '';
	var nameline = user.name;
	var location = user.earthPoint();
	if (location)
		nameline += ' @' + JSON.stringify(dloc(location));

	var operatorTags = getOperatorTags();
	var processed = {};

	function getTitleString(tl) {
		var name = tl[0];
		var tagID = tl[3];
		if (name!=tagID)
			return name + ' [' + tagID + ']';
		return name;
	}
	function getValueString(O, exceptTags) {
		var s = '';
		_.each(O.value, function(v) {
			if (exceptTags.indexOf(v.id)==-1) {
				if (v.value)
					s+= '     ' + (v.id == 'textarea' ? '' : (v.id + ': ')) + JSON.stringify(v.value) + '\n';
				else
					s+= '     ' + v.id;
			}
		});
		if (s.length > 0) s= '\n' + s;
		return s;
	}

	//Knowledge Tags
	var header = 'Know                                    L=========D=========T\n';
	var chartColumn = header.indexOf('L');
	for (var j = operatorTags.length-1; j >=0; j--) {
	   	var i = operatorTags[j];
		if (isKnowledgeTag(i)) {
			if (!tags[i]) continue;			
			for (var y = 0; y < tags[i].length; y++) {
				var oid = tags[i][y][2];
				var O = $N.getObject(oid);

				if (!objIsPublic(O)) continue;

				if (processed[oid]) continue;
				processed[oid] = true;

				var line = getTitleString(tags[i][y]);
				var spacePadding = chartColumn - line.length-2;
				for (var n = 0; n < spacePadding; n++)
					line += ' ';
				var knowLevel = knowTagsToRange(O);
				var chartIndex = Math.round(knowLevel * 10);
				for (var n = -10; n <= 10; n++) {
					if (n == chartIndex) line += '|'
					else line += '-';
				}
				
				s += '  ' + (line + getValueString(O, ['Do','Learn', 'Teach', tags[i][y][3]] ) + '\n').trim() + '\n';
				
			}
		}
	}
	if (s.length > 0) s = header + s;
	s = nameline + '\n'  + s;

	for (var j = 0; j < operatorTags.length; j++) {
	   	var i = operatorTags[j];
		if (!isKnowledgeTag(i)) {
			if (!tags[i]) continue;			
			s += i + '\n';
			for (var y = 0; y < tags[i].length; y++) {
				var oid = tags[i][y][2];
				var O = $N.getObject(oid);

				if (!objIsPublic(O)) continue;

				s += '  ' + getTitleString(tags[i][y]) + getValueString(O, [i,tags[i][y][3]]) + '\n';				
			}
		}
	}

	return s;
}

function knowTagsToRange(x) {
	var s = objTagStrength(x, false);

	//if (s['DoLearn'])...

	var DO = s['Do'] || 0;
	var LEARN = s['Learn'] || 0;
	var TEACH = s['Teach'] || 0;

	//console.log(LEARN, DO, TEACH);

	if (LEARN && TEACH) {
		console.log(x + ' has conflicting Learn and Teach strengths');
		TEACH = null;
		LEARN = null;
	}
	if (LEARN) {
		var total = LEARN + DO;						
		LEARN/=total;
		DO/=total;
		
		return -1 * LEARN;
	}
	else if (TEACH) {
		var total = TEACH + DO;						
		TEACH/=total;
		DO/=total;
		
		return 1 * TEACH;
	}
	else {
		return 0;
	}					
}

