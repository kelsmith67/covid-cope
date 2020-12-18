let fs = require("fs");



var express = require("express");
var app = express();

// Tell Express to look in the "public" folder for any files first
app.use(express.static("public"));

// If the user just goes to the "route" / then run this function
app.get("/", function (req, res) {
  res.send("Hello World!");
});


// Here is the actual HTTP server
// In this case, HTTPS (secure) server
var https = require("https");

// Security options - key and certificate
var serverOptions = {
  key: fs.readFileSync("local.key"),
  cert: fs.readFileSync("local.cert"),
};

// We pass in the Express object and the serverOptions object
var httpsServer = https.createServer(serverOptions, app);

// Default HTTPS port
httpsServer.listen(443);



let peers = {};




// 3. Create websocket server using socket.io
var io = require("socket.io")().listen(httpsServer);


io.sockets.on("connection", (socket) => {
    // add the socket to our 'peers' object:
    peers[socket.id] = socket;
    // { "290384kjdhfasdhg": socket, "029837423udskjgf": socket}
    console.log("We have a new client: " + socket.id + "!");
  
    socket.on("list", () => {
      let ids = Object.keys(peers);
      // ["290384kjdhfasdhg", "029837423udskjgf"]
  
      console.log("ids length: " + ids.length);
      socket.emit("listresults", ids);
    });
  
    // Relay signals back and forth
    socket.on("signal", (to, from, data) => {
      console.log("signal", to, data);
  
      if (to in peers) {
        peers[to].emit("signal", to, from, data);
      } else {
        console.log("Peer not found!");
      }
    });
  
    socket.on("disconnect", () => {
      console.log("Client has disconnected " + socket.id);
      io.emit("peer_disconnect", socket.id);
      delete peers[socket.id];
    });
  });
  