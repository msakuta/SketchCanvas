<?php header("Content-Type:text/plain"); ?>
<?php
	foreach(glob("data/*") as $filename){
		echo basename($filename) . "\n";
	}
?>
