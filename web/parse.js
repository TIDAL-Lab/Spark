    var pubnub = PUBNUB.init({
       publish_key: 'demo',
       subscribe_key: 'demo'
   });
    Parse.initialize("fl2zrLOSKAMHwwQecBBlIJW77r9sqp5VKnPhYSiC", "DHlf8YKZTVaXmqvToSXyHZ82vu96asiRmKNufQvF");
    var deleteParse = function(myObj){
      
      this.doDeleteParse = function(){
        var parseCircuit = Parse.Object.extend("Circuit");
        var a_Circuit = new Parse.Query(parseCircuit);
        a_Circuit.exists("type");
        
          a_Circuit.find().then(function(Circuits){
            var promise = Parse.Promise.as(); //can hold an array of promises, one for each Circuit in Circuits
            _.each(Circuits, function(Circuit){ //iterate through every Circuit in Circuits
              promise = promise.then(function(){
                return Circuit.destroy();
                
              });
              
            });
              
              return promise;
            }).then(function(Circuit){
                
                var promise = Parse.Promise.as();
                _.each(myObj, function(anObj){
                  promise = promise.then(function(){
                    var parseCircuit = Parse.Object.extend("Circuit");
                    var a_Circuit = new parseCircuit();
                    a_Circuit.set("type", anObj.type);
                    a_Circuit.set("voltageDrop", anObj.voltageDrop);
                    a_Circuit.set("current", anObj.current);
                    a_Circuit.set("resistance", anObj.resistance);
                    a_Circuit.set("startX", anObj.startX);
                    a_Circuit.set("startY", anObj.startY);
                    a_Circuit.set("endX", anObj.endX);
                    a_Circuit.set("endY", anObj.endY);
                    a_Circuit.set("direction", anObj.direction);
                    a_Circuit.set("innerwall", anObj.innerWall);
                    a_Circuit.set("connection", anObj.connection);
                    a_Circuit.set("graphLabel", anObj.graphLabel);
                    return a_Circuit.save();
                   
                  });
                  
                });
                return promise;
            
          }).then(function(Circuit){
              pubnub.publish({
                channel: 'ebz',
                message: 'update'
             });
            
          });
            
       
      } 
    }
    
   