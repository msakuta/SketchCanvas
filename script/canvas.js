// Canvas Editor script

var skcanvas;

onload = function(){
	var canvas = document.getElementById('canvassample');

	skcanvas = new SketchCanvas(canvas, {editmode: true});

	skcanvas.onLocalChange = function(){
		skcanvas.listLocal(document.forms[0].canvasselect);
	};

	// Load saved figure list from localStorage
	skcanvas.listLocal(document.forms[0].canvasselect);
}

