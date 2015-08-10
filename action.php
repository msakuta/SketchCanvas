<?php
/**
 * DokuWiki Plugin skcanvas (Action Component)
 *
 * @license ???
 * @author  Masahiro Sakuta
 */

// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();

/**
 * Add scripts via an event handler
 */
class action_plugin_skcanvas extends DokuWiki_Action_Plugin {

    /**
     * Register handler for the TPL_METAHEADER_OUTPUT event
     */
    public function register(Doku_Event_Handler $controller) {
       $controller->register_hook('TPL_METAHEADER_OUTPUT', 'BEFORE', $this, 'metaheader');

       $controller->register_hook('HTML_SECEDIT_BUTTON', 'BEFORE', $this, 'editButton');
       $controller->register_hook('HTML_EDIT_FORMSELECTION', 'BEFORE', $this, 'editForm');
       $controller->register_hook('ACTION_ACT_PREPROCESS', 'BEFORE', $this, 'handle_newfigure');

       $controller->register_hook('TOOLBAR_DEFINE', 'AFTER', $this, 'toolbarDefine');
    }

    /**
     * Add <script> blocks to the headers
     *
     * Scripts are ought to be included via script.js on the plugin root directory, but
     * it doesn't work if compress option (discarding whitespaces) is ative, so we have to
     * include the necessary scripts individually in the header.
     *
     * @param Doku_Event $event
     * @param            $param
     */
    public function metaheader(Doku_Event &$event, $param) {
        $files = array('SketchCanvas.js', 'draw.js', /*'i18next-1.7.2.min.js', 'js-yaml.min.js',*/ 'translation.js');
        foreach($files as $file)
            $event->data['script'][] = array(
                'type'    => 'text/javascript',
                'charset' => 'utf-8',
                'src'     => 'lib/plugins/' . $this->getPluginName() . '/script/' . $file,
                '_data'   => '',
    	           );
        $event->data['script'][] = array(
            'type'    => 'text/javascript',
            'charset' => 'utf-8',
            '_data'   => <<<EOT
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
EOT
               );
    }

    public function editButton(Doku_Event $event, $param){
        if($event->data['target'] !== 'plugin_skcanvas')
            return;

        $event->data['name'] = /*$this->getLang*/('Edit Figure');
    }

    public function editForm(Doku_Event $event, $param){
        global $TEXT;
        if($event->data['target'] !== 'plugin_skcanvas')
            return;
        $event->preventDefault();

        $event->data['media_manager'] = false;

        $escText = '"' . str_replace(array("\r", "\n"), array('\r', '\n'), addslashes($TEXT)) . '"';

        $form =& $event->data['form'];
        $canvasText = <<<EOT
<canvas id="editcanvas"></canvas>
<script type="text/javascript"><!--
(function(){
    var skcanvas = new SketchCanvas(document.getElementById('editcanvas'), {editmode: true});
    skcanvas.loadData($escText);
    skcanvas.onUpdateData = function(data){
        var wikitext = document.getElementById('wiki__text');
        wikitext.innerHTML = data;
    }
})();
--></script>
<textarea name="wikitext" id="wiki__text" class="edit" cols="80" rows="10">$TEXT</textarea>
EOT;
        $form->addElement($canvasText);

        // Pass wikitext through POSTs for previewing and saving
        if(isset($_POST['editfigure__new'])) {
            foreach($_POST['editfigure__new'] as $k => $v) {
                $form->addHidden("editfigure__new[$k]", $v);
            }
        }
    }

    /**
     * Add a toolbar button to add a new figure
     *
     * @param Doku_Event $event
     */
    public function toolbarDefine(Doku_Event $event, $param){
        $event->data[] = array(
            'type' => 'NewFigure',
            'title' => 'New Figure',
            'icon' => '../../plugins/' . $this->getPluginName() . '/images/figure.png',
            'block' => true);
    }

    /**
     * Handle the click on the new figure button in the toolbar
     *
     * @param Doku_Event $event
     */
    function handle_newfigure($event) {
        global $INPUT;
        global $TEXT;
        global $ACT;

        if(!$INPUT->post->has('editfigure__new')) return;

        /*
         * $fields['pre']  has all data before the selection when the "Insert table" button was clicked
         * $fields['text'] has all data inside the selection when the "Insert table" button was clicked
         * $fields['suf']  has all data after the selection when the "Insert table" button was clicked
         * $TEXT has the table created by the editor (from action_plugin_edittable_editor::handle_table_post())
         */
        $fields = $INPUT->post->arr('editfigure__new');

        // clean the fields (undos formText()) and update the post and request arrays
        $fields['pre'] = cleanText($fields['pre']);
        $fields['text'] = cleanText($fields['text']);
        $fields['suf'] = cleanText($fields['suf']);
        $INPUT->post->set('editfigure__new', $fields);


        $ACT = act_clean($ACT);
        switch($ACT){
            case 'preview':
                // preview view of a table edit
                $INPUT->post->set('target', 'plugin_skcanvas');
                break;
            case 'edit':
                // edit view of a table (first edit)
                $INPUT->post->set('target', 'plugin_skcanvas');
                $TEXT = "";
                foreach(explode("\n", $fields['text']) as $line) {
                    $TEXT .= "$line\n";
                }
                break;
            case 'draftdel':
                // not sure if/how this would happen, we restore all data and hand over to section edit
                $INPUT->post->set('target', 'section');
                $TEXT = $fields['pre'].$fields['text'].$fields['suf'];
                $ACT  = 'edit';
                break;
            case 'save':
                // return to edit page
                $INPUT->post->set('target', 'section');
                $TEXT = $fields['pre']."<skcanvas>\n".$TEXT."</skcanvas>".$fields['suf'];
                $ACT  = 'edit';
                break;
        }
    }
}
