/// @brief The SketchCanvas class accepts a canvas object to draw on.
/// @param canvas The canvas to draw the figure to.
/// @param options An initialization parameters table that contains following items:
///                editmode: The canvas is used for editing when true.
///                debug: A function with one argument to output debug string.
///
/// Make sure to invoke this class's constructor with "new" prepended
/// and keep the returned object to some variable.
///
/// It has following event handlers that can be assigned as this object's method.
///
/// function onLocalChange();
/// This event is invoked when the canvas saves its contents into localStorage of the
/// browser.  Use this event to update list of locally saved figures.
///
/// function onUpdateServerList(list);
/// This event is invoked when the object requests the server to refresh figure list
/// and receives response.
///
/// function onUpdateData(data);
/// This event is invoked when the contents of figure data is modified.
function SketchCanvas(canvas, options){
'use strict';
var editmode = options && options.editmode;
var scale = options && options.scale ? options.scale : 1;

// Obtain the browser's preferred language.
var currentLanguage = (window.navigator.language || window.navigator.userLanguage || window.navigator.userLanguage);
currentLanguage = currentLanguage.substr(0, 2);

i18n.init({lng: currentLanguage, fallbackLng: 'en', resStore: resources, getAsync: false});

var dobjs; // Drawing objects
var dhistory; // Drawing object history (for undoing)
var selectobj = [];

var handleSize = 4;
var gridEnable = false;
var gridSize = 8;
var toolButtonInterval = 36;

// Called at the end of the constructor
function onload(){

  // Check existence of canvas element and treating not compatible browsers
  if ( ! canvas || ! canvas.getContext ) {
    return false;
  }

	// Ignore mouse events if it's non-edit mode.
	if(editmode){
		canvas.onclick = mouseLeftClick;
		canvas.onmousedown = mouseDown;
		canvas.onmouseup = mouseUp;
		canvas.onmousemove = mouseMove;
		canvas.onmouseout = mouseleave;
		canvas.setAttribute("tabindex", 0); // Make sure the canvas can have a key focus
		canvas.onkeydown = keyDown;
	}

  // 2D context
  ctx = canvas.getContext('2d');
	// Set a placeholder function to ignore setLineDash method for browsers that don't support it.
	// The method is not compatible with many browsers, but we don't care if it's not supported
	// because it's only used for selected object designation.
	if(!ctx.setLineDash) {
		ctx.setLineDash = function(){};
	}

	var aw = 20; // Arrow width

	// Previous toolbar page button
	buttons.push(new Button(mx0, my0, mx0 + aw, my0 + mh0, function(){
		ctx.fillStyle = 'rgb(127,127,127)';
		ctx.beginPath();
		ctx.moveTo(mx0, my0 + mh0 / 2);
		ctx.lineTo(mx0 + aw, my0);
		ctx.lineTo(mx0 + aw, my0 + mh0);
		ctx.closePath();
		ctx.fill();
	}, function(){
		debug("clicked left");
		toolbarPage = Math.max(toolbarPage - 1, 0);
		toolbar = toolbars[toolbarPage];
		cur_tool = toolbar[0];
		draw();
	}));

	// Next toolbar page button
	buttons.push(new Button(mx0 + mw0 - aw, my0, mx0 + mw0, my0 + mh0, function(){
		ctx.beginPath();
		ctx.moveTo(mx0 + mw0, my0 + mh0 / 2);
		ctx.lineTo(mx0 + mw0 - aw, my0);
		ctx.lineTo(mx0 + mw0 - aw, my0 + mh0);
		ctx.closePath();
		ctx.fill();
	}, function(){
		debug("clicked right");
		toolbarPage = Math.min(toolbarPage + 1, toolbars.length-1);
		toolbar = toolbars[toolbarPage];
		cur_tool = toolbar[0];
		draw();
	}));

  resizeCanvas();
  draw();

  // Draw objects
  dobjs = [];

  // And the history of operations
  dhistory = [];
}

var datadir = "data";

function draw() {
	if(!editmode)
		return;
	// Draw a rectangle
	ctx.beginPath();
	ctx.strokeStyle = 'rgb(192, 192, 77)'; // yellow
		ctx.font = i18n.t("14px 'Courier'");
	ctx.strokeText('SketchCanvas Editor v0.1.2', 420, 10);
	ctx.rect(x0, y0, w0, h0);
	ctx.rect(x1, y1, w1, h1);
	ctx.closePath();
	ctx.stroke();

	// Background for the page text
	ctx.fillStyle = 'rgb(255,255,255)';
	ctx.fillRect(x0 + 1, y0 + 1, x1 - 2, y0 + h0 - 2);

	// Text indicating current toolbar page
	ctx.fillStyle = 'rgb(0,0,0)';
	var text = (toolbarPage + 1) + "/" + (toolbars.length);
	var width = ctx.measureText(text).width;
	ctx.fillText(text, mx0 + mw0 / 2 - width / 2, my0 + mh0 / 2);

	// menu
	drawMenu();
	drawTBox();
	drawButtons();
	drawCBox(cur_col);
	drawHBox(cur_thin);
}

// draw coord(for Debug)
function drawPos(x, y) {
  ctx.strokeText('X='+x+' Y='+y, x, y);
}

// Menu
function drawMenu() {
	for(var i=0;i<menus.length;i++) {
		ctx.fillStyle = 'rgb(100, 200, 100)'; // green
		ctx.fillRect(mx1+(i+0)*(mw1+10), my0, mw1, mh0);
		//ctx.strokeStyle = 'rgb(50, 192, 177)'; // cyan
		ctx.strokeStyle = 'rgb(250, 250, 250)'; // white
		ctx.strokeText(menus[i].text, mx1+10+(i+0)*(mw1+10), my0+20);
	}
}

/// Returns bounding box of a toolbar button.
function getTBox(i){
	return {minx: mx0, miny: my0 + toolButtonInterval + toolButtonInterval*i,
		maxx: mx0 + mw0, maxy: my0 + toolButtonInterval + toolButtonInterval*i+mh0};
}

// Tool Box
function drawTBox() {
	ctx.fillStyle = 'rgb(255,255,255)';
	ctx.fillRect(x0 + 1, my0 + mh0 + 1, x1 - 2, my0 + h0 - 2);

	for(var i=0;i<toolbar.length;i++) {
		if (cur_tool === toolbar[i])
			ctx.fillStyle = 'rgb(255, 80, 77)'; // red
		else
			ctx.fillStyle = 'rgb(192, 80, 77)'; // red
		var r = getTBox(i);
		ctx.fillRect(r.minx, r.miny, r.maxx - r.minx, r.maxy - r.miny);
		ctx.strokeStyle = 'rgb(250, 250, 250)'; // white
		drawParts(toolbar[i], mx0+10, my0 + toolButtonInterval + 10 + (mh0+8)*i);
	}
}

function drawButtons(){
	for(var i = 0; i < buttons.length; i++){
		if("ondraw" in buttons[i])
			buttons[i].ondraw();
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
function drawParts(tool, x, y) {
	if(tool.drawTool)
		tool.drawTool(x, y);
	else
		ctx.strokeText(i18n.t('Unimplemented'), x, y);
}

// Returns bounding box for a drawing object.
function objBounds(obj, rawvalue){
	var ret = obj.getBoundingRect(rawvalue);
	if(!rawvalue){
		ret.minx += offset.x;
		ret.maxx += offset.x;
		ret.miny += offset.y;
		ret.maxy += offset.y;
	}
	return ret;
}

// Expand given rectangle by an offset
function expandRect(r, offset){
	return {minx: r.minx - offset, miny : r.miny - offset,
		maxx: r.maxx + offset, maxy: r.maxy + offset};
}

// Check if a point intersects with a rectangle
function hitRect(r, x, y){
	return r.minx < x && x < r.maxx && r.miny < y && y < r.maxy;
}

// Check if two rectangles intersect each other
function intersectRect(r1, r2){
	return r1.minx < r2.maxx && r2.minx < r1.maxx && r1.miny < r2.maxy && r2.miny < r1.maxy;
}

function mouseLeftClick(e) {
	if (3 == e.which) mouseRightClick(e);
	else {
		var clrect = canvas.getBoundingClientRect();
		var mx = e.clientX - clrect.left;
		var my = e.clientY - clrect.top;

		for(var i = 0; i < buttons.length; i++){
			if(hitRect(buttons[i], mx, my)){
				buttons[i].onclick();
				return;
			}
		}

		if(choiceTBox(mx, my))
			return;

		var menuno = checkMenu(mx, my);
		debug(menuno);
		if (menuno < 0) {		// draw area
			if(mx < offset.x || my < offset.y)
				return;
			if(cur_tool.name === "delete"){ // delete
				for(var i = 0; i < dobjs.length; i++){
					// For the time being, we use the bounding boxes of the objects
					// to determine the clicked object.  It may be surprising
					// when a diagonal line gets deleted by clicking on seemingly
					// empty space, but we could fix it in the future.
					var bounds = expandRect(objBounds(dobjs[i]), 10);
					if(hitRect(bounds, mx, my)){
						// If any dobj hits, save the current state to the undo buffer and delete the object.
						dhistory.push(cloneObject(dobjs));
						// Delete from selected object list, too.
						for(var j = 0; j < selectobj.length;){
							if(selectobj[j] === dobjs[i])
								selectobj.splice(j, 1);
							else
								j++;
						}
						dobjs.splice(i, 1);
						redraw(dobjs);
						updateDrawData();
						return;
					}
				}
				return;
			}
			else if(cur_tool.name !== "select" && cur_tool.name !== "pathedit")
				cur_tool.appendPoint(mx, my);
		}
		else if (menuno < 10) {
			drawMenu();
			menus[menuno].onclick();
		}
		else if (menuno <= 40) {
			drawCBox(menuno);
			cur_col = colnames[menuno-31];
			if(0 < selectobj.length){
				dhistory.push(cloneObject(dobjs));
				for(var i = 0; i < selectobj.length; i++)
					selectobj[i].color = cur_col;
				updateDrawData();
				redraw(dobjs);
			}
		}
		else {
			drawHBox(menuno);
			cur_thin = menuno - 40;
			if(0 < selectobj.length){
				dhistory.push(cloneObject(dobjs));
				for(var i = 0; i < selectobj.length; i++)
					selectobj[i].width = cur_thin;
				updateDrawData();
				redraw(dobjs);
			}
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

var movebase = [0,0];
var dragstart = [0,0];
var dragend = [0,0];
var moving = false;
var sizing = null; // Reference to object being resized. Null if no resizing is in progress.
var sizedir = 0;
var pointMoving = null;
var pointMovingIdx = 0;
var pointMovingCP = ""; ///< Control point for moving, "": vertex, "c": first control point, "d": second control point
var boxselecting = false;
function pathEditMouseDown(e){
	var clrect = canvas.getBoundingClientRect();
	var mx = e.clientX - clrect.left;
	var my = e.clientY - clrect.top;

	// Prioritize path editing over shape selection.

	// Check to see if we are dragging any of control points.
	for(var n = 0; n < selectobj.length; n++){
		// Do not try to change shape of non-sizeable object.
		if(!selectobj[n].isSizeable())
			continue;
		var pts = selectobj[n].points;
		// Grab a control point uder the mouse cursor to move it.
		for(var i = 0; i < pts.length; i++){
			var p = pts[i];

			// Function to check if we should start dragging one of vertices or
			// control points.  Written as a local function to clarify logic.
			function checkVertexHandle(){
				if(!hitRect(pointHandle(p.x, p.y), mx - offset.x, my - offset.y))
					return false;
				// Check control points for only the "path" shapes.
				// Pressing Ctrl key before dragging the handle pulls out the
				// control point, even if the vertex didn't have one.
				if(selectobj[n].tool === "path" && e.ctrlKey){
					if(0 < i && !("dx" in p))
						pointMovingCP = "d";
					else if(i+1 < pts.length && !("cx" in pts[i+1])){
						pointMovingCP = "c";
						pointMoving = selectobj[n];
						pointMovingIdx = i+1;
						return true;
					}
					else
						return false;
				}
				else
					pointMovingCP = "";
				pointMoving = selectobj[n];
				pointMovingIdx = i;
				dhistory.push(cloneObject(dobjs));
				return true;
			}

			// do{ ... }while(false) statement could do a similar trick, but we prefer
			// local functions for the ease of debugging and more concise expression.
			if(checkVertexHandle())
				return;

			// Check for existing control points
			if("cx" in p && "cy" in p && hitRect(pointHandle(p.cx, p.cy), mx - offset.x, my - offset.y)){
				pointMoving = selectobj[n];
				pointMovingIdx = i;
				pointMovingCP = "c";
				dhistory.push(cloneObject(dobjs));
				return;
			}
			if("dx" in p && "dy" in p && hitRect(pointHandle(p.dx, p.dy), mx - offset.x, my - offset.y)){
				pointMoving = selectobj[n];
				pointMovingIdx = i;
				pointMovingCP = "d";
				dhistory.push(cloneObject(dobjs));
				return;
			}
		}
	}

	selectCommonMouseDown(mx, my);
}

/// A common method to select and pathedit tools.
/// The pathedit tool can select objects, not to mention the select tool.
function selectCommonMouseDown(mx, my){

	var menuno = checkMenu(mx, my);
	if(0 <= menuno) // If we are clicking on a menu button, ignore this event
		return null;
	for(var i = 0; i < dobjs.length; i++){
		// For the time being, we use the bounding boxes of the objects
		// to determine the clicked object.  It may be surprising
		// when a diagonal line gets deleted by clicking on seemingly
		// empty space, but we could fix it in the future.
		var bounds = expandRect(objBounds(dobjs[i]), 10);
		if(hitRect(bounds, mx, my)){
			var pointOnSelection = false;
			// If we click on one of already selected objects, do not clear the selection
			// and check if we should enter moving or scaling mode later.
			for(var j = 0; j < selectobj.length; j++){
				if(selectobj[j] === dobjs[i]){
					pointOnSelection = true;
					break;
				}
			}
			// If we haven't selected an object but clicked on an object, select it.
			if(!pointOnSelection){
				selectobj = [dobjs[i]];
				pointOnSelection = true;
			}
			break;
		}
	}
	redraw(dobjs);

	return pointOnSelection;
}

function selectMouseDown(e){
	var clrect = canvas.getBoundingClientRect();
	var mx = e.clientX - clrect.left;
	var my = e.clientY - clrect.top;

	var pointOnSelection = selectCommonMouseDown(mx, my);

	// Enter sizing, moving or box-selecting mode only with select tool.
	// The pathedit tool should not bother interfering with these modes.

	// Check to see if we are dragging any of scaling handles.
	for(var n = 0; n < selectobj.length; n++){
		// Do not try to change size of non-sizeable object.
		if(!selectobj[n].isSizeable())
			continue;
		var bounds = objBounds(selectobj[n]);
		// Do not enter sizing mode if the object is point sized.
		if(1 <= Math.abs(bounds.maxx - bounds.minx) && 1 <= Math.abs(bounds.maxy - bounds.miny)){
			for(var i = 0; i < 8; i++){
				if(hitRect(getHandleRect(bounds, i), mx, my)){
					sizedir = i;
					sizing = selectobj[n];
					dhistory.push(cloneObject(dobjs));
					return;
				}
			}
		}
	}

	// If we're starting dragging on a selected object, enter moving mode.
	if(pointOnSelection){
		var mx = gridEnable ? Math.round(mx / gridSize) * gridSize : mx;
		var my = gridEnable ? Math.round(my / gridSize) * gridSize : my;
		movebase = [mx, my];
		moving = true;
		dhistory.push(cloneObject(dobjs));
	}
	else{
		// If no object is selected and dragging is started, it's box selection mode.
		boxselecting = true;
		selectobj = [];
		dragstart = [mx, my];
	}
}

function mouseDown(e){
	if(cur_tool)
		cur_tool.mouseDown(e);
}

function mouseUp(e){
	if(cur_tool)
		cur_tool.mouseUp(e);
}

function mouseMove(e){
	var mx, my;
	var clrect = canvas.getBoundingClientRect();
	var mx = (gridEnable ? Math.round(e.clientX / gridSize) * gridSize : e.clientX) - clrect.left;
	var my = (gridEnable ? Math.round(e.clientY / gridSize) * gridSize : e.clientY) - clrect.top;

	if(cur_tool === toolmap.select && 0 < selectobj.length){
		if(moving){
			var dx = mx - movebase[0];
			var dy = my - movebase[1];
			for(var n = 0; n < selectobj.length; n++){
				var obj = selectobj[n];
				for(var i = 0; i < obj.points.length; i++){
					var pt = obj.points[i];
					pt.x += dx;
					pt.y += dy;
					// Move control points, too
					if("cx" in pt && "cy" in pt)
						pt.cx += dx, pt.cy += dy;
					if("dx" in pt && "dy" in pt)
						pt.dx += dx, pt.dy += dy;
				}
			}
			movebase = [mx, my];
			redraw(dobjs);
		}
		else if(sizing){
			/* Definition of handle index and position
				0 --- 1 --- 2
				|           |
				7           3
				|           |
				6 --- 5 --- 4
			*/
			mx -= offset.x;
			my -= offset.y;
			var bounds = objBounds(sizing, true);
			var ux = [-1,0,1,1,1,0,-1,-1][sizedir];
			var uy = [-1,-1,-1,0,1,1,1,0][sizedir];
			var xscale = ux === 0 ? 1 : (ux === 1 ? mx - bounds.minx : bounds.maxx - mx) / (bounds.maxx - bounds.minx);
			var yscale = uy === 0 ? 1 : (uy === 1 ? my - bounds.miny : bounds.maxy - my) / (bounds.maxy - bounds.miny);
			var obj = sizing;
			for(var i = 0; i < obj.points.length; i++){
				var pt = obj.points[i];
				if(ux !== 0 && xscale !== 0){
					// Scale control points, too
					var props = ["x", "cx", "dx"];
					for(var j = 0; j < props.length; j++){
						var prop = props[j];
						if(!(prop in pt))
							continue;
						pt[prop] = ux === 1 ?
							(pt[prop] - bounds.minx) * xscale + bounds.minx :
							(pt[prop] - bounds.maxx) * xscale + bounds.maxx;
					}
				}
				if(uy !== 0 && yscale !== 0){
					// Scale control points, too
					var props = ["y", "cy", "dy"];
					for(var j = 0; j < props.length; j++){
						var prop = props[j];
						if(!(prop in pt))
							continue;
						pt[prop] = uy === 1 ?
							(pt[prop] - bounds.miny) * yscale + bounds.miny :
							(pt[prop] - bounds.maxy) * yscale + bounds.maxy;
					}
				}
			}
			// Invert handle selection when the handle is dragged to the other side to enable mirror scaling.
			if(ux !== 0 && xscale < 0)
				sizedir = [2,1,0,7,6,5,4,3][sizedir];
			if(uy !== 0 && yscale < 0)
				sizedir = [6,5,4,3,2,1,0,7][sizedir];
			redraw(dobjs);
		}
	}
	if(cur_tool === toolmap.pathedit && 0 < selectobj.length){
		if(pointMoving){
			mx -= offset.x;
			my -= offset.y;

			// Relatively move a control point if it exists
			function relmove(name, idx, dx, dy){
				if(pointMovingIdx + idx < 0 || pointMoving.points.length <= pointMovingIdx + idx)
					return;
				var p1 = pointMoving.points[pointMovingIdx + idx];
				if((name + "x") in p1) p1[name + "x"] += dx;
				if((name + "y") in p1) p1[name + "y"] += dy;
			}

			if(pointMovingCP === ""){
				// When moving a vertex, Bezier control points associated with that vertex
				// should move as well.  We remember delta of position change and apply it
				// to the control points later.
				var dx = mx - pointMoving.points[pointMovingIdx].x;
				var dy = my - pointMoving.points[pointMovingIdx].y;
				pointMoving.points[pointMovingIdx].x = mx;
				pointMoving.points[pointMovingIdx].y = my;
				// If it's the last vertex, there's no control point toward the next vertex.
				if(pointMovingIdx + 1 < pointMoving.points.length)
					relmove("c", 1, dx, dy);
				relmove("d", 0, dx, dy);
			}
			else{
				pointMoving.points[pointMovingIdx][pointMovingCP + "x"] = mx;
				pointMoving.points[pointMovingIdx][pointMovingCP + "y"] = my;
			}
			redraw(dobjs);
		}
	}

	// We could use e.buttons to check if it's supported by all the browsers,
	// but it seems not much trusty.
	if(cur_tool === toolmap.select && !moving && !sizing && boxselecting){
		dragend = [mx, my];
		var box = {
			minx: Math.min(dragstart[0], mx),
			maxx: Math.max(dragstart[0], mx),
			miny: Math.min(dragstart[1], my),
			maxy: Math.max(dragstart[1], my),
		}
		selectobj = [];
		// Select all intersecting objects with the dragged box.
		for(var i = 0; i < dobjs.length; i++){
			var bounds = expandRect(objBounds(dobjs[i]), 10);
			if(intersectRect(bounds, box))
				selectobj.push(dobjs[i]);
		}
		redraw(dobjs);
	}
	else
		cur_tool.mouseMove(mx, my);
}

function mouseleave(e){
	moving = false;
	sizing = null;
	boxselecting = false;
}

function keyDown(e){
	e = e || window.event;
	var code = e.keyCode || e.which;
	if(code === 46){ // Delete key
		dhistory.push(cloneObject(dobjs)); // Push undo buffer
		// Delete all selected objects
		for (var i = 0; i < selectobj.length; i++) {
			var s = selectobj[i];
			for (var j = 0; j < dobjs.length; j++) {
				if(dobjs[j] === s){
					dobjs.splice(j, 1);
					break;
				}
			}
		}
		selectobj = []; // And don't forget to clear the selection
		updateDrawData();
		redraw(dobjs);
	}
}

/// Constrain coordinate values if the grid is enabled.
function constrainCoord(coord){
	if(gridEnable)
		return { x: Math.round(coord.x / gridSize) * gridSize, y: Math.round(coord.y / gridSize) * gridSize };
	else
		return { x: coord.x, y: coord.y };
}

/// Convert canvas coordinates to the source coordinates.
/// These coordinates can differ when offset is not zero.
function canvasToSrc(coord){
	return { x: (coord.x - offset.x) / scale, y: (coord.y - offset.y) / scale };
}

// A local function to set font size with the global scaling factor in mind.
function setFont(baseSize) {
	ctx.font = baseSize + "px 'Noto Sans Japanese', sans-serif";
}

/// Draw a shape on the canvas.
function drawCanvas(obj) {
	var tool = toolmap[obj.tool];
	var numPoints = tool.points;

	tool.setColor(coltable[obj.color]);
	tool.setWidth(obj.width);
	if(numPoints <= obj.points.length)
		if(tool.draw(obj))
			return;
}

function getHandleRect(bounds, i){
	var x, y;
	switch(i){
	case 0: x = bounds.minx, y = bounds.miny; break;
	case 1: x = (bounds.minx+bounds.maxx)/2, y = bounds.miny; break;
	case 2: x = bounds.maxx, y = bounds.miny; break;
	case 3: x = bounds.maxx, y = (bounds.miny+bounds.maxy)/2; break;
	case 4: x = bounds.maxx, y = bounds.maxy; break;
	case 5: x = (bounds.minx+bounds.maxx)/2, y = bounds.maxy; break;
	case 6: x = bounds.minx, y = bounds.maxy; break;
	case 7: x = bounds.minx, y = (bounds.miny+bounds.maxy)/2; break;
	default: return;
	}
	return pointHandle(x, y);
}

/// Returns a small rectangle surrounding the given point which is suitable for mouse-picking.
function pointHandle(x, y){
	return {minx: x - handleSize, miny: y - handleSize, maxx: x + handleSize, maxy: y + handleSize};
}

// Resize the canvas so that it fits the contents.
// Note that the canvas contents are also cleared, so we might need to redraw everything.
function resizeCanvas(){
	if(!editmode){
		// Resize the canvas so that the figure fits the size of canvas.
		// It's only done in view mode because we should show the toolbar and the menu bar
		// in edit mode.
		canvas.width = metaObj.size[0] * scale;
		canvas.height = metaObj.size[1] * scale;
		x1 = 0;
		y1 = 0;
		offset = {x:0, y:0};
	}
	else{
		canvas.width = 1024;
		canvas.height = 640;
		x1 = 90;
		y1 = 50;
		offset = {x:x1, y:y1};
	}
}

// redraw
function redraw(pt) {

	clearCanvas();

	// Clip the drawing region when in edit mode in order to prevent shapes from
	// contaminate the menu bar and the toolbar.
	if(editmode){
		ctx.save();
		ctx.beginPath();
		ctx.rect(x1,y1, w1, h1);
		ctx.clip();
	}

	if(gridEnable){
		ctx.fillStyle = "#000";
		for(var ix = Math.ceil(x1 / gridSize); ix < (x1 + w1) / gridSize; ix++){
			for(var iy = Math.ceil(y1 / gridSize); iy < (y1 + h1) / gridSize; iy++){
				ctx.fillRect(ix * gridSize, iy * gridSize, 1, 1);
			}
		}
	}

	// Translate and scale the coordinates by applying matrices before invoking drawCanvas().
	ctx.save();
	ctx.translate(offset.x, offset.y);
	ctx.scale(scale, scale);
	for (var i=0; i<pt.length; i++)
		drawCanvas(pt[i]);

	if(cur_shape)
		drawCanvas(cur_shape);

	ctx.restore();

	if(boxselecting){
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#000';
		ctx.setLineDash([5]);
		ctx.rect(dragstart[0], dragstart[1], dragend[0] - dragstart[0], dragend[1] - dragstart[1]);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	for(var n = 0; n < selectobj.length; n++){
		var bounds = objBounds(selectobj[n]);
		if(cur_tool === toolmap.pathedit){
			// When pathedit tool is selected, draw handles on the shape's control points
			// and the path that connecting control points, but not the
			// bounding boxes and scaling handles, which could be annoying
			// because they're nothing to do with path editing.
			var pts = selectobj[n].points;
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#000';
			ctx.setLineDash([5]);
			ctx.moveTo(pts[0].x + offset.x, pts[0].y + offset.y);
			for(var i = 1; i < pts.length; i++)
				ctx.lineTo(pts[i].x + offset.x, pts[i].y + offset.y);
			ctx.stroke();
			ctx.setLineDash([]);

			// Draw a handle rectangle around a vertex or a control point
			function drawHandle(x, y, color){
				var r = pointHandle(x, y);
				ctx.fillStyle = color;
				ctx.fillRect(r.minx, r.miny, r.maxx - r.minx, r.maxy-r.miny);
				ctx.beginPath();
				ctx.strokeStyle = '#000';
				ctx.rect(r.minx, r.miny, r.maxx - r.minx, r.maxy-r.miny);
				ctx.stroke();
			}

			// Draws dashed line that connects a control point and its associated vertex
			function drawGuidingLine(pt0, name){
				ctx.setLineDash([5]);
				ctx.beginPath();
				ctx.moveTo(pt0.x + offset.x, pt0.y + offset.y);
				ctx.lineTo(pt[name + "x"] + offset.x, pt[name + "y"] + offset.y);
				ctx.stroke();
				ctx.setLineDash([]);
			}

			for(var i = 0; i < pts.length; i++){
				var pt = pts[i];
				drawHandle(pt.x + offset.x, pt.y + offset.y, '#7f7fff');

				// Handles and guiding lines for the control points
				if(0 < i && "cx" in pt && "cy" in pt){
					drawHandle(pt.cx + offset.x, pt.cy + offset.y, '#ff7f7f');
					drawGuidingLine(pts[i-1], "c");
				}
				if("dx" in pt && "dy" in pt){
					drawHandle(pt.dx + offset.x, pt.dy + offset.y, '#ff7f7f');
					drawGuidingLine(pt, "d");
				}
			}
		}
		else{
			// All other tools than the pathedit, draw scaling handles and
			// bounding boxes around selected objects.
			// Aside from the select tool, the user cannot grab the scaling handles,
			// but they're useful to visually appeal that the object is selected.
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#000';
			ctx.setLineDash([5]);
			ctx.rect(bounds.minx, bounds.miny, bounds.maxx-bounds.minx, bounds.maxy-bounds.miny);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.beginPath();
			ctx.strokeStyle = '#000';
			for(var i = 0; i < 8; i++){
				var r = getHandleRect(bounds, i);
				ctx.fillStyle = sizing === selectobj[n] && i === sizedir ? '#7fff7f' : '#ffff7f';
				ctx.fillRect(r.minx, r.miny, r.maxx - r.minx, r.maxy-r.miny);
				ctx.rect(r.minx, r.miny, r.maxx - r.minx, r.maxy-r.miny);
			}
			ctx.stroke();
		}
	}

	if(editmode)
		ctx.restore();
}


// ==================== Shape class definition ================================= //
function Shape(){
	this.tool = "line";
	this.color = "black";
	this.width = 1;
	this.points = [];
}
//inherit(Shape, Object);

Shape.prototype.serialize = function(){
	function set_default(t,k,v,def){
		if(v !== def) 
			t[k] = v;
	}

	// send parts to server
	var dat = "";
	for (var i=0; i<this.points.length; i++){
		if(i !== 0) dat += ":";
		// Prepend control points if this vertex has them.
		if("cx" in this.points[i] && "cy" in this.points[i])
			dat += this.points[i].cx+","+this.points[i].cy+",";
		if("dx" in this.points[i] && "dy" in this.points[i])
			dat += this.points[i].dx+","+this.points[i].dy+",";
		dat += this.points[i].x+","+this.points[i].y;
	}
	var alldat = {
		type: this.tool,
		points: dat
	};
	// Values with defaults needs not assigned a value when saved.
	// This will save space if the drawn element properties use many default values.
	set_default(alldat, "color", this.color, "black");
	set_default(alldat, "width", this.width, 1);
	return alldat;
};

Shape.prototype.isSizeable = function(){
	return true;
}

Shape.prototype.deserialize = function(obj){
	this.color = obj.color || "black";
	this.width = obj.width || 1;
	if("points" in obj){
		var pt1 = obj.points.split(":");
		var arr = [];
		for(var j = 0; j < pt1.length; j++){
			var pt2 = pt1[j].split(",");
			var pt = {};
			if(6 <= pt2.length){
				pt.cx = parseFloat(pt2[0]);
				pt.cy = parseFloat(pt2[1]);
			}
			if(4 <= pt2.length){
				pt.dx = parseFloat(pt2[pt2.length-4]);
				pt.dy = parseFloat(pt2[pt2.length-3]);
			}
			pt.x = parseFloat(pt2[pt2.length-2]);
			pt.y = parseFloat(pt2[pt2.length-1]);
			arr.push(pt);
		}
		this.points = arr;
	}
};

Shape.prototype.getBoundingRect = function(){
	// Get bounding box of the object
	var maxx, maxy, minx, miny;
	for(var j = 0; j < this.points.length; j++){
		var x = this.points[j].x;
		if(maxx === undefined || maxx < x)
			maxx = x;
		if(minx === undefined || x < minx)
			minx = x;
		var y = this.points[j].y;
		if(maxy === undefined || maxy < y)
			maxy = y;
		if(miny === undefined || y < miny)
			miny = y;
	}
	return {minx: minx, miny: miny, maxx: maxx, maxy: maxy};
};
// ==================== Shape class definition end ================================= //

// ==================== PointShape class definition ================================= //
function PointShape(){
	Shape.call(this);
}
inherit(PointShape, Shape);

PointShape.prototype.isSizeable = function(){
	return false;
}

PointShape.prototype.getBoundingRect = function(){
	var height = 20;
	var width = 20;
	return {minx: this.points[0].x, miny: this.points[0].y,
		maxx: this.points[0].x + width, maxy: this.points[0].y + height};
}
// ==================== PointOject class definition end ================================= //

// ==================== TextShape class definition ================================= //
function TextShape(){
	Shape.call(this);
	this.text = "";
}
inherit(TextShape, Shape);

TextShape.prototype.serialize = function(){
	var alldat = Shape.prototype.serialize.call(this);
	alldat.text = this.text;
	return alldat;
}

TextShape.prototype.deserialize = function(obj){
	Shape.prototype.deserialize.call(this, obj);
	if (undefined !== obj.text) this.text = obj.text;
};

TextShape.prototype.isSizeable = function(){
	return false;
}

TextShape.prototype.getBoundingRect = function(){
	var height = this.width === 1 ? 14 : this.width === 2 ? 16 : 20;
	var oldfont = ctx.font;
	ctx.font = setFont(height);
	var width = ctx.measureText(this.text).width;
	ctx.font = oldfont;
	return {minx: this.points[0].x, miny: this.points[0].y - height,
		maxx: this.points[0].x + width, maxy: this.points[0].y};
}
// ==================== TextShape class definition end ================================= //

// ==================== PathShape class definition ================================= //
function PathShape(){
	Shape.call(this);
}
inherit(PathShape, Shape);

/// Custom serializer for SVG-compatible path data
PathShape.prototype.serialize = function(){
	var alldat = Shape.prototype.serialize.call(this);
	var src = "";
	for (var i=0; i<this.points.length; i++){
		var pt = this.points[i];
		if(i !== 0 && ("cx" in pt && "cy" in pt || "dx" in pt && "dy" in pt)){
			src += "C"; // Bezier curve command. 'S' command is not yet supported.
			// Prepend control points if this vertex has them.
			if("cx" in pt && "cy" in pt)
				src += pt.cx+","+pt.cy+" ";
			else
				src += this.points[i-1].x+","+this.points[i-1].y+" ";
			if("dx" in pt && "dy" in pt)
				src += pt.dx+","+pt.dy+" ";
			else
				src += pt.x+","+pt.y+" ";
		}
		else if(i === 0)
			src += "M"; // Moveto command
		else
			src += "L"; // Lineto command
		src += pt.x+","+pt.y;
	}
	alldat.d = src;
	// Set point data source to src and forget about old field
	delete alldat.points;
	return alldat;
}

/// Custom deserializer for SVG-compatible path data
PathShape.prototype.deserialize = function(obj){
	Shape.prototype.deserialize.call(this, obj);
	if(!("d" in obj))
		return;
	var arr = [];
	var src = obj.d;
	var pt2 = [];
	var last = 0;

	function process(){
		if(k <= last)
			return;
		var ssrc = src.slice(last+1, k);
		pt2 = ssrc.split(/[, \t]/);
		var pt = {};
		if(6 <= pt2.length){
			pt.cx = parseFloat(pt2[0]);
			pt.cy = parseFloat(pt2[1]);
		}
		if(4 <= pt2.length){
			pt.dx = parseFloat(pt2[pt2.length-4]);
			pt.dy = parseFloat(pt2[pt2.length-3]);
		}
		pt.x = parseFloat(pt2[pt2.length-2]);
		pt.y = parseFloat(pt2[pt2.length-1]);
		arr.push(pt);
		last = k;
	}

	for(var k = 0; k < src.length; k++){
		if("MCLS".indexOf(src.charAt(k)) >= 0)
			process();
	}
	process();

	this.points = arr;
};
// ==================== PathShape class definition end ================================= //


function serialize(dobjs){
	var ret = [metaObj];
	for(var i = 0; i < dobjs.length; i++)
		ret.push(dobjs[i].serialize());
	return ret;
}

function deserialize(dat){
	// Reset the metaObj before deserialization
	metaObj = cloneObject(defaultMetaObj);
	var ret = [];
	for (var i=0; i<dat.length; i++) {
		var obj = dat[i];
		if(obj.type === 'meta'){
			metaObj = obj;
			continue;
		}
		if(!(obj.type in toolmap))
			continue;
		var robj = new toolmap[obj.type].objctor();
		robj.tool = obj.type;
		robj.deserialize(obj);
		ret.push(robj);
	}
	return ret;
}

this.loadData = function(value){
	try{
		dobjs = deserialize(jsyaml.safeLoad(value));
		selectobj = []; // Clear the selection explicitly
		resizeCanvas();
		draw();
		redraw(dobjs);
	} catch(e){
		console.log(e);
	}
}

this.saveAsImage = function(img){
	var reset = editmode;
	if(editmode){
		editmode = false;
		resizeCanvas();
		redraw(dobjs);
	}
	img.src = canvas.toDataURL();
	if(reset){
		editmode = true;
		resizeCanvas();
		draw();
		redraw(dobjs);
	}
}

/// @brief Loads a data from local storage of the browser
/// @param name The name of the sketch in the local storage to load.
this.loadLocal = function(name){
	try{
		var origData = localStorage.getItem("canvasDrawData");
		if(origData === null)
			return;
		var selData = jsyaml.safeLoad(origData);
		dobjs = deserialize(jsyaml.safeLoad(selData[name]));
		selectobj = []; // Clear the selection explicitly
		updateDrawData();
		redraw(dobjs);
	} catch(e){
		debug(e);
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
				if(self.onUpdateServerList)
					self.onUpdateServerList(selData.split("\n"));
			}
			catch(e){
				console.log(e);
			}
		};
		xmlHttp.open("GET", "list.php", true);
		xmlHttp.send();
	}
}

this.listServer = downloadList;

this.requestServerFile = function(item, hash){
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
				dobjs = deserialize(jsyaml.safeLoad(selData));
				selectobj = [];
				updateDrawData();
				resizeCanvas();
				draw();
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

this.requestServerFileHistory = function(item, responseCallback){
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
				responseCallback(historyData);
			}
			catch(e){
				console.log(e);
			}
		};
		historyQuery.open("GET", "history.php?fname=" + encodeURI(item), true);
		historyQuery.send();
	}
}

// clear canvas
function clearCanvas() {
	if(editmode){
		// Fill outside of valid figure area defined by metaObj.size with gray color.
		ctx.fillStyle = '#7f7f7f';
		ctx.fillRect(x1,y1, w1, h1);
	}
	ctx.fillStyle = white;
	ctx.fillRect(x1, y1, Math.min(w1, metaObj.size[0]), Math.min(h1, metaObj.size[1]));
}

// Sets the size of the canvas
function setSize(sx, sy){
	metaObj.size[0] = sx;
	metaObj.size[1] = sy;
	updateDrawData();
	redraw(dobjs);
}

// check all menu
function checkMenu(x, y) {
	var no = choiceMenu(x, y);
	if (no >= 0) return no;
	no = choiceCBox(x, y);
	if (no > 0) return no;
	no = choiceHBox(x, y);
	if (no > 0) return no;

	if (x > w0 || y > h0) no = -1;
	return no;
}

function choiceMenu(x, y) {
	// menu
	if (y < my0 || y > my0+mh0) return -1;
	for(var i=0;i<menus.length;i++) {
		if (x >= mx1+(mw1+10)*i && x <= mx1+mw0+(mw1+10)*i) return i;
	}

	return -1;
}

/// Selects a toolbar button. Returns true if the coordinates hit a button.
function choiceTBox(x, y) {
	// ToolBox
	if (x < mx0 || x > mx0+mw0) return false;
	for(var i=0;i<toolbar.length;i++) {
		var r = getTBox(i);
		if(hitRect(r, x, y)){
			cur_tool = toolbar[i];
			drawTBox();
			cur_shape = null;
			redraw(dobjs);
			return true;
		}
	}
	
	return false;
}

	// Color Parett
function choiceCBox(x, y) {
	if (y < my0 || y > my0+mh0) return -1;
	for(var i=0;i<5;i++) {
		if (x >= mx2+(mw2+10)*i && x <= mx2+mw2+(mw2+10)*i) return i+31;
	}
	
	return -1;
}
	// Thin Box
function choiceHBox(x, y) {
	if (y < my0 || y > my0+mh0) return -1;
	for(var i=0;i<3;i++) {
		if (x >= mx3+(mw2+10)*i && x <= mx3+mw2+(mw2+10)*i) return i+41;
	}
	
	return -1;
}

/// @brief Save a sketch data to a local storage entry with name
/// @param name Name of the sketch which can be used in loadLocal() to restore
this.saveLocal = function(name){
	if(typeof(Storage) !== "undefined"){
		var str = localStorage.getItem("canvasDrawData");
		var origData = str === null ? {} : jsyaml.safeLoad(str);
		var newEntry = !(name in origData);
		origData[name] = jsyaml.safeDump(serialize(dobjs));
		localStorage.setItem("canvasDrawData", jsyaml.safeDump(origData));
		// If the named sketch didn't exist, fire up the event of local storage change.
		if(newEntry && ('onLocalChange' in this) && this.onLocalChange)
			this.onLocalChange();
		return true;
	}
	return false;
};

/// @brief Returns list of sketches saved in local storage
/// @returns An array with sketch names in each element
this.listLocal = function() {

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

		return keys;
	}

}

/// Custom inheritance function that prevents the super class's constructor
/// from being called on inehritance.
/// Also assigns constructor property of the subclass properly.
/// Inheriting is closely related to cloneObject()
function inherit(subclass,base){
	// If the browser or ECMAScript supports Object.create, use it
	// (but don't remember to redirect constructor pointer to subclass)
	if(Object.create){
		subclass.prototype = Object.create(base.prototype);
	}
	else{
		var sub = function(){};
		sub.prototype = base.prototype;
		subclass.prototype = new sub;
	}
	subclass.prototype.constructor = subclass;
}

/// Copy all properties in src to target, retaining target's existing properties
/// that have different names from src's.
function mixin(target, src){
	for(var k in src){
		target[k] = src[k];
	}
}

// Create a deep clone of objects
function cloneObject(obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}

	// give temp the original obj's constructor
	// this 'new' is important in case obj is user-defined class which was created by
	// 'new ClassName()', no matter inherited or not.
	// I wonder why Array and Object (built-in classes) don't need new operator.
	var temp = new obj.constructor();
	for (var key in obj) {
		temp[key] = cloneObject(obj[key]);
	}

	return temp;
}

function updateDrawData(){
	try{
		var text = jsyaml.safeDump(serialize(dobjs), {flowLevel: 2});
		if(('onUpdateData' in self) && self.onUpdateData)
			self.onUpdateData(text);
	} catch(e){
		console.log(e);
	}
}

// clear data
function ajaxclear() {
	dobjs = [];
	selectobj = [];
	updateDrawData();
	clearCanvas();
}

// undo
function ajaxundo() {
	if(dhistory.length < 1)
		return;
	dobjs = dhistory[dhistory.length-1];
	dhistory.pop();
	selectobj = [];
	updateDrawData();
	redraw(dobjs);
}

var createXMLHttpRequest = this.createXMLHttpRequest;

/// @brief Posts a sketch data to the server
/// @param fname The file name of the added sketch.
/// @param target The target URL for posting.
/// @param requestDelete If true, it will post delete request instead of new data.
this.postData = function(fname, target, requestDelete){
	var data = jsyaml.safeDump(serialize(dobjs), {flowLevel: 2});
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
		xmlHttp.open("POST", target, true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		var request = "fname=" + encodeURI(fname);
		if(requestDelete)
			request += "&action=delete";
		else
			request += "&drawdata=" + encodeURI(data);
		xmlHttp.send(request);
	}
};

/// @brief Posts a request to server to pull from remote (respective to the server)
/// @param remoteName The remote name (defined in the server)
this.pull = function(remoteName){
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
		xmlHttp.open("GET", "pull.php?remote=" + encodeURI(remoteName), true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.send();
	}
}

/// @brief Posts a request to server to push to remote (respective to the server)
/// @param remoteName The remote name (defined in the server)
this.push = function(remoteName){
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
		xmlHttp.open("GET", "push.php?remote=" + encodeURI(remoteName), true);
		xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlHttp.send();
	}
}

