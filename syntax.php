<?php
/**
 * Plugin SKCanvas: SketchCanvas Document Embedding.
 * 
 * @license    ??? 
//GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author     Masahiro Sakuta <masahiro.sakuta@gmail.com>
 */
 
// must be run within DokuWiki
if(!defined('DOKU_INC')) die();
 
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'syntax.php');
 
/**
 * All DokuWiki plugins to extend the parser/rendering mechanism
 * need to inherit from this class
 */
class syntax_plugin_skcanvas extends DokuWiki_Syntax_Plugin {
 
    function getType(){ return 'formatting'; }
    function getAllowedTypes() { return array('formatting', 'substition', 'disabled'); }   
    function getSort(){ return 159; }
    function connectTo($mode) { $this->Lexer->addEntryPattern('<skcanvas.*?>(?=.*?</skcanvas>)',$mode,'plugin_skcanvas'); }
    function postConnect() { $this->Lexer->addExitPattern('</skcanvas>','plugin_skcanvas'); }
 
 
    /**
     * Handle the match
     */
    function handle($match, $state, $pos, &$handler){
        switch ($state) {
          case DOKU_LEXER_ENTER :
                return array($state, array(true));
 
          case DOKU_LEXER_UNMATCHED :  return array($state, $match);
          case DOKU_LEXER_EXIT :       return array($state, array(false));
        }
        return array();
    }
 
    /**
     * Create output
     */
    function render($mode, &$renderer, $data) {
        if($mode == 'xhtml'){
            list($state, $match) = $data;
            switch ($state) {
              case DOKU_LEXER_ENTER :      
                list($active) = $match;
                $renderer->doc .= '<canvas id="canvas" width="1024" height="640">
<script language="javascript" src="' . addslashes('lib/plugins/skcanvas/script/SketchCanvas.js') . '"></script>' .
'<script language="javascript" src="' . addslashes('lib/plugins/skcanvas/script/draw.js') . '"></script>' . "\n" .
'<script language="javascript" src="' . addslashes('lib/plugins/skcanvas/script/i18next-1.7.2.min.js') . '"></script>' . "\n" .
'<script language="javascript" src="' . addslashes('lib/plugins/skcanvas/script/js-yaml.min.js') . '"></script>' . "\n" .
'<script language="javascript" src="' . addslashes('lib/plugins/skcanvas/script/translation.js') . '"></script>' . "\n" .
"
<script language='javascript'>
(function(){
var skcanvas = new SketchCanvas(document.getElementById('canvas'));
var text = \"";
                break;
 
              case DOKU_LEXER_UNMATCHED :
                   list($active) = $match;
                   if($active)
                       $renderer->doc .= str_replace(array("\r", "\n"), array('\r', '\n'), addslashes($match));
                   else
                       $renderer->doc .= $renderer->_xmlEntities($match);
                   break;
              case DOKU_LEXER_EXIT :
                   $renderer->doc .= "\";
skcanvas.loadData(text);
})();
</script>";
                   break;
            }
            return true;
        }
        return false;
    }
}
?>
