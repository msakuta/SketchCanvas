/// @brief The SketchCanvas class accepts a canvas object to draw on.
///
/// Make sure to invoke this class's constructor with "new" prepended
/// and keep the returned object to some variable.
function SketchCanvas(canvas){
// Obtain the browser's preferred language.
var currentLanguage = (window.navigator.language || window.navigator.userLanguage || window.navigator.userLanguage).substr(0, 2);

i18n.init({lng: currentLanguage, fallbackLng: 'en', resStore: resources, getAsync: false});

var dobjs; // Drawing objects
var dhistory; // Drawing object history (for undoing)

// Called at the end of the constructor
function onload(){

  // Check existence of canvas element and treating not compatible browsers
  if ( ! canvas || ! canvas.getContext ) {
    return false;
  }

  canvas.onclick = mouseLeftClick;

  // 2D context
  ctx = canvas.getContext('2d');
  draw();

  // Draw objects
  dobjs = [];

  // And the history of operations
  dhistory = [];

  // Load saved figure list from localStorage
  ajaxsearch(0);

  // Download saved figures list from the server
  downloadList();
};

var datadir = "data";

function draw() {
  // Draw a rectangle
  ctx.beginPath();
  ctx.strokeStyle = 'rgb(192, 192, 77)'; // yellow
		ctx.font = i18n.t("14px 'Courier'");
  ctx.strokeText('Canvas v1.00', 420, 10);
  ctx.rect(x0, y0, w0, h0);
  ctx.rect(x1, y1, w1, h1);
  ctx.closePath();
  ctx.stroke();

  // menu
  drawMenu(0);
  drawTBox(cur_tool);
  drawCBox(cur_col);
  drawHBox(cur_thin);
};

// draw coord(for Debug)
function drawPos(x, y) {
  ctx.strokeText('X='+x+' Y='+y, x, y);
}

// Menu
function drawMenu(no) {
	for(var i=0;i<7;i++) {
		if (no == i+1)
			ctx.fillStyle = 'rgb(120, 255, 120)'; // green
		else
			ctx.fillStyle = 'rgb(100, 200, 100)'; // green
		ctx.fillRect(mx1+i*(mw1+10), my0, mw1, mh0);
		//ctx.strokeStyle = 'rgb(50, 192, 177)'; // cyan
		ctx.strokeStyle = 'rgb(250, 250, 250)'; // white
		ctx.strokeText(menustr[i], mx1+10+i*(mw1+10), my0+20);
	}
}

// Tool Box
function drawTBox(no) {
	for(var i=0;i<15;i++) {
		if (no == i+11)
			ctx.fillStyle = 'rgb(255, 80, 77)'; // red
		else
			ctx.fillStyle = 'rgb(192, 80, 77)'; // red
		ctx.fillRect(mx0, my0+40*i, mw0, mh0);
		ctx.strokeStyle = 'rgb(250, 250, 250)'; // white
		drawParts(i+11, mx0+10, my0+10+(mh0+10)*i);
	}
}

// Color Palette
function drawCBox(no) {
	for(var i=0;i<5;i++) {
		ctx.beginPath();
		ctx.fillStyle = colstr[i];
		var x = mx2+(mw2+10)*i;
		ctx.fillRect(x, my0, mw2, mh0);
		ctx.stroke();
		if (4==i) {		// border line if white
			ctx.beginPath();
			//ctx.lineWidth = 1;
			ctx.strokeStyle = gray;
			ctx.rect(x, my0, mw2, mh0);
			ctx.stroke();
		}
		if (no == i+31) {
			ctx.beginPath();
			ctx.strokeStyle = gray;
			ctx.strokeText('○', x+9, my0+20);
		}
	}
}

// Thin Box
function drawHBox(no) {
	for(var i=0;i<3;i++) {
		ctx.beginPath();
		if (no == i+41)
			ctx.fillStyle = 'rgb(255, 80, 77)'; // red
		else
			ctx.fillStyle = 'rgb(192, 80, 77)'; // red
		ctx.fillRect(mx3+(mw2+10)*i, my0, mw2, mh0);
		ctx.beginPath();
		ctx.strokeStyle = white;
		ctx.lineWidth = i + 1;
		ctx.moveTo(mx3+(mw2+10)*i+10, my0+15);
		ctx.lineTo(mx3+(mw2+10)*i+25, my0+15);
		ctx.stroke();
	}
	ctx.lineWidth = 1;
}

// draw toolbox
function drawParts(no, x, y) {
	var a = new Array(3);
	switch (no) {
	case 11:		// line
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x+40, y+10);
		ctx.stroke();
		ctx.strokeText('2', x+45, y+10);
		break;
	case 12:		// arrow
		ctx.beginPath();
		a[0] = {x:x, y:y+5};
		a[1] = {x:x+40, y:y+5};
		l_arrow(ctx, a);
		ctx.strokeText('2', x+45, y+10);
		break;
	case 13:		// twin arrow
		ctx.beginPath();
		a[0] = {x:x, y:y+5};
		a[1] = {x:x+40, y:y+5};
		l_tarrow(ctx, a);
		ctx.strokeText('2', x+45, y+10);
		break;
	case 14:		// double arrow
		ctx.beginPath();
		ctx.moveTo(x, y+3);
		ctx.lineTo(x+39, y+3);
		ctx.moveTo(x, y+7);
		ctx.lineTo(x+39, y+7);
		ctx.moveTo(x+35, y);
		ctx.lineTo(x+40, y+5);
		ctx.lineTo(x+35, y+10);
		ctx.stroke();
		ctx.strokeText('2', x+45, y+10);
		break;
	case 15:		// arc
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.quadraticCurveTo(x+20, y+20, x+40, y);
		ctx.stroke();
		ctx.strokeText('3', x+45, y+10);
		break;
	case 16:		// arc arrow
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.quadraticCurveTo(x+20, y+20, x+40, y);
		a[0] = {x:x+20, y:y+20};
		a[1] = {x:x+40, y:y};
		l_hige(ctx, a);
		ctx.strokeText('3', x+45, y+10);
		break;
	case 17:		// twin arc arrow
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.quadraticCurveTo(x+20, y+20, x+40, y);
		a[0] = {x:x+20, y:y+20};
		a[1] = {x:x+40, y:y};
		l_hige(ctx, a);
		//a[0] = {x:x+10, y:y+10};
		a[1] = {x:x, y:y};
		l_hige(ctx, a);
		ctx.strokeText('3', x+45, y+10);
		break;
	case 18:		// rect
		ctx.beginPath();
		ctx.rect(x, y, 40, 10);
		ctx.stroke();
		ctx.strokeText('2', x+45, y+10);
		break;
	case 19:		// elipse
		ctx.beginPath();
		ctx.scale(1.0, 0.5);		// vertically half
		ctx.arc(x+20, (y+5)*2, 20, 0, 2 * Math.PI, false);
		ctx.stroke();
		ctx.scale(1.0, 2.0);
		ctx.strokeText('2', x+45, y+10);
		break;
	case 20:		// rect fill
		ctx.beginPath();
		ctx.fillStyle = 'rgb(250, 250, 250)';
		ctx.fillRect(x, y, 40, 10);
		ctx.strokeText('2', x+45, y+10);
		break;
	case 21:		// elipse fill
		ctx.beginPath();
		ctx.fillStyle = 'rgb(250, 250, 250)';
		ctx.scale(1.0, 0.5);		// vertically half
		ctx.arc(x+20, (y+5)*2, 20, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.scale(1.0, 2.0);
		ctx.strokeText('2', x+45, y+10);
		break;
	case 22:		//star
		ctx.beginPath();
		ctx.moveTo(x+8, y-3);
		ctx.lineTo(x+14, y+13);
		ctx.lineTo(x, y+2);
		ctx.lineTo(x+16, y+2);
		ctx.lineTo(x+2, y+13);
		ctx.closePath();
		ctx.stroke();
		ctx.strokeText('1', x+45, y+10);
		break;
	case 23:		// check
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x+5, y+7);
		ctx.lineTo(x+20, y);
		ctx.stroke();
		ctx.strokeText('1', x+45, y+10);
		break;
	case 24:		// complete
		ctx.beginPath();
		ctx.strokeText(i18n.t('Done'), x+3, y+10);
		ctx.beginPath();
		ctx.arc(x+9, y+5, 8, 0, 6.28, false);
		ctx.stroke();
		ctx.strokeText('1', x+45, y+10);
		break;
	case 25:		// text
		ctx.beginPath();
		ctx.strokeText(i18n.t('Text'), x+3, y+10);
		ctx.strokeText('1', x+45, y+10);
		break;
	default:
		ctx.strokeText(i18n.t('Unimplemented'), x, y);
	}
}


