<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Seg_model extends CI_Model {

	private $table = 'seg';

    function __construct()
    {
        // Call the Model constructor
        parent::__construct();

		$this->load->library('alpha');
		$this->load->model('project_model');
    }

	// returns all time segments in a project
    public function project($key)
	{
		$project_id = $this->alpha->id($key, 'editable');
		
		return $this->project_byid($project_id);
	}
	
	public function project_byid($project_id)
	{
		$segments = array();
		
		$query = $this->db->query("SELECT GROUP_CONCAT(id SEPARATOR '_') as id,
      									  IF(group_id IS NULL,id,group_id) AS seg_group,
										  IF(memo='',id,memo) AS memo_group,
										  max( IF(completed IS NULL,DATE_FORMAT(created,'%b %e'),DATE_FORMAT(completed,'%b %e')) ) AS completed_day,
										  max(memo) as memo,
									  	  max(focus) as focus,
									      IF(SUM(completed IS NULL), NULL, SUM(completed)) AS completed,
									  	  SUM(IF(completed IS NULL, TIME_TO_SEC(TIMEDIFF(NOW(),`created`)), TIME_TO_SEC(TIMEDIFF(`completed`,`created`)))) AS time_logged
									FROM ".$this->table."
					  				WHERE project_id=".$project_id."
									GROUP BY seg_group
									ORDER BY focus DESC,completed_day DESC, memo ASC, max(completed) DESC");
		
		if ($query->num_rows() > 0)
			$segments = $query->result();
		
		return $segments;
	}
	
	public function play($key, $group_id=NULL, $memo="")
	{	
		$result = array(
			'new_entry_id' => 0,
			'time_logged' => 0,
			'group_ids' => ""
		);
		
		$project = $this->project_model->get($key);
		if(!is_null($project))
		{
			// remove focus
			$this->db->where('focus', 1);
			$this->db->where('project_id', $project->id);
		    $this->db->update($this->table, array('focus' => 0) );
			
			//$this->stop_byid($project->id);
			$new_entry = array(
	    		'project_id' => $project->id,
				'memo' => $memo,
				'created' => date('Y-m-d H:i:s'),
				'focus' => 1
			);

			if(!is_null($group_id)) $new_entry['group_id'] = $group_id;

			$this->db->insert($this->table, $new_entry);
			$result['new_entry_id'] = $this->db->insert_id();
			
			if(!is_null($group_id))
			{
				$group = $this->grouptime($project->id, $group_id);
				$result['time_logged'] = $group->time_logged;
				$result['group_ids'] = $group->id;
			}
		}
		
		return $result;
	}
	
	public function stop($key, $group_id)
	{
		$project_id = $this->alpha->id($key, 'editable');
		return $this->stop_byid($project_id, $group_id);
	}
	
	private function stop_byid($project_id, $group_id)
	{
		$result = array(
			'time_logged' => NULL,
			'group_ids' => ""
		);
		
		if( (is_null($group_id) || is_numeric($group_id)) && is_numeric($project_id) )
		{
			$seg = $this->grouptime($project_id, $group_id);
			if(!is_null($seg))
			{
				$result['time_logged'] = $seg->time_logged;
				$result['group_ids'] = $seg->id;
				$current_time = $seg->time_now;
			
				// wrap up current seg 
				$this->db->where("(group_id=".$group_id." OR id=".$group_id.") 
				                   AND project_id=".$project_id." AND completed IS NULL");
			    $this->db->update($this->table, array('completed' => $current_time) );
			}
		}
		
		return $result;
	}
	
	private function grouptime($project_id, $group_id)
	{
		$seg = NULL;
		
		$sql = "SELECT 
				GROUP_CONCAT(id SEPARATOR '_') as id,
				SUM(IF(completed IS NULL, TIME_TO_SEC(TIMEDIFF(NOW(),`created`)), TIME_TO_SEC(TIMEDIFF(`completed`,`created`)))) AS time_logged,
				NOW() as time_now,
				IF(group_id IS NULL,id,group_id) AS seg_group
			FROM ".$this->table."
			WHERE project_id=".$project_id." AND (group_id=".$group_id." OR id=".$group_id.")
			GROUP BY seg_group";
		
		$query = $this->db->query($sql);
		
		if($query->num_rows() > 0)
			$seg = $query->row();
			
		return $seg;
	}
	
	public function nofocus($key)
	{
		$project_id = $this->alpha->id($key, 'editable');
		
		if(is_numeric($project_id))
		{
			// remove focus
			$this->db->where('focus', 1);
			$this->db->where('project_id', $project_id);
		    $this->db->update($this->table, array('focus' => 0) );
		}
	}
		
	public function memo($memo, $key, $group_id)
	{
		$project_id = $this->alpha->id($key, 'editable');
		
		$memo = $this->cleanInput($memo);
		
		$sql = "UPDATE ".$this->table."
				SET memo=".$this->db->escape($memo)."
				WHERE project_id=".$project_id." AND (group_id=".$group_id." OR id=".$group_id.")";
		
		return array(
			'query' => $this->db->query($sql)
		);
	}
	
	public function delete($key, $group_id)
	{
		$project_id = $this->alpha->id($key, 'editable');
		
		$sql = "DELETE FROM ".$this->table."
				WHERE project_id=".$project_id." AND (group_id=".$group_id." OR id=".$group_id.")";
		
		return array(
			'query' => $this->db->query($sql)
		);
	}
	
	private function cleanInput($input)
	{
		$search = array(
			'@<script[^>]*?>.*?</script>@si',   // Strip out javascript
			'@<[\/\!]*?[^<>]*?>@si',            // Strip out HTML tags
			'@<style[^>]*?>.*?</style>@siU',    // Strip style tags properly
			'@<![\s\S]*?--[ \t\n\r]*>@'         // Strip multi-line comments
		);

		$output = preg_replace($search, '', $input);
		return $output;
	}
}