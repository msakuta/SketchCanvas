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

/// @brief Converts a sequence (array) to a set (object)
///
/// Due to a limitation in js-yaml JavaScript library, a set is represented
/// as a sequence in the YAML document.  PHP neither supports set type,
/// so let's port the function from JavaScript to PHP.
///
/// @sa set2seq
function seq2set($seq){
	$ret = array();
	for($i = 0; $i < count($seq); $i++){
		if($seq[$i] === "")
			continue;
		$ret[$seq[$i]] = TRUE;
	}
	return $ret;
}

/// @brief Converts a set (object) to a sequence (array)
/// @sa seq2set
function set2seq($set){
	$ret = array();
	foreach ($set as $i) {
		if(i === "")
			continue;
		$ret[] = $i;
	}
	return $ret;
}
