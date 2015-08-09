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
    }

}