function mouseLeftClick(e) {
	if (3 == e.which) mouseRightClick(e);
	else {
		var menuno = checkMenu(e.pageX, e.pageY);
		debug(menuno);
		if (menuno == 0) {		// draw area
			draw_point(e.pageX, e.pageY);
		}
		else if (menuno <= 10) {
			drawMenu(menuno);
			cur_menu = menuno;
			if (1 == cur_menu) {	// save
				ajaxsave();
			}
			else if (2 == cur_menu) {	// list
				//clearCanvas();
				ajaxsearch(0);
			}
			else if (3 == cur_menu) {	// search
				//clearCanvas();
				ajaxsearch(1);
			}
			else if (4 == cur_menu) {	// clear
				clearCanvas();
				ajaxclear();
			}
			else if (5 == cur_menu) {	// redraw
				clearCanvas();
				ajaxredraw(selectedID());
			}
			else if (6 == cur_menu) {	// undo
				clearCanvas();
				ajaxundo();
			}
			else if (7 == cur_menu) {	// append
				ajaxappend();
			}
			else if (8 == cur_menu) {	// append
				postSave();
			}
		}
		else if (menuno <= 30) {
			drawTBox(menuno);
			cur_tool = menuno;
			idx = 0;
		}
		else if (menuno <= 40) {
			drawCBox(menuno);
			cur_col = colnames[menuno-31];
		}
		else {
			drawHBox(menuno);
			cur_thin = menuno - 40;
		}
		//if (1 == menuno) debug('x='+arr[0].x + 'y='+arr[0].y);
	}
}

