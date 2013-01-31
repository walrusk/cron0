<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/*
 * Convert seconds to human readable text.
 *
 */
function seconds_to_human($secs)
{
	$hours = floor($secs / 3600);
	$minutes = leading_zero(floor(($secs / 60) % 60));
	$seconds = leading_zero($secs % 60);

	return '<span class="hours">'.$hours.'</span><span class="sep">:</span><span class="minutes">'.$minutes.'</span><span class="seconds">'.$seconds.'</span>';
}

function leading_zero($num)
{
	if($num < 10) $num = '0'.$num;
	return $num;
}