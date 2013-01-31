<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed'); 

class Template {

	private $CI;

	function __construct()
	{
		$this->CI =& get_instance();
	}
	
	public function build($view, $data=NULL)
	{
		$this->CI->load->view('header');	
		$this->CI->load->view($view, $data);
		$this->CI->load->view('footer');
	}
	
}

/* End of file Template.php */

