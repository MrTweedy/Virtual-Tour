//Dependencies: jQuery, 3js, CHECKS.js, data.js
//Panorama image files should be 8192 x 1024 pixel jpgs
//Instantiate by calling "init()" and passing the id of a div to use.

//Written by Joshua Hugo for Riverside Healthcare, 2017

var scene, cylinder, group, renderer, texture, mouseOrg, rotOrgY, mouseTurnRatio, hasTouch, isRotating, currentRoom, rotCrossesZero, isTouch, XLine, XLineInfo, stageName,
	mouseInfo = false,
	rotConstraint = [],
	textures = {},
	targetsArray = [],
	isGrabbing = false,
	draggingLine = false,
	firstRoom = true;

var cssString = "<style>\
	###{\
		width:100%;\
		margin-left:auto;\
		margin-right:auto;\
		padding:0px;\
		position:relative;\
	}\
	### canvas{\
		width:100%;\
		height:100%;\
		padding:0px;\
		margin:0px;\
		margin-left:auto;\
		margin-right:auto;\
		cursor: grab;\
		cursor: -webkit-grab;\
	}\
	###.grabbing{\
		cursor: grabbing;\
		cursor: -webkit-grabbing;\
	}\
	### canvas.pointing{\
		cursor: pointer;\
		cursor: -webkit-pointer;\
	}\
	#controller{\
		position:absolute;\
		z-index:10000;\
		bottom:10px;\
		right:10px;\
	}\
	#mouseover-info, .x-line-info{\
		position:absolute;\
		z-index:100;\
		color:white;\
		font-family:Gotham, \"Helvetica Neue\", Helvetica, Arial, \"sans-serif\";\
		text-shadow:1px 1px 6px black;\
	}\
	.x-line-info{\
		white-space: nowrap;\
		pointer-events: none;\
	}\
	#info-line{\
		position:absolute;\
		z-index:99;\
		width:2px;\
		top:7%;\
		bottom:7%;\
		left:40%;\
		background-color: rgba(255,98,51,.8);\
		box-shadow:0px 0px 4px black;\
	}\
	.ignore-pointer{\
		pointer-events:none !important;\
	}\
	#info-line:before{\
		content:\"\";\
		position:absolute;\
		z-index:99;\
		background-color:rgba(255,98,51,.5);\
		box-shadow:0px 0px 4px black;\
		height:30px;\
		width:30px;\
		border-radius:100%;\
		top:-30px;\
		left:-14px;\
	}\
	#info-line:after{\
		content:\"\";\
		position:absolute;\
		z-index:99;\
		background-color:rgba(255,98,51,.5);\
		box-shadow:0px 0px 4px black;\
		height:30px;\
		width:30px;\
		border-radius:100%;\
		bottom:-30px;\
		left:-14px;\
	}\
	#loading{\
		background-image:url(img/loading.gif);\
		background-repeat:no-repeat;\
		background-color:white;\
		background-position: center;\
		height:100px;\
		width:100px;\
		border-radius:100%;\
		position:absolute;\
		z-index: 1000;\
		top:calc(50% - 50px);\
		left:calc(50% - 50px);\
	}\
	#tour-help{\
		max-width:50%;\
		margin:0px;\
		padding-left:10px;\
		padding-right:10px;\
		background-color:rgba(255,255,255,.9);\
		border:1px solid gray;\
		border-radius:10px;\
		color:dimGray;\
		cursor:pointer;\
		text-align:center;\
		position:absolute;\
		left:50%;\
		top:50%;\
		transform:translate(-50%, -50%);\
		-webkit-transform:translate(-50%, -50%);\
		z-index:10000;\
		box-shadow:5px 5px 10px rgba(0,0,0,.75);\
		font-size:large;\
	}\
	</style>";

