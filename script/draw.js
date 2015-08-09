'use strict';
//--- draw.hs -- lib for canvas.js 
// draw arrow


function l_arrow(ctx, arr) {
	var c = l_vec(arr, 6);
	ctx.moveTo(arr[0].x, arr[0].y);
	ctx.lineTo(arr[1].x, arr[1].y);
	ctx.lineTo(arr[1].x-c[0].x, arr[1].y-c[0].y);
	ctx.moveTo(arr[1].x, arr[1].y);
	ctx.lineTo(arr[1].x-c[1].x, arr[1].y-c[1].y);
	ctx.stroke();
}

// draw double arrow
function l_darrow(ctx, arr) {
	var c = l_vec9(arr, 2);
	var d = l_vec(arr, 8);
	ctx.moveTo(arr[0].x+c[0].x, arr[0].y+c[0].y);
	ctx.lineTo(arr[1].x+c[0].x, arr[1].y+c[0].y);
	ctx.moveTo(arr[0].x+c[1].x, arr[0].y+c[1].y);
	ctx.lineTo(arr[1].x+c[1].x, arr[1].y+c[1].y);
	ctx.moveTo(arr[1].x-d[0].x, arr[1].y-d[0].y);
	ctx.lineTo(arr[1].x, arr[1].y);
	ctx.lineTo(arr[1].x-d[1].x, arr[1].y-d[1].y);
	ctx.stroke();
}

// draw twin arrow
function l_tarrow(ctx, arr) {
	var c = l_vec(arr, 6);
	ctx.moveTo(arr[0].x, arr[0].y);
	ctx.lineTo(arr[1].x, arr[1].y);
	ctx.lineTo(arr[1].x-c[0].x, arr[1].y-c[0].y);
	ctx.moveTo(arr[1].x, arr[1].y);
	ctx.lineTo(arr[1].x-c[1].x, arr[1].y-c[1].y);
	var a = new Array(2);
	a[0] = arr[1];
	a[1] = arr[0];
	c = l_vec(a, 6);
	ctx.moveTo(arr[0].x-c[0].x, arr[0].y-c[0].y);
	ctx.lineTo(arr[0].x, arr[0].y);
	ctx.lineTo(arr[0].x-c[1].x, arr[0].y-c[1].y);
	ctx.stroke();
}

function l_hige(ctx, arr) {
	var c = l_vec(arr, 6);
	ctx.moveTo(arr[1].x-c[0].x, arr[1].y-c[0].y);
	ctx.lineTo(arr[1].x, arr[1].y);
	ctx.lineTo(arr[1].x-c[1].x, arr[1].y-c[1].y);
	ctx.stroke();
}

// draw elipse
function l_elipse(ctx, arr) {
	var x0 = Math.min(arr[0].x, arr[1].x);
	var y0 = Math.min(arr[0].y, arr[1].y);
	var x1 = Math.max(arr[0].x, arr[1].x);
	var y1 = Math.max(arr[0].y, arr[1].y);
	var w = x1 - x0;
	var h = y1 - y0;
	if (0 == w || 0 == h) {	// line
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();
	}
	else {
		var rate = h / w;
		var r = w / 2;
		ctx.scale(1.0, rate);		// 縦変形
		ctx.arc(x0+r, y0/rate+r, r, 0, 2 * Math.PI, false);
		ctx.stroke();
		ctx.scale(1.0, w/h);		// 回復
	}
}

// draw elipse fill
function l_elipsef(ctx, arr) {
	var x0 = Math.min(arr[0].x, arr[1].x);
	var y0 = Math.min(arr[0].y, arr[1].y);
	var x1 = Math.max(arr[0].x, arr[1].x);
	var y1 = Math.max(arr[0].y, arr[1].y);
	var w = x1 - x0;
	var h = y1 - y0;
	if (0 == w || 0 == h) {	// line
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();
	}
	else {
		var rate = h / w;
		var r = w / 2;
		ctx.scale(1.0, rate);		// 縦変形
		ctx.arc(x0+r, y0/rate+r, r, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.scale(1.0, w/h);		// 回復
	}
}

// draw star
function l_star(ctx, arr) {
	ctx.moveTo(arr[0].x+8, arr[0].y-3);
	ctx.lineTo(arr[0].x+14, arr[0].y+13);
	ctx.lineTo(arr[0].x, arr[0].y+2);
	ctx.lineTo(arr[0].x+16, arr[0].y+2);
	ctx.lineTo(arr[0].x+2, arr[0].y+13);
	ctx.closePath();
	ctx.stroke();
}

// draw check
function l_check(ctx, arr) {
	ctx.moveTo(arr[0].x, arr[0].y);
	ctx.lineTo(arr[0].x+5, arr[0].y+7);
	ctx.lineTo(arr[0].x+20, arr[0].y);
	ctx.stroke();
}

// draw complete
function l_complete(ctx, arr) {
	ctx.strokeText('済', arr[0].x+3, arr[0].y+10);
	ctx.arc(arr[0].x+9, arr[0].y+5, 8, 0, 6.28, false);
	ctx.stroke();
}

// 内積45° a:vector b:length 
function l_vec(a, b) {
	var ax = a[1].x-a[0].x;
	var ay = a[1].y-a[0].y;
	var rate = b / Math.sqrt(ax * ax + ay * ay);
	ax *= rate;
	ay *= rate;
	var rad1 = Math.PI / 4.0;		// 45°
	var rad2 = -Math.PI / 4.0;		// -45°
	var a1x = ax * Math.cos(rad1) - ay * Math.sin(rad1);
	var a1y = ax * Math.sin(rad1) + ay * Math.cos(rad1);
	var a2x = ax * Math.cos(rad2) - ay * Math.sin(rad2);
	var a2y = ax * Math.sin(rad2) + ay * Math.cos(rad2);
	var c = new Array(2);
	c[0] = { x:a1x, y:a1y };
	c[1] = { x:a2x, y:a2y };
	return c;
}

// 内積90° a:vector b:length 
function l_vec9(a, b) {
	var ax = a[1].x-a[0].x;
	var ay = a[1].y-a[0].y;
	var rate = b / Math.sqrt(ax * ax + ay * ay);
	ax *= rate;
	ay *= rate;
	var a1x = -ay;
	var a1y = ax;
	var a2x = ay;
	var a2y = -ax;
	var c = new Array(2);
	c[0] = { x:a1x, y:a1y };
	c[1] = { x:a2x, y:a2y };
	return c;
}
