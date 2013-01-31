var intervalVar;
var lastTime = (new Date()).getTime();

$(document).ready(function(){
	if(access == "")
	{
		// attach events for ajax editing
		$('span.edit-memo,a.edit-memo').click(Events.edit_memo_link);
		$('.title h2').click(Events.edit_title_link);
		
		$('.edit-title').submit(Events.edit_title_form);

		$('.seg-play').click(Events.play_seg);
		$('.seg-pause').click(Events.pause_seg);
		$('.seg-delete').click(Events.delete_seg);
		
		$('.folded-info-link').click(Events.folded_info_link);
		
		// move info panel into sight
		setTimeout(function(){ $('.info').animate({top: '-6px'}, 1000, 'easeInOutElastic');	},3000);
	}
		
	// start timing
	Events.timing_interval(false);
	intervalVar = setInterval(function(){ Events.timing_interval(true); }, 1000);
});

var DateHelper = {
	seconds_to_human: function(secs){
		var hours = Math.floor(secs / 3600);
		var minutes = DateHelper.leading_zero(Math.floor((secs / 60) % 60));
		var seconds = DateHelper.leading_zero(secs % 60);

		return '<span class="hours">'+hours+'</span><span class="sep">:</span><span class="minutes">'+minutes+'</span><span class="seconds">'+seconds+'</span>';
	},
	leading_zero: function(num){
		if(num < 10) num = '0'+num;
		return num;
	}
};

