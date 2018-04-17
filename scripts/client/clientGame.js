Rocket.main = (function(input, logic, graphics, assets) {

    let socketIO = null;

    let keyboard = input.Keyboard(), lastTimeStamp, messageId = 1,
        myPlayer = {
            model: logic.Player(),
            texture: 'playerShip1_blue.png'
        },
        background = null,
        mini = graphics.miniMap(),
        jobQueue = logic.createQueue(),
        otherUsers = [];

    function network() {
        socketIO.on(NetworkIds.CONNECT_ACK, data => {
            jobQueue.enqueue({
                type: NetworkIds.CONNECT_ACK,
                data: data
            });
        });

        socketIO.on(NetworkIds.CONNECT_OTHER, data => {
            jobQueue.enqueue({
                type: NetworkIds.CONNECT_OTHER,
                data: data
            });
        });

        socketIO.on(NetworkIds.UPDATE_OTHER, data => {
            jobQueue.enqueue({
                type: NetworkIds.UPDATE_OTHER,
                data: data
            });
        });
    }

    function updateMsgs(){
        let processMe = jobQueue;
        jobQueue = jobQueue = logic.createQueue();
        while (!processMe.empty) {
            let message = processMe.dequeue();
            console.log('message received: ' + message);
            switch (message.type) {
                case NetworkIds.CONNECT_ACK:
                    connectPlayerSelf(message.data);
                    break;
                case NetworkIds.CONNECT_OTHER:
                    connectPlayerOther(message.data);
                    break;
                case NetworkIds.UPDATE_OTHER:
                    updateOthers(message.data);
                    break;
            }
        }
    }

    //------------------------------------------------------------------
    //
    // Handler for when a new player connects to the game.  We receive
    // the state of the newly connected player model.
    //
    //------------------------------------------------------------------
    function connectPlayerOther(data) {
        let model = logic.OtherPlayer();
        model.state.position.x = data.position.x + data.view.left;
        model.state.position.y = data.position.y + data.view.top;
        // model.view.left = data.view.left;
        // model.view.top = data.view.top;

        otherUsers[data.userId] = {
            model: model,
            texture: 'playerShip1_blue.png'
        };
    }

    function connectPlayerSelf(data) {
        myPlayer.model.position.x = data.position.x;
        myPlayer.model.position.y = data.position.y;
        background.setViewport(data.view.left, data.view.top);
    }

    function updateOthers(data) {
        if (otherUsers.hasOwnProperty(data.clientId)) {
            let model = otherUsers[data.clientId].model;
            model.goal.updateWindow = data.updateWindow;

            // model.state.position.x = data.position.x;
            // model.state.position.y = data.position.y;
            // model.state.orientation = data.orientation;
            //
            model.goal.position.x = data.worldView.x;
            model.goal.position.y = data.worldView.y;
            // model.view.top = data.view.top;
            // model.view.left = data.view.left;
            model.goal.orientation = data.orientation;
        }
    }

    function shiftView(position, elapsedTime) {
        let newCenter = {
                x: position.x,
                y: position.y
            }, vector = null;

        if (position.x >= (1 - (1/3)) || position.x <= (1/3)) {
            let x;
            if (position.x >= (1 - (1/3))) {
                newCenter.x = (1 - (1/3));
                x = Math.abs(newCenter.x - position.x);
            } else {
                newCenter.x = (1/3);
                x = Math.abs(newCenter.x - position.x)* (-1);
            }
            vector = { x: x, y: 0 };
            background.move(vector);
        }
        if (position.y >= (1 - (1/3)) || position.y <= (1/3)) {
            let y;
            if (position.y >= (1 - (1/3))) {
                newCenter.y = (1 - (1/3));
                y = Math.abs(newCenter.y - position.y);
            } else {
                newCenter.y = (1/3);
                y = Math.abs(newCenter.y - position.y)* (-1);
            }
            vector = { x: 0, y: y };
            background.move(vector);
        }

        position.x = newCenter.x;
        position.y = newCenter.y;
    }

    function update(elapsedTime){
        updateMsgs();
        for (let index in otherUsers){
            otherUsers[index].model.update(elapsedTime);
        }
        shiftView(myPlayer.model.position, elapsedTime);
    }

    function processInput(elapsedTime){
        keyboard.update(elapsedTime);
    }

    function otherPlayers(other){
        if (other.model.state.position.x - background.viewport.left < 1 &&
            other.model.state.position.y - background.viewport.top < 1 &&
            other.model.state.position.x - background.viewport.left > 0 &&
            other.model.state.position.y - background.viewport.top > 0){
            let position = {
                y: other.model.state.position.y - background.viewport.top,
                x: other.model.state.position.x - background.viewport.left
            };

            graphics.draw(other.texture, position,
                other.model.size, other.model.state.orientation, false)
        }
    }

    function render(){
        graphics.clear();
        background.render();
        for (let index in otherUsers){
            otherPlayers(otherUsers[index])
        }
        graphics.draw(myPlayer.texture, myPlayer.model.position, myPlayer.model.size, myPlayer.model.orientation, true);
        mini.drawMini();
        mini.drawPosition(myPlayer.model.position, background.viewport, background.size);
    }

    function gameLoop(time) {
        let elapsedTime = time - lastTimeStamp;
        lastTimeStamp = time;

        processInput(elapsedTime);
        update(elapsedTime);
        render();

        requestAnimationFrame(gameLoop);
    };

    function init(socket, userId) {
        socketIO = socket;
        background = graphics.TiledImage({
            pixel: { width: assets['background'].width, height: assets['background'].height },
            size: { width: 5, height: 5 },
            tileSize: assets['background'].tileSize,
            assetKey: 'background'
        });

        background.setViewport(0.00, 0.00);
        graphics.createImage(myPlayer.texture);
        graphics.initGraphics();

        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_MOVE_UP,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
                // messageHistory.enqueue(message);
                myPlayer.model.moveUp(elapsedTime);
            },
            Rocket.input.KeyEvent.DOM_VK_W, true);

        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_MOVE_DOWN,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
                // messageHistory.enqueue(message);
                myPlayer.model.moveDown(elapsedTime);
            },
            Rocket.input.KeyEvent.DOM_VK_S, true);

        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_MOVE_LEFT,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
                // messageHistory.enqueue(message);
                myPlayer.model.moveLeft(elapsedTime);
            },
            Rocket.input.KeyEvent.DOM_VK_A, true);


        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_MOVE_RIGHT,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
                // messageHistory.enqueue(message);
                myPlayer.model.moveRight(elapsedTime);
            },
            Rocket.input.KeyEvent.DOM_VK_D, true);

        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_ROTATE_RIGHT,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
                // messageHistory.enqueue(message);
                myPlayer.model.rotateRight(elapsedTime);
            },
            Rocket.input.KeyEvent.DOM_VK_RIGHT, true);

        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_FLIP,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
                // messageHistory.enqueue(message);
                myPlayer.model.flipIt(elapsedTime);
            },
            Rocket.input.KeyEvent.DOM_VK_DOWN, false);

        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_ROTATE_LEFT,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
                // messageHistory.enqueue(message);
                myPlayer.model.rotateLeft(elapsedTime);
            },
            Rocket.input.KeyEvent.DOM_VK_LEFT, true);

        keyboard.registerHandler(elapsedTime => {
                let message = {
                    id: messageId++,
                    elapsedTime: elapsedTime,
                    type: NetworkIds.INPUT_FIRE,
                    userId: userId
                };
                socket.emit(NetworkIds.INPUT, message);
            },
            Rocket.input.KeyEvent.DOM_VK_UP, false);

        network();
        requestAnimationFrame(gameLoop);
    }

    return {
        init : init
    };

}(Rocket.input, Rocket.logic, Rocket.graphics, Rocket.assets));