function mouseRightClick(e) {
	//drawPos(e.pageX, e.pageY);
	//cood = { x:e.pageX, y:e.pageY }
	//arr[idx] = cood;
	//idx++;
	debug('idx='+idx);
}

// draw one click
function draw_point(x, y) {
	debug('idx='+idx+',x='+x+',y='+y);
	cood = { x:x, y:y }
	arr[idx] = cood;
	idx++;
	if (idx == points()) drawCanvas(0, null);
}

// return tool points
function points() {
	if (cur_tool >=22 && cur_tool <=25) return 1;
	else if (cur_tool >=15 && cur_tool <=17) return 3;
	else return 2;
}

// draw parts
function drawCanvas(mode, str) {
	// DEBUG
	//if (1 == mode) alert("tool="+cur_tool+",col="+cur_col+",thin ="+cur_thin);
	var numPoints = 2;
	switch(cur_tool){
		// Set fillStyle only if the tool is filler.
		case 20: case 21: case 25: ctx.fillStyle = coltable[cur_col]; break;
		default:  ctx.strokeStyle = coltable[cur_col]; break;
	}

	switch(cur_tool){
		case 20: case 22: case 23: case 24: break;
		case 25: ctx.lineWidth = cur_thin - 1; break;
		default: ctx.lineWidth = cur_thin; break;
	}

	switch (cur_tool) {
	case 11:	// line
		ctx.beginPath();
		ctx.moveTo(arr[0].x, arr[0].y);
		ctx.lineTo(arr[1].x, arr[1].y);
		ctx.stroke();
		ctx.lineWidth = 1;
		break;
	case 12:	// arrow
		ctx.beginPath();
		l_arrow(ctx, arr);
		ctx.lineWidth = 1;
		break;
	case 13:	// twin arrow
		ctx.beginPath();
		l_tarrow(ctx, arr);
		ctx.lineWidth = 1;
		break;
	case 14:	// double arrow
		ctx.beginPath();
		l_darrow(ctx, arr);
		ctx.lineWidth = 1;
		break;
	case 15:	// arc
		ctx.beginPath();
		ctx.moveTo(arr[0].x, arr[0].y);
		ctx.quadraticCurveTo(arr[1].x, arr[1].y, arr[2].x, arr[2].y);
		ctx.stroke();
		ctx.lineWidth = 1;
		numPoints = 3;
		break;
	case 16:	// arc arrow
		ctx.beginPath();
		ctx.moveTo(arr[0].x, arr[0].y);
		ctx.quadraticCurveTo(arr[1].x, arr[1].y, arr[2].x, arr[2].y);
		var a = new Array(2);
		a[0] = arr[1];
		a[1] = arr[2];
		l_hige(ctx, a);
		ctx.lineWidth = 1;
		numPoints = 3;
		break;
	case 17:	// arc twin arrow
		ctx.beginPath();
		ctx.moveTo(arr[0].x, arr[0].y);
		ctx.quadraticCurveTo(arr[1].x, arr[1].y, arr[2].x, arr[2].y);
		var a = new Array(2);
		a[0] = arr[1];
		a[1] = arr[2];
		l_hige(ctx, a);
		a[1] = arr[0];
		l_hige(ctx, a);
		ctx.lineWidth = 1;
		numPoints = 3;
		break;
	case 18:	// rect
		ctx.beginPath();
		ctx.rect(arr[0].x, arr[0].y, arr[1].x-arr[0].x, arr[1].y-arr[0].y);
		ctx.stroke();
		ctx.lineWidth = 1;
		break;
	case 19:	// elipse
		ctx.beginPath();
		l_elipse(ctx, arr);
		ctx.lineWidth = 1;
		break;
	case 20:	// rect fill
		ctx.beginPath();
		ctx.fillRect(arr[0].x, arr[0].y, arr[1].x-arr[0].x, arr[1].y-arr[0].y);
		break;
	case 21:	// elipse fill
		ctx.beginPath();
		l_elipsef(ctx, arr);
		ctx.lineWidth = 1;
		break;
	case 22:	// star
		ctx.beginPath();
		//ctx.lineWidth = cur_thin - 40;
		l_star(ctx, arr);
		ctx.lineWidth = 1;
		numPoints = 1;
		break;
	case 23:	// check
		ctx.beginPath();
		l_check(ctx, arr);
		numPoints = 1;
		break;
	case 24:	// complete
		ctx.beginPath();
		l_complete(ctx, arr);
		numPoints = 1;
		break;
	case 25:	// string
		if (0 == mode) str = prompt(i18n.t("String") + ":", "");
		if (null == str) {		// cancel
			idx = 0;
			return;
		}
		ctx.beginPath();
		
		if (1 == cur_thin) ctx.font = i18n.t("14px 'Helvetica'");
		else if (2 == cur_thin) ctx.font = i18n.t("16px 'Helvetica'");
		else ctx.font = i18n.t("20px 'Helvetica'");
		ctx.fillText(str, arr[0].x, arr[0].y);
		ctx.font = i18n.t("14px 'Helvetica'");
		numPoints = 1;
		break;
	default:
		debug("illegal tool no "+cur_tool);
	}

	function tool2str(tool){
		switch(tool){
		case 11: return "line";
		case 12: return "arrow";
		case 13: return "barrow";
		case 14: return "dallow";
		case 15: return "arc";
		case 16: return "arcarrow";
		case 17: return "arcbarrow";
		case 18: return "rect";
		case 19: return "ellipse";
		case 20: return "rectfill";
		case 21: return "ellipsefill";
		case 22: return "star";
		case 23: return "check";
		case 24: return "done";
		case 25: return "text";
		default: return tool;
		}
	}

	function set_default(t,k,v,def){
		if(v !== def) 
			t[k] = v;
	}

	if (0 == mode) {	// regist
		// send parts to server
		var dat = "";
		for (var i=0; i<numPoints; i++){
			if(i !== 0) dat += ":";
			dat += arr[i].x+","+arr[i].y;
		}
		var alldat = {
			type: tool2str(cur_tool),
			points: dat,
		};
		// Values with defaults needs not assigned a value when saved.
		// This will save space if the drawn element properties use many default values.
		set_default(alldat, "color", cur_col, "black");
		set_default(alldat, "width", cur_thin, 1);
		if (25 == cur_tool) alldat.text = str;
		ajaxparts(alldat);
	}
	// clear
	idx = 0;
	
}
// redraw
function redraw(pt) {
	// backup
	var org_tool = cur_tool;
	var org_col = cur_col;
	var org_thin = cur_thin;
//	var pt = str.split(",");

	function str2tool(str){
		switch(str){
		case "line": return 11;
		case "arrow": return 12;
		case "barrow": return 13;
		case "dallow": return 14;
		case "arc": return 15;
		case "arcarrow": return 16;
		case "arcbarrow": return 17;
		case "rect": return 18;
		case "ellipse": return 19;
		case "rectfill": return 20;
		case "ellipsefill": return 21;
		case "star": return 22;
		case "check": return 23;
		case "done": return 24;
		case "text": return 25;
		default: return str;
		}
	}

	//alert("pt length="+pt.length);
	for (var i=0; i<pt.length; i++) {
		var obj = pt[i];
		var pt1 = obj.points.split(":");
		cur_tool = str2tool(obj.type);
		cur_col = obj.color || "black";
		cur_thin = obj.width || 1;
		for(var j = 0; j < pt1.length; j++){
			var pt2 = pt1[j].split(",");
			arr[j] = {x:pt2[0]-0, y:pt2[1]-0};
		}
		for(var j = pt1.length; j < 3; j++){
			arr[j] = {x:0, y:0};
		}
		var rstr = null;
		if (25 == cur_tool) rstr = obj.text;
		drawCanvas(1, rstr);
	}

	// restore tools
	cur_tool = org_tool;
	cur_col = org_col;
	cur_thin = org_thin;
}

