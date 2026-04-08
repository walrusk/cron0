(function($) {
	'use strict';

	var STORAGE_KEY = 'cron0-static-store-v1';
	var KEY_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	var TIMER_INTERVAL = 1000;
	var INFO_ANIMATION_DELAY = 3000;

	var App = {
		state: null,
		currentRoute: null,
		infoExpanded: {},
		infoAnimated: {},
		infoAnimationTimer: null,

		init: function() {
			App.state = Store.load();
			App.bindEvents();
			App.routeAndRender();

			window.setInterval(App.refreshTimers, TIMER_INTERVAL);
			$(window).on('hashchange', App.routeAndRender);
			$(window).on('storage', App.handleStorageUpdate);
		},

		bindEvents: function() {
			$(document).on('click', '.home-play-link', Events.startTimedProject);
			$(document).on('click', '.new-project-link', Events.startUntimedProject);
			$(document).on('click', '.seg-play', Events.playSegment);
			$(document).on('click', '.seg-pause', Events.pauseSegment);
			$(document).on('click', '.seg-stop', Events.stopFocus);
			$(document).on('click', '.seg-delete', Events.deleteSegment);
			$(document).on('click', 'span.edit-memo, a.edit-memo', Events.editMemoLink);
			$(document).on('submit', 'form.edit-memo', Events.editMemoForm);
			$(document).on('submit', '.edit-title', Events.editTitleForm);
			$(document).on('click', '.folded-info-link', Events.foldedInfoLink);
		},

		handleStorageUpdate: function(event) {
			if (event.originalEvent && event.originalEvent.key !== STORAGE_KEY)
			{
				return;
			}

			App.state = Store.load();
			App.routeAndRender();
		},

		routeAndRender: function() {
			var route = Router.parse(window.location.hash);
			App.currentRoute = route;

			if (route.type === 'action')
			{
				App.handleActionRoute(route);
				return;
			}

			if (App.infoAnimationTimer)
			{
				window.clearTimeout(App.infoAnimationTimer);
				App.infoAnimationTimer = null;
			}

			if (route.type === 'project')
			{
				var project = Store.findProject(App.state, route.key, route.access);
				if (!project)
				{
					App.renderNotFound();
					return;
				}

				App.renderProject(project, route.access);
				return;
			}

			if (route.type === 'notfound')
			{
				App.renderNotFound();
				return;
			}

			App.renderHome();
		},

		handleActionRoute: function(route) {
			var redirectHash = '#/';

			if (route.action === 'create')
			{
				var createdProject = Store.createProject(App.state, {
					title: route.title,
					autoStart: route.mode === 't'
				});

				Store.save(App.state);
				redirectHash = Router.projectHash(createdProject.editableKey, '');
				App.redirectTo(redirectHash);
				return;
			}

			if (route.action === 'play')
			{
				if (Store.play(App.state, route.key, route.groupId))
				{
					Store.save(App.state);
					redirectHash = Router.projectHash(route.key, '');
					App.redirectTo(redirectHash);
					return;
				}
			}

			if (route.action === 'pause')
			{
				if (Store.pause(App.state, route.key, route.groupId))
				{
					Store.save(App.state);
					redirectHash = Router.projectHash(route.key, '');
					App.redirectTo(redirectHash);
					return;
				}
			}

			if (route.action === 'stop')
			{
				if (Store.stop(App.state, route.key))
				{
					Store.save(App.state);
					redirectHash = Router.projectHash(route.key, '');
					App.redirectTo(redirectHash);
					return;
				}
			}

			if (route.action === 'delete')
			{
				if (Store.deleteGroup(App.state, route.key, route.groupId))
				{
					Store.save(App.state);
					redirectHash = Router.projectHash(route.key, '');
					App.redirectTo(redirectHash);
					return;
				}
			}

			App.renderNotFound();
		},

		redirectTo: function(hash) {
			if (window.location.hash === hash)
			{
				App.routeAndRender();
				return;
			}

			window.location.replace(hash);
		},

		renderHome: function() {
			$('#app').html(Html.home());
		},

		renderNotFound: function() {
			$('#app').html(Html.notFound());
		},

		renderProject: function(project, access) {
			var routeId = App.routeId(project, access);
			var infoExpanded = access === '' && App.infoExpanded[routeId] === true;
			var aggregated = Store.aggregateSegments(project);

			$('#app').html(Html.project(project, aggregated, access, infoExpanded));

			App.scheduleInfoAnimation(routeId, access);
			App.refreshTimers();
		},

		refreshTimers: function() {
			if (!App.currentRoute || App.currentRoute.type !== 'project')
			{
				return;
			}

			var project = Store.findProject(App.state, App.currentRoute.key, App.currentRoute.access);
			if (!project)
			{
				return;
			}

			var aggregated = Store.aggregateSegments(project);
			var groupsById = {};
			var total = 0;

			aggregated.forEach(function(group) {
				groupsById[String(group.segGroup)] = group;
				total += group.time_logged;
			});

			$('.segments li[data-group]').each(function() {
				var item = $(this);
				var group = groupsById[item.attr('data-group')];

				if (!group)
				{
					return;
				}

				var timer = item.find('.time_logged');
				timer.attr('data-count', group.time_logged);
				timer.toggleClass('timing', group.completed === null);
				timer.html(DateHelper.secondsToHuman(group.time_logged));
			});

			var totalItem = $('li.total');
			if (totalItem.length)
			{
				totalItem.attr('data-count', total);
				totalItem.find('span').html(DateHelper.secondsToHuman(total));
			}
		},

		scheduleInfoAnimation: function(routeId, access) {
			if (access !== '' || App.infoAnimated[routeId])
			{
				return;
			}

			App.infoAnimationTimer = window.setTimeout(function() {
				var info = $('.info');
				if (info.length)
				{
					info.animate({ top: '-6px' }, 1000, 'easeInOutElastic');
				}
			}, INFO_ANIMATION_DELAY);

			App.infoAnimated[routeId] = true;
		},

		setInfoExpanded: function(expanded) {
			if (!App.currentRoute || App.currentRoute.type !== 'project')
			{
				return;
			}

			var project = Store.findProject(App.state, App.currentRoute.key, App.currentRoute.access);
			if (!project)
			{
				return;
			}

			App.infoExpanded[App.routeId(project, App.currentRoute.access)] = expanded;
		},

		routeId: function(project, access) {
			return project.id + ':' + access;
		}
	};

	var Events = {
		startTimedProject: function(event) {
			event.preventDefault();

			var project = Store.createProject(App.state, {
				title: '',
				autoStart: true
			});

			Store.save(App.state);
			App.redirectTo(Router.projectHash(project.editableKey, ''));
		},

		startUntimedProject: function(event) {
			event.preventDefault();

			var project = Store.createProject(App.state, {
				title: '',
				autoStart: false
			});

			Store.save(App.state);
			App.redirectTo(Router.projectHash(project.editableKey, ''));
		},

		playSegment: function(event) {
			event.preventDefault();

			var link = $(this);
			var key = link.attr('data-key');
			var groupId = link.attr('data-group') || null;

			Store.play(App.state, key, groupId);
			Store.save(App.state);
			App.redirectTo(Router.projectHash(key, ''));
		},

		pauseSegment: function(event) {
			event.preventDefault();

			var link = $(this);
			var key = link.attr('data-key');
			var groupId = link.attr('data-group') || null;

			Store.pause(App.state, key, groupId);
			Store.save(App.state);
			App.redirectTo(Router.projectHash(key, ''));
		},

		stopFocus: function(event) {
			event.preventDefault();

			var link = $(this);
			var key = link.attr('data-key');

			Store.stop(App.state, key);
			Store.save(App.state);
			App.redirectTo(Router.projectHash(key, ''));
		},

		deleteSegment: function(event) {
			event.preventDefault();

			var link = $(this);
			var segment = link.parents('li');
			var timeLogged = segment.find('.hours').text() + ':' + segment.find('.minutes').text() + ':' + segment.find('.seconds').text();
			var memo = segment.find('.memo').text().trim();

			if (memo !== '')
			{
				memo = ' - "' + memo + '"';
			}

			if (!window.confirm('\nDELETE this time? Are you sure?\n\n' + timeLogged + memo))
			{
				return;
			}

			Store.deleteGroup(App.state, link.attr('data-key'), link.attr('data-group'));
			Store.save(App.state);
			App.redirectTo(Router.projectHash(link.attr('data-key'), ''));
		},

		editMemoLink: function(event) {
			if (!App.currentRoute || App.currentRoute.type !== 'project' || App.currentRoute.access !== '')
			{
				return false;
			}

			event.preventDefault();

			var editLink = $(this);
			var currentText = '';
			var groupId = editLink.parents('li').attr('data-group');

			if (editLink.prop('tagName') === 'SPAN')
			{
				currentText = editLink.text();
			}

			editLink.fadeOut(250, function() {
				var editForm = $(
					'<form class="edit-memo" action="#/seg/memo" method="post">' +
						'<input type="hidden" name="key" value="' + Html.escapeAttribute(App.currentRoute.key) + '">' +
						'<input type="hidden" name="group_id" value="' + Html.escapeAttribute(groupId) + '">' +
						'<input type="text" name="memo" maxlength="140" value="' + Html.escapeAttribute(currentText) + '">' +
						'<button type="submit"><i class="icon-ok-sign"></i></button>' +
					'</form>'
				);

				editLink.replaceWith(editForm);
				editForm.find('input[type=text]').focus();
			});

			return false;
		},

		editMemoForm: function(event) {
			event.preventDefault();

			var form = $(this);
			var key = form.find('input[name=key]').val();
			var groupId = form.find('input[name=group_id]').val();
			var memo = form.find('input[name=memo]').val();

			Store.updateMemo(App.state, key, groupId, memo);
			Store.save(App.state);
			App.routeAndRender();
		},

		editTitleForm: function(event) {
			event.preventDefault();

			var form = $(this);
			var key = form.find('input[name=key]').val();
			var title = form.find('input[name=title]').val();

			Store.updateTitle(App.state, key, title);
			Store.save(App.state);
			App.routeAndRender();
		},

		foldedInfoLink: function(event) {
			event.preventDefault();

			var foldedInfo = $($(this).attr('href'));
			if (!foldedInfo.length)
			{
				return false;
			}

			if (foldedInfo.is(':hidden'))
			{
				App.setInfoExpanded(true);
				foldedInfo.show(250);
			}
			else
			{
				App.setInfoExpanded(false);
				foldedInfo.hide(250);
			}

			return false;
		}
	};

	var Router = {
		parse: function(hash) {
			var cleaned = (hash || '').replace(/^#\/?/, '');
			var parts = cleaned ? cleaned.split('/').filter(Boolean) : [];

			if (!parts.length)
			{
				return { type: 'home' };
			}

			if (parts[0] === 't')
			{
				return {
					type: 'action',
					action: 'create',
					mode: 't',
					title: ''
				};
			}

			if (parts[0] === 'new')
			{
				return {
					type: 'action',
					action: 'create',
					mode: 'new',
					title: decodeURIComponent(parts.slice(1).join('/'))
				};
			}

			if (parts[0] === 'play' && parts[1])
			{
				return {
					type: 'action',
					action: 'play',
					key: decodeURIComponent(parts[1]),
					groupId: parts[2] || null
				};
			}

			if (parts[0] === 'pause' && parts[1] && parts[2])
			{
				return {
					type: 'action',
					action: 'pause',
					key: decodeURIComponent(parts[1]),
					groupId: parts[2]
				};
			}

			if (parts[0] === 'stop' && parts[1])
			{
				return {
					type: 'action',
					action: 'stop',
					key: decodeURIComponent(parts[1])
				};
			}

			if (parts[0] === 'delete' && parts[1] && parts[2])
			{
				return {
					type: 'action',
					action: 'delete',
					key: decodeURIComponent(parts[1]),
					groupId: parts[2]
				};
			}

			if (parts.length === 2 && parts[1] === 'read')
			{
				return {
					type: 'project',
					key: decodeURIComponent(parts[0]),
					access: 'read'
				};
			}

			if (parts.length === 1)
			{
				return {
					type: 'project',
					key: decodeURIComponent(parts[0]),
					access: ''
				};
			}

			return { type: 'notfound' };
		},

		projectHash: function(key, access) {
			return '#/' + encodeURIComponent(key) + (access ? '/' + access : '');
		},

		actionHash: function(action, key, groupId) {
			var parts = ['#', action, key];

			if (groupId !== null && groupId !== undefined && groupId !== '')
			{
				parts.push(String(groupId));
			}

			return parts.join('/').replace('#/', '#/');
		}
	};

	var Store = {
		load: function() {
			var parsed;

			try
			{
				parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
			}
			catch (error)
			{
				parsed = null;
			}

			if (!parsed || parsed.version !== 1 || !$.isArray(parsed.projects))
			{
				return Store.defaultState();
			}

			return parsed;
		},

		save: function(state) {
			try
			{
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
			}
			catch (error)
			{
				window.console && console.error('Failed to save cron0 state.', error);
			}
		},

		defaultState: function() {
			return {
				version: 1,
				nextProjectId: 1,
				nextSegmentId: 1,
				projects: []
			};
		},

		findProject: function(state, key, access) {
			return state.projects.find(function(project) {
				return access === 'read' ? project.readonlyKey === key : project.editableKey === key;
			}) || null;
		},

		createProject: function(state, options) {
			var project = {
				id: state.nextProjectId++,
				editableKey: KeyFactory.unique(state),
				readonlyKey: KeyFactory.unique(state),
				title: Sanitizer.clean(options.title || ''),
				createdAt: DateHelper.nowIso(),
				segments: []
			};

			state.projects.push(project);

			if (options.autoStart)
			{
				Store.play(state, project.editableKey, null);
			}

			return project;
		},

		play: function(state, editableKey, groupId) {
			var project = Store.findProject(state, editableKey, '');
			if (!project)
			{
				return false;
			}

			var numericGroupId = Store.normalizeId(groupId);
			project.segments.forEach(function(segment) {
				segment.focus = 0;
			});

			project.segments.push({
				id: state.nextSegmentId++,
				groupId: numericGroupId,
				memo: '',
				focus: 1,
				createdAt: DateHelper.nowIso(),
				completedAt: null
			});

			return true;
		},

		pause: function(state, editableKey, groupId) {
			var project = Store.findProject(state, editableKey, '');
			var numericGroupId = Store.normalizeId(groupId);
			var now = DateHelper.nowIso();
			var changed = false;

			if (!project || numericGroupId === null)
			{
				return false;
			}

			project.segments.forEach(function(segment) {
				if (Store.segmentMatchesGroup(segment, numericGroupId) && segment.completedAt === null)
				{
					segment.completedAt = now;
					changed = true;
				}
			});

			return changed;
		},

		stop: function(state, editableKey) {
			var project = Store.findProject(state, editableKey, '');
			if (!project)
			{
				return false;
			}

			project.segments.forEach(function(segment) {
				segment.focus = 0;
			});

			return true;
		},

		deleteGroup: function(state, editableKey, groupId) {
			var project = Store.findProject(state, editableKey, '');
			var numericGroupId = Store.normalizeId(groupId);

			if (!project || numericGroupId === null)
			{
				return false;
			}

			var originalLength = project.segments.length;
			project.segments = project.segments.filter(function(segment) {
				return !Store.segmentMatchesGroup(segment, numericGroupId);
			});

			return project.segments.length !== originalLength;
		},

		updateMemo: function(state, editableKey, groupId, memo) {
			var project = Store.findProject(state, editableKey, '');
			var numericGroupId = Store.normalizeId(groupId);
			var cleanedMemo = Sanitizer.clean(memo);

			if (!project || numericGroupId === null)
			{
				return false;
			}

			project.segments.forEach(function(segment) {
				if (Store.segmentMatchesGroup(segment, numericGroupId))
				{
					segment.memo = cleanedMemo;
				}
			});

			return true;
		},

		updateTitle: function(state, editableKey, title) {
			var project = Store.findProject(state, editableKey, '');

			if (!project)
			{
				return false;
			}

			project.title = Sanitizer.clean(title);
			return true;
		},

		aggregateSegments: function(project) {
			var groups = {};
			var nowMs = Date.now();

			project.segments.forEach(function(segment) {
				var groupId = segment.groupId || segment.id;
				var latestAt = segment.completedAt || segment.createdAt;
				var group = groups[groupId];

				if (!group)
				{
					group = groups[groupId] = {
						id: [],
						segGroup: groupId,
						completedDay: '',
						memo: '',
						focus: 0,
						completed: null,
						time_logged: 0,
						latestAt: latestAt,
						hasActive: false
					};
				}

				group.id.push(segment.id);
				group.focus = Math.max(group.focus, segment.focus || 0);
				group.time_logged += DateHelper.durationSeconds(segment.createdAt, segment.completedAt, nowMs);

				if (segment.memo !== '')
				{
					group.memo = segment.memo;
				}

				if (segment.completedAt === null)
				{
					group.hasActive = true;
				}
				else if (group.completed === null || segment.completedAt > group.completed)
				{
					group.completed = segment.completedAt;
				}

				if (latestAt > group.latestAt)
				{
					group.latestAt = latestAt;
				}
			});

			var aggregated = Object.keys(groups).map(function(groupId) {
				var group = groups[groupId];
				group.id.sort(function(a, b) { return a - b; });
				group.completedDay = DateHelper.dayLabel(group.latestAt);
				group.completed = group.hasActive ? null : group.completed;
				return group;
			});

			aggregated.sort(Store.compareGroups);
			return aggregated;
		},

		compareGroups: function(a, b) {
			if (b.focus !== a.focus)
			{
				return b.focus - a.focus;
			}

			if (b.latestAt !== a.latestAt)
			{
				return b.latestAt > a.latestAt ? 1 : -1;
			}

			var memoA = a.memo.toLowerCase();
			var memoB = b.memo.toLowerCase();
			if (memoA !== memoB)
			{
				return memoA > memoB ? 1 : -1;
			}

			return b.segGroup - a.segGroup;
		},

		segmentMatchesGroup: function(segment, groupId) {
			return segment.id === groupId || segment.groupId === groupId;
		},

		normalizeId: function(value) {
			if (value === null || value === undefined || value === '')
			{
				return null;
			}

			var numeric = parseInt(value, 10);
			return isNaN(numeric) ? null : numeric;
		}
	};

	var Html = {
		home: function() {
			return '' +
				'<section class="index">' +
					'<p><a href="#/t" class="home-play-link"><i class="icon-play-circle"></i></a></p>' +
				'</section>';
		},

		notFound: function() {
			return '' +
				'<section class="notfound">' +
					'<h3><i class="icon-warning-sign"></i> Not found</h3>' +
					'<p><a href="javascript:history.go(-1);"><i class="icon-arrow-left"></i> Back</a></p>' +
				'</section>';
		},

		project: function(project, segments, access, infoExpanded) {
			var days = [];
			var total = 0;
			var html = [];

			html.push('<section class="view' + (access === '' ? ' edit' : '') + '">');
			html.push('<h2 class="title' + (project.title ? '' : ' hidden') + '">' + Html.escape(project.title) + '</h2>');
			html.push(Html.info(project, access, infoExpanded));
			html.push('<div class="segments"><ul>');

			if (segments.length)
			{
				segments.forEach(function(segment, index) {
					total += segment.time_logged;

					if (index === 0 && segment.focus === 0)
					{
						html.push(Html.nofocusItem(project.editableKey));
					}

					if ((index > 0 || segment.focus === 0) && $.inArray(segment.completedDay, days) === -1)
					{
						days.push(segment.completedDay);
						html.push('<li class="heading"><h3>' + Html.escape(segment.completedDay) + '</h3></li>');
					}

					html.push(Html.segmentItem(project, segment, access));
				});
			}
			else
			{
				html.push(Html.nofocusItem(project.editableKey));
			}

			if (segments.length > 1)
			{
				html.push(
					'<li class="total" data-count="' + total + '">' +
						'<strong>Total</strong><i class="icon-circle-arrow-right"></i><span>' + DateHelper.secondsToHuman(total) + '</span>' +
					'</li>'
				);
			}

			html.push('</ul></div>');

			if (access === '')
			{
				html.push(
					'<p class="links">' +
						'<a href="' + Html.escapeAttribute(Router.projectHash(project.readonlyKey, 'read')) + '">' +
							'<i class="icon-link"></i> read only link' +
						'</a>' +
					'</p>'
				);
			}

			html.push('</section>');

			return html.join('');
		},

		info: function(project, access, infoExpanded) {
			var projectUrl = Html.absoluteUrl(Router.projectHash(project.editableKey, ''));
			var readonlyUrl = Html.absoluteUrl(Router.projectHash(project.readonlyKey, 'read'));
			var infoClass = access === '' && infoExpanded ? '' : ' hidden';
			var html = [];

			if (access === '')
			{
				html.push(
					'<div class="info">' +
						'<a href="#information" class="folded-info-link"><i class="icon-info-sign"></i></a>' +
					'</div>'
				);
			}

			html.push('<div id="information" class="' + infoClass.trim() + '">');
			html.push('<h3><span>What is Cron0?</span></h3>');
			html.push('<ul>');
			html.push('<li>A thing for timing stuff.</li>');
			html.push('<li>Timing continues if you leave the page.</li>');
			html.push('<li>Legend:<ul>');
			html.push('<li><i class="icon-paper-clip"></i> Add memo</li>');
			html.push('<li><i class="icon-play"></i> Start/Continue</li>');
			html.push('<li><i class="icon-pause"></i> Pause</li>');
			html.push('<li><i class="icon-stop"></i> New</li>');
			html.push('<li><i class="icon-remove"></i> Delete</li>');
			html.push('<li><span class="seconds">42</span> Seconds</li>');
			html.push('</ul></li>');
			html.push('</ul>');

			if (access === '')
			{
				html.push('<h3><span>Your unique page link:</span> <a href="' + Html.escapeAttribute(Router.projectHash(project.editableKey, '')) + '">' + Html.escape(projectUrl) + '</a></h3>');
				html.push('<ul>');
				html.push('<li>Save this link for future access.</li>');
				html.push('<li>This is the URL currently in your address bar.</li>');
				html.push('<li>You can add a title to this page:<ul><li>');
				html.push(
					'<form class="edit-title" action="#/project/title" method="post">' +
						'<input type="hidden" name="key" value="' + Html.escapeAttribute(project.editableKey) + '">' +
						'<input type="text" maxlength="64" name="title" value="' + Html.escapeAttribute(project.title) + '">' +
						'<button type="submit"><i class="icon-ok-sign"></i></button>' +
						'<p class="message hidden"></p>' +
					'</form>'
				);
				html.push('</li></ul></li>');
				html.push('</ul>');

				html.push('<h3><span>Read only link:</span> <a href="' + Html.escapeAttribute(Router.projectHash(project.readonlyKey, 'read')) + '">' + Html.escape(readonlyUrl) + '</a></h3>');
				html.push('<ul>');
				html.push('<li>A link to the read only version of the page.</li>');
				html.push('<li>Share with someone who you wish to be able to see your memos without the ability to modify.</li>');
				html.push('</ul>');
			}

			html.push('<h3><span>Still have questions?</span></h3>');
			html.push("<ul><li><a href='ma&#105;lto&#58;&#114;ob&#64;&#37;6Eor%6&#68;&#97;n&#37;6&#52;ev&#46;c&#37;6F%6D'>rob&#64;&#110;ormandev&#46;c&#111;&#109;</a></li></ul>");
			html.push('<p><a href="#information" class="folded-info-link"><i class="icon-remove"></i> Hide Information</a></p>');
			html.push('</div>');

			return html.join('');
		},

		nofocusItem: function(editableKey) {
			return '' +
				'<li class="nofocus">' +
					'<span class="timer">' +
						'<a href="' + Html.escapeAttribute(Router.actionHash('play', editableKey)) + '" class="seg-play" data-key="' + Html.escapeAttribute(editableKey) + '">' +
							'<i class="icon-play"></i>' +
						'</a>' +
					'</span>' +
				'</li>';
		},

		segmentItem: function(project, segment, access) {
			var html = [];
			var editableKey = project.editableKey;
			var isEditable = access === '';
			var isRunning = segment.completed === null;
			var memoTitle = isEditable ? 'Click to edit memo.' : 'memo';
			var stopClasses = (isRunning ? 'invisible' : '') + (segment.focus ? '' : ' hidden');

			html.push('<li data-group="' + segment.segGroup + '">');

			if (isEditable)
			{
				html.push('<span class="timer">');

				if (isRunning)
				{
					html.push(
						'<a href="' + Html.escapeAttribute(Router.actionHash('pause', editableKey, segment.segGroup)) + '" class="seg-pause" data-key="' + Html.escapeAttribute(editableKey) + '" data-group="' + segment.segGroup + '">' +
							'<i class="icon-pause"></i>' +
						'</a>'
					);
				}
				else
				{
					html.push(
						'<a href="' + Html.escapeAttribute(Router.actionHash('play', editableKey, segment.segGroup)) + '" class="seg-play" data-key="' + Html.escapeAttribute(editableKey) + '" data-group="' + segment.segGroup + '">' +
							'<i class="icon-play"></i>' +
						'</a>'
					);
				}

				html.push('</span>');
			}

			html.push(
				'<span class="time_logged' + (isRunning ? ' timing' : '') + '" data-count="' + segment.time_logged + '">' +
					DateHelper.secondsToHuman(segment.time_logged) +
				'</span>'
			);

			if (isEditable)
			{
				html.push(
					'<a href="' + Html.escapeAttribute(Router.actionHash('stop', editableKey)) + '" class="seg-stop ' + stopClasses.trim() + '" data-key="' + Html.escapeAttribute(editableKey) + '">' +
						'<i class="icon-stop"></i>' +
					'</a>'
				);
				html.push('<span class="delete">');
				html.push(
					'<a href="' + Html.escapeAttribute(Router.actionHash('delete', editableKey, segment.segGroup)) + '" class="seg-delete" data-key="' + Html.escapeAttribute(editableKey) + '" data-group="' + segment.segGroup + '">' +
						'<i class="icon-remove"></i>' +
					'</a>'
				);
				html.push('</span>');
			}

			html.push('<span class="memo">');

			if (!segment.memo && isEditable)
			{
				html.push('<a href="memo" class="edit-memo" title="Click to edit memo."><i class="icon-paper-clip"></i></a>');
			}
			else
			{
				html.push('<span class="edit-memo" title="' + Html.escapeAttribute(memoTitle) + '">' + Html.escape(segment.memo) + '</span>');
			}

			html.push('</span>');
			html.push('</li>');

			return html.join('');
		},

		absoluteUrl: function(hash) {
			return window.location.href.split('#')[0] + hash;
		},

		escape: function(value) {
			return String(value || '')
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
		},

		escapeAttribute: function(value) {
			return Html.escape(value);
		}
	};

	var DateHelper = {
		secondsToHuman: function(seconds) {
			var safeSeconds = Math.max(0, Math.floor(seconds || 0));
			var hours = Math.floor(safeSeconds / 3600);
			var minutes = DateHelper.leadingZero(Math.floor((safeSeconds / 60) % 60));
			var secs = DateHelper.leadingZero(safeSeconds % 60);

			return '<span class="hours">' + hours + '</span><span class="sep">:</span><span class="minutes">' + minutes + '</span><span class="seconds">' + secs + '</span>';
		},

		leadingZero: function(number) {
			return number < 10 ? '0' + number : String(number);
		},

		nowIso: function() {
			return new Date().toISOString();
		},

		durationSeconds: function(createdAt, completedAt, nowMs) {
			var start = Date.parse(createdAt);
			var end = completedAt ? Date.parse(completedAt) : nowMs;

			if (isNaN(start) || isNaN(end))
			{
				return 0;
			}

			return Math.max(0, Math.floor((end - start) / 1000));
		},

		dayLabel: function(timestamp) {
			var date = new Date(timestamp);
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

			return months[date.getMonth()] + ' ' + date.getDate();
		}
	};

	var Sanitizer = {
		clean: function(value) {
			var div = document.createElement('div');
			div.innerHTML = String(value || '');
			return $.trim(div.textContent || div.innerText || '');
		}
	};

	var KeyFactory = {
		unique: function(state) {
			var key = '';

			do
			{
				key = KeyFactory.random(5);
			}
			while (KeyFactory.exists(state, key));

			return key;
		},

		random: function(length) {
			var charactersLength = KEY_CHARS.length;
			var output = [];

			for (var i = 0; i < length; i++)
			{
				output.push(KEY_CHARS.charAt(KeyFactory.randomIndex(charactersLength)));
			}

			return output.join('');
		},

		randomIndex: function(max) {
			if (window.crypto && window.crypto.getRandomValues)
			{
				var values = new Uint32Array(1);
				window.crypto.getRandomValues(values);
				return values[0] % max;
			}

			return Math.floor(Math.random() * max);
		},

		exists: function(state, key) {
			return state.projects.some(function(project) {
				return project.editableKey === key || project.readonlyKey === key;
			});
		}
	};

	jQuery.extend(jQuery.easing, {
		easeInOutElastic: function(x, t, b, c, d) {
			var s = 1.70158;
			var p = 0;
			var a = c;
			if (t === 0) { return b; }
			if ((t /= d / 2) === 2) { return b + c; }
			if (!p) { p = d * (0.3 * 1.5); }
			if (a < Math.abs(c))
			{
				a = c;
				s = p / 4;
			}
			else
			{
				s = p / (2 * Math.PI) * Math.asin(c / a);
			}
			if (t < 1)
			{
				return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
			}
			return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
		}
	});

	$(document).ready(App.init);

})(window.jQuery);
