<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Project_model extends CI_Model {

	private $table = 'projects';

    function __construct()
    {
        // Call the Model constructor
        parent::__construct();

		$this->load->database();
    }
    
    public function get($key, $access="")
	{
		$entry = NULL;
		
		if($key !== FALSE)
		{
			$this->load->library('alpha');
			
			// get id from alpha key
			$salt = empty($access) ? 'editable' : 'readonly';
			$id = $this->alpha->id($key, $salt);
			
			// get project
			$this->db->select(array('id','title','ip','created'));
			$this->db->where('id', $id);
			$query = $this->db->get($this->table);
			
			if ($query->num_rows() > 0)
				$entry = $query->row();
		}
		
		return $entry;
	}
	
	public function create($ip, $title="")
	{
		// create new project
		$new_entry = array(
			'title' => $title,
			'ip' => $ip,
			'created' => date('Y-m-d H:i:s')
		);
		$this->db->insert($this->table,$new_entry);
		
		// get alpha key of id
		$id = $this->db->insert_id();
		$this->load->library('alpha');
		$key = $this->alpha->key($id, 'editable');

		return $key;
	}
	
	public function title($title, $key)
	{
		$id = $this->alpha->id($key, 'editable');
		
		$title = $this->cleanInput($title);
		
		$sql = "UPDATE ".$this->table."
				SET title=".$this->db->escape($title)."
				WHERE id=".$id;
		
		return array(
			'query' => $this->db->query($sql)
		);
	}
	
	public function readonly_key($id)
	{
		$this->load->library('alpha');
		return $this->alpha->key($id, 'readonly');
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