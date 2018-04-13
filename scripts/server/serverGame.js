
let connections = 0;
let TARGET_USERS_NUM = 1;
let game_started = false;
let activeUsers = [];

let present = require('present');
let User = require('./userData');
let NetworkIds = require('../persistant/network-ids');
// let Missile = require('./missile');
let Queue = require('../persistant/queue');

const SIMULATION_UPDATE_RATE_MS = 50;
const STATE_UPDATE_RATE_MS = 100;
let lastUpdate = 0;
let quit = false;
let activeClients = {};
let newMissiles = [];
let activeMissiles = [];
let hits = [];
let inputQueue = Queue.createQ();
// let nextMissileId = 1;
//
// //------------------------------------------------------------------
// //
// // Used to create a missile in response to user input.
// //
// //------------------------------------------------------------------
// function createMissile(clientId, playerModel) {
//     let missile = Missile.create({
//         id: nextMissileId++,
//         clientId: clientId,
//         position: {
//             x: playerModel.position.x,
//             y: playerModel.position.y
//         },
//         direction: playerModel.direction,
//         speed: playerModel.speed
//     });
//
//     newMissiles.push(missile);
// }
//
//------------------------------------------------------------------
//
// Process the network inputs we have received since the last time
// the game loop was processed.
//
//------------------------------------------------------------------
function processInput(elapsedTime) {
    //
    // Double buffering on the queue so we don't asynchronously receive inputs
    // while processing.
    let processMe = inputQueue;
    inputQueue = Queue.createQ();

    while (!processMe.empty) {
        let input = processMe.dequeue();
        console.log(input);
        console.log(input.clientId);
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
            // case NetworkIds.INPUT_FIRE:
            //     createMissile(input.clientId, client.player);
            //     break;
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

    // for (let missile = 0; missile < newMissiles.length; missile++) {
    //     newMissiles[missile].update(elapsedTime);
    // }
    //
    // let keepMissiles = [];
    // for (let missile = 0; missile < activeMissiles.length; missile++) {
    //     //
    //     // If update returns false, that means the missile lifetime ended and
    //     // we don't keep it around any longer.
    //     if (activeMissiles[missile].update(elapsedTime)) {
    //         keepMissiles.push(activeMissiles[missile]);
    //     }
    // }
    // activeMissiles = keepMissiles;

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

//------------------------------------------------------------------
//
// Send state of the game to any connected clients.
//
//------------------------------------------------------------------
function updateClients(elapsedTime) {
    //
    // For demonstration purposes, network updates run at a slower rate than
    // the game simulation.
    lastUpdate += elapsedTime;
    if (lastUpdate < STATE_UPDATE_RATE_MS) {
        return;
    }

    // //
    // // Build the missile messages one time, then reuse inside the loop
    // let missileMessages = [];
    // for (let item = 0; item < newMissiles.length; item++) {
    //     let missile = newMissiles[item];
    //     missileMessages.push({
    //         id: missile.id,
    //         direction: missile.direction,
    //         position: {
    //             x: missile.position.x,
    //             y: missile.position.y
    //         },
    //         radius: missile.radius,
    //         speed: missile.speed,
    //         timeRemaining: missile.timeRemaining
    //     });
    // }
    //
    // //
    // // Move all the new missiles over to the active missiles array
    // for (let missile = 0; missile < newMissiles.length; missile++) {
    //     activeMissiles.push(newMissiles[missile]);
    // }
    // newMissiles.length = 0;

    for (let clientId in activeUsers) {
        let client = activeUsers[clientId];
        let update = {
            clientId: clientId,
            lastMessageId: client.lastMessageId,
            direction: client.user.direction,
            position: client.user.position,
            updateWindow: lastUpdate
        };
        if (client.user.reportUpdate) {
            client.socket.emit(NetworkIds.UPDATE_SELF, update);

            //
            // Notify all other connected clients about every
            // other connected client status...but only if they are updated.
            for (let otherId in activeUsers) {
                if (otherId !== clientId) {
                    activeUsers[otherId].socket.emit(NetworkIds.UPDATE_OTHER, update);
                }
            }
        }
        //
        // //
        // // Report any new missiles to the active clients
        // for (let missile = 0; missile < missileMessages.length; missile++) {
        //     client.socket.emit(NetworkIds.MISSILE_NEW, missileMessages[missile]);
        // }
        //
        // //
        // // Report any missile hits to this client
        // for (let hit = 0; hit < hits.length; hit++) {
        //     client.socket.emit(NetworkIds.MISSILE_HIT, hits[hit]);
        // }
    }

    for (let clientId in activeUsers) {
        activeUsers[clientId].user.reportUpdate = false;
    }

    //
    // Don't need these anymore, clean up
    hits.length = 0;
    //
    // Reset the elapsedt time since last update so we can know
    // when to put out the next update.
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

    //my func
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
            }
        }, 1000);
    }
    //my func done

    //------------------------------------------------------------------
    //
    // Notifies the already connected clients about the arrival of this
    // new client.  Plus, tell the newly connected client about the
    // other players already connected.
    //
    //------------------------------------------------------------------
    // function notifyConnect(socket, newPlayer) {
    //     for (let clientId in activeClients) {
    //         let client = activeClients[clientId];
    //         if (newPlayer.clientId !== clientId) {
    //             //
    //             // Tell existing about the newly connected player
    //             client.socket.emit(NetworkIds.CONNECT_OTHER, {
    //                 clientId: newPlayer.clientId,
    //                 direction: newPlayer.direction,
    //                 position: newPlayer.position,
    //                 rotateRate: newPlayer.rotateRate,
    //                 speed: newPlayer.speed,
    //                 size: newPlayer.size
    //             });
    //
    //             //
    //             // Tell the new player about the already connected player
    //             socket.emit(NetworkIds.CONNECT_OTHER, {
    //                 clientId: client.player.clientId,
    //                 direction: client.player.direction,
    //                 position: client.player.position,
    //                 rotateRate: client.player.rotateRate,
    //                 speed: client.player.speed,
    //                 size: client.player.size
    //             });
    //         }
    //     }
    // }
    //
    // //------------------------------------------------------------------
    // //
    // // Notifies the already connected clients about the disconnect of
    // // another client.
    // //
    // //------------------------------------------------------------------
    // function notifyDisconnect(playerId) {
    //     for (let clientId in activeClients) {
    //         let client = activeClients[clientId];
    //         if (playerId !== clientId) {
    //             client.socket.emit(NetworkIds.DISCONNECT_OTHER, {
    //                 clientId: playerId
    //             });
    //         }
    //     }
    // }

    // io.on('connection', function(socket) {
    //     console.log('Connection established: ', socket.id);
    //     //
    //     // Create an entry in our list of connected clients
    //     let newPlayer = Player.create()
    //     newPlayer.clientId = socket.id;
    //     activeClients[socket.id] = {
    //         socket: socket,
    //         player: newPlayer
    //     };
    //     socket.emit(NetworkIds.CONNECT_ACK, {
    //         direction: newPlayer.direction,
    //         position: newPlayer.position,
    //         size: newPlayer.size,
    //         rotateRate: newPlayer.rotateRate,
    //         speed: newPlayer.speed
    //     });
    //
    //     socket.on(NetworkIds.INPUT, data => {
    //         inputQueue.enqueue({
    //             clientId: socket.id,
    //             message: data
    //         });
    //     });
    //
    //     socket.on('disconnect', function() {
    //         delete activeClients[socket.id];
    //         // notifyDisconnect(socket.id);
    //     });
    //
    //     // notifyConnect(socket, newPlayer);
    // });


    ////ours

    io.on('connection', function(socket){
        socket.on('join', function(data){
            console.log(data.name + ' with id ' + socket.id + ' connected');
            if(game_started) {
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
                activeUsers[data.name] = {
                    id: socket.id,
                    socket: socket,
                    user: newUser
                };

                socket.emit(NetworkIds.CONNECT_ACK, {
                    position: newUser.position,
                });

                connections++;
                if (connections >= TARGET_USERS_NUM) {
                    if (!game_started) runCountdown();
                    game_started = true;
                }
            }

            socket.on('chat message', function(msg){
                io.emit('chat message', data.name + ": " + msg);
            });

            // socket.on('input', (keyInput) => {
            //     console.log(data.name + ':: ' + keyInput);
            // });

            socket.on(NetworkIds.INPUT, keyInput => {
                inputQueue.enqueue({
                    clientId: socket.id,
                    message: keyInput
                });
                console.log(data.name + ': ' + keyInput.type);
            });

            socket.on('disconnect', function(){
                connections--;
                console.log(data.name + ' with id ' + socket.id + ' disconnected');
                io.emit('chat message', data.name + ' has left the game');
            });
        });
    });
}

//------------------------------------------------------------------
//
// Entry point to get the game started.
//
//------------------------------------------------------------------
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
