<?php
require_once('conf/default_config.php');
?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Content-Language" content="ja" />
    <meta http-equiv="Content-Style-Type" content="text/css" />
    <meta http-equiv="Content-Script-Type" content="text/javascript" />
    <title>Canvas</title>
    <script language="javascript" src="script/draw.js"></script>
    <script language="javascript" src="script/i18next-1.7.2.min.js"></script>
    <script language="javascript" src="script/translation.js"></script>
    <script language="javascript" src="script/SketchCanvas.js"></script>
<!--    <script language="javascript" src="script/encoding.js"></script> -->
    <script src="script/js-yaml.min.js"></script>
    <script language="javascript"> <!--
files = [
<?php
$files = glob('data/*');
foreach($files as $filename){
	echo "'" . addslashes(substr($filename, strlen('data/'))) . "',\n";
}
?>
];

canvases = [];
onload = function(){
	var scale = 0.5;
	var gallery = document.getElementById('gallery');
	for(var i = 0; i < files.length; i++){
		var div = document.createElement('div');
		div.innerHTML = '<a href="canvas.php?fname=' + encodeURI(files[i]) + '">' + files[i] + '</a><br>';
		var canvas = document.createElement('canvas');
		canvas.id = 'canvassample' + i;
		canvas.width = 1024 * scale;
		canvas.height = 640 * scale;
		div.appendChild(canvas);
		gallery.appendChild(div);
		var skcanvas = new SketchCanvas(canvas, {scale: scale});
		skcanvas.requestServerFile(files[i]);
		canvases.push(skcanvas);
	}
}

--> </script>
    <style type="text/css">
<!--
@import url(http://fonts.googleapis.com/earlyaccess/notosansjapanese.css);
body{background-color: #fff0e7}
canvas{background-color: #fff}
table{background-color: #f7c0a0; border: 3px solid #7f7f7f; border-collapse: collapse}
td{background-color: #ffe0d0}
th{background-color: #e0c0a0}
td, th{padding: 10px; border: 2px solid #7f7f7f}
-->
    </style>
  </head>
  <body>
    <h1>Gallery of server figures</h1>
    <a href="canvas.php">Edit or create figures</a>
    <hr>
    <div id="gallery"></div>
    <hr>
    <p>This application uses <a href="https://github.com/nodeca/js-yaml">js-yaml</a> JavaScript library.
    It's license is found in <a href="script/LICENSE">LICENSE</a> file.</p>
  </body>
</html>