//------------------------ debug ------------------------
function debug(msg) {
	if(options && options.debug)
		options.debug(msg);
}

// ==================== Button class definition ================================= //
/// An abstract button class.
/// SVG or canvas graphics libraries like EaselJS would do this sort of thing
/// much better, but I don't feel like to port to it at once.
function Button(minx, miny, maxx, maxy, ondraw, onclick){
	this.minx = minx;
	this.miny = miny;
	this.maxx = maxx;
	this.maxy = maxy;
	this.ondraw = ondraw;
	this.onclick = onclick;
}

// ==================== Menu class definition ================================= //
function MenuItem(text, onclick){
	this.text = i18n.t(text);
	this.onclick = onclick;
}

// init --------------------------------------------------
//window.captureEvents(Event.click);
//onclick=mouseLeftClick;
var ctx;
var menus = [
	new MenuItem("Grid", function(){
		gridEnable = !gridEnable;
		redraw(dobjs);
	}),
	new MenuItem("Grid+", function(){
		if(gridSize < 32)
			gridSize *= 2;
		if(gridEnable)
			redraw(dobjs);
	}),
	new MenuItem("Grid-", function(){
		if(4 < gridSize)
			gridSize /= 2;
		if(gridEnable)
			redraw(dobjs);
	}),
	new MenuItem("Clear", function(){	// clear
		clearCanvas();
		ajaxclear();
	}),
	new MenuItem("Redraw", function(){redraw(dobjs);}),// redraw
	new MenuItem("Undo", function(){	// undo
		clearCanvas();
		ajaxundo();
	}),
	new MenuItem("Size", function(){
		// Show size input layer on top of the canvas because the canvas cannot have
		// a text input element.
		if(!sizeLayer){
			sizeLayer = document.createElement('div');
			var lay = sizeLayer;
			lay.id = 'bookingLayer';
			lay.style.position = 'absolute';
			lay.style.padding = '5px 5px 5px 5px';
			lay.style.borderStyle = 'solid';
			lay.style.borderColor = '#cf0000';
			lay.style.borderWidth = '2px';
			// Drop shadow to make it distinguishable from the figure contents.
			lay.style.boxShadow = '0px 0px 20px grey';
			lay.style.background = '#cfffcf';
			lay.innerHTML = i18n.t('Input image size in pixels') + ':<br>'
				+ 'x:<input id="sizeinputx" type="text">'
				+ 'y:<input id="sizeinputy" type="text">';
			var okbutton = document.createElement('input');
			okbutton.type = 'button';
			okbutton.value = 'OK';
			okbutton.onclick = function(s){
				lay.style.display = 'none';
				setSize(parseFloat(document.getElementById('sizeinputx').value),
					parseFloat(document.getElementById('sizeinputy').value));
			}
			var cancelbutton = document.createElement('input');
			cancelbutton.type = 'button';
			cancelbutton.value = 'Cancel';
			cancelbutton.onclick = function(s){
				lay.style.display = 'none';
			}
			lay.appendChild(document.createElement('br'));
			lay.appendChild(okbutton);
			lay.appendChild(cancelbutton);
			// Append as the body element's child because style.position = "absolute" would
			// screw up in deeply nested DOM tree (which may have a positioned ancestor).
			document.body.appendChild(lay);
		}
		else // Just show the created layer in the second invocation.
			sizeLayer.style.display = 'block';
		var canvasRect = canvas.getBoundingClientRect();
		// Cross-browser scroll position query
		var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
		var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
		// getBoundingClientRect() returns coordinates relative to view, which means we have to
		// add scroll position into them.
		sizeLayer.style.left = (canvasRect.left + scrollX + 150) + 'px';
		sizeLayer.style.top = (canvasRect.top + scrollY + 50) + 'px';
		document.getElementById('sizeinputx').value = metaObj.size[0];
		document.getElementById('sizeinputy').value = metaObj.size[1];
	}), // size
];