this.loadData = function(){
	var drawdata = document.getElementById("drawdata");
	try{
		dobjs = jsyaml.safeLoad(drawdata.value);
		clearCanvas();
		redraw(dobjs);
	} catch(e){
		console.log(e);
	}
}

this.loadDataFromList = function(){
	var sel = document.forms[0].canvasselect;
	var item = sel.options[sel.selectedIndex].text;
	try{
		var origData = localStorage.getItem("canvasDrawData");
		if(origData === null)
			return;
		var selData = jsyaml.safeLoad(origData);
		dobjs = jsyaml.safeLoad(selData[item]);
		updateDrawData();
		clearCanvas();
		redraw(dobjs);
	} catch(e){
		console.log(e);
	}
}

// Downloads the file list from the server.
function downloadList(){
	// Asynchronous request for getting figure data in the server.
	var xmlHttp = createXMLHttpRequest();
	if(xmlHttp){
		// The event handler is assigned here because xmlHttp is a free variable
		// implicitly passed to the anonymous function without polluting the
		// global namespace.
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState !== 4 || xmlHttp.status !== 200)
				return;
			try{
				var selData = xmlHttp.responseText;
				if(!selData)
					return;
				setSelect(selData.split("\n"), document.forms[0].serverselect);
			}
			catch(e){
				console.log(e);
			}
		};
		xmlHttp.open("GET", "list.php", true);
		xmlHttp.send();
	}
}

