/*!
 * index.js
 */

"use strict";

var FOCUS_KEYWORD_UPDATE_PERIOD = 1500;

var updateView;


var lastView = null;
var currentView = null;

function updateBrand() {
    if (!self.myself())
        return;

    $('.brand').html(self.myself().name);

    var avatarURL = getAvatarURL(self.myself());
    $('#avatar-img').attr('src', avatarURL);
    $('#toggle-img').attr('src', avatarURL);
}

function updateViewControls() {
    //select the current view in the ViewControls

	//TODO uncheck all that are checked


}


function _updateView(force) {

    var s = window.self;

    updateBrand();

    //s.saveLocal();

    var view = s.get('currentView');

    var o = $('#ViewOptions');
    var v = $('#View');
    var submenu = $('#toggle-submenu');

    if (v.is(':visible')) {
    }
    else
        return;

    if (!force) {
        if ((currentView) && (view === lastView)) {
            if (currentView.onChange) {
                currentView.onChange();
                return;
            }
        }
    }

    v.empty();
    o.empty();
	$('.toggle-submenu').empty();
    submenu.empty();
    submenu.hide();
	updateIndent(false);

    lastView = view;

	if (currentView)
		if (currentView.destroy)
			currentView.destroy();

    v.css('font-size', '100%').removeClass('ui-widget-content view-indented overthrow overflow-hidden nobg');

    function indent() {
        submenu.show();
        v.addClass('overthrow ui-widget-content view-indented');
		updateIndent($('#ViewMenu').is(":visible"));
    }

	$N.router.navigate("view/" + view, {trigger: false});

    if (view === 'browse') {
        indent();
        currentView = renderList(s, o, v);
    }
    else if (view === 'us') {
        indent();
        currentView = renderUs(v);
    }
    else if (view === 'map') {
        v.addClass('overflow-hidden');
        v.addClass('nobg');
        currentView = renderMap(s, o, v);
    }
    else if (view === 'trends') {
        indent();
        currentView = renderTrends(s, o, v);
    }
    else if (view == 'graph') {
        v.addClass('overflow-hidden');
        currentView = renderGraph(s, o, v);
    }
    /*    else if (view == 'slides') {
     currentView = renderSlides(s, o, v);
     }*/
    else if (view == 'self') {
        indent();
        currentView = renderSelf(s, o, v);
    }
    else if (view == 'wiki') {
        indent();
        currentView = renderWiki(s, o, v);
    }
    else if (view == 'plan') {
        indent();
        currentView = renderPlan(v);
    }
    else if (view == 'options') {
        indent();
        currentView = renderOptions(s, o, v);
    }
    else if (view == 'chat') {
        indent();
        currentView = renderChat(v);
    }
    else if (view == 'share') {
        indent();
        currentView = renderShare(v);
    }
    else if (view == 'templates') {
        indent();
        currentView = renderTemplatesView(v);
    }
    else {
        v.html('Unknown view: ' + view);
        currentView = null;
    }


}


function initKeyboard() {
	var views = [];
	$('.ViewControl').each(function(x) { views.push($(this).attr('id')); });

	for (var i = 0; i < views.length; i++) {
		var f = function(I) { 
			jwerty.key('ctrl+' + (1+I), function() {
				later(function() {
					self.set('currentView', views[I]); 
					updateViewControls();
				});
				return false; 
			})
		};
		f(i);
	}
	
	var viewDelta = function(delta) {
		var currentIndex = _.indexOf( views, self.get('currentView') );
		var nextIndex = currentIndex + delta;

		if (nextIndex < 0) nextIndex = views.length - 1;
		if (nextIndex >= views.length) nextIndex = 0;

		later(function() {
			self.set('currentView', views[nextIndex]); 
			updateViewControls();
		});
	};


	jwerty.key('esc', function() {	toggleAvatarMenu(); return false;	});
	jwerty.key('ctrl+[',  function()	{	viewDelta(-1); return false;	});
	jwerty.key('ctrl+]', function() {	viewDelta(+1); return false;	});
}


