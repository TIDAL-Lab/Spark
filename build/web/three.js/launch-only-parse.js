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
	if (event.origin !== '*') return;
	//console.log(event.data);
	//event.source.postMessage('hello back Elli Goli', event.origin);
}, false);

Parse.initialize("fl2zrLOSKAMHwwQecBBlIJW77r9sqp5VKnPhYSiC", "DHlf8YKZTVaXmqvToSXyHZ82vu96asiRmKNufQvF");
doParse('init');
//listen for streamed messages
var pubnub = PUBNUB.init({
	publish_key: 'demo',
    subscribe_key: 'demo'
 });

// pubnub.publish({
// 	channel: 'ebz',
//     message: '1'
// });

pubnub.subscribe({
    channel: 'ebz',
    message: function(m){

    	doParse('update');
    }
});

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