Rocket.logic.Player = function () {
    let that = {};

    let position = {
        x: 0.5,
        y: 0.5
    };

    let projected = {
        x: 0.5,
        y: 0.5
    };

    let size = {
        width: 0.05,
        height: 0.05
    };

    let radius = .025;
    let orientation = 0;
    let rotateRate = Math.PI;
    let speed = .2;
    let flipped = true;

    let ammo = 0;
    let health = 100;
    let armor = null;
    let weapon = null;
    let sprint = null;

    let userId = null;

    Object.defineProperty(that, 'orientation', {
        get: () => orientation,
        set: (value) => { orientation = value }
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed,
        set: value => { speed = value; }
    });

    Object.defineProperty(that, 'projected', {
        get: () => projected,
        set: value => { projected = value; }
    });

    Object.defineProperty(that, 'sprint', {
        get: () => sprint,
        set: value => { sprint = value; }
    });


    Object.defineProperty(that, 'weapon', {
        get: () => weapon,
        set: value => { weapon = value; }
    });


    Object.defineProperty(that, 'health', {
        get: () => health ,
        set: value => { health = value; }
    });


    Object.defineProperty(that, 'armor', {
        get: () => armor,
        set: value => { armor = value; }
    });


    Object.defineProperty(that, 'ammo', {
        get: () => ammo,
        set: value => { ammo = value; }
    });

    Object.defineProperty(that, 'rotateRate', {
        get: () => rotateRate,
        set: value => { rotateRate = value; }
    });

    Object.defineProperty(that, 'position', {
        get: () => position,
        set: value => { position = value; }
    });

    Object.defineProperty(that, 'userId', {
        get: () => userId,
        set: value => { userId = value; }
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    Object.defineProperty(that, 'radius', {
        get: () => radius
    });

    that.moveUp = function(elapsedTime) {
        projected.y -= speed * (elapsedTime / 1000);
    };

    that.moveDown = function(elapsedTime) {
        projected.y += speed * (elapsedTime / 1000);
    };

    that.moveLeft = function(elapsedTime) {
        projected.x -= speed * (elapsedTime / 1000);
    };

    that.moveRight = function(elapsedTime) {
        projected.x += speed * (elapsedTime / 1000);
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

    Object.defineProperty(that, 'goal', {
        get: () => goal
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    that.update = function(elapsedTime) {
        // Protect against divide by 0 before the first update from the server has been given
        if (goal.updateWindow === 0) return;

        let updateFraction = elapsedTime / goal.updateWindow;
        if (updateFraction > 0) {
            //
            // Turn first, then move.
            state.orientation -= (state.orientation - goal.orientation) * updateFraction;

            if (state.position.hasOwnProperty('x')){
                state.position.x -= (state.position.x - goal.position.x) * updateFraction;
                state.position.y -= (state.position.y - goal.position.y) * updateFraction;
            }
        }
    };

    return that;
};

Rocket.logic.Missile = function(spec) {
    let that = {};

    Object.defineProperty(that, 'position', {
        get: () => spec.position
    });

    Object.defineProperty(that, 'radius', {
        get: () => spec.radius
    });

    Object.defineProperty(that, 'direction', {
        get: () => spec.direction
    });

    Object.defineProperty(that, 'id', {
        get: () => spec.id
    });

    that.update = function(elapsedTime) {
        let vectorX = Math.cos(spec.direction);
        let vectorY = Math.sin(spec.direction);

        spec.speed *= spec.acceleration;
        spec.position.x += ((vectorX/Math.cos(Math.PI/4)) * (elapsedTime/1000) * spec.speed);
        spec.position.y += ((vectorY/Math.cos(Math.PI/4)) * (elapsedTime/1000) * spec.speed);

        spec.timeRemaining -= elapsedTime;

        if (spec.timeRemaining <= 0) {
            return false;
        } else {
            return true;
        }
    };

    return that;
};

Rocket.logic.ParticleSystem = function(spec, graphics) {
    let that = {};

    let position = {
        x: spec.position.x,
        y: spec.position.y
    };

    that.setPosition = function (x, y) {
        position.x = x;
        position.y = y;
    };

    Object.defineProperty(that, 'position', {
        get: () => position
    });

    let particles = [];
    that.render = function(view) {
        for (let particle = 0; particle < particles.length; particle++) {
            if (particles[particle].alive >= 30) {
                let position_particles = {
                    x: particles[particle].position.x - view.left,
                    y: particles[particle].position.y - view.top,
                }
                graphics.drawRectangle(
                position_particles,
                particles[particle].size,
                particles[particle].rotation,
                particles[particle].fill,
                particles[particle].stroke);
            }
        }
    };

    that.update = function(elapsedTime) {
        let keepMe = [];

        for (let particle = 0; particle < particles.length; particle++) {

            particles[particle].alive += elapsedTime;
            let vectorX = Math.cos(particles[particle].direction);
            let vectorY = Math.sin(particles[particle].direction);
            particles[particle].position.x += ((vectorX/Math.cos(Math.PI/4)) * (elapsedTime/1000) * particles[particle].speed);
            particles[particle].position.y += ((vectorY/Math.cos(Math.PI/4)) * (elapsedTime/1000) * particles[particle].speed);
            particles[particle].rotation += particles[particle].speed / .5;

            if (particles[particle].alive <= particles[particle].lifetime) {
                keepMe.push(particles[particle]);
            }
        }

        for (let particle = 0; particle < 3; particle++) {
            var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
            let p = {
                position: { x: position.x, y: position.y },
                direction: spec.direction + (Math.random() * spec.theta * plusOrMinus),
                speed: spec.speed,	// pixels per millisecond
                rotation: 0,
                lifetime: Math.random()*spec.lifetime,	// milliseconds
                alive: 0,
                size: spec.size,
                fill: spec.fill,
                stroke: 'black'
            };
            keepMe.push(p);
        }
        particles = keepMe;
    };

    return that;
};
