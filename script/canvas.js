// Canvas Editor script

var skcanvas;

/// @brief Set strings in array to select element
///
/// @param ca An array that contains strings to added as select options.
///           Empty strings in the array are skipped.
/// @param sel The select element object to set options subelements to.
/// @returns Number of actually set options. This can differ from ca.length.
function setSelect(ca, sel) {
	var name = null;
	var option = null;
	var text = null;

	// Remember previously selected item string to try to preserve the selection
	// after the options are refreshed.  Note that remembering selectedIndex won't
	// help much because items can not only be appended but also inserted before
	// current selection.
	var oldname = 0 < sel.selectedIndex ? sel.childNodes[sel.selectedIndex].text : "";

	// clear
	var n = sel.childNodes.length;
	for (var i=n-1; i>=0; i--) sel.removeChild(sel.childNodes.item(i));

	// Counter for actually created items, empty strings in ca are ignored.
	var ii = 0;
	for(var i = 0; i < ca.length; i++){
		var name = ca[i];
		if(!name) // Skip blank lines
			continue;
		// create node
		option = document.createElement("OPTION");
		option.setAttribute("value", name);
		text = document.createTextNode(name);
		option.appendChild(text);
		sel.appendChild(option);
		if(name === oldname)
			sel.selectedIndex = ii;
		ii++;
	}
	return ii;
}

onload = function(){
	var canvas = document.getElementById('canvassample');

	skcanvas = new SketchCanvas(canvas, {editmode: true,
	debug: function(msg){
		var darea = document.getElementById('message');
		darea.innerHTML = msg;
	}});

	skcanvas.onLocalChange = function(){
		setSelect(skcanvas.listLocal(), document.forms[0].canvasselect);
	};

	skcanvas.onUpdateServerList = function(list){
		setSelect(list, document.forms[0].serverselect);
		if("showingFigureName" in this && null !== showingFigureName)
			document.forms[0].serverselect.value = showingFigureName;
	}

	skcanvas.onUpdateData = function(text){
		var drawdata = document.getElementById('drawdata');
		drawdata.value = text;
	}

	// Load saved figure list from localStorage
	setSelect(skcanvas.listLocal(), document.forms[0].canvasselect);

	// Download saved figures list from the server
	skcanvas.listServer();

	if("showingFigureName" in this && null !== showingFigureName){
		skcanvas.requestServerFile(showingFigureName);
		skcanvas.requestServerFileHistory(showingFigureName);
	}
	else if("showingData" in this && null !== showingData){
		skcanvas.loadData(showingData);
		document.getElementById('drawdata').innerHTML = showingData;
	}
}

function loadDataFromList(){
	var sel = document.forms[0].canvasselect;
	var item = sel.options[sel.selectedIndex].text;
	skcanvas.loadLocal(item);
}

function saveDataFromList(){
	var sel = document.forms[0].canvasselect;
	skcanvas.saveLocal(sel.options[sel.selectedIndex].text);
}

function loadDataFromServerList(){
	var sel = document.forms[0].serverselect;
	var item = sel.options[sel.selectedIndex].text;

	skcanvas.requestServerFile(item);

	// If history list box is not present, the server is configured to disable Git support.
	if(!document.getElementById("historyselect"))
		return;

	skcanvas.requestServerFileHistory(item, function(historyData){
		var sel = document.getElementById("historyselect");
		if(sel){
			setSelect(historyData, sel);
			sel.size = historyData.length;
		}
	});
}

function uploadDataFromServerList(){
	var sel = document.forms[0].serverselect;
	if(0 <= sel.selectedIndex)
		skcanvas.postData(sel.options[sel.selectedIndex].text, "upload.php");
}

function deleteFromServerList(){
	var sel = document.forms[0].serverselect;
	if(sel.selectedIndex < 0)
		return;
	var fname = sel.options[sel.selectedIndex].text;
	skcanvas.postData(fname, "upload.php", true);
}

function loadDataFromServerHistory(){
	var sel = document.forms[0].serverselect;
	var item = sel.options[sel.selectedIndex].text;
	var histsel = document.getElementById("historyselect");

	skcanvas.requestServerFile(item, histsel.options[histsel.selectedIndex].text.split(" ")[0]);
}

function pullServer(){
	skcanvas.pull(document.getElementById("remote").value);
}

function pushServer(){
	skcanvas.push(document.getElementById("remote").value);
}

function saveLocalNew(){
	skcanvas.saveLocal(document.getElementById('clientfname').value);
}

function uploadDataNew(){
	skcanvas.postData(document.getElementById("fname").value, "upload.php");
}

function convertPNG(){
	var xmlHttp = SketchCanvas.prototype.createXMLHttpRequest();
	if(xmlHttp){
		// The event handler is assigned here because xmlHttp is a free variable
		// implicitly passed to the anonymous function without polluting the
		// global namespace.
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState !== 4 || xmlHttp.status !== 200)
				return;
			var image = document.getElementById('imageForSave');
			image.src = "data:image/png;base64," + xmlHttp.responseText;
		};
		xmlHttp.open("POST", "phplib/image.php?base64=1", true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		var request = "&drawdata=" + encodeURI(document.getElementById("drawdata").value);
		xmlHttp.send(request);
	}
}