function requestServerFile(item, hash){
	// Asynchronous request for getting figure data in the server.
	var xmlHttp = createXMLHttpRequest();
	if(xmlHttp){
		var request;
		// The event handler is assigned here because xmlHttp is a free variable
		// implicitly passed to the anonymous function without polluting the
		// global namespace.
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState !== 4 || xmlHttp.status !== 200)
				return;
			try{
				var selData = xmlHttp.responseText;
				if(!selData)
					return;
				if(hash){
					var firstLine = selData.split("\n", 1)[0];
					if(firstLine !== "succeeded")
						throw "Failed to obtain revision " + selData;
					selData = selData.substr(selData.indexOf("\n")+1);
				}
				dobjs = jsyaml.safeLoad(selData);
				updateDrawData();
				clearCanvas();
				redraw(dobjs);
			}
			catch(e){
				debug(e);
			}
		};
		if(!hash)
			request = datadir + "/" + encodeURI(item);
		else
			request = "history.php?fname=" + encodeURI(item) + "&hash=" + encodeURI(hash);
		xmlHttp.open("GET", request, true);
		xmlHttp.send();
	}
}

this.loadDataFromServerList = function(){
	var sel = document.forms[0].serverselect;
	var item = sel.options[sel.selectedIndex].text;

	requestServerFile(item);

	var historyQuery = createXMLHttpRequest();
	if(historyQuery){
		historyQuery.onreadystatechange = function(){
			if(historyQuery.readyState !== 4 || historyQuery.status !== 200)
				return;
			try{
				var res = historyQuery.responseText;
				if(!res)
					return;
				var historyData = res.split("\n");
				if(historyData[0] !== "succeeded")
					return;
				historyData = historyData.splice(1);
				var sel = document.getElementById("historyselect");
				if(sel){
					setSelect(historyData, sel);
					sel.size = historyData.length;
				}
			}
			catch(e){
				console.log(e);
			}
		};
		historyQuery.open("GET", "history.php?fname=" + encodeURI(item), true);
		historyQuery.send();
	}
}

