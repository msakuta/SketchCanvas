// Canvas Editor script

var skcanvas;

onload = function(){
	var canvas = document.getElementById('canvassample');

	skcanvas = new SketchCanvas(canvas, {editmode: true,
	debug: function(msg){
		var darea = document.getElementById('message');
		darea.innerHTML = msg;
	}});

	skcanvas.onLocalChange = function(){
		skcanvas.listLocal(document.forms[0].canvasselect);
	};

	skcanvas.onUpdateServerList = function(list){
		skcanvas.setSelect(list, document.forms[0].serverselect);
	}

	// Load saved figure list from localStorage
	skcanvas.listLocal(document.forms[0].canvasselect);
}