var buttons = [];


// ==================== Tool class definition ================================= //

// A mapping of tool names and tool objects. Automatically updated in the Tool class's constructor.
var toolmap = {};

/// @brief A class that represents a tool in the toolbar.
/// @param name Name of the tool, used in serialized text
/// @param points Number of points which are used to describe points
/// @param params A table of initialization parameters:
///         objctor: The constructor function that is used to create Shape, stands for OBJect ConsTructOR
///         drawTool: A function(x, y) to draw icon on the toolbar.
///         setColor: A function(color) that is called before drawing.
///         setWidth: A function(width) that is called before drawing.
///         draw: A function(mode,str) to actually draw a shape.
function Tool(name, points, params){
	this.name = name;
	this.points = points || 1;
	this.objctor = params && params.objctor || Shape;
	this.drawTool = params && params.drawTool;
	mixin(this, params);
	toolmap[name] = this;
}

Tool.prototype.setColor = function(color){
	ctx.strokeStyle = color;
};

function setColorFill(color){
	ctx.fillStyle = color;
}

Tool.prototype.setWidth = function(width){
	ctx.lineWidth = width;
};

function nop(){}

Tool.prototype.draw = nop;

/// Append a point to the shape by mouse click
Tool.prototype.appendPoint = function(x, y) {
	function addPoint(x, y){
		if (cur_shape.points.length === cur_tool.points){
			dhistory.push(cloneObject(dobjs));
			dobjs.push(cur_shape);
			updateDrawData();
			cur_shape = null;
			redraw(dobjs);
			return true;
		}
		else{
			cur_shape.points.push(canvasToSrc(constrainCoord({x:x, y:y})));
			return false;
		}
	}

	if(!cur_shape){
		var obj = new cur_tool.objctor();
		obj.tool = cur_tool.name;
		obj.color = cur_col;
		obj.width = cur_thin;
		cur_shape = obj;
		// Add two points for previewing shapes that consist of multiple points,
		// but single-point shapes will finish with just single click.
		if(!addPoint(x, y))
			addPoint(x, y);
	}
	else{
		addPoint(x, y);
	}
}

