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
        otherUsers = [],
        missiles = {};

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

        socketIO.on(NetworkIds.RECONNECT_SELF, data => {
            jobQueue.enqueue({
                type: NetworkIds.RECONNECT_SELF,
                data: data
            });
        });

        socketIO.on(NetworkIds.RECONNECT_OTHER, data => {
            jobQueue.enqueue({
                type: NetworkIds.RECONNECT_OTHER,
                data: data
            });
        });

        socketIO.on(NetworkIds.UPDATE_OTHER, data => {
            jobQueue.enqueue({
                type: NetworkIds.UPDATE_OTHER,
                data: data
            });
        });

        socketIO.on(NetworkIds.UPDATE_OTHER_DELETE, data => {
            jobQueue.enqueue({
                type: NetworkIds.UPDATE_OTHER_DELETE,
                data: data
            });
        });

        socketIO.on(NetworkIds.MISSILE_NEW, data => {
            jobQueue.enqueue({
                type: NetworkIds.MISSILE_NEW,
                data: data
            });
        });

        socketIO.on(NetworkIds.MISSILE_HIT, data => {
            jobQueue.enqueue({
                type: NetworkIds.MISSILE_HIT,
                data: data
            });
        });
    }

    function missileNew(data) {
        missiles[data.id] = logic.Missile({
            id: data.id,
            radius: data.radius,
            speed: data.speed,
            acceleration: data.acceleration,
            direction: data.direction,
            position: {
                x: data.position.x,
                y: data.position.y
            },
            timeRemaining: data.timeRemaining
        });
    }

    function updateMsgs(){
        let processMe = jobQueue;
        jobQueue = jobQueue = logic.createQueue();
        while (!processMe.empty) {
            let message = processMe.dequeue();
            switch (message.type) {
                case NetworkIds.CONNECT_ACK:
                    connectPlayerSelf(message.data);
                    break;
                case NetworkIds.CONNECT_OTHER:
                    connectPlayerOther(message.data);
                    break;
                case NetworkIds.RECONNECT_SELF:
                    reconnectPlayerSelf(message.data);
                    break;
                case NetworkIds.RECONNECT_OTHER:
                    reconnectPlayerOther(message.data);
                    break;
                case NetworkIds.UPDATE_OTHER:
                    updateOthers(message.data);
                    break;
                case NetworkIds.UPDATE_OTHER_DELETE:
                    untrack(message.data);
                    break;
                case NetworkIds.MISSILE_NEW:
                    missileNew(message.data);
                    break;
                case NetworkIds.MISSILE_HIT:
                    console.log('Put missile hit code here');
                    break;
            }
        }
    }

    function connectPlayerOther(data) {
        let model = logic.OtherPlayer();
        // model.state.position.x = data.position.x + data.view.left;
        // model.state.position.y = data.position.y + data.view.top;

        otherUsers[data.userId] = {
            model: model,
            texture: 'playerShip1_blue.png'
        };
    }

    function reconnectPlayerOther(data) {
        let model = logic.OtherPlayer();
        model.state.orientation = data.orientation;

        otherUsers[data.userId] = {
            model: model,
            texture: 'playerShip1_blue.png'
        };
    }

    function reconnectPlayerSelf(data) {
        myPlayer.model.position.x = .5;
        myPlayer.model.position.y = .5;
        myPlayer.model.orientation = data.orientation;
        background.setViewport(data.worldView.x - .5, data.worldView.y - .5);
    }

    function connectPlayerSelf(data) {
        myPlayer.model.position.x = data.position.x;
        myPlayer.model.position.y = data.position.y;
        background.setViewport(data.view.left, data.view.top);
    }

    function untrack(data) {
        if (otherUsers.hasOwnProperty(data.clientId)) {
            let model = otherUsers[data.clientId].model;
            delete model.state.position.x;
            delete model.state.position.y;
        }
    }

    function updateOthers(data) {
        if (otherUsers.hasOwnProperty(data.clientId)) {
            let model = otherUsers[data.clientId].model;
            model.goal.updateWindow = data.updateWindow;

            if (!model.state.position.hasOwnProperty('x')){
                model.state.position.x = data.worldView.x;
                model.state.position.y = data.worldView.y;
                console.log(model.state.position);
                console.log('inside');
            }
            console.log(model.state.position);
            console.log('outside');
            model.goal.position.x = data.worldView.x;

            model.goal.position.y = data.worldView.y;
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
        let removeMissiles = [];
        for (let missile in missiles) {
            if (!missiles[missile].update(elapsedTime)) {
                removeMissiles.push(missiles[missile]);
            }
        }

        for (let missile = 0; missile < removeMissiles.length; missile++) {
            delete missiles[removeMissiles[missile].id];
        }

        shiftView(myPlayer.model.position, elapsedTime);
    }

    function processInput(elapsedTime){
        keyboard.update(elapsedTime);
    }

    function drawObjects(object){
        if (object.x - background.viewport.left < 1 &&
            object.y - background.viewport.top < 1 &&
            object.x - background.viewport.left > 0 &&
            object.y - background.viewport.top > 0){
            return {
                y: object.y - background.viewport.top,
                x: object.x - background.viewport.left
            };
        }
        return false;
    }

    function render(){
        graphics.clear();
        background.render();
        for (let index in otherUsers){
            let object = otherUsers[index].model.state.position;
            if (!object.hasOwnProperty('x')) continue;
            let position = drawObjects(object);
            if (position.hasOwnProperty('x')){
                graphics.draw(otherUsers[index].texture, position,
                    otherUsers[index].model.size, object.orientation, false)
            }
        }
        for (let missile in missiles){
            let position = drawObjects(missiles[missile].position);
            if (position.hasOwnProperty('x')){
                graphics.drawMissile(position, missiles[missile].radius, 'black');
            }
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

