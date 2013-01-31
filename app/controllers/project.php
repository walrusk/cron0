<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Project extends CI_Controller {

	function __construct()
	{
		parent::__construct();

		$this->load->helper('url');
		$this->load->library('template');
		
		$this->load->model(array('project_model','seg_model'));
	}

	public function index()
	{
		// front page -- shows timer
		
		$this->template->build('project/index');
	}
	
	public function view()
	{
		$data['access'] = $this->uri->segment(2, ''); // 'read'
		
		$data['key'] = $this->uri->segment(1);
		$data['project'] = $this->project_model->get($data['key'], $data['access']);
		
		// check if project is valid
		if(!is_null($data['project']))
		{
			$this->load->helper('date');
			
			$data['rokey'] = $this->project_model->readonly_key($data['project']->id);
			$data['segments'] = $this->seg_model->project_byid($data['project']->id);
			$this->template->build('project/view', $data);
		}
		else
			$this->template->build('project/404', $data);
	}
	
	public function title()
	{
		$key = $this->input->post('key',TRUE);
		$title = $this->input->post('title',TRUE);
		
		$result = $this->project_model->title($title, $key);
		
		if($this->input->is_ajax_request())
			echo json_encode($result);
		else
			redirect($key);
	}
	
	public function create()
	{
		$ip = $this->input->ip_address();
		$mode = $this->uri->segment(1,'t');
		$title = $this->uri->segment(2,'');
		
		$key = $this->project_model->create($ip, $title);
		
		if($mode == 't')
			$this->seg_model->play($key);
		
		redirect($key);
	}
}

/* End of file welcome.php */
/* Location: ./application/controllers/welcome.php */