Tool.prototype.mouseDown = function(e){
	// Do nothing by default
}

Tool.prototype.mouseMove = function(mx, my){
	if(cur_shape && 0 < cur_shape.points.length){
		// Live preview of the shape being added.
		var coord = {x: mx, y: my};
		cur_shape.points[cur_shape.points.length-1] = canvasToSrc(constrainCoord(coord));
		redraw(dobjs);
	}
}

Tool.prototype.mouseUp = function(e){
	moving = false;
	sizing = null;
	pointMoving = null;
	var needsRedraw = boxselecting;
	boxselecting = false;
	if(needsRedraw) // Redraw to clear selection box
		redraw(dobjs);
}

// ==================== Tool class definition end ============================= //


// List of tools in the toolbar.
var toolbar = [
	new Tool("select", 1, {drawTool: function(x, y){
			ctx.beginPath();
			ctx.moveTo(x, y-5);
			ctx.lineTo(x, y+10);
			ctx.lineTo(x+4, y+7);
			ctx.lineTo(x+6, y+11);
			ctx.lineTo(x+8, y+9);
			ctx.lineTo(x+6, y+5);
			ctx.lineTo(x+10, y+3);
			ctx.closePath();
			ctx.stroke();
			ctx.strokeText('1', x+45, y+10);
		},
		mouseDown: selectMouseDown,
		mouseUp: function(e){
			if(0 < selectobj.length && (moving || sizing))
				updateDrawData();
			Tool.prototype.mouseUp.call(this, e);
		}
	}),
	new Tool("pathedit", 1, {
		// The path editing tool. This is especially useful when editing
		// existing curves.  The icon is identical to that of select tool,
		// except that the mouse cursor graphic is filled.
		drawTool: function(x, y){
			ctx.fillStyle = 'rgb(250, 250, 250)';
			ctx.beginPath();
			ctx.moveTo(x, y-5);
			ctx.lineTo(x, y+10);
			ctx.lineTo(x+4, y+7);
			ctx.lineTo(x+6, y+11);
			ctx.lineTo(x+8, y+9);
			ctx.lineTo(x+6, y+5);
			ctx.lineTo(x+10, y+3);
			ctx.closePath();
			ctx.fill();
			ctx.strokeText('1', x+45, y+10);
		},
		mouseDown: pathEditMouseDown,
		mouseUp: function(e){
			if(0 < selectobj.length && pointMoving)
				updateDrawData();
			Tool.prototype.mouseUp.call(this, e);
		}
	}),
	new Tool("line", 2, {
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x+40, y+10);
			ctx.stroke();
			ctx.strokeText('2', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			ctx.moveTo(arr[0].x, arr[0].y);
			ctx.lineTo(arr[1].x, arr[1].y);
			ctx.stroke();
			ctx.lineWidth = 1;
		},
	}),
	new Tool("arrow", 2, {
		drawTool: function(x, y){
			ctx.beginPath();
			l_arrow(ctx, [{x:x, y:y+5}, {x:x+40, y:y+5}]);
			ctx.strokeText('2', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			l_arrow(ctx, arr);
			ctx.lineWidth = 1;
		}
	}),
	new Tool("barrow", 2, {
		drawTool: function(x, y){
			ctx.beginPath();
			l_tarrow(ctx, [{x:x, y:y+5}, {x:x+40, y:y+5}]);
			ctx.strokeText('2', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			l_tarrow(ctx, arr);
			ctx.lineWidth = 1;
		}
	}),
	new Tool("darrow", 2, {
		drawTool: function(x, y){
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
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			l_darrow(ctx, arr);
			ctx.lineWidth = 1;
		}
	}),
	new Tool("arc", 3, {
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.quadraticCurveTo(x+20, y+20, x+40, y);
			ctx.stroke();
			ctx.strokeText('3', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			ctx.moveTo(arr[0].x, arr[0].y);
			ctx.quadraticCurveTo(arr[1].x, arr[1].y, arr[2].x, arr[2].y);
			ctx.stroke();
			ctx.lineWidth = 1;
		}
	}),
	new Tool("arcarrow", 3, {
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.quadraticCurveTo(x+20, y+20, x+40, y);
			l_hige(ctx, [{x:x+20, y:y+20}, {x:x+40, y:y}]);
			ctx.strokeText('3', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			ctx.moveTo(arr[0].x, arr[0].y);
			ctx.quadraticCurveTo(arr[1].x, arr[1].y, arr[2].x, arr[2].y);
			l_hige(ctx, [arr[1], arr[2]]);
			ctx.lineWidth = 1;
		}
	}),
	new Tool("arcbarrow", 3, {
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.quadraticCurveTo(x+20, y+20, x+40, y);
			var a = [{x:x+20, y:y+20}, {x:x+40, y:y}];
			l_hige(ctx, a);
			//a[0] = {x:x+10, y:y+10};
			a[1] = {x:x, y:y};
			l_hige(ctx, a);
			ctx.strokeText('3', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
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
		}
	}),
	new Tool("rect", 2, {
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.rect(x, y, 40, 10);
			ctx.stroke();
			ctx.strokeText('2', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			ctx.rect(arr[0].x, arr[0].y, arr[1].x-arr[0].x, arr[1].y-arr[0].y);
			ctx.stroke();
			ctx.lineWidth = 1;
		}
	}),
	new Tool("ellipse", 2, {
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.scale(1.0, 0.5);		// vertically half
			ctx.arc(x+20, (y+5)*2, 20, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.scale(1.0, 2.0);
			ctx.strokeText('2', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			l_elipse(ctx, arr);
			ctx.lineWidth = 1;
		}
	}),
	new Tool("rectfill", 2, {
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.fillStyle = 'rgb(250, 250, 250)';
			ctx.fillRect(x, y, 40, 10);
			ctx.strokeText('2', x+45, y+10);
		},
		setColor: setColorFill,
		setWidth: nop,
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			ctx.fillRect(arr[0].x, arr[0].y, arr[1].x-arr[0].x, arr[1].y-arr[0].y);
		}
	}),
	new Tool("ellipsefill", 2, {drawTool: function(x, y){
			ctx.beginPath();
			ctx.fillStyle = 'rgb(250, 250, 250)';
			ctx.scale(1.0, 0.5);		// vertically half
			ctx.arc(x+20, (y+5)*2, 20, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.scale(1.0, 2.0);
			ctx.strokeText('2', x+45, y+10);
		},
		setColor: setColorFill,
		setWidth: nop,
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			l_elipsef(ctx, arr);
			ctx.lineWidth = 1;
		}
	}),
	new Tool("star", 1, {objctor: PointShape,
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.moveTo(x+8, y-3);
			ctx.lineTo(x+14, y+13);
			ctx.lineTo(x, y+2);
			ctx.lineTo(x+16, y+2);
			ctx.lineTo(x+2, y+13);
			ctx.closePath();
			ctx.stroke();
			ctx.strokeText('1', x+45, y+10);
		},
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			//ctx.lineWidth = cur_thin - 40;
			l_star(ctx, arr);
			ctx.lineWidth = 1;
		}
	}),
	new Tool("check", 1, {objctor: PointShape,
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x+5, y+7);
			ctx.lineTo(x+20, y);
			ctx.stroke();
			ctx.strokeText('1', x+45, y+10);
		},
		setWidth: nop,
		draw: function(obj){
			var arr = obj.points;
			ctx.beginPath();
			l_check(ctx, arr);
		}
	}),
	new Tool("text", 1, {objctor: TextShape,
		drawTool: function(x, y){
			ctx.beginPath();
			ctx.strokeText(i18n.t('Text'), x+3, y+10);
			ctx.strokeText('1', x+45, y+10);
		},
		setColor: setColorFill,
		draw: function(obj){
			var str = obj.text;
			if (null == str) {		// cancel
//					idx = 0;
				return;
			}
			ctx.beginPath();
			if (1 == obj.width) setFont(14);
			else if (2 == obj.width) setFont(16);
			else setFont(20);
			ctx.fillText(str, obj.points[0].x, obj.points[0].y);
			ctx.font = setFont(14);
		},
		appendPoint: function(x, y){
			var textTool = this;
			// Show size input layer on top of the canvas because the canvas cannot have
			// a text input element.
			if(!textLayer){
				textLayer = document.createElement('div');
				// Create field for remembering position of text being inserted.
				// Free variables won't work well.
				textLayer.canvasPos = {x:0, y:0};
				var lay = textLayer;
				lay.id = 'textLayer';
				lay.style.position = 'absolute';
				lay.style.padding = '5px 5px 5px 5px';
				lay.style.borderStyle = 'solid';
				lay.style.borderColor = '#cf0000';
				lay.style.borderWidth = '2px';
				// Drop shadow to make it distinguishable from the figure contents.
				lay.style.boxShadow = '0px 0px 20px grey';
				lay.style.background = '#cfffcf';

				// Create and assign the input element to a field of the textLayer object
				// to keep track of the input element after this function is exited.
				lay.textInput = document.createElement('input');
				lay.textInput.id = "textinput";
				lay.textInput.type = "text";
				lay.textInput.onkeyup = function(e){
					// Convert enter key event to OK button click
					if(e.keyCode === 13)
						okbutton.onclick();
				};
				lay.appendChild(lay.textInput);

				var okbutton = document.createElement('input');
				okbutton.type = 'button';
				okbutton.value = 'OK';
				okbutton.onclick = function(e){
					lay.style.display = 'none';
					// Ignore blank text
					if(lay.textInput.value == '')
						return;
					dhistory.push(cloneObject(dobjs));
					// If a shape is clicked, alter its value instead of adding a new one.
					if(lay.dobj){
						lay.dobj.text = lay.textInput.value;
					}
					else{
						var obj = new textTool.objctor();
						obj.tool = cur_tool.name;
						obj.color = cur_col;
						obj.width = cur_thin;
						obj.points.push({x: lay.canvasPos.x, y: lay.canvasPos.y});
						obj.text = lay.textInput.value;
						dobjs.push(obj);
					}
					updateDrawData();
					redraw(dobjs);
				}
				var cancelbutton = document.createElement('input');
				cancelbutton.type = 'button';
				cancelbutton.value = 'Cancel';
				cancelbutton.onclick = function(s){
					lay.style.display = 'none';
				}
				lay.appendChild(document.createElement('br'));
				lay.appendChild(okbutton);
				lay.appendChild(cancelbutton);
				// Append as the body element's child because style.position = "absolute" would
				// screw up in deeply nested DOM tree (which may have a positioned ancestor).
				document.body.appendChild(lay);
			}
			else
				textLayer.style.display = 'block';
			var coord = canvasToSrc(constrainCoord({x:x, y:y}));
			textLayer.canvasPos.x = coord.x;
			textLayer.canvasPos.y = coord.y;

			// Find if any TextShape is under the mouse cursor.
			textLayer.dobj = null;
			textLayer.textInput.value = "";
			for (var i = 0; i < dobjs.length; i++) {
				if(dobjs[i] instanceof TextShape && hitRect(objBounds(dobjs[i], true), coord.x, coord.y)){
					textLayer.dobj = dobjs[i]; // Remember the shape being clicked on.
					textLayer.textInput.value = dobjs[i].text; // Initialized the input buffer with the previous content.
					break;
				}
			}

			var canvasRect = canvas.getBoundingClientRect();
			// Cross-browser scroll position query
			var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
			var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
			// getBoundingClientRect() returns coordinates relative to view, which means we have to
			// add scroll position into them.
			textLayer.style.left = (canvasRect.left + scrollX + offset.x + coord.x) + 'px';
			textLayer.style.top = (canvasRect.top + scrollY + offset.y + coord.y) + 'px';
			// focus() should be called after textLayer is positioned, otherwise the page may
			// unexpectedly scroll to somewhere.
			textLayer.textInput.focus();

			// Reset the point buffer
//				idx = 0;
			return true; // Skip registration
		}
	})
];

