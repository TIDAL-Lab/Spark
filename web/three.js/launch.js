/*
 * Spark - Agent-based electrical circuit environment
 *
 * Elham Beheshti, 2015
 * Northwestern University
 * beheshti@u.northwestern.edu
 *
 * Spark is an interactive learning environment in which users interact with electrical circuits at two levels: 
 * Circuit-level and the level that shows interactions between electrons and ions as they move through circuit components.
 * This project has been conducted in TIDAL lab (Tangible Interaction Design and Learning Lab) at Northwestern University.
 */
var myObj;


window.addEventListener('message', function(event) {
	if (event.origin !== 'http://localhost:8080') return;
	console.log(event.data);  // this prints "hello model iframe"
	event.source.postMessage("hello back", event.origin);
}, false);


doParse('init');

//listen for streamed messages
var pubnub = PUBNUB.init({
	publish_key: 'demo',
    subscribe_key: 'demo'
 });

pubnub.subscribe({
    channel: 'ebz',
    message: function(m){
    	if (m == "init") {
    		//console.log("init webgl");
    		doParse('init');
    	}
    	else {
    		myObj = m;
    		//console.log("received object:" + myObj);
 			doParse('update');	
    	}

    }
});

function doParse(message){
	if (message == 'init') {
		
		doInit();
	}
	else {
		var tCircuit;
		components = [];
		for (var i=0; i<myObj.length; i++) {
			var compType = myObj[i]["type"];
			var compVolt = myObj[i]["voltageDrop"];
	        var current = myObj[i]["current"];
	        var compRes = myObj[i]["resistance"];
	        var startx = 2 * myObj[i]["startX"];
	        var starty = 2 * myObj[i]["startY"];
	        var endx = 2 * myObj[i]["endX"];
	        var endy = 2 * myObj[i]["endY"];
	        var direction = myObj[i]["direction"];
	       	var graphLabel = myObj[i]["graphLabel"];
	        var connections = myObj[i]["connection"];
	        tCircuit = new Component(compType, current, compRes, compVolt, startx, starty, endx, endy, direction, connections, graphLabel);
	        components.push(tCircuit);
		}
		updateFlag = false; //sets the boolean to resume rendering the scene
    	doUpdate();
	}
}

