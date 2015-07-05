<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Content-Language" content="ja" />
    <meta http-equiv="Content-Style-Type" content="text/css" />
    <meta http-equiv="Content-Script-Type" content="text/javascript" />
    <title>Canvas</title>
    <script language="javascript" src="script/draw.js"></script>
    <script language="javascript" src="script/canvas.js"></script>
<!--    <script language="javascript" src="script/encoding.js"></script> -->
    <script src="script/js-yaml.min.js"></script>
    <script language="javascript">
<?php
	$maxsize = 10000;
	echo "serverdata = {\n";
	foreach(glob("test/*") as $filename){
		$fp = fopen($filename, "r");
		if($fp){
			$content = fread($fp, $maxsize);
			if($content)
				echo("\"" . basename($filename) . "\": \"" .
					str_replace(array("\r\n", "\n", "\r"), "\\n", addslashes($content)) . "\",\n");
			fclose($fp);
		}
	}
	echo "};\n";
?>
    </script>
    <style type="text/css">
<!--
body{margin: 0 0 0 0;}
-->
    </style>
  </head>
  <body>
    <canvas id="canvassample" width="1024" height="640"></canvas>
    <form name="form1" method="POST" action="upload.php" enctype="multipart/form-data">
      <p>Client-saved figures<select name="canvasselect"><option value="0">no select</option></select>
      <input type="button" value="Load" onclick="loadDataFromList()"></p>
      <p>Server-saved figures<select name="serverselect"><option value="0">no select</option>
<?php
	foreach(glob("test/*") as $filename){
		echo "<option value=\"$i\">" . basename($filename) . "</option>\n";
	}
?>
</select>
      <input type="button" value="Load" onclick="loadDataFromServerList()"></p>
      <p>Message:<span id="message"></span></p>
      <p>Draw data: <input type="button" value="Load" onclick="loadData()"></p>
      <textarea id="drawdata" name="drawdata" rows="10" cols="50"></textarea>
      <input type="hidden" name="dir" value="test">
      <p>Upload name
        <input type="text" name="fname" value="default">
        <input type="submit" value="Upload">
      </p>
    </form>
    <p>This application uses <a href="https://github.com/nodeca/js-yaml">js-yaml</a> JavaScript library.
    It's license is found in <a href="script/LICENSE">LICENSE</a> file.</p>
  </body>
</html>
