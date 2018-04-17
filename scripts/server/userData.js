function makePlayer() {
    let that = {};

    let position = {
        x: Math.random(),
        y: Math.random()
    };

    let view = {
        left: Math.random()*4,
        top: Math.random()*4
    };

    let size = {
        width: 0.05,
        height: 0.05
    };

    let worldView = {
      x: position.x + view.left,
      y: position.y + view.top
    };

    let orientation = 0;
    let rotateRate = Math.PI;
    let speed = .3;
    let flipped = true;
    let reportUpdate = false;

    Object.defineProperty(that, 'reportUpdate', {
        get: () => reportUpdate,
        set: value => reportUpdate = value
    });

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

    Object.defineProperty(that, 'view', {
        get: () => view,
        set: value => { view = value; }
    });

    Object.defineProperty(that, 'worldView', {
        get: () => worldView,
        set: value => { worldView = value; }
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    that.moveUp = function(elapsedTime) {
        reportUpdate = true;
        worldView.y -= speed * (elapsedTime / 1000);
    };

    that.moveDown = function(elapsedTime) {
        reportUpdate = true;
        worldView.y += speed * (elapsedTime / 1000);
    };

    that.moveLeft = function(elapsedTime) {
        reportUpdate = true;
        worldView.x -= speed * (elapsedTime / 1000);
    };

    that.moveRight = function(elapsedTime) {
        reportUpdate = true;
        worldView.x += speed * (elapsedTime / 1000);
    };

    that.rotateRight = function(elapsedTime) {
        reportUpdate = true;
        orientation += ((rotateRate/1000) * elapsedTime);
    };

    that.rotateLeft = function(elapsedTime) {
        reportUpdate = true;
        orientation -= ((rotateRate/1000) * elapsedTime);
    };

    that.flipIt = function (elapsedTime) {
        reportUpdate = true;
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

module.exports.makeplayer = makePlayer;
