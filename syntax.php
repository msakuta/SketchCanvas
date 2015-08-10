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
 
    /// Generator for canvas ids
    var $generator = 1;

    /**
     * Handle the match
     */
    function handle($match, $state, $pos, &$handler){
        switch ($state) {
          case DOKU_LEXER_ENTER :
                return array($state, array(true, $this->generator, 'bytepos_start' => $pos + strlen($match)));

          case DOKU_LEXER_UNMATCHED : return array($state, $match);
          case DOKU_LEXER_EXIT :       return array($state, array(false, $this->generator++, 'bytepos_end' => $pos));
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
                list($active, $num) = $match;
                $class = '';
                if(method_exists($renderer, 'startSectionEdit'))
                  $class = $renderer->startSectionEdit($match['bytepos_start'], 'plugin_skcanvas');
                $canvasId = '__sketchcanvas' . $num;
                $renderer->doc .= <<<EOT
<div class="$class">
<canvas id="$canvasId" width="1024" height="640"></canvas>
<div id="__sketchcanvas_text$num" style="display: none">
EOT;
                break;
 
              case DOKU_LEXER_UNMATCHED :
                   list($active) = $match;
                   if($active)
                       $renderer->doc .= /*str_replace(array("\r", "\n"), array('\r', '\n'), addslashes*/($renderer->_xmlEntities($match));
                   else
                       $renderer->doc .= $renderer->_xmlEntities($match);
                   break;
              case DOKU_LEXER_EXIT :
                  list($active, $num) = $match;
                   $renderer->doc .= <<<EOT
</div>
</div>
EOT;
                if(method_exists($renderer, 'finishSectionEdit'))
                  $renderer->finishSectionEdit($match['bytepos_end']);
                break;
            }
            return true;
        }
        return false;
    }
}
?>