function init(_stageName){
	stageName = _stageName;
	while(cssString.indexOf("###") > -1){
		cssString = cssString.replace("###", stageName);
	}
	$("head").append(cssString);
	CHECKS.checkKeys();
	CHECKS.featureTests();
	CHECKS.webglAvailable() ? renderer = new THREE.WebGLRenderer() : renderer = new THREE.CanvasRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	$(stageName).append(renderer.domElement);
	addListeners(Modernizr.touchevents);
	var room = GET("room");
	if(room){
		createController(room);
		loadRoom(room);
	} else {
		createController(defaultRoom);
		loadRoom(defaultRoom);
	}
}

function createController(room){
	$(stageName).prepend('<div id="controller"><select id="room-select"></select></div>');
	var keys = Object.keys(DATA);
	for(var i = 0; i < keys.length; i++){
		$("#room-select").append("<option value='"+ keys[i] +"'>"+ DATA[keys[i]].name +"</option>");
	}
	$("#room-select option[value = '" + room + "']").attr("selected", "selected");
	$("#room-select").change(function(){
		loadRoom($("#room-select").val())
	});
}

function loadRoom(room, _pushState, startAngle){
	clearOverlays();
	var pushState = typeof(_pushState) == "boolean" ? pushState = _pushState : pushState = true;
	$("#room-select").find("option").each(function(){ $(this).removeAttr("selected"); })
	$("#room-select option[value = '" + room + "']").attr("selected", "selected");
	if(pushState) window.history.pushState({room:room}, null, "?room=" + room);
	if(textures.hasOwnProperty(room)){
		texture = textures[room];
		showRoom(room, startAngle);
	} else {
		$(stageName).prepend("<div id='loading'></div>");
		loader.load(imgFolder + "/"+ DATA[room].img, function(text){
			textures[room] = text;
			texture = textures[room];
			$("#loading").remove();
			showRoom(room, startAngle);
		})
	}
}

function clearOverlays(){
	$("#mouseover-info").remove();
	$(".x-line-info").remove();
}

function showRoom(room, startAngle){
	targetsArray = [];
	scene = new THREE.Scene();
	cylinder = new THREE.Mesh( new THREE.CylinderGeometry(cylSize, cylSize, cylSize, 64, 1, true), new THREE.MeshBasicMaterial( {map:texture, side:THREE.BackSide} ) );
	group = new THREE.Group();
	group.add(cylinder);
	for(var i = 0; i < DATA[room].targets.length; i++){
		var targetGeom = new THREE.BoxGeometry(DATA[room].targets[i].W, DATA[room].targets[i].H, targetThickness);
		var target = new THREE.Mesh(targetGeom, targetMaterial);
		var targetParent = new THREE.Group();
		target.position.x = DATA[room].targets[i].X;
		target.position.y = DATA[room].targets[i].Y;
		target.position.z = cylSize * .9;
		target.targetName = DATA[room].targets[i].targetName;
		target.targetAction = DATA[room].targets[i].targetAction;
		target.targetType = DATA[room].targets[i].targetType;
		if(DATA[room].targets[i].startAngle) target.startAngle = DATA[room].targets[i].startAngle;
		if(DATA[room].targets[i].xTilt) target.rotation.x = PI2(DATA[room].targets[i].xTilt);
		if(DATA[room].targets[i].yTilt) target.rotation.y = PI2(DATA[room].targets[i].yTilt);
		if(DATA[room].targets[i].zTilt) target.rotation.z = PI2(DATA[room].targets[i].zTilt);
		targetsArray.push(target);
		targetParent.add(target);
		var targetFrame = new THREE.LineSegments(new THREE.EdgesGeometry(targetGeom), targetFrameMaterial);
		targetFrame.position.x = target.position.x;
		targetFrame.position.y = target.position.y;
		targetFrame.position.z = target.position.z;
		targetFrame.rotation.x = target.rotation.x;
		targetFrame.rotation.y = target.rotation.y;
		targetFrame.rotation.z = target.rotation.z;
		targetParent.add(targetFrame);
		targetParent.rotation.y = PI2(DATA[room].targets[i].rotY);
		group.add(targetParent);
	}
	group.rotation.y = startAngle || PI2(DATA[room].defaultStartAngle);
	scene.add(group);
	rotConstraint = DATA[room].rotConstraint.length == 2 ? [PI2(DATA[room].rotConstraint[0]), PI2(DATA[room].rotConstraint[1])] : [0, 0];
	if(firstRoom){
		var helpHTML = isTouch ? "<p>Drag to rotate the view.</p><p>Drag the orange line over hotspots to see information about them.</p><p>Tap hotspots to interact.</p><p style='font-size:smaller'>Tap to hide these instructions.</p>" : "<p>Click and drag to rotate the view.</p><p>Mouse over hotspots to see information about them.</p><p>Click hotspots to interact.</p><p style='font-size:smaller'>Click to hide these instructions.</p>";
		$(stageName).prepend('<div id="tour-help">' + helpHTML + '</div>');
		$("#tour-help").click(function(){$(this).fadeOut()})
		firstRoom = false;
		animate();
	}
	onWindowResize();
}