var Events = {
	timing_interval: function(incr){
		$('.timing').each(function(){
			var count = parseInt($(this).attr('data-count'));
			if(incr) count++;
			$(this).attr('data-count',count);

			$(this).html(DateHelper.seconds_to_human(count));
		});
		
		// check to see if the page just woke up
		var currentTime = (new Date()).getTime();
		if (currentTime > (lastTime + 1000*3)) {  // ignore small delays
			// Probably just woke up!
				// reload state of application
		}
		lastTime = currentTime;
	},
	edit_memo_link: function(){
		var current_text = "";
		var editlink = $(this);
		var group_id = editlink.parents('li').attr('data-group');

		if(editlink.prop('tagName') == "SPAN")
			current_text = editlink.text();

		$(this).fadeOut(250,function(){
			var editform = $('<form class="edit-memo" action="'+base_url+'seg/memo" method="post"><input type="hidden" name="key" value="'+key+'"><input type="hidden" name="group_id" value="'+group_id+'"><input type="text" name="memo" maxlength="140" value="'+current_text+'"><button type="submit"><i class="icon-ok-sign"></i></button></form>');
			$(this).replaceWith(editform);
			editform.submit(Events.edit_memo_form);
			$(this).fadeIn(250);
			editform.find('input[type=text]').focus();
		});

		return false;
	},
	edit_memo_form: function(){
		var editform = $(this);
		var seg = editform.parents('li');
		var memo = editform.find('input[name=memo]').val();

		$.post(editform.attr('action'), {
			key: editform.find('input[name=key]').val(),
			group_id: editform.find('input[name=group_id]').val(),
			memo: memo
		})
		.done(function(data) {
			var result = JSON.parse(data);
			
			if(result.query)
			{
				editform.fadeOut(250,function(){
					var editlink = $('<span class="edit-memo" title="Click to edit memo." style="display:none;">'+memo+'</span>');
					if(memo == "") editlink = $('<a href="memo" class="edit-memo" title="Click to edit memo." style="display:none;"><i class="icon-paper-clip"></i></a>');

					editform.replaceWith(editlink);
				
					editlink.fadeIn(250);
					editlink.click(Events.edit_memo_link);
				});
			}
			else
				editform.find('button').html('<i class="icon-exclamation-sign"></i>');
		});

		return false;
	},
	edit_title_link: function(){
		

		return false;
	},
	edit_title_form: function(){
		var editform = $(this);
		var formbutton = editform.find('button');
		var message = editform.find('.message');
		
		var h2 = $('h2.title');
		
		var newtitle = editform.find('input[name=title]').val();
		
		formbutton.html('<i class="icon-spinner icon-spin"></i>');
		
		$.post(editform.attr('action'), {
			key: editform.find('input[name=key]').val(),
			title: newtitle
		})
		.done(function(data) {
			var result = JSON.parse(data);
			
			ajaxdebug(data);
			
			if(typeof result !== "undefined" && result.query)
			{
				formbutton.html('<i class="icon-ok-sign"></i>');
				message.html('Saved.').slideDown();
				h2.fadeOut(400,function(){
					h2.html(newtitle);
					h2.fadeIn();
				})
			}
			else
			{
				formbutton.html('<i class="icon-exclamation-sign"></i>');
				message.html('Error saving title. Please try again in a few moments.').slideDown();
			}
			
			// remove message span after 10 seconds
			setTimeout(function(){
				formbutton.html('<i class="icon-ok-sign"></i>');
				message.slideUp(400);
			},10000);
		})
		.fail(function(data){
			//ajaxdebug(data);
			console.log(data);
			
			formbutton.html('<i class="icon-exclamation-sign"></i>');
			message.html('Connection error. Please try again in a few moments.').slideDown();
			
			// remove message span after 10 seconds
			setTimeout(function(){
				formbutton.html('<i class="icon-ok-sign"></i>');
				message.slideUp(400);
			},10000);
		});
		
		return false;
	},
	delete_seg: function(){
		var deletelink = $(this);
		var seg = deletelink.parents('li');
		var time_logged = seg.find('.hours').text() + ':' + seg.find('.minutes').text() + ':' + seg.find('.seconds').text();		
		var memo = seg.find('.memo').text().trim();
		
		if(memo != "")
			memo = ' - "'+memo+'"';
		
		if(confirm('\nDELETE this time? Are you sure?\n\n'+time_logged+memo))
		{
			// hide actions
			deletelink.fadeOut();
			seg.addClass('deleting').find('.seg-play,a.edit-memo').fadeOut();
			
			// show spinner
			var spinner = $('<span class="spinner right hidden"><i class="icon-spinner icon-spin"></i></span>');
			seg.append(spinner);
			spinner.fadeIn();
			
			$.get(deletelink.attr('href'))
			.done(function(data) {
				var result = JSON.parse(data);
				
				if(result.query)
				{
					var segheading = seg.prev('.heading');
					if(segheading.length > 0 && (seg.is(':last-child') || seg.next('.heading').length > 0))
						segheading.slideUp(400,function(){ segheading.remove(); });
					seg.slideUp(400,function(){ seg.remove(); });
					

				}
				else // failed delete
				{
					// show actions
					deletelink.fadeIn();
					seg.removeClass('deleting').find('.seg-play,a.edit-memo').fadeIn();;
					
					// hide spinner
					spinner.fadeOut(400,function(){ spinner.remove(); });
				}
			});
		}
		
		return false;
	},
	play_seg: function(){
		var playlink = $(this);
		var seg = playlink.parents('li');
		
		$.get(playlink.attr('href'))
		.done(function(data) {
			var result = JSON.parse(data);
			
			ajaxdebug(data);
			
			// timer
			seg.find('.time_logged')
				.addClass('timing')
				.attr('data-count',result.time_logged)
				.html(DateHelper.seconds_to_human(result.time_logged));
				
			// stop button
			if(seg.is(':first-child')) seg.find('.seg-stop')
				.fadeOut(400,function(){
					seg.find('.seg-stop').css('visibility','hidden').show();
				});
			
			// play/pause
			var pauselink = $(playlink.outerHTML().replace(/play/g,'pause')).hide();
			playlink.replaceWith(pauselink);
			pauselink.fadeIn();
			pauselink.click(Events.pause_seg);
		});
		
		return false;
	},
	pause_seg: function(){
		var pauselink = $(this);
		var seg = pauselink.parents('li');
		
		$.get(pauselink.attr('href'))
		.done(function(data) {
			var result = JSON.parse(data);
			
			ajaxdebug(data);
			
			// timer
			seg.find('.time_logged')
				.removeClass('timing')
				.attr('data-count',result.time_logged)
				.html(DateHelper.seconds_to_human(result.time_logged));
			
			// stop button
			if(seg.is(':first-child')) seg.find('.seg-stop')
				.hide()
				.css('visibility','visible')
				.fadeIn();
			
			// play/pause
			var playlink = $(pauselink.outerHTML().replace(/pause/g,'play')).hide();
			pauselink.replaceWith(playlink);
			playlink.fadeIn();
			playlink.click(Events.play_seg);
		});
		
		return false;
	},
	stop_seg: function(){
		
	},
	folded_info_link: function(){
		var folded_info = $($(this).attr('href'));
		
		if(folded_info.length > 0)
		{
			if(folded_info.is(':hidden'))
				folded_info.show(250);
			else
				folded_info.hide(250);
		}
		
		return false;
	}
}

jQuery.extend( jQuery.easing,
{
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	}
});

jQuery.fn.outerHTML = function(s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};

function ajaxdebug(data)
{
	var result = JSON.parse(data);
	
	if(typeof result === "undefined")
		alert(data);
	else
		console.log(result);
}

// error handling for JSON.parse
(function(){
    var parse = JSON.parse;
    JSON = {
        stringify: JSON.stringify,
        validate: function(str){
            try{
                parse(str);
                return true;
            }catch(err){
                return err;
            }
        },
        parse: function(str){
            try{
                return parse(str);
            }catch(err){
                return undefined;
            }
        }
    }
})();