let userId = '';

document.getElementById('id-signup').hidden = true;
document.getElementById('id-join').hidden = true;
document.getElementById('id-chat').hidden = true;
document.getElementById('id-game').hidden = true;
document.getElementById('min-players').hidden = true;
document.getElementById('id-highscores').hidden = true;
document.getElementById('id-options').hidden = true;
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

function countdown() {
    var target_date = new Date().getTime() + (10*1000);
    var countdown = document.getElementById('countdown');
    var seconds;
// update the tag with id "countdown" every 1 second
    var refresh = setInterval(function () {

        // find the amount of "seconds" between now and target
        var current_date = new Date().getTime();
        var seconds_left = (target_date - current_date + 1) / 1000;
        seconds = parseInt(seconds_left % 60);

        if (seconds === 0){
            clearInterval(refresh);
            document.getElementById('id-game').hidden = false;
            document.getElementById('id-chat').hidden = true;
            document.getElementById('h1-id-username').innerHTML = userId;
            window.addEventListener('keydown', function(event) {
              socket.emit('input', event.keyCode);
            });
        }

        // format countdown string + set tag value
        countdown.innerHTML = "Ready to Start in: " + seconds;

    }, 1000);
}

document.getElementById('button-join').addEventListener('click', function(){
    document.getElementById('id-chat').hidden = false;
    document.getElementById('id-join').hidden = true;
    socket = io();
    socket.on('connect', function(){
      socket.emit('join', {name: userId});
    });
    socket.on('start game', function (msg) {
        if (msg === "players reached"){
            document.getElementById('min-players').hidden = false;
            countdown();
        } else if (msg === "player reconnect") {
          document.getElementById('id-game').hidden = false;
          document.getElementById('id-chat').hidden = true;
          document.getElementById('h1-id-username').innerHTML = userId;
          window.addEventListener('keydown', function(event) {
            socket.emit('input', event.keyCode);
          });
        }
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
});

document.getElementById('button-chat').addEventListener('click', function(){
  socket.emit('chat message', document.getElementById('input-send').value);
  document.getElementById('input-send').value = "";
});

document.getElementById('input-send').addEventListener('keyup', function(event) {
    event.preventDefault();
    if (event.keyCode === 13) { //13 = enter
        document.getElementById('button-chat').click();
    }
});

document.getElementById('button-highscores').addEventListener('click',function(){
  document.getElementById('id-highscores').hidden = false;
  document.getElementById('id-join').hidden = true;

  let req = new XMLHttpRequest();
  req.responseType = 'json';
  req.open("GET", "/highscores");
  req.onload  = function() {
    var rows = req.response;
    // do something with jsonResponse
    document.getElementById('id-scores-list').innerHTML = "";
    for(var row in rows){
      var node = document.createElement("li");
      var rowString = parseInt(row) + 1;
      var textnode = document.createTextNode(rowString + ". " + rows[row].score + " - " + rows[row].user);
      node.appendChild(textnode);
      node.className = "list-group-item"
      //node.className = "list-group-item justify-content-between align-items-center";
      document.getElementById("id-scores-list").appendChild(node);
    }
 };
  req.send();


});

document.getElementById('button-high-back').addEventListener('click',function(){
  document.getElementById('id-join').hidden = false;
  document.getElementById('id-highscores').hidden = true;

});

document.getElementById('button-options').addEventListener('click',function(){
  document.getElementById('id-options').hidden = false;
  document.getElementById('id-join').hidden = true;

});

document.getElementById('button-options-back').addEventListener('click',function(){
  document.getElementById('id-join').hidden = false;
  document.getElementById('id-options').hidden = true;

});