function addListeners(hasTouch){
	if(hasTouch){
		isTouch = true;
		$(stageName).prepend("<div id='info-line'></div>");
		XLineInfo = {};
		$("#info-line").on("touchstart", function(){ draggingLine = true; });
		$("#info-line").on("touchend", function(){ cancelMouse(); });
		$("#info-line").on("touchmove", function(data){ onMouseMove(data); });
		$(stageName + " canvas").on("touchstart", function(data){ onMouseDown(data); });
		$(stageName + " canvas").on("touchend", function(data){ onMouseUp(data); });
		$(stageName + " canvas").on("touchmove", function(data){ onMouseMove(data); });
		$(stageName + " canvas").on("touchcancel", function(data){ cancelMouse(); });
	} else {
		isTouch = false;
		$(stageName + " canvas").on("mousedown", function(data){ onMouseDown(data); });
		$(stageName + " canvas").on("mouseup", function(data){ onMouseUp(data); });
		$(stageName + " canvas").on("mousemove", function(data){ onMouseMove(data); });
		$(stageName + " canvas").on("mouseleave", function(data){ cancelMouse(); });
		$(stageName + " canvas").on("mouseout", function(data){ cancelMouse(); });
	}
	window.addEventListener( 'resize', onWindowResize, false );
	window.addEventListener('popstate', function(){	GET("room") ? loadRoom(GET("room"), false) : loadRoom(defaultRoom, false); }, false);
}

function onWindowResize() {
	var propWidth = $(stageName).parent().width();
	var propHeight = propWidth * aspect;
	if(propHeight > $(window).height()){
		propHeight = $(window).height();
		propWidth = propHeight / aspect;
		$(stageName).attr("style", "width:" + propWidth + "px;")
	} else {
		$(stageName).removeAttr("style");
	}
	renderer.setSize(propWidth, propHeight);
	mouseTurnRatio = 2 / propWidth;
	if(isTouch){
		setXLine(xLineInfo);
	}
}

function onMouseUp(e){
	if(!isRotating){
		targetHit(checkHits(normalizeXY(getMouse(e))));
	}
	cancelMouse();
}

function cancelMouse(){
	isGrabbing = false;
	isRotating = false;
	$(stageName + " canvas").removeClass("grabbing");
	if(draggingLine){
		setXLine();
		draggingLine = false;
	}
	if(isTouch){
		$("#info-line").removeClass("ignore-pointer");
	}
}

function onMouseDown(e){
	if(isTouch){
		$("#info-line").addClass("ignore-pointer");
	}
	mouseOrg = getMouse(e);
	rotOrgY = group.rotation.y;
	isGrabbing = true;
	$(stageName + " canvas").addClass("grabbing");
}

