<?php
/**
 * Hooks for SketchCanvas extension
 *
 * @file
 * @ingroup Extensions
 */

class SketchCanvasHooks {
	/**
	 * Bind the renderPoem function to the <poem> tag
	 * @param Parser $parser
	 * @return bool true
	 */
	public static function init( &$parser ) {
		$parser->setHook('skcanvas', array( 'SketchCanvasHooks', 'wfSketchReader'));
		return true;
	}

	public static function wfSketchReader( $input, array $args, Parser $parser, PPFrame $frame){
		return htmlspecialchars( "Hello!" . $input );
	}
}
