<?php header("Content-Type:text/plain"); ?>
<?php

$maxsize = 100000;
$updir = "data/";

do{
	$fname = $_POST['fname'];
	$fdata = $_POST['drawdata'];
	$action = isset($_POST['action']) ? $_POST['action'] : 'up';
	$fsize = strlen($fdata);

	if($fname == ""){
		echo "empty\n";
		break;
	}
	else if(strpos($fname, "/") !== false || strpos($fname, "\\") !== false){
		echo "failed\n";
		echo "file path delimiter is prohibited in the file name\n";
		break;
	}
	else if($action === "delete"){
		if(!unlink($updir.$fname)){
			echo "failed\n";
			echo "Couldn't unlink " . $fname . "\n";
			break;
		}

		require_once('gitphp/Git.php');

		// Try to delete the file in Git repository, too.
		$comment = "";
		try{
			$repo = new GitRepo('data');
			// The rm method accepts files either as an array of strings
			// or a string.  It's unclear whether a space in a string should be
			// treated as a delimiter or a part of the file name, but the API
			// seems to be the former.
			$repo->rm('"' . $fname . '"', true);
			$repo->commit('Delete file ' . $fname);
		}
		catch(Exception $e){
			$comment = $e->getMessage();
		}
		echo "succeeded\n";
		echo $comment . "\n";
		break;
	}


	// Allow overwriting to a file since we have git repository to backup previous revisions
/*	if(file_exists($updir.$fname)==TRUE) {
		echo "failed\n";
		echo "file already exists\n";
	}*/

	// Disallow uploading too large file
	if($maxsize < $fsize){
		echo "failed\n";
		echo "size limit " . $maxsize . " is exceeded: " . $fsize;
		break;
	}

	$fp = fopen($updir.$fname, "w");
	if($fp){
		fwrite($fp, $fdata);
		fclose($fp);

		require_once('gitphp/Git.php');

		$comment = "";
		try{
			$repo = new GitRepo('data', true);
			// The add method accepts files either as an array of strings
			// or a string.  It's unclear whether a space in a string should be
			// treated as a delimiter or a part of the file name, but the API
			// seems to be the former.
			$repo->add('"' . $fname . '"');
			$repo->commit('Add file ' . $fname);
		}
		catch(Exception $e){
			$comment = $e->getMessage();
		}


/*	elseif(!is_uploaded_file($_FILES['fl']['tmp_name'])) {
		echo "failed\n";
		echo "something's wrong for uploading";
	}
	elseif(!move_uploaded_file($_FILES['fl']['tmp_name'],$updir.$_FILES['fl']['name'])){
		echo "failed\n";
		echo "something's wrong moving uploaded file";
	}
	else{*/
		echo "succeeded\n";
		echo "size=" . $fsize . "\n";
		echo $comment . "\n";

		// Save the last image successfully uploaded.
		// This is necessary because the client sometimes fails to upload, making live,php
		// not capable of showing the image.
/*		$fp = fopen('current', 'w');
		if($fp){
			fwrite($fp, $updir.$_FILES['fl']['name']);
			fclose($fp);
		}*/

		// Save upload log
		$fp = fopen('upload.log', 'a');
		if($fp){
			fwrite($fp, $updir.$fname . "\n");
			fclose($fp);
		}
	}
} while(0);
?>