this.loadDataFromServerHistory = function(){
	var sel = document.forms[0].serverselect;
	var item = sel.options[sel.selectedIndex].text;
	var histsel = document.getElementById("historyselect");

	requestServerFile(item, histsel.options[histsel.selectedIndex].text.split(" ")[0]);
}

// clear canvas
function clearCanvas() {
	ctx.fillStyle = white;
	ctx.fillRect(x1,y1, w1, h1);
	idx = 0;
	zorder = 0;
}

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

// obtain an id from selection
function selectedID() {
	var name = null;
	var option = null;
	var text = null;
	var sel = document.forms[0].canvasselect;
	var idx = sel.selectedIndex;
	return sel.options[idx].value;
}

// check all menu
function checkMenu(x, y) {
	var no = choiceMenu(x, y);
	if (no > 0) return no;
	no = choiceTBox(x, y);
	if (no > 0) return no;
	no = choiceCBox(x, y);
	if (no > 0) return no;
	no = choiceHBox(x, y);
	if (no > 0) return no;

	if (x > w0 || y > h0) no = -1;
	return no;
}

function choiceMenu(x, y) {
	// menu
	if (y < my0 || y > my0+mh0) return 0;
	for(var i=0;i<8;i++) {
		if (x >= mx1+(mw1+10)*i && x <= mx1+mw0+(mw1+10)*i) return i+1;
	}

	return 0;
}

//
function choiceTBox(x, y) {
	// ToolBox
	if (x < mx0 || x > mx0+mw0) return 0;
	for(var i=0;i<15;i++) {
		if (y >= my0+(mh0+10)*i && y <= my0+mh0+(mh0+10)*i) return i+11;
	}
	
	return 0;
}

	// Color Parett
function choiceCBox(x, y) {
	if (y < my0 || y > my0+mh0) return 0;
	for(var i=0;i<5;i++) {
		if (x >= mx2+(mw2+10)*i && x <= mx2+mw2+(mw2+10)*i) return i+31;
	}
	
	return 0;
}
	// Thin Box
function choiceHBox(x, y) {
	if (y < my0 || y > my0+mh0) return 0;
	for(var i=0;i<3;i++) {
		if (x >= mx3+(mw2+10)*i && x <= mx3+mw2+(mw2+10)*i) return i+41;
	}
	
	return 0;
}

