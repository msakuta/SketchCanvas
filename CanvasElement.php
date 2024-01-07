<?php

/**
 * Class CanvasElement
 *
 * A custom element used for DokuWiki "Igor" and later, where old JavaScript injection won't work anymore.
 *
 * This is not a general-purpose element. It is strictly designed for sketchcanvas plugin.
 */
class CanvasElement extends dokuwiki\Form\InputElement
{
    /**
     * @var string the actual text within the area
     */
    protected $text;

    /**
     * @param string $name The name of this form element
     * @param string $label The label text for this element
     */
    public function __construct()
    {
        parent::__construct('canvas', 'canvas', '');
    }

        /**
     * Get or set the element's value
     *
     * This is the preferred way of setting the element's value
     *
     * @param null|string $value
     * @return string|$this
     */
    public function val($value = null)
    {
        if ($value !== null) {
            $this->text = $value;
            return $this;
        }
        return $this->text;
    }

    /**
     * The HTML representation of this element
     *
     * @return string
     */
    protected function mainElementHTML()
    {
        $escText = '"' . str_replace(array("\r", "\n"), array('\r', '\n'), addslashes($this->text)) . '"';

        $attrs = buildAttributes($this->attrs());

        $canvasText = <<<EOT
<canvas id="editcanvas" $attrs></canvas>
<script type="text/javascript"><!--
var skcanvas;
document.addEventListener('DOMContentLoaded', function(){
    skcanvas = new SketchCanvas(document.getElementById('editcanvas'), {editmode: true});
    skcanvas.loadData($escText);
    skcanvas.onUpdateData = function(data){
        var wikitext = document.getElementById('wiki__text');
        wikitext.value = data;
    }
});
--></script>
<input type="button" value="Load data from text" onclick="skcanvas.loadData(document.getElementById('wiki__text').value)">
<textarea name="wikitext" id="wiki__text" class="edit" cols="80" rows="10">$this->text</textarea>
EOT;
        return $canvasText;
    }

}
