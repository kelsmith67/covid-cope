let myFriends = {};
// let peerConnection = new SimplePeer()
// { "dosifasdoi24234": peerConnection }
let mySocket;
let myLocalMediaStream;

// when the window loads, start capturing media
window.addEventListener("load", () => {
    // This kicks it off
    initCapture();
  });


function initCapture() {
    console.log("initCapture");
  
    // The video element on the page to display the webcam
    let videoEl = document.getElementById("myvideo");
  
    // Constraints - what do we want?
    let constraints = { audio: true, video: true };
  
    // Prompt the user for permission, get the stream
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        console.log(stream);  
        // Global object
        myLocalMediaStream = stream;
  
        // Attach to our video object
        videoEl.srcObject = stream;
  
        // Wait for the stream to load enough to play
        videoEl.onloadedmetadata = function (e) {
          videoEl.play();
        };
  
        // Now setup socket
        setupSocket();
      })
      .catch((err) => {
        /* Handle the error */
        alert(err);
      });
  }

function setupSocket() {
    mySocket = io.connect();
  
    mySocket.on("connect", function () {
      console.log("Socket Connected");
      console.log("My socket id: ", mySocket.id);
  
      // Tell the server we want a list of the other users
      mySocket.emit("list");
    });
  
    mySocket.on("disconnect", function (data) {
      console.log("Socket disconnected");
    });
  
    mySocket.on("peer_disconnect", function (data) {
      console.log("Your friend with ID " + data + " has left.");
  
      delete myFriends[data];
      document.getElementById(data).remove();
    });
  
    // Receive listresults from server
    mySocket.on("listresults", (data) => {
        // ["asodifh23234", "aosudf23423"]
      console.log(data);
      for (let i = 0; i < data.length; i++) {
        // Make sure it's not us
        if (data[i] != mySocket.id) {
          let theirSocketId = data[i];
          let peerConnection = setupConnection(true, theirSocketId);
          myFriends[data[i]] = peerConnection;
        }
      }
    });
  
    mySocket.on("signal", (to, from, data) => {
      console.log("Got a signal from the server: ", to, from, data);
  
      // to should be us
      if (to != mySocket.id) {
        console.log("Socket IDs don't match");
      }
  
      // Look for the right simplepeer in our array
      let connection = myFriends[from];
      if (connection) {
        connection.signal(data);
      } else {
        console.log("Never found right simplepeer object");
        // Let's create it then, we won't be the "initiator"
        let theirSocketId = from;
        let peerConnection = setupConnection(false, theirSocketId);
  
        myFriends[from] = peerConnection;
  
        // Tell the new simplepeer that signal
        peerConnection.signal(data);
      }
    });
  }

function setupConnection(initiator, theirSocketId) {
    let peerConnection = new SimplePeer({
      initiator: initiator,
      trickle: false,
    });
  
    // simplepeer generates signals which need to be sent across socket
    peerConnection.on("signal", (data) => {
      mySocket.emit("signal", theirSocketId, mySocket.id, data);
    });
  
    // When we have a connection, send our stream
    peerConnection.on("connect", () => {
      console.log("CONNECT");
      console.log(peerConnection);
  
      // Let's give them our stream
      peerConnection.addStream(myLocalMediaStream);
      console.log("Send our stream");
    });
  
    // Stream coming in to us
    peerConnection.on("stream", (stream) => {
      console.log("Incoming Stream");
  
      // This should really be a callback
      // Create a video object
      let theirVideoEl = document.createElement("VIDEO");
      theirVideoEl.id = theirSocketId;
      theirVideoEl.srcObject = stream;
      theirVideoEl.muted = true;
      theirVideoEl.onloadedmetadata = function (e) {
        theirVideoEl.play();
      };
      document.body.appendChild(theirVideoEl);
      console.log(theirVideoEl);
    });
  
    peerConnection.on("close", () => {
      console.log("Got close event");
      // Should probably remove from the array of simplepeers
    });
  
    peerConnection.on("error", (err) => {
      console.log(err);
    });
  
    return peerConnection;
  }