<?php header("Content-Type:text/plain"); ?>
<?php
	foreach(glob("test/*") as $filename){
		echo basename($filename) . "\n";
	}
?>
