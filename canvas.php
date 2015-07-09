<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Content-Language" content="ja" />
    <meta http-equiv="Content-Style-Type" content="text/css" />
    <meta http-equiv="Content-Script-Type" content="text/javascript" />
    <title>Canvas</title>
    <script language="javascript" src="script/draw.js"></script>
    <script language="javascript" src="script/i18next-1.7.2.min.js"></script>
    <script language="javascript" src="script/translation.js"></script>
    <script language="javascript" src="script/canvas.js"></script>
<!--    <script language="javascript" src="script/encoding.js"></script> -->
    <script src="script/js-yaml.min.js"></script>
    <style type="text/css">
<!--
body{margin: 0 0 0 0; background-color: #fff0e7}
canvas{background-color: #fff}
table{background-color: #f7c0a0; border: 3px solid #7f7f7f; border-collapse: collapse}
td{background-color: #ffe0d0}
th{background-color: #e0c0a0}
td, th{padding: 10px; border: 2px solid #7f7f7f}
-->
    </style>
  </head>
  <body>
    <canvas id="canvassample" width="1024" height="640"></canvas>
    <form name="form1" method="POST" action="upload.php" enctype="multipart/form-data">
      <table>
        <tr><th></th><th>Client figures</th><th>Server figures <sup>(*)</sup></th></tr>
        <tr>
          <th>Saved figures</th>
          <td>
            <select name="canvasselect"><option value="0">no select</option></select>
            <input type="button" value="Show" onclick="loadDataFromList()">
            <input type="button" value="Save (overwrite)" onclick="saveDataFromList()">
          </td>
          <td>
            Name: <select name="serverselect"><option value="0">no select</option></select>
            <input type="button" value="Show" onclick="loadDataFromServerList()">
            <input type="button" value="Upload (overwrite)" onclick="uploadDataFromServerList()">
            <input type="button" value="Delete" onclick="deleteFromServerList()"><br>
            History: <select id="historyselect"></select>
            <input type="button" value="Show Revision" onclick="loadDataFromServerHistory()">
          </td>
        </tr>
        <tr>
          <th>New figure</th>
          <td>
            <input type="text" id="clientfname" name="clientfname" value="default">
            <input type="button" value="Save (new)" onclick="saveDataNew()">
          </td>
          </td>
          <td>
            <input type="text" id="fname" name="fname" value="default">
            <input type="button" value="Upload (new)" onclick="uploadDataNew()">
          </td>
        </tr>
      </table>
      <p style="font-size:14px">(*) Requires PHP configured server.
Also note that history will work only if Git client is set up in the server.</p>
      <p>Message:<span id="message"></span></p>
      <p>Draw data: <input type="button" value="Load" onclick="loadData()"></p>
      <textarea id="drawdata" name="drawdata" rows="10" cols="50"></textarea>
    </form>
    <p>This application uses <a href="https://github.com/nodeca/js-yaml">js-yaml</a> JavaScript library.
    It's license is found in <a href="script/LICENSE">LICENSE</a> file.</p>
  </body>
</html>
