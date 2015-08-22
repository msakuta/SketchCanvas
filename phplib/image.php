<?php
/**
 * SketchCanvas server-side renderer
 *
 * It requires GD and Yaml extensions set up for PHP in order to work.
 */

$size = Array(640, 480);
$drawdata = null;

try{
	if(isset($_GET['fname']) || isset($_POST['drawdata'])){
		if(isset($_GET['fname']))
			$drawdata = yaml_parse_file('data/' . $_GET['fname']);
		else
			$drawdata = yaml_parse($_POST['drawdata']);
		foreach ($drawdata as $key => $value) {
			switch($value["type"]){
				case "meta":
					$size = $value["size"];
					break;
			}
		}
	}
}
catch(Exception $e){
	echo "failed\n";
	echo $e->getMessage();
	return;
}

$im = imagecreatetruecolor($size[0], $size[1]);

$white = imagecolorallocate($im, 255, 255, 255);
$c = imagecolorallocate($im, 255, 0, 0);

imagefill($im, 0, 0, $white);

/// @brief Dot product 45 degrees
/// @param a vector
/// @param b length
function l_vec($a, $b) {
	$ax = $a[1][0]-$a[0][0];
	$ay = $a[1][1]-$a[0][1];
	$rate = $b / sqrt($ax * $ax + $ay * $ay);
	$ax *= $rate;
	$ay *= $rate;
	$rad1 = pi() / 4.0;		// 45°
	$rad2 = -pi() / 4.0;		// -45°
	$a1x = $ax * cos($rad1) - $ay * sin($rad1);
	$a1y = $ax * sin($rad1) + $ay * cos($rad1);
	$a2x = $ax * cos($rad2) - $ay * sin($rad2);
	$a2y = $ax * sin($rad2) + $ay * cos($rad2);
	$c = array(2);
	$c[0] = array( $a1x, $a1y );
	$c[1] = array( $a2x, $a2y );
	return $c;
}

/// @brief Dot product 90 degrees
/// @param a vector
/// @param b length
function l_vec9($a, $b) {
	$ax = $a[1][0]-$a[0][0];
	$ay = $a[1][1]-$a[0][1];
	$rate = $b / sqrt($ax * $ax + $ay * $ay);
	$ax *= $rate;
	$ay *= $rate;
	$a1x = -$ay;
	$a1y = $ax;
	$a2x = $ay;
	$a2y = -$ax;
	$c = array(2);
	$c[0] = array( $a1x, $a1y );
	$c[1] = array( $a2x, $a2y );
	return $c;
}

function l_arrow($im, $arr, $color) {
	$c = l_vec($arr, 6);
	imageline($im, $arr[1][0], $arr[1][1], $arr[1][0]-$c[0][0], $arr[1][1]-$c[0][1], $color);
	imageline($im, $arr[1][0], $arr[1][1], $arr[1][0]-$c[1][0], $arr[1][1]-$c[1][1], $color);
}

// draw double arrow
function l_darrow($im, $arr, $color) {
	$c = l_vec9($arr, 2);
	$d = l_vec($arr, 8);
	imageline($im, $arr[0][0]+$c[0][0], $arr[0][1]+$c[0][1], $arr[1][0]+$c[0][0], $arr[1][1]+$c[0][1], $color);
	imageline($im, $arr[0][0]+$c[0][0], $arr[0][1]+$c[0][1], $arr[1][0]+$c[0][0], $arr[1][1]+$c[0][1], $color);
	imageline($im, $arr[0][0]+$c[1][0], $arr[0][1]+$c[1][1], $arr[1][0]+$c[1][0], $arr[1][1]+$c[1][1], $color);
	imageline($im, $arr[0][0]+$c[1][0], $arr[0][1]+$c[1][1], $arr[1][0]+$c[1][0], $arr[1][1]+$c[1][1], $color);
	imageline($im, $arr[1][0], $arr[1][1], $arr[1][0]-$d[0][0], $arr[1][1]-$d[0][1], $color);
	imageline($im, $arr[1][0], $arr[1][1], $arr[1][0]-$d[1][0], $arr[1][1]-$d[1][1], $color);
}

