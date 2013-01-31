<? if(empty($access)): ?>
	<div class="info">
		<a href="#information" class="folded-info-link"><i class="icon-info-sign"></i></a>
	</div>
<? endif; ?>

<div id="information" class="hidden">
	<h3><span>What is Cron0?</span></h3>
	<ul>
		<li>A thing for timing stuff.</li>
		<li>Legend:
			<ul>
				<li><i class="icon-paper-clip"></i> Add memo</li>
				<li><i class="icon-play"></i> Start/Continue</li>
				<li><i class="icon-pause"></i> Pause</li>
				<li><i class="icon-stop"></i> New</li>
				<li><i class="icon-remove"></i> Delete</li>					
				<li><span class="seconds">42</span> Seconds</li>
			</ul>
		</li>
	</ul>
	
	<h3><span>Your unique page link:</span> <?= anchor($key,'cron0.com/'.$key); ?></h3>
	<ul>
		<li>Save this link for future access.</li>
		<li>This is the URL currently in your address bar.</li>
		<li>You can add a title to this page:
			<ul>
				<li>
					<form class="edit-title" action="<?=base_url('project/title');?>" method="post">
						<input type="hidden" name="key" value="<?= $key; ?>">
						<input type="text" maxlength="64" name="title" value="<?= $project->title; ?>">
						<button type="submit">
							<i class="icon-ok-sign"></i>
						</button>
						<p class="message hidden"></p>
					</form>
				</li>
			</ul>
		</li>
	</ul>
	
	<h3><span>Read only link:</span> <?= anchor($rokey.'/read','cron0.com/'.$rokey.'/read'); ?></h3>
	<ul>
		<li>A link to the read only version of the page.</li>
		<li>Share with someone who you wish to be able to see your memos without the ability to modify.</li>
	</ul>
	
	<h3><span>Still have questions?</span></h3>
	<ul>
		<li><a href='ma&#105;lto&#58;&#114;ob&#64;&#37;6Eor%6&#68;&#97;n&#37;6&#52;ev&#46;c&#37;6F%6D'>rob&#64;&#110;ormandev&#46;c&#111;&#109;</a></li>
	</ul>
	
	<p><a href="#information" class="folded-info-link"><i class="icon-remove"></i> Hide Information</a></p>
</div>