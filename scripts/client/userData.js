Rocket.logic.Player = function () {
    let that = {};

    let position = {
        x: 0.5,
        y: 0.5
    };

    let size = {
        width: 0.05,
        height: 0.05
    };

    let orientation = 0;
    let rotateRate = Math.PI;
    let speed = .3;
    let flipped = true;

    Object.defineProperty(that, 'orientation', {
        get: () => orientation,
        set: (value) => { orientation = value }
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed,
        set: value => { speed = value; }
    });

    Object.defineProperty(that, 'rotateRate', {
        get: () => rotateRate,
        set: value => { rotateRate = value; }
    });

    Object.defineProperty(that, 'position', {
        get: () => position,
        set: value => { position = value; }
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    that.moveUp = function(elapsedTime) {
        position.y -= speed * (elapsedTime / 1000);
    };

    that.moveDown = function(elapsedTime) {
        position.y += speed * (elapsedTime / 1000);
    };

    that.moveLeft = function(elapsedTime) {
        position.x -= speed * (elapsedTime / 1000);
    };

    that.moveRight = function(elapsedTime) {
        position.x += speed * (elapsedTime / 1000);
    };

    that.rotateRight = function(elapsedTime) {
        orientation += ((rotateRate/1000) * elapsedTime);
    };

    that.rotateLeft = function(elapsedTime) {
        orientation -= ((rotateRate/1000) * elapsedTime);
    };

    that.flipIt = function (elapsedTime) {
        if (flipped) {
            orientation += Math.PI;
        } else {
            orientation -= Math.PI;
        }
        flipped = !flipped;
    };

    that.update = function(elapsedTime) {
    };

    return that;
};

Rocket.logic.createQueue = function () {

    let that = [];

    that.enqueue = function(value) {
        that.push(value);
    }

    that.dequeue = function() {
        return that.shift();
    }

    Object.defineProperty(that, 'front', {
        get: () => that[0]
    });

    Object.defineProperty(that, 'empty', {
        get: () => { return that.length === 0; }
    });

    return that;

};