//------------------- ajax -----------------------------------

function saveData(title){
	if(typeof(Storage) !== "undefined"){
		var str = localStorage.getItem("canvasDrawData");
		var origData = str === null ? {} : jsyaml.safeLoad(str);
		origData[title] = jsyaml.safeDump(dobjs);
		localStorage.setItem("canvasDrawData", jsyaml.safeDump(origData));
	}
}

// save data
function ajaxsave() {
	var title = prompt("TITLE:", "");
	if (null === title) return false;
	saveData(title);
	ajaxsearch(0);
	return true;
}

this.saveDataNew = function(){
	var text = document.getElementById("clientfname").value;
	if(null === text) return;
	saveData(text);
	ajaxsearch(0);
}

this.saveDataFromList = function(){
	var sel = document.forms[0].canvasselect;
	saveData(sel.options[sel.selectedIndex].text);
}

// append save
function ajaxappend() {
	var sel = document.forms[0].canvasselect;
	var idx = sel.selectedIndex;
	if (0 == idx) {
		alert("Select a figure to overwrite");
		return false;
	}
	var title =  sel.options[idx].innerHTML;
	if (!confirm("TITLE:"+title + i18n.t("<- OK to overwrite?"))) return false;

	var str = localStorage.getItem("canvasDrawData");
	var origData = str === null ? {} : jsyaml.safeLoad(str);
	origData[title] = jsyaml.safeDump(dobjs);
	localStorage.setItem("canvasDrawData", jsyaml.safeDump(origData));

	return true;
}

// search
function ajaxsearch(mode) {

	if(typeof(Storage) !== "undefined"){
		var str = localStorage.getItem("canvasDrawData");
		var origData = str === null ? {} : jsyaml.safeLoad(str);

		// Enumerating keys array would be simpler if we could use Object.keys(),
		// but the method won't work for IE6, 7, 8.
		// If we'd repeat this procedure, we may be able to use a shim in:
		// https://github/com/es-shims/es5-shim/blob/v2.0.5/es5-shim.js
		var keys = [];
		for(var name in origData)
			keys.push(name);

		setSelect(keys, document.forms[0].canvasselect);
	}

}

// Create a deep clone of objects
function cloneObject(obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	var temp = obj.constructor(); // give temp the original obj's constructor
	for (var key in obj) {
		temp[key] = cloneObject(obj[key]);
	}

	return temp;
}

// Update dobjs
function ajaxparts(str) {
	dhistory.push(cloneObject(dobjs));
	dobjs.push(str);
	updateDrawData();
}

function updateDrawData(){
	try{
		var drawdata = document.getElementById('drawdata');
		drawdata.value = jsyaml.safeDump(dobjs, {flowLevel: 2});
	} catch(e){
		console.log(e);
	}
}

// clear data
function ajaxclear() {
	dobjs = [];
	updateDrawData();
	clearCanvas();
}

// undo
function ajaxundo() {
	if(dhistory.length < 1)
		return;
	dobjs = dhistory[dhistory.length-1];
	dhistory.pop();
	updateDrawData();
	clearCanvas();
	redraw(dobjs);
}

// redraw
function ajaxredraw(id) {
	clearCanvas();
	redraw(dobjs);
}

// Create and return a XMLHttpRequest object or ActiveXObject for IE6-
function createXMLHttpRequest(){
	var xmlHttp = null;
	try{
		// for IE7+, Fireforx, Chrome, Opera, Safari
		xmlHttp = new XMLHttpRequest();
	}
	catch(e){
		try{
			// for IE6, IE5 (canvas element wouldn't work from the start, though)
			xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch(e){
			try{
				xmlHttp = new ActiveXObject("Microsoft.XMLHttp");
			}
			catch(e){
				return null;
			}
		}
	}
	return xmlHttp;
}

function uploadData(fname){
	var drawdata = document.getElementById("drawdata");

	// Asynchronous request for getting figure data in the server.
	var xmlHttp = createXMLHttpRequest();
	if(xmlHttp){
		// The event handler is assigned here because xmlHttp is a free variable
		// implicitly passed to the anonymous function without polluting the
		// global namespace.
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState !== 4 || xmlHttp.status !== 200)
				return;
			debug(xmlHttp.responseText);
			downloadList();
		};
		xmlHttp.open("POST", "upload.php", true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.send("fname=" + encodeURI(fname) + "&drawdata=" + encodeURI(drawdata.value));
	}
}