function onMouseMove(e){
	var newXY = getMouse(e);
	if(draggingLine){
		$("#info-line").attr("style", "left:" + newXY[0] + "px;");
		setXLine();
		xLineInfo();
	}
	if(isGrabbing){
		var mouseChange = [mouseOrg[0] - newXY[0], mouseOrg[1] - newXY[1]];
		if(Math.abs(mouseChange[0]) > 10){
			isRotating = true;
		}
		doRotation(rotOrgY + mouseChange[0] * mouseTurnRatio, e);
		if(!isTouch){
			if(mouseInfo){
				$("#mouseover-info").remove();
				$(stageName + " canvas").removeClass("pointing");
			}
			mouseInfo = false;
		}	
	} else if(!isTouch) {
		mouseoverInfo( newXY );
	}
	if(isTouch){
		xLineInfo();
	}
}

function doRotation(proposedRotY, e){
	if(rotConstraint[0] == rotConstraint[1]){ // view is unconstrained
		group.rotation.y = proposedRotY;
	} else if(rotConstraint[0] < rotConstraint[1]){ // view angle does not cross zero
		if(proposedRotY > rotConstraint[0] && proposedRotY < rotConstraint[1]){
			group.rotation.y = proposedRotY;
		}
	} else { // view angle crosses zero
		if(proposedRotY > rotConstraint[0] || proposedRotY < rotConstraint[1]){
			group.rotation.y = proposedRotY;
		}
	}
	if(group.rotation.y > Math.PI * 2){
		group.rotation.y = rotOrgY = 0;
		mouseOrg = getMouse(e);
	}
	if(group.rotation.y < 0){
		group.rotation.y = rotOrgY = Math.PI * 2;
		mouseOrg = getMouse(e);
	}
}

function mouseoverInfo(XY){
	var mouseXY = [XY[0], XY[1]];
	var normedXY = normalizeXY([XY[0], XY[1]]);
	var hitTarget = checkHits(normedXY);
	if(hitTarget){			
		if(!mouseInfo){
			mouseInfo = true;
			$(stageName + " canvas").addClass("pointing");
			$(stageName).prepend("<div id='mouseover-info'>" + hitTarget.targetName + "</div>");
		}
		var placement = normedXY[0] > .5 ? $("#mouseover-info").width() + 25 : 0;
		$("#mouseover-info").attr("style", "left:calc(" + (mouseXY[0] + 15) + "px - " + placement + "px); top:" + (mouseXY[1] + 5) + "px");
	} else {
		$(stageName + " canvas").removeClass("pointing");
		mouseInfo = false;
		$("#mouseover-info").remove();
	}
}

function xLineInfo(){
	var hits = checkHits(XLine);
	if(hits){
		hits.forEach(function(target){
			if(!XLineInfo.hasOwnProperty(target[0].id)){
				var placement = XLine[0][0] > .25 ? " right:10px;" : " left:10px;";
				$("#info-line").append("<div class='x-line-info' targetid='" + target[0].id + "' style='top:" + (normalizeXY(target[1], true)[1] - 25) + "px;" + placement + "'>" + target[0].targetName + "</div>");
				XLineInfo[target[0].id] = target.targetName;
			}
		});
		Object.keys(XLineInfo).forEach(function(key){
			var isCurrent = false;
			for(var z = 0; z < hits.length; z++){
				if(key == hits[z][0].id){
					isCurrent = true;
					break;
				}
			}
			if(!isCurrent){
				$(".x-line-info[targetid='" + key + "']").remove();
				delete XLineInfo[key];
			}
		});
	} else {
		if(Object.keys(XLineInfo).length > 0){
			Object.keys(XLineInfo).forEach(function(key){
				$(".x-line-info[targetid='" + key + "']").remove();
				delete XLineInfo[key];
			});
		}
	}
}

function getMouse(e){
	var X, Y;
	try{
		X = e.originalEvent.offsetX || e.originalEvent.changedTouches[0].pageX - e.originalEvent.srcElement.offsetParent.offsetLeft;
	} catch(er) {
		X = 1;
	}
	try{
		Y = e.originalEvent.offsetY || e.originalEvent.changedTouches[0].pageY - e.originalEvent.srcElement.offsetParent.offsetTop;
	} catch(er) {
		Y = 1;
	}
	return [X, Y];
}

