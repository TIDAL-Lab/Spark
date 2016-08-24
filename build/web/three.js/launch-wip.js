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

 	    window.addEventListener('message', function(event) {
			if (event.origin !== 'http://localhost:8080') {
				console.log("this is the error!");
				return; }
			console.log('test receive');
			console.log(event.data);  // this prints "hello model iframe"
			event.source.postMessage("hello back", event.origin);
		}, false);

/* moved to the calling html file */
// //listen for streamed messages
// var pubnub = PUBNUB.init({
// 	publish_key: 'demo',
//     subscribe_key: 'demo',
//     error: function (error) {
//         console.log('Error:', error);
//     }
//  });

// window.addEventListener('message', function(event) {
// 	//if (event.origin !== 'http://localhost:8080') return;
// 	console.log(event.data);  // this prints "hello model iframe"
// 	event.source.postMessage("hello back", event.origin);
// }, false);

var myObj = [];
var ArFlag = false;

if (ArFlag) {
	//Parse.initialize("fl2zrLOSKAMHwwQecBBlIJW77r9sqp5VKnPhYSiC", "DHlf8YKZTVaXmqvToSXyHZ82vu96asiRmKNufQvF");
	//doParse('init'); 
	}
else {
	//doReceive("init"); 
	}


/*
//listen for streamed messages
var pubnub = PUBNUB.init({
	publish_key: 'demo',
    subscribe_key: 'demo',
    error: function (error) {
        console.log('Error:', error);
    }
 });

// Subscribe to a channel
 
pubnub.subscribe({
    channel : 'my_channel',
    message : function(m){
        console.log("I am not so dumb!")
    },
    error : function (error) {
        // Handle error here
        //console.log(JSON.stringify(error));
    }
});*/

// pubnub.subscribe({
//     channel: 'ebz',
//     message: function(m){
//     	console.log(m);
//     	if (m == "init") {
//     		console.log("webgl is initiated");
//     		doReceive("init");
//     	}
//     	else {
//     		myObj = m;
//     		console.log("received object:" + myObj);
//  			doReceive('update');	
//     	}

//     }
// });

function doReceive(message){
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
	//doUpdate();

	if (message == 'init') {
		doInit();
	}
	else { // message is update
		updateFlag = false; //sets the boolean to resume rendering the scene
		doUpdate();
	}
}


function doParse(message){
	// if updating the circuit, set a boolean to pause the rendering while the circuit object is being parsed
	if (message != 'init') updateFlag = true; 
   	var numComps;
    components = []; // this var is created in main.js 
    var tCircuit;
	// create a new subclass of Parse.Object named Circuit
    var parseCircuit = Parse.Object.extend("Circuit");
    var query = new Parse.Query(parseCircuit);
    //query.exists("type");// This determines if the field "type" is set for the instances and retrieves all 
  	//objects that have the "type" field set
  	query.find().then(function(results){
    	var promise = Parse.Promise.as();
    	_.each(results, function(result){
      	promise = promise.then(function(){
              compType = result.get("type");
              compVolt = result.get("voltageDrop");
              current = result.get("current");
              compRes = result.get("resistance");
              startx = 2 * result.get("startX");
              starty = 2 * result.get("startY");
              endx = 2 * result.get("endX");
              endy = 2 * result.get("endY");
              direction = result.get("direction");
              graphLabel = result.get("graphLabel");
              //direction = 1;
              connections = result.get("connection");
              tCircuit = new Component(compType, current, compRes, compVolt, startx, starty, endx, endy, direction, connections, graphLabel);
              components.push(tCircuit);        
      		});

    	});
        return promise;
    }).then(function(){
    	if (message == 'init') {
    		doInit();
    	}
    	else { // message is update
    		updateFlag = false; //sets the boolean to resume rendering the scene
    		doUpdate();
    	}
    	

  
    });  
}
