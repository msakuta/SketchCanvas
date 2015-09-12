<?php
/**
 * SketchCanvas server-side renderer
 *
 * It requires GD and Yaml extensions set up for PHP in order to work.
 */

define('FONTFACE', "NotoSansCJKjp-Regular.otf");

require_once "spyc.php";

$size = Array(640, 480);
$drawdata = null;

try{
	if(isset($_GET['fname']) || isset($_POST['drawdata']) || isset($_GET['drawdata'])){
		if(isset($_GET['fname']))
			$drawdata = Spyc::YAMLLoad('data/' . $_GET['fname']);
		else if(isset($_POST['drawdata']))
			$drawdata = Spyc::YAMLLoadString($_POST['drawdata']);
		else
			$drawdata = Spyc::YAMLLoadString($_GET['drawdata']);
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

imagefilledrectangle($im, 0, 0, $size[0], $size[1], $white);

function pixelToPoint($px){
	return $px * 0.525;
}

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

function l_hige($im, $arr, $color) {
	$c = l_vec($arr, 6);
	imageline($im, $arr[1][0]-$c[0][0], $arr[1][1]-$c[0][1], $arr[1][0], $arr[1][1], $color);
	imageline($im, $arr[1][0]-$c[1][0], $arr[1][1]-$c[1][1], $arr[1][0], $arr[1][1], $color);
}

// draw star
function l_star($im, $arr, $color) {
	$x = $arr[0][0];
	$y = $arr[0][1];
	imagepolygon($im, array(
		$x+8, $y-3,
		$x+14, $y+13,
		$x, $y+2,
		$x+16, $y+2,
		$x+2, $y+13),
		5, $color);
}

// draw check
function l_check($im, $arr, $color) {
	$x = $arr[0][0];
	$y = $arr[0][1];
	imageline($im, $x, $y, $x+5, $y+7, $color);
	imageline($im, $x+5, $y+7, $x+20, $y, $color);
}

// draw complete
function l_complete($im, $arr, $color) {
	imagettftext($im, pixelToPoint(20), 0, $arr[0][0]+3, $arr[0][1]+10, $c, "/usr/share/fonts/vlgothic/VL-Gothic-Regular.ttf", '済');
	imageellipse($im, $arr[0][0]+9, $arr[0][1]+5, 16, 16, $color);
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

/// Length of 2-D vector
function veclen($a){
	return sqrt($a[0] * $a[0] + $a[1] * $a[1]);
}

/// Subtraction of 2-D vectors
function vecsub($a, $b){
	return array($a[0] - $b[0], $a[1] - $b[1]);
}

/// Distance of 2-D vectors
function vecdist($a, $b){
	return veclen(vecsub($a, $b));
}

/// Returns dividing point of line between $a and $b that divide
/// the line by $t and 1 - $t.
function midPoint($a, $b, $t){
	return array($a[0] * (1. - $t) + $b[0] * $t,
		$a[1] * (1. - $t) + $b[1] * $t);
}

/// Obtain coordinates of a point on a quadratic bezier curve.
function quadraticBezierPoint($a, $b, $c, $t){
	$ab = midPoint($a, $b, $t);
	$bc = midPoint($b, $c, $t);
	return midPoint($ab, $bc, $t);
}

/// Obtain coordinates of a point on a cubic bezier curve.
function cubicBezierPoint($a, $c, $d, $b, $t){
	$ac = midPoint($a, $c, $t);
	$cd = midPoint($c, $d, $t);
	$db = midPoint($d, $b, $t);
	$acd = midPoint($ac, $cd, $t);
	$cdb = midPoint($cd, $db, $t);
	return midPoint($acd, $cdb, $t);

}

/// Draws a cubic Bezier curve on image $im.
function cubicBezierCurve($im, $prev, $p, $color){
	$a = array($prev["x"], $prev["y"]);
	$b = array($p["x"], $p["y"]);
	$c = isset($p["cx"]) && isset($p["cy"]) ? array($p["cx"], $p["cy"]) : $a;
	$d = isset($p["dx"]) && isset($p["dy"]) ? array($p["dx"], $p["dy"]) : $b;

	// If both c and d control points are not defined, just draw a straight line,
	if((!isset($p["cx"]) || !isset($p["cy"])) && (!isset($p["dx"]) || !isset($p["dy"]))){
		imageline($im, $a[0], $a[1], $b[0], $b[1], $color);
		return;
	}

	// The curve is actually made of line segments.
	// We determine the number of segments here by first measuring
	// the rough length of the whole shape.
	$length = vecdist($a, $c)
			+ vecdist($c, $d)
			+ vecdist($d, $b);
	$divs = ceil($length / 10.); // The divisor determines how smooth the curve is.

	$a0 = $a;

	for($t = 0; $t <= $divs; $t++){
		$p1 = cubicBezierPoint($a, $c, $d, $b, $t / $divs);
		imageline($im, $a0[0], $a0[1], $p1[0], $p1[1], $color);
		$a0 = $p1;
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
					$wid = isset($value["width"]) ? $value["width"] : 1;
					imagesetthickness($im, $wid);
					imageantialias($im, $wid === 1);
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
				case 'arc':
				case 'arcarrow':
				case 'arcbarrow':
					// We emulate HTML5 Canvas's Context2D.quadraticCurveTo(),
					// which is really an implementation of quadratic Bezier curve.
					// Bezier curves are very easy to implement. See:
					// https://en.wikipedia.org/wiki/B%C3%A9zier_curve
					$pts = parsePointList($value["points"]);

					// The curve is actually made of line segments.
					// We determine the number of segments here by first measuring
					// the rough length of the whole shape.
					$length = vecdist($pts[0], $pts[1])
							+ vecdist($pts[1], $pts[2]);
					$divs = ceil($length / 20.);
					$prev = $pts[0];

					$wid = isset($value["width"]) ? $value["width"] : 1;
					imagesetthickness($im, $wid);
					imageantialias($im, $wid === 1);
					for($t = 0; $t <= $divs; $t++){
						$p1 = quadraticBezierPoint($pts[0], $pts[1], $pts[2], $t / $divs);
						imageline($im, $prev[0], $prev[1], $p1[0], $p1[1], $c);
						$prev = $p1;
					}
					if($value["type"] === "arcarrow" || $value["type"] === "arcbarrow")
						l_hige($im, array($pts[1], $pts[2]), $c);
					if($value["type"] === "arcbarrow")
						l_hige($im, array($pts[1], $pts[0]), $c);
					break;
				case 'star':
					l_star($im, parsePointList($value["points"]), $c);
					break;
				case 'check':
					l_check($im, parsePointList($value["points"]), $c);
					break;
				case 'done':
					l_complete($im, parsePointList($value["points"]), $c);
					break;
				case 'text':
					$pts = parsePointList($value["points"]);
					$fontsize = 10;
					if (1 == $value["width"]) $fontsize = 14;
					else if (2 == $value["width"]) $fontsize = 16;
					else $fontsize = 20;
					imagettftext($im, pixelToPoint($fontsize), 0, $pts[0][0], $pts[0][1], $c, FONTFACE, $value["text"]);
					break;
				case 'path':
					$pts = parsePathCommands($value["d"]);
					$wid = isset($value["width"]) ? $value["width"] : 1;
					imagesetthickness($im, $wid);
					imageantialias($im, $wid === 1);
					$prev = null;
					foreach($pts as $i => $p){
						if($prev !== null)
							cubicBezierCurve($im, $prev, $p, $c);
						$prev = $p;
					}
					if(isset($value["arrow"]) && 1 < count($pts)){
						$set = seq2set($value["arrow"]);
						if(isset($set["head"])){
							$first = $pts[0];
							$first2 = $pts[1];
							$a = array();
							if(isset($first2["cx"]) && isset($first2["cy"]) && ($first2["cx"] !== $first["x"] || $first2["cy"] !== $first["y"]))
								$a[] = array($first2["cx"], $first2["cy"]);
							else if(isset($first2["dx"]) && isset($first2["dy"]) && ($first2["dx"] !== $first["x"] || $first2["dy"] !== $first["y"]))
								$a[] = array($first2["dx"], $first2["dy"]);
							else
								$a[] = array($first2["x"], $first2["y"]);
							$a[] = array($first["x"], $first["y"]);
							l_hige($im, $a, $c);
						}
						if(isset($set["tail"])){
							$last = $pts[count($pts)-1];
							$last2 = $pts[count($pts)-2];
							$a = array();
							if(isset($last["dx"]) && isset($last["dy"]) && ($last["dx"] !== $last["x"] || $last["dy"] !== $last["y"]))
								$a[0] = array($last["dx"], $last["dy"]);
							else if(isset($last["cx"]) && isset($last["cy"]) && ($last["cx"] !== $last["x"] || $last["cy"] !== $last["y"]))
								$a[0] = array($last["cx"], $last["cy"]);
							else
								$a[0] = array($last2["x"], $last2["y"]);
							$a[1] = array($last["x"], $last["y"]);
							l_hige($im, $a, $c);
						}
					}
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

$useBase64 = false;
if(isset($_GET['base64']) || isset($_POST['base64']))
	$useBase64 = true;
else
	header('Content-Type: image/png');

if($useBase64)
	ob_start();
imagepng($im);
imagedestroy($im);
if($useBase64){
	$imagedata = ob_get_contents();
	ob_end_clean();
	print base64_encode($imagedata);
}
