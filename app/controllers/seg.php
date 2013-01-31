<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Seg extends CI_Controller {

	function __construct()
	{
		parent::__construct();

		$this->load->helper('url');
		
		$this->load->model(array('seg_model'));
	}

	public function play()
	{		
		$key = $this->uri->segment(2, '');
		$group_id = $this->uri->segment(3, NULL);
	
		$result = $this->seg_model->play($key, $group_id);
		
		if($this->input->is_ajax_request())
			echo json_encode($result);
		else
			redirect($key);
	}
	
	public function pause()
	{
		$key = $this->uri->segment(2, '');
		$group_id = $this->uri->segment(3, NULL);

		$result = $this->seg_model->stop($key, $group_id);
		
		if($this->input->is_ajax_request())
			echo json_encode($result);
		else
			redirect($key);
	}
	
	public function stop()
	{
		$key = $this->uri->segment(2, '');
		
		$this->seg_model->nofocus($key);
		
		redirect($key);
	}
	
	public function memo()
	{
		$key = $this->input->post('key',TRUE);
		$group_id = $this->input->post('group_id',TRUE);
		$memo = $this->input->post('memo',TRUE);
		
		$result = $this->seg_model->memo($memo, $key, $group_id);
		
		if($this->input->is_ajax_request())
			echo json_encode($result);
		else
			redirect($key);
	}
	
	public function delete()
	{
		$key = $this->uri->segment(2, '');
		$group_id = $this->uri->segment(3, '');
		
		$result = $this->seg_model->delete($key, $group_id);
		
		if($this->input->is_ajax_request())
			echo json_encode($result);
		else
			redirect($key);
	}
}

/* End of file welcome.php */
/* Location: ./application/controllers/welcome.php */