// draw twin arrow
function l_tarrow($im, $arr, $color) {
	$c = l_vec($arr, 6);
	imageline($im, $arr[1][0], $arr[1][1], $arr[1][0]-$c[0][0], $arr[1][1]-$c[0][1], $color);
	imageline($im, $arr[1][0], $arr[1][1], $arr[1][0]-$c[1][0], $arr[1][1]-$c[1][1], $color);
	$a = array($arr[1], $arr[0]);
	$c = l_vec($a, 6);
	imageline($im, $arr[0][0], $arr[0][1], $arr[0][0]-$c[0][0], $arr[0][1]-$c[0][1], $color);
	imageline($im, $arr[0][0], $arr[0][1], $arr[0][0]-$c[1][0], $arr[0][1]-$c[1][1], $color);
}


function colorSelect($im, $value){
	$c = null;
	if(isset($value['color'])){
		switch($value['color']){
			default:
			case 'black':
				$c = imagecolorallocate($im, 0, 0, 0);
				break;
			case 'blue':
				$c = imagecolorallocate($im, 0, 0, 255);
				break;
			case 'red':
				$c = imagecolorallocate($im, 255, 0, 0);
				break;
			case 'green':
				$c = imagecolorallocate($im, 0, 255, 0);
				break;
		}
	}
	else
		$c = imagecolorallocate($im, 0, 0, 0);
	return $c;
}

class Shape{

	public function draw(){

	}
}

try{
	if($drawdata !== null){
		require_once "lib.php";
		foreach ($drawdata as $key => $value) {
			$c = colorSelect($im, $value);
			switch($value["type"]){
				case "line":
				case "arrow":
				case "barrow":
				case "darrow":
				case "rect":
				case "rectfill":
				case "ellipse":
				case "ellipsefill":
					$pts = parsePointList($value["points"]);
					$p1 = $pts[0];
					$p2 = $pts[1];
					if($value["type"] === "rect")
						imagerectangle($im, $p1[0], $p1[1], $p2[0], $p2[1], $c);
					else if($value["type"] === "rectfill")
						imagefilledrectangle($im, $p1[0], $p1[1], $p2[0], $p2[1], $c);
					else if($value["type"] === "ellipse")
						imageellipse($im, ($p1[0] + $p2[0]) / 2, ($p1[1] + $p2[1]) / 2, abs($p2[0] - $p1[0]), abs($p2[1] - $p1[1]), $c);
					else if($value["type"] === "ellipsefill")
						imagefilledellipse($im, ($p1[0] + $p2[0]) / 2, ($p1[1] + $p2[1]) / 2, abs($p2[0] - $p1[0]), abs($p2[1] - $p1[1]), $c);
					else if($value["type"] === "darrow")
						l_darrow($im, $pts, $c);
					else
						imageline($im, $p1[0], $p1[1], $p2[0], $p2[1], $c);
					if($value["type"] === "arrow")
						l_arrow($im, $pts, $c);
					else if($value["type"] === "barrow")
						l_tarrow($im, $pts, $c);
					break;
				case 'text':
					$pts = parsePointList($value["points"]);
					$fontsize = 10;
					if (1 == $value["width"]) $fontsize = 14;
					else if (2 == $value["width"]) $fontsize = 16;
					else $fontsize = 20;
					imagettftext($im, $fontsize / 2, 0, $pts[0][0], $pts[0][1], $c, "/usr/share/fonts/vlgothic/VL-Gothic-Regular.ttf", $value["text"]);
					break;
			}
		}
	}
}
catch(Exception $e){
	echo "failed\n";
	echo $e->getMessage();
	return;
}

header('Content-Type: image/png');

imagepng($im);
imagedestroy($im);
