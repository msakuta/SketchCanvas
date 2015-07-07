<?php header("Content-Type:text/plain"); ?>
<?php
$updir = "data/";
try{
	if(!isset($_GET['remote']) || $_GET['remote'] === '')
		$remote = 'origin';
	else
		$remote = $_GET['remote'];

	require_once('gitphp/Git.php');

	$repo = new GitRepo('data');
	$response = $repo->pull($remote, 'master');

	echo "succeeded\n";
	echo $response;
}
catch(Exception $e){
	echo "failed\n";
	echo $e->getMessage();
}
?>
