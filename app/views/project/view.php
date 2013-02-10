<section class="view<?=(empty($access) ? ' edit' : '')?>">
	
	<h2 class="title <?= (empty($project->title) ? 'hidden':'') ?>"><?= $project->title; ?></h2>
	
	<? $this->load->view('project/info'); ?>	
	
	<div class="segments">
		<ul>
		<? if(!empty($segments)): ?>
			<?  $days = array(); 
			    $total = 0;
			  foreach($segments as $i => $seg):	
				$total += $seg->time_logged;
					?>
				<?if($i==0 && $seg->focus==0): ?>
					<li class="nofocus">
						<? if(empty($access)): ?>
						<span class="timer">
							<a href="<?=base_url('play/'.$key);?>"><i class="icon-play"></i></a>
						</span>
						<? endif; ?>
					</li>
				<? endif; ?>
				
				<? if( ($i > 0 || $seg->focus==0)  && !in_array($seg->completed_day,$days)): 
					$days[] = $seg->completed_day; ?>
					<li class="heading">
						<h3><?= $seg->completed_day; ?></h3>
					</li>
				<? endif; ?>
				<li data-group="<?=$seg->seg_group;?>">
					<? if(empty($access)): ?>
						<span class="timer">
							<? if(is_null($seg->completed)): ?>
								<a href="<?=base_url('pause/'.$key.'/'.$seg->seg_group);?>" class="seg-pause"><i class="icon-pause"></i></a>
							<? else: ?>
								<a href="<?=base_url('play/'.$key.'/'.$seg->seg_group);?>" class="seg-play"><i class="icon-play"></i></a>
							<? endif; ?>
						</span>
					<? endif; ?>
					<span class="time_logged<?=(is_null($seg->completed) ? ' timing' : '')?>" data-count="<?=$seg->time_logged?>"><?=seconds_to_human($seg->time_logged); ?></span>
					<? if(empty($access)): ?>
						<a href="<?=base_url('stop/'.$key);?>" class="seg-stop <?= (is_null($seg->completed) ? 'invisible' : '').($seg->focus ? '' : ' hidden') ?>"><i class="icon-stop"></i></a>
						<span class="delete">
							<a href="<?=base_url('delete/'.$key.'/'.$seg->seg_group) ?>" class="seg-delete"><i class="icon-remove"></i></a>
						</span>
					<? endif; ?>
					<span class="memo">
						<? if(empty($seg->memo) && empty($access)): ?>
							<a href="memo" class="edit-memo" title="Click to edit memo."><i class="icon-paper-clip"></i></a>
						<? else: ?>
							<span class="edit-memo" title="<?= empty($access) ? 'Click to edit memo.' : 'memo' ?>"><?= $seg->memo; ?></span>
						<? endif; ?>
					</span>
				</li>
			<? endforeach; ?>
		<? else: ?>
			<li class="nofocus">
				<span class="timer">
					<?= anchor('play/'.$key,'<i class="icon-play"></i>'); ?>
				</span>
			</li>
		<? endif; ?>
		<? if(count($segments) > 1): ?>
			<li class="total" data-count="<?=$total?>">
				<strong>Total</strong><i class="icon-circle-arrow-right"></i><span><?= seconds_to_human($total); ?></span>
			</li>
		<? endif; ?>
		</ul>
	</div>
	
	<? if(empty($access)): ?>
		<p class="links">
			<?= anchor($rokey.'/read','<i class="icon-link"></i> read only link'); ?>
		</p>
	<? endif; ?>

	<script>
		key = "<?=$key;?>";
		access = "<?=$access;?>";
	</script>

</section>