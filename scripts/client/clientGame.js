Rocket.main = (function(input, logic, graphics, assets) {

    let socketIO = null;

    let keyboard = input.Keyboard(), lastTimeStamp, messageId = 1,
        myPlayer = {
            model: logic.Player(),
            texture: 'playerShip1_blue.png'
        },
        background = null,
        mini = graphics.miniMap(),
        jobQueue = logic.createQueue();

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
            }
        }
    }

    function connectPlayerSelf(data) {
        myPlayer.model.position.x = data.position.x;
        myPlayer.model.position.y = data.position.y;
    }

    function shiftView(position, elapsedTime) {
        let newCenter = {
                x: position.x,
                y: position.y
            }, vector = null;

        if (position.x >= 0.85 || position.x <= 0.15) {
            let x;
            if (position.x >= 0.85) {
                newCenter.x = 0.85;
                x = Math.abs(newCenter.x - position.x);
            } else {
                newCenter.x = 0.15;
                x = Math.abs(newCenter.x - position.x)* (-1);
            }
            vector = { x: x, y: 0 };
            background.move(vector);
        }
        if (position.y >= 0.9 || position.y <= 0.1) {
            let y;
            if (position.y >= 0.9) {
                newCenter.y = 0.9;
                y = Math.abs(newCenter.y - position.y);
            } else {
                newCenter.y = 0.1;
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
        shiftView(myPlayer.model.position, elapsedTime);
    }

    function processInput(elapsedTime){
        keyboard.update(elapsedTime);
    }

    function render(){
        graphics.clear();
        background.render();
        graphics.draw(myPlayer.texture, myPlayer.model.position, myPlayer.model.size, myPlayer.model.orientation);
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

        socket.on(NetworkIds.CONNECT_ACK, data => {
            console.log('did i get here')
            jobQueue.enqueue({
                type: NetworkIds.CONNECT_ACK,
                data: data
            });
        });

        requestAnimationFrame(gameLoop);
    }

    return {
        init : init
    };

}(Rocket.input, Rocket.logic, Rocket.graphics, Rocket.assets));