var toolbars = [toolbar,
	[
		toolmap.select,
		toolmap.pathedit,
		new Tool("delete", 1, {
			drawTool: function(x, y){
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x+10, y+10);
				ctx.moveTo(x, y+10);
				ctx.lineTo(x+10, y);
				ctx.stroke();
				ctx.strokeText('1', x+45, y+10);
			}
		}),
		new Tool("done", 1, {objctor: PointShape,
			drawTool: function(x, y){
				ctx.beginPath();
				ctx.strokeText(i18n.t('Done'), x+3, y+10);
				ctx.beginPath();
				ctx.arc(x+9, y+5, 8, 0, 6.28, false);
				ctx.stroke();
				ctx.strokeText('1', x+45, y+10);
			},
			setWidth: nop,
			draw: function(obj){
				var arr = obj.points;
				ctx.beginPath();
				l_complete(ctx, arr);
			}
		}),
		new Tool("path", 2, {
			objctor: PathShape,
			drawTool: function(x, y){
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.bezierCurveTo(x+10, y+20, x+20, y-10, x+30, y+10);
				ctx.stroke();
				ctx.strokeText('n', x+45, y+10);
			},
			draw: function(obj){
				var arr = obj.points;
				if(arr.length < 2)
					return;
				ctx.beginPath();
				ctx.moveTo(arr[0].x, arr[0].y);
				for(var i = 1; i < arr.length; i++){
					if("cx" in arr[i] && "cy" in arr[i]){
						if("dx" in arr[i] && "dy" in arr[i])
							ctx.bezierCurveTo(arr[i].cx, arr[i].cy, arr[i].dx, arr[i].dy, arr[i].x, arr[i].y);
						else
							ctx.bezierCurveTo(arr[i].cx, arr[i].cy, arr[i].x, arr[i].y, arr[i].x, arr[i].y);
					}
					else if("dx" in arr[i] && "dy" in arr[i])
						ctx.bezierCurveTo(arr[i-1].x, arr[i-1].y, arr[i].dx, arr[i].dy, arr[i].x, arr[i].y);
					else
						ctx.lineTo(arr[i].x, arr[i].y);
				}
				ctx.stroke();
				ctx.lineWidth = 1;
			},
			appendPoint: function(x, y){
				function addPoint(){
					var pts = cur_shape.points;
					pts.push(d);
				}

				var d = canvasToSrc(constrainCoord({x:x, y:y}));
				if(!cur_shape){
					var obj = new cur_tool.objctor();
					obj.tool = cur_tool.name;
					obj.color = cur_col;
					obj.width = cur_thin;
					cur_shape = obj;
					addPoint();
					addPoint();
				}
				else{
					var pts = cur_shape.points;
					if(pts.length !== 1){
						var prev = pts[pts.length-2];
						if(d.x === prev.x && d.y === prev.y){
							cur_shape.points.pop();
							dhistory.push(cloneObject(dobjs));
							dobjs.push(cur_shape);
							updateDrawData();
							cur_shape = null;
							redraw(dobjs);
							return true;
						}
					}
					addPoint();
				}
			},
		})
	]
];
var toolbarPage = 0;

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
var mw0 = 70, mw1 = 60, mw2 = 30, my0 = 20, mh0 = 28;
var cur_tool = toolmap.select, cur_col = "black", cur_thin = 1;
var cur_shape = null;
var offset = editmode ? {x:x1, y:y1} : {x:0, y:0};

// The layer to show input controls for width and height sizes of the figure.
// It's kept as a member variable in order to reuse in the second and later invocations.
var sizeLayer = null;

// The layer to input text.
// It used to be prompt() function, but it's not beautiful.
var textLayer = null;

// The default metaObj values used for resetting.
var defaultMetaObj = {type: "meta", size: [1024-x1, 640-y1]};

// The meta object is always the first element in the serialized figure text,
// but is not an element of dobjs array.
// It's automatically loaded when deserialized and included when serialized.
var metaObj = cloneObject(defaultMetaObj);

// A pseudo-this pointer that can be used in private methods.
// Private methods mean local functions in this constructor, which
// don't share this pointer with the constructor itself unless the
// form "function.call(this)" is used.
var self = this;

onload();
}

// Create and return a XMLHttpRequest object or ActiveXObject for IE6-
SketchCanvas.prototype.createXMLHttpRequest = function(){
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

