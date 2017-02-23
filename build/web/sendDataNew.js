var pubnub;

// called in the main App constructor
function initPubnub() {
  console.log("initiating pubnub on circuit side");
  pubnub = PUBNUB.init({
    publish_key: 'demo',
    subscribe_key: 'demo'
  });

}

// called when the webglModel is launched (non-AR condition)
function publishPubnub() {
  console.log("publish to pubnub");
  pubnub.publish({
      channel: 'ebz',
      message: "init"
   });

}
var sendData = function(myObj){
  this.doSendData = function(){
      pubnub.publish({
      channel: 'ebz',
      message: myObj
   });

  }

}


// Phant  Initiation //
//var publicKey = "aG77NQx81bhqqY7REZZK";
var publicKey = "mKqq6prv4qSMZz4MboRG";
var privateKey = "kzBBaMn5DBhd9GxdElBV";
//var baseUrl = 'https://data.sparkfun.com';
//var postUrl = baseUrl + '/input/' + publicKey;
var postUrl = "https://data.sparkfun.com/input/mKqq6prv4qSMZz4MboRG";
// var headers = {
//   'Content-type': 'application/x-www-form-urlencoded',
//   'Phant-Private-Key': privateKey
// }

postPhant();
function postPhant() {
  data = {}
  data['private_key'] = privateKey;
  data['comptype'] = "battery";
  data['current'] = "c";
  data['resistance'] = 'r';
  data['voltage'] = 'v';

  console.log(data);
  //data = urllib.urlencode(data)
  //data = encodeURIComponent(data);
  console.log("now:");
  console.log(data);

  //var url = "sample-url.php";
  //var params = "lorem=ipsum&name=alpha";
  var xhr = new XMLHttpRequest();
  xhr.open("GET", postUrl + "?" + data, true);

  //Send the proper header information along with the request
  //xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  //xhr.setRequestHeader("Phant-Private-Key", privateKey);


  xhr.send(data);
  //post_request = urllib2.Request(post_url,data,headers)

  var response = xhr.responseText;
  console.log(response);
}


/*var sendParse = function(myObj){
  
  this.doUpdateParse = function(){
    // _.each(myObj, function(anObj){
    //   comptype = anObj.type;

    // }
  }
}*/

/*
Parse.initialize("fl2zrLOSKAMHwwQecBBlIJW77r9sqp5VKnPhYSiC", "DHlf8YKZTVaXmqvToSXyHZ82vu96asiRmKNufQvF");
var sendParse = function(myObj){
  
  this.doUpdateParse = function(){
    var ParseCircuit = Parse.Object.extend("Circuit"); // 
    var circuit = new Parse.Query(ParseCircuit); 
    circuit.exists("type");   // EB: commented to test the error with not deleting objects.

    
    circuit.find().then(function(Circuits){
      var promise = Parse.Promise.as(); //can hold an array of promises, one for each Circuit in Circuits
      _.each(Circuits, function(Circuit){ //iterate through every Circuit in Circuits
        promise = promise.then(function(){
          return Circuit.destroy();
          
        });
        
      });
        
        return promise;
      }).then(function(){
          
          var promise = Parse.Promise.as();
          _.each(myObj, function(anObj){
            promise = promise.then(function(){
              var ParseCircuit = Parse.Object.extend("Circuit");
              var a_Circuit = new ParseCircuit();
              a_Circuit.set("type", anObj.type);
              a_Circuit.set("voltageDrop", anObj.voltageDrop);
              a_Circuit.set("current", anObj.current);
              a_Circuit.set("resistance", anObj.resistance);
              a_Circuit.set("startX", anObj.startX);
              a_Circuit.set("startY", anObj.startY);
              a_Circuit.set("endX", anObj.endX);
              a_Circuit.set("endY", anObj.endY);
              a_Circuit.set("direction", anObj.direction);
              a_Circuit.set("connection", anObj.connection);
              a_Circuit.set("graphLabel", anObj.graphLabel);
              return a_Circuit.save();
             
            });
            
          });
          return promise;
      
    }).then(function(){
        pubnub.publish({
          channel: 'ebz',
          message: 'update'
       });
      
    });
        

   
  } 
}*/