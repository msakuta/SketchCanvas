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
