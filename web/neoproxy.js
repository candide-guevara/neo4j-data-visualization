// Thin wrapper to use cypher through ajax calls and get some json

var neoproxy = {
  'NEO_CYPHER_URL' : "http://localhost:7474/db/data/cypher",
    
  /**
   * Creates a wrapper closure around the user callback. It ensures that the callback is only
   * called in case of success of the ajax call.
   */
  'decorate' : function (request, callback) {
    var decorated = function() {
      try {
        if (request.readyState == 4) {
          if (request.status == 200) {
            var jsonResponse = JSON.parse(request.responseText);
            //console.log(jsonResponse);
            callback(jsonResponse.data);
          }
          else
            alert('Got error response from DB : ' + request.statusText);
        }
      }
      catch(err) {
        alert('Could not complete async DB call : ' + err.message);
      }
    };
    return decorated;
  },
  
  /**
   * Communicates with the graph DB through the REST API. Cross Origin Resource Sharing must be
   * enabled since the DB listen to a different port than the HTTP server.
   * @param cypher the query to execute, no parameters accepted
   * @param callback the function to be called with the JSON result as argument
   */
  'callDb' : function (cypher, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = this.decorate(request, callback);
    request.open('POST', this.NEO_CYPHER_URL);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Accept', 'application/json');
    
    var payload = {
      "query" : cypher,
      "params" : {}
    };
    request.send(JSON.stringify(payload));
  }
};