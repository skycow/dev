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

Rocket.logic.OtherPlayer = function() {
    'use strict';
    let that = {};
    let size = {
        width: 0.05,
        height: 0.05
    };
    let state = {
        orientation: 0,
        position: {
            x: 0,
            y: 0
        }
    };
    //
    // let view = {
    //     top: 0,
    //     left: 0
    // };

    let goal = {
        orientation: 0,
        position: {
            x: 0,
            y: 0
        },
        updateWindow: 0      // Server reported time elapsed since last update
    };

    Object.defineProperty(that, 'state', {
        get: () => state
    });

    // Object.defineProperty(that, 'view', {
    //     get: () => view
    // });

    Object.defineProperty(that, 'goal', {
        get: () => goal
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    //------------------------------------------------------------------
    //
    // Update of the remote player is a simple linear progression/interpolation
    // from the previous state to the goal (new) state.
    //
    //------------------------------------------------------------------
    that.update = function(elapsedTime) {
        // Protect against divide by 0 before the first update from the server has been given
        if (goal.updateWindow === 0) return;

        let updateFraction = elapsedTime / goal.updateWindow;
        if (updateFraction > 0) {
            //
            // Turn first, then move.
            state.orientation -= (state.orientation - goal.orientation) * updateFraction;

            state.position.x -= (state.position.x - goal.position.x) * updateFraction;
            state.position.y -= (state.position.y - goal.position.y) * updateFraction;
        }
    };

    return that;
};