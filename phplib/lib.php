<?php
/**
 * Library functions for SketchCanvas server-side renderer
 */

function parsePointList($str){
	$pl = explode(":", $str);
	$ret = array();
	foreach ($pl as $key => $value) {
		$point = explode(",", $value);
		foreach ($point as $idx => $ivalue) {
			$point[$idx] = intval($ivalue);
		}
		array_push($ret, $point);
	}
	return $ret;
}

/// See PathShape.prototype.deserialize in SketchCanvas.js
function parsePathCommands($str){
	$cmds = preg_split("/[MCLS]/", $str);

	$ret = array();
	foreach($cmds as $i => $sub){
		if($sub === "")
			continue;

		$pt2 = preg_split("/[\s,]/", $sub);

		$pt = array();
		if(6 <= count($pt2)){
			$pt["cx"] = floatval($pt2[0]);
			$pt["cy"] = floatval($pt2[1]);
		}
		if(4 <= count($pt2)){
			$pt["dx"] = floatval($pt2[count($pt2)-4]);
			$pt["dy"] = floatval($pt2[count($pt2)-3]);
		}
		$pt["x"] = floatval($pt2[count($pt2)-2]);
		$pt["y"] = floatval($pt2[count($pt2)-1]);
		array_push($ret, $pt);
	}
	return $ret;
}