function setTheme(t) {
    if (!t)
        t = configuration.defaultTheme;
    if (!_.contains(_.keys(themes), t))
        t = configuration.defaultTheme;

    var oldTheme = window.self.get('theme');
    if (oldTheme !== t) {
        self.save('theme', t);
    }

    $('.themecss').remove();

    var themeURL;
    var inverse = false;
    if (t[0] == '_') {
        t = t.substring(1);
        themeURL = 'theme/' + t + '.css';
        if (t === 'Dark')
            inverse = true;
    }
    else {
        themeURL = 'lib/jquery-ui/1.10.4/themes/' + t + '/jquery-ui.min.css';
        if (t === 'ui-darkness')
            inverse = true;
    }

    $('head').append('<link class="themecss" href="' + themeURL + '" type="text/css" rel="stylesheet"/>');
    if (inverse) {
        $('head').append('<link class="themecss" href="/theme/black-background.css" type="text/css" rel="stylesheet"/>');
    }

}



function popupAboutDialog() {
    $.get('/about.html', function(d) {
        var p = newPopup('About');
        p.html(d);
    });
}

var TogetherJS;

$(document).ready(function() {

    var themeSelect = $('#uitheme');
    for (var k in themes) {
        themeSelect.append($('<option id="' + k + '">' + themes[k] + '</option>'));
    }
    themeSelect.change(function() {
        var t = $(this).children(":selected").attr("id");
        setTheme(t);
    });

    if (configuration.enableTogetherJS) {
        loadJS('https://togetherjs.com/togetherjs-min.js');
        $('#TogetherJSTalk').show();
    }
    else {
        TogetherJS = null;
    }

    if (configuration.enableAnonymous)
        $('#AnonymousLoginButton').show();

	if (configuration.focusEnable)
		$('#AvatarFocus').show();

	$('title').html(configuration.siteName);
	$('#loginLogo').attr('src', configuration.loginLogo);
	if (configuration.favicon)
		$('#favicon').attr('href', configuration.favicon);

	var conviews = configuration.views;
	for (var i = 0; i < conviews.length; i++) {
		var c = conviews[i];
		$('#' + c).show();
	}

	$('#openid-open').click(function() {
		$('#openid-login').fadeIn();
	});


    $('.logout').show();

    function newLoginButton() {
        var lb = $('<button>Login</button>');
        lb.click(function() {
            $('#LoadingSplash').show();
        });
        return lb;
    }

    var ii = identity();
    if (ii == ID_UNKNOWN) {
        if (configuration.requireIdentity) {
            $('#LoadingSplash').show();
            return;
        }
        else {
            $('#welcome').html(newLoginButton());
            $('#LoadingSplash').hide();
        }
    }
    else {
        $('#LoadingSplash').hide();
    }

    $('#NotificationArea').html('Loading...');

    netention(function($N) {
		$('#NotificationArea').html('System loaded.');

        window.self = $N; //DEPRECATED
		window.$N = $N;

        setTheme($N.get('theme'));

        $N.clear();

        $N.loadSchemaJSON('/ontology/json', function() {
            $('#NotificationArea').html('Ontology ready. Loading objects...');

            $N.getLatestObjects(configuration.maxStartupObjects, function() {

                $N.listenAll(true);

                //SETUP ROUTER
                var Workspace = Backbone.Router.extend({
                    routes: {
                        "new": "new",
                        "me": "me", // #help
                        "help": "help", // #help
                        "query/:query": "query", // #search/kiwis
                        "object/:id": "object",
                        "object/:id/focus": "focus",
                        "tag/:tag": "tag",
                        //"new/with/tags/:t":     "newWithTags",
                        "example": "completeExample",
						"view/:view": "view"
                                //"search/:query/:page":  "query"   // #search/kiwis/p7
                    },
                    me: function() {
                        commitFocus($N.myself());
                    },
                    completeExample: function() {
                        commitFocus(exampleObject);
                    },
                    showObject: function(id) {
                        var x = $N.getObject(id);
                        if (x) {
                            newPopupObjectView(x);
                        }
                        else {
                            /*$.pnotify({
                             title: 'Unknown object',
                             text: id.substring(0, 4) + '...'
                             });*/
                        }
                    },
					view: function(view) {
						self.set('currentView', view);
					}

                });

                var w = new Workspace();
                Backbone.history.start();
				window.$N.router = w;				

				if (!$N.get('currentView')) {
		            if (configuration.initialView) {
		                $N.save('currentView', configuration.initialView);
		            }
				}

				updateViewControls();

                $('body').timeago();
                updateView = _.throttle(function() {
                    later(function() {
                        _updateView();
                    });
                }, configuration.viewUpdateMS);


                var msgs = ['I think', 'I feel', 'I wonder', 'I know', 'I want'];
                //var msgs = ['Revolutionary', 'Extraordinary', 'Bodacious', 'Scrumptious', 'Delicious'];
                function updatePrompt() {
                    var l = msgs[parseInt(Math.random() * msgs.length)];
                    $('.nameInput').attr('placeholder', l + '...');
                }
                setInterval(updatePrompt, 7000);
                updatePrompt();

                $.getScript(configuration.ui, function(data) {

		            var ii = identity();

		            if (ii === ID_AUTHENTICATED) {
		                $('#NotificationArea').html('Authorized.');
		            }
		            else if (ii === ID_ANONYMOUS) {
		                $('#NotificationArea').html('Anonymous.');
		            }
		            else {
		                $('#NotificationArea').html('Read-only public access.');
		                /*$('.loginlink').click(function() {
		                    $('#LoadingSplash').show();
		                    nn.hide();
		                });*/
		            }

                    $('#View').show();
                    $('#LoadingSplash2').hide();
					

					var alreadyLoggedIn = false;
					if (configuration.autoLoginDefaultProfile) {
						var otherSelves = _.filter($N.get("otherSelves"), function(f) { return $N.getObject(f)!=null; } );
						if (otherSelves.length >= 1) {
							$N.become(otherSelves[0]);
							alreadyLoggedIn = true;
						}
					}


					if (!alreadyLoggedIn) {
		                if (isAnonymous()) {
		                    //show profile chooser
		                    openSelectProfileModal("Anonymous Profiles");
		                }
		                else if ($N.myself() === undefined) {
		                    if (configuration.requireIdentity)
		                        openSelectProfileModal("Start a New Profile");
							else {
	                            //$N.trigger('change:attention');
								updateView();
							}
		                }
					}

					$('#NotificationArea').html('Ready...');
					$('#NotificationArea').fadeOut();

					initKeyboard();

		            $N.on('change:attention', updateView);
		            //$N.on('change:layer', updateView);
		            $N.on('change:currentView', updateView);
		            $N.on('change:tags', updateView);
		            $N.on('change:focus', updateView);
				
					/*
					//USEFUL FOR DEBUGGING EVENTS:
		            $N.on('change:attention', function() { console.log('change:attention'); });
		            $N.on('change:currentView', function() { console.log('change:currentView'); });
		            $N.on('change:tags', function() { console.log('change:tags'); });
		            $N.on('change:focus', function() { console.log('change:focus'); });
					*/

                });


            });
        });


    });



    $('#logout').hover(
            function() {
                $(this).addClass('ui-state-hover');
                $(this).addClass('shadow');
            },
            function() {
                $(this).removeClass('ui-state-hover');
                $(this).removeClass('shadow');
            }
    );


    $('#close-menu').button();
    $(".ViewControl").click(function() {
		var v = $(this);
		self.set('currentView', v.attr('id'));
	});

    $('#about-toggle').click(function() {
        $('#about-netention').fadeIn();
    });

	


});
