<?php
/**
 * Hooks for SketchCanvas extension
 *
 * @file
 * @ingroup Extensions
 */

class SketchCanvasHooks {
	/**
	 * Bind the wfSketchReader function to the <skcanvas> tag
	 * @param Parser $parser
	 * @return bool true
	 */
	public static function init( &$parser ) {
		$parser->setHook('skcanvas', array( 'SketchCanvasHooks', 'wfSketchReader'));
		return true;
	}

	private static $canvasNum = 1;

	public static function wfSketchReader( $input, array $args, Parser $parser, PPFrame $frame){
		$num = self::$canvasNum++;
		$canvasId = '__sketchcanvas' . $num;
		$text = <<<EOT
<canvas id="$canvasId" width="1024" height="640"></canvas>
<div id="__sketchcanvas_text$num" style="display: none">
EOT;
		return  array( $text . htmlspecialchars($input ) . "</div>", "markerType" => 'nowiki');
	}

	public static function addHeader(&$parser, &$text){
		global $wgScriptPath;
		global $addJqueryScripts;
		if($addJqueryScripts === true)
			return true;
		$path = "$wgScriptPath/extensions/SketchCanvas/script";
		$scripts = <<<EOT
<script type="text/javascript" src="$path/i18next-1.7.2.min.js"></script>
<script type="text/javascript" src="$path/js-yaml.min.js"></script>
<script type="text/javascript" src="$path/SketchCanvas.js"></script>
<script type="text/javascript" src="$path/draw.js"></script>
<script type="text/javascript" src="$path/translation.js"></script>
<script type="text/javascript"><!--
document.addEventListener('DOMContentLoaded', function(){
    var canvas;
    for(var i = 1; (canvas = document.getElementById("__sketchcanvas" + i)); i++) {
        var text = document.getElementById("__sketchcanvas_text" + i);
        if(text) {
            var skcanvas = new SketchCanvas(canvas);
            skcanvas.loadData(text.innerHTML);
            var form = document.forms['__sketchcanvas_form' + i];
            if(form){
                var input = document.createElement('input');
                input.type = 'hidden';
                input.name = "data";
                input.value = text.innerHTML;
                form.appendChild(input);
            }
        }
    }
});
--></script>
EOT;
		$parser->mOutput->addHeadItem($scripts);

		$addJqueryScripts = true;
		return true;
	}
}