function checkHits(XY){
	if(typeof XY[0] == "object"){
		var hitsArray = [];
		for(var o = 0; o < targetsArray.length; o++){
			for(var i = 0; i < XY.length; i++){
				raycaster.setFromCamera(new THREE.Vector2(XY[i][0], XY[i][1]), camera);
				try{
					if(raycaster.intersectObject(targetsArray[o]).length == 1){
						hitsArray.push([targetsArray[o], XY[i]]);
						break;
					}
				} catch(err){}
			}
		}
		return hitsArray.length ? hitsArray : false ;
	} else if(typeof XY[0] == "number") {
		for(var q = 0; q < targetsArray.length; q++){
			raycaster.setFromCamera(new THREE.Vector2(XY[0], XY[1]), camera);
			if(raycaster.intersectObject(targetsArray[q]).length == 1){
				return targetsArray[q];
				break;
			}
		}
		return false;
	}
}

function targetHit(target){
	if(target){
		if(target.targetType == "portal"){
			$(stageName + " canvas").removeClass("pointing");
			mouseInfo = false;
			$("#mouseover-info").remove();
			loadRoom(target.targetAction, true, PI2(target.startAngle));
		}
	}
}

function setXLine(callback){
	XLine = [];
	var Xpos = $("#info-line").position().left;
	var Ypos = $("#info-line").position().top;
	var height = $("#info-line").height();
	var firstPoint = normalizeXY([Xpos, Ypos]);
	if(Math.abs(firstPoint[0]) <= 1 && Math.abs(firstPoint[1]) <= 1){
		XLine.push(firstPoint);
		for(var i = 1; i <= touchlineSamples; i++){
			XLine.push( normalizeXY( [ Xpos, height * (i * (1 / touchlineSamples)) ] ) );
		}
		try{callback();}catch(q){};
	} else {
		var XLineSet = false;
		var XLineInterval = setInterval(function(){
			if(XLineSet){
				clearInterval(XLineInterval);
				try{callback();}catch(qq){};
			} else {
				Xpos = $("#info-line").position().left;
				Ypos = $("#info-line").position().top;
				height = $("#info-line").height();
				firstPoint = normalizeXY([Xpos, Ypos]);
				if(Math.abs(firstPoint[0]) <= 1 && Math.abs(firstPoint[1]) <= 1){
					XLine.push(firstPoint);
					for(var i = 1; i <= touchlineSamples; i++){
						XLine.push( normalizeXY( [ Xpos, height * (i * (1 / touchlineSamples)) ] ) );
					}
					XLineSet = true;
				}
			}
		}, 100);
	}
}

function normalizeXY(_XY, reverse){ // Receives mouse coords relative to document and returns normalized coords, and vice versa
	var XY = _XY.slice();
	if(reverse){
		XY[0] += 1;
		XY[0] /= 2;
		XY[0] *= $(stageName + " canvas").width();
		XY[0] = Math.round(XY[0]);
		XY[1] += 1;
		XY[1] /= 2;
		XY[1] *= $(stageName + " canvas").height();
		XY[1] = $(stageName + " canvas").height() - XY[1];
		XY[1] = Math.round(XY[1]);
	} else {
		XY[0] = XY[0] / $(stageName + " canvas").width();
		XY[0] = (XY[0] - .5) * 2;
		XY[1] = 1 - XY[1] / $(stageName + " canvas").height();
		XY[1] = (XY[1] - .5) * 2;
	}
	return XY;
}

function GET(variable){
   var vars = window.location.search.substring(1).split("&");
   for (var i = 0; i < vars.length; i++) {
	   var pair = vars[i].split("=");
	   if(pair[0] == variable){ return pair[1]; }
   }
   return(false);
}

function PI2(e){ // Accepts rotation expressed as percentage of a circle and returns it as a radian angle
	return Math.PI * 2 * e;
}

function animate(){
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}