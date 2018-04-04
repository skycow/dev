let userId = '';

document.getElementById('id-signup').hidden = true;
document.getElementById('id-join').hidden = true;
document.getElementById('id-chat').hidden = true;
document.getElementById('id-game').hidden = true;
let socket;

document.getElementById('button-signin').addEventListener('click',function(){
    let req = new XMLHttpRequest();
    req.responseType = 'json';
    req.open("POST", "/signin");
    req.setRequestHeader("Content-Type","application/json");
    req.onload  = function() {
      var jsonResponse = req.response;
      // do something with jsonResponse
      if(req.response.error) {
        document.getElementById('id-signinerror').innerHTML = req.response.error;
      } else if (req.response.authenticated) {
        document.getElementById('id-join').hidden = false;
        document.getElementById('id-welcome').hidden = true;
        document.getElementById('id-signup').hidden = true;

        userId = document.getElementById("id-username").value;

      } else {
        document.getElementById('id-signinerror').innerHTML = "Unknown Error";
      }
   };
  //  req.send({'user':'username'});
    req.send(JSON.stringify({'username': document.getElementById("id-username").value, 'password': document.getElementById("id-password").value}));
});

document.getElementById('button-signup').addEventListener('click',function(){
  let req = new XMLHttpRequest();
  req.responseType = 'json';
  req.open("POST", "/signup");
  req.setRequestHeader("Content-Type","application/json");
  req.onload  = function() {
    var jsonResponse = req.response;
    // do something with jsonResponse
    if(req.response.error) {
      document.getElementById('id-signuperror').innerHTML = req.response.error;
    } else if (req.response.authenticated) {
      document.getElementById('id-join').hidden = false;
      document.getElementById('id-welcome').hidden = true;
      document.getElementById('id-signup').hidden = true;

      userId = document.getElementById("id-newusername").value;

    } else {
      document.getElementById('id-signinerror').innerHTML = "Unknown Error";
    }
 };
  req.send(JSON.stringify({'username': document.getElementById("id-newusername").value, 'password': document.getElementById("id-newpassword").value}));
});

document.getElementById('button-newuser').addEventListener('click',function(){
  document.getElementById('id-signup').hidden = false;
  document.getElementById('id-welcome').hidden = true;
  
});

document.getElementById('button-signinret').addEventListener('click',function(){
  document.getElementById('id-welcome').hidden = false;
  document.getElementById('id-signup').hidden = true;
  
});

let passMatch = function(){
  let p1 = document.getElementById('id-newpassword').value;
  let p2 = document.getElementById('id-newpassword2').value;
  if(p1 !== "" && p1 === p2){
    document.getElementById('button-signup').disabled = false;
    document.getElementById('id-signuperror').innerHTML = "";
  } else{
    document.getElementById('button-signup').disabled = true;
    document.getElementById('id-signuperror').innerHTML = "Passwords don't match";
  }
};

document.getElementById('id-newpassword').addEventListener('keydown', passMatch)
document.getElementById('id-newpassword2').addEventListener('keyup', passMatch)

document.getElementById('button-join').addEventListener('click', function(){
    document.getElementById('id-chat').hidden = false;  
    document.getElementById('id-join').hidden = true;
    socket = io();
    socket.on('connect', function(){
      socket.emit('join', {name: userId});
    });
    socket.on('chat message', function(msg){
        var node = document.createElement("li");
        var br = document.createElement("br");
        var textnode = document.createTextNode(msg);
        node.appendChild(textnode);
        node.appendChild(br);
        node.className = "list-group-item justify-content-between align-items-center";
        document.getElementById("messages").appendChild(node);
        document.getElementById("chat-bar").scrollTop = document.getElementById("chat-bar").scrollHeight;
    });  
    socket.on('start game', () => {
      document.getElementById('id-game').hidden = false;
      document.getElementById('id-chat').hidden = true; 
      document.getElementById('h1-id-username').innerHTML = userId;
      window.addEventListener('keydown', function(event) {
		
		  socket.emit('input', event.keyCode);
	    });
    });
    socket.on('countdown', (value) => {
      
    });
    
});

document.getElementById('button-chat').addEventListener('click', function(){
  socket.emit('chat message', document.getElementById('input-send').value);
  document.getElementById('input-send').value = "";
});