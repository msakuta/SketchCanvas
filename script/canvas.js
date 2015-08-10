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
		if(null !== showingFigureName)
			document.forms[0].serverselect.value = showingFigureName;
	}

	skcanvas.onUpdateData = function(text){
		var drawdata = document.getElementById('drawdata');
		drawdata.value = text;
	}

	// Load saved figure list from localStorage
	skcanvas.listLocal(document.forms[0].canvasselect);

	// Download saved figures list from the server
	skcanvas.listServer();

	if(null !== showingFigureName){
		skcanvas.requestServerFile(showingFigureName);
		skcanvas.requestServerFileHistory(showingFigureName);
	}
	else if(null !== showingData){
		skcanvas.loadData(showingData);
		document.getElementById('drawdata').innerHTML = showingData;
	}
}