this.pull = function(){
	var text = document.getElementById("remote").value;
	// Asynchronous request for pulling.
	var xmlHttp = createXMLHttpRequest();
	if(xmlHttp){
		// The event handler is assigned here because xmlHttp is a free variable
		// implicitly passed to the anonymous function without polluting the
		// global namespace.
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState !== 4 || xmlHttp.status !== 200)
				return;
			debug(xmlHttp.responseText);
			downloadList();
		};
		xmlHttp.open("GET", "pull.php?remote=" + encodeURI(text), true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.send();
	}
}

this.push = function(){
	// Asynchronous request for pulling.
	var xmlHttp = createXMLHttpRequest();
	if(xmlHttp){
		// The event handler is assigned here because xmlHttp is a free variable
		// implicitly passed to the anonymous function without polluting the
		// global namespace.
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState !== 4 || xmlHttp.status !== 200)
				return;
			debug(xmlHttp.responseText);
			downloadList();
		};
		xmlHttp.open("GET", "push.php", true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.send();
	}
}

this.uploadDataNew = function(){
	uploadData(document.getElementById("fname").value);
}

this.uploadDataFromServerList = function(){
	var sel = document.forms[0].serverselect;
	if(0 <= sel.selectedIndex)
		uploadData(sel.options[sel.selectedIndex].text);
}

this.deleteFromServerList = function(){
	var sel = document.forms[0].serverselect;
	if(sel.selectedIndex < 0)
		return;
	var fname = sel.options[sel.selectedIndex].text;

	// Asynchronous request for deleting file in the server.
	var xmlHttp = createXMLHttpRequest();
	if(xmlHttp){
		// The event handler is assigned here because xmlHttp is a free variable
		// implicitly passed to the anonymous function without polluting the
		// global namespace.
		xmlHttp.onreadystatechange = function(){
			if(xmlHttp.readyState !== 4 || xmlHttp.status !== 200)
				return;
			debug(xmlHttp.responseText);
			downloadList();
		};
		xmlHttp.open("POST", "upload.php", true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.send("fname=" + encodeURI(fname) + "&action=delete");
	}
}

//------------------------ debug ------------------------
function debug(msg) {
  var darea = document.getElementById('message');
  darea.innerHTML = msg;
}

// init --------------------------------------------------
//window.captureEvents(Event.click);
//onclick=mouseLeftClick;
var arr = new Array({x:0,y:0}, {x:0,y:0}, {x:0,y:0});
var idx = 0, zorder = 0;
var ctx;
var menustr = new Array(i18n.t("Save"), i18n.t("List"), i18n.t("Search"), i18n.t("Clear"), i18n.t("Redraw"), i18n.t("Undo"), i18n.t("Overwrite"));
var white = "rgb(255, 255, 255)";
var black = "rgb(0, 0, 0)";
var blue = "rgb(0, 100, 255)";
var green = "rgb(0, 255, 0)";
var red = "rgb(255, 0, 0)";
var gray = "rgb(150, 150, 150)";
var colstr = new Array(black,blue,red,green,white);
var colnames = ["black", "blue", "red", "green", "white"];
var coltable = {"black": black, "blue": blue, "red": red, "green": green, "white": white};
var x0 = 0, y0 = 0, w0 = 1024, h0 = 640;
var x1 = 90, y1 = 50, w1 = 930, h1 = 580;
var mx0 = 10, mx1 = x1, mx2 = 600, mx3 = 820;
var mw0 = 70, mw1 = 60, mw2 = 30, my0 = 20, mh0 = 30;
var cur_tool = 11, cur_col = "black", cur_thin = 1;

onload();
}

