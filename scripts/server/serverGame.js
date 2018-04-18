
let connections = 0;
let TARGET_USERS_NUM = 1;
let game_started = false;
let reconnection = false;
let activeUsers = [];

let present = require('present');
let User = require('./userData');
let NetworkIds = require('../persistant/network-ids');
let Missile = require('./missile');

let Queue = require('../persistant/queue');
const SIMULATION_UPDATE_RATE_MS = 50;
const STATE_UPDATE_RATE_MS = 100;
let lastUpdate = 0;
let quit = false;
let newMissiles = [];
let activeMissiles = [];
let hits = [];
let inputQueue = Queue.create();
let nextMissileId = 1;

function createMissile(userId, user) {
    let missile = Missile.create({
        id: nextMissileId++,
        userId: userId,
        position: {
            x: user.worldView.x,
            y: user.worldView.y
        },
        direction: user.orientation,
        speed: user.speed
    });

    newMissiles.push(missile);
}

function processInput(elapsedTime) {
    //
    // Double buffering on the queue so we don't asynchronously receive inputs
    // while processing.
    let processMe = inputQueue;
    inputQueue = Queue.create();

    while (!processMe.empty) {
        let input = processMe.dequeue();
        let client = activeUsers[input.message.userId];
        client.lastMessageId = input.message.id;
        switch (input.message.type) {
            case NetworkIds.INPUT_MOVE_DOWN:
                client.user.moveDown(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_MOVE_UP:
                client.user.moveUp(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_MOVE_LEFT:
                client.user.moveLeft(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_MOVE_RIGHT:
                client.user.moveRight(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_ROTATE_LEFT:
                client.user.rotateLeft(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_ROTATE_RIGHT:
                client.user.rotateRight(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_FLIP:
                client.user.flipIt(input.message.elapsedTime);
                break;
            case NetworkIds.INPUT_FIRE:
                createMissile(input.message.userId, client.user);
                break;
        }
    }
}

//------------------------------------------------------------------
//
// // Utility function to perform a hit test between two objects.  The
// // objects must have a position: { x: , y: } property and radius property.
// //
// //------------------------------------------------------------------
// function collided(obj1, obj2) {
//     let distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.y - obj2.position.y, 2));
//     let radii = obj1.radius + obj2.radius;
//
//     return distance <= radii;
// }

//------------------------------------------------------------------
//
// Update the simulation of the game.
//
//------------------------------------------------------------------
function update(elapsedTime, currentTime) {
    for (let clientId in activeUsers) {
        activeUsers[clientId].user.update(currentTime);
    }

    for (let missile = 0; missile < newMissiles.length; missile++) {
        newMissiles[missile].update(elapsedTime);
    }

    let keepMissiles = [];
    for (let missile = 0; missile < activeMissiles.length; missile++) {

        if (activeMissiles[missile].update(elapsedTime)) {
            keepMissiles.push(activeMissiles[missile]);
        }
    }
    activeMissiles = keepMissiles;

    //
    // Check to see if any missiles collide with any players (no friendly fire)
    // keepMissiles = [];
    // for (let missile = 0; missile < activeMissiles.length; missile++) {
    //     let hit = false;
    //     for (let clientId in activeClients) {
    //         //
    //         // Don't allow a missile to hit the player it was fired from.
    //         if (clientId !== activeMissiles[missile].clientId) {
    //             if (collided(activeMissiles[missile], activeClients[clientId].player)) {
    //                 hit = true;
    //                 hits.push({
    //                     clientId: clientId,
    //                     missileId: activeMissiles[missile].id,
    //                     position: activeClients[clientId].player.position
    //                 });
    //             }
    //         }
    //     }
    //     if (!hit) {
    //         keepMissiles.push(activeMissiles[missile]);
    //     }
    // }
    // activeMissiles = keepMissiles;
}

function sameArea(object1, object2){
    if (Math.abs(object1.worldView.x - object2.worldView.x) < .6 &&
        Math.abs(object1.worldView.y - object2.worldView.y) < .6){
        return true;
    }
}

function updateClients(elapsedTime) {
    //
    // For demonstration purposes, network updates run at a slower rate than
    // the game simulation.
    lastUpdate += elapsedTime;
    if (lastUpdate < STATE_UPDATE_RATE_MS) {
        return;
    }

    let missileMessages = [];
    for (let item = 0; item < newMissiles.length; item++) {
        let missile = newMissiles[item];
        missileMessages.push({
            id: missile.id,
            direction: missile.direction,
            position: {
                x: missile.position.x,
                y: missile.position.y
            },
            radius: missile.radius,
            speed: .1,
            acceleration: missile.acceleration,
            timeRemaining: missile.timeRemaining
        });
    }

    // Move all the new missiles over to the active missiles array
    for (let missile = 0; missile < newMissiles.length; missile++) {
        activeMissiles.push(newMissiles[missile]);
    }
    newMissiles.length = 0;

    for (let clientId in activeUsers) {
        let client = activeUsers[clientId];
        let update = {
            clientId: clientId,
            lastMessageId: client.lastMessageId,
            orientation: client.user.orientation,
            worldView: client.user.worldView,
            updateWindow: lastUpdate
        };
        if (client.user.reportUpdate) {
            client.socket.emit(NetworkIds.UPDATE_SELF, update);

            for (let otherId in activeUsers) {
                if (otherId !== clientId && sameArea(client.user, activeUsers[otherId].user)) {
                    activeUsers[otherId].socket.emit(NetworkIds.UPDATE_OTHER, update);
                }
            }
        }

        for (let missile = 0; missile < missileMessages.length; missile++) {
            client.socket.emit(NetworkIds.MISSILE_NEW, missileMessages[missile]);
        }

        // // Report any missile hits to this client
        // for (let hit = 0; hit < hits.length; hit++) {
        //     client.socket.emit(NetworkIds.MISSILE_HIT, hits[hit]);
        // }
    }

    for (let clientId in activeUsers) {
        activeUsers[clientId].user.reportUpdate = false;
    }

    hits.length = 0;
    lastUpdate = 0;
}

//------------------------------------------------------------------
//
// Server side game loop
//
//------------------------------------------------------------------
function gameLoop(currentTime, elapsedTime) {
    processInput(elapsedTime);
    update(elapsedTime, currentTime);
    updateClients(elapsedTime);

    if (!quit) {
        setTimeout(() => {
            let now = present();
            gameLoop(now, now - currentTime);
        }, SIMULATION_UPDATE_RATE_MS);
    }
}



//------------------------------------------------------------------
//
// Get the socket.io server up and running so it can begin
// collecting inputs from the connected clients.
//
//------------------------------------------------------------------
function initializeSocketIO(http) {

    var io = require('socket.io')(http);

    function runCountdown() {
        var target_date = new Date().getTime() + (10*1000);
        var seconds, pastSeconds = 0;
        // update the tag with id "countdown" every 1 second
        var refresh = setInterval(function () {

            // find the amount of "seconds" between now and target
            var current_date = new Date().getTime();
            var seconds_left = (target_date - current_date + 1) / 1000;
            seconds = parseInt(seconds_left % 60);

            if (pastSeconds !== seconds) {
                io.emit('start game', seconds.toString());
                pastSeconds = seconds;
            }
            if (seconds === 0){
                io.emit('start game', 'countdown finished');
                clearInterval(refresh);
                reconnection = true;
            }
        }, 1000);
    }

    function notifyConnect(socket, newUser) {
        for (let clientId in activeUsers) {
            let client = activeUsers[clientId];
            if (newUser.userId !== clientId) {
                // Tell existing about the newly connected player
                client.socket.emit(NetworkIds.CONNECT_OTHER, {
                    userId: newUser.userId,
                    position: newUser.position,
                    view: newUser.view
                });

                // Tell the new player about the already connected player
                socket.emit(NetworkIds.CONNECT_OTHER, {
                    userId: client.user.userId,
                    position: client.user.position,
                    view: client.user.view
                });
            }
        }
    }

    io.on('connection', function(socket){
        socket.on('join', function(data){
            console.log(data.name + ' with id ' + socket.id + ' connected');
            if(reconnection) {
                if(typeof activeUsers[data.name] !== 'undefined') {
                    activeUsers[data.name].socket = socket;
                    activeUsers[data.name].id = socket.id;
                    activeUsers[data.name].user.clientId = socket.id;

                    io.sockets.sockets[socket.id].emit('start game', "player reconnect");
                    io.emit('chat message',data.name + ' has rejoined the game.');
                } else {
                    io.emit('chat message', "Game already in progress.")
                }
            } else {
                io.emit('chat message',data.name + ' has joined the game.');
                let newUser = User.makeplayer();
                newUser.clientId = socket.id;
                newUser.userId = data.name;
                activeUsers[data.name] = {
                    id: socket.id,
                    socket: socket,
                    user: newUser
                };

                socket.emit(NetworkIds.CONNECT_ACK, {
                    position: newUser.position,
                    view: newUser.view
                });

                notifyConnect(socket, newUser);

                connections++;
                if (connections >= TARGET_USERS_NUM) {
                    if (!game_started) runCountdown();
                    game_started = true;
                }
            }

            socket.on('chat message', function(msg){
                io.emit('chat message', data.name + ": " + msg);
            });

            socket.on(NetworkIds.INPUT, keyInput => {
                inputQueue.enqueue({
                    clientId: socket.id,
                    message: keyInput
                });
                console.log(data.name + ': ' + keyInput.type);
            });

            socket.on('disconnect', function(){
                // notifyDisconnect(socket.id);
                //delete activeClients[socket.id];
                connections--;
                console.log(data.name + ' with id ' + socket.id + ' disconnected');
                io.emit('chat message', data.name + ' has left the game');
            });

        });
    });
}

function initialize(http) {
    initializeSocketIO(http);
    gameLoop(present(), 0);
}

//------------------------------------------------------------------
//
// Public function that allows the game simulation and processing to
// be terminated.
//
//------------------------------------------------------------------
function terminate() {
    this.quit = true;
}

module.exports.initialize = initialize;
