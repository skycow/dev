//------------------------------------------------------------------
//
// Public function used to initially create a newly fired missile.
//
//------------------------------------------------------------------
function createMissile(spec) {
    let that = {};

    let radius = 0.01;
    let speed = spec.speed + 0.0002;    // unit distance per millisecond
    let acceleration = 1.02;
    let timeRemaining = 1500;   // milliseconds

    Object.defineProperty(that, 'userId', {
        get: () => spec.userId
    });

    Object.defineProperty(that, 'id', {
        get: () => spec.id
    });

    Object.defineProperty(that, 'direction', {
        get: () => spec.direction
    });

    Object.defineProperty(that, 'position', {
        get: () => spec.position
    });

    Object.defineProperty(that, 'radius', {
        get: () => radius
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed
    });


    Object.defineProperty(that, 'acceleration', {
        get: () => acceleration,
    });

    Object.defineProperty(that, 'timeRemaining', {
        get: () => timeRemaining
    });

    that.update = function(elapsedTime) {
        let vectorX = Math.cos(spec.direction);
        let vectorY = Math.sin(spec.direction);

        speed *= acceleration;

        spec.position.x += ((vectorX/Math.cos(Math.PI/4)) * (elapsedTime/1000) * speed);
        spec.position.y += ((vectorY/Math.cos(Math.PI/4)) * (elapsedTime/1000) * speed);
        // spec.position.x += ((vectorX*1.5) * (elapsedTime/1000) * speed);
        // spec.position.y += ((vectorY*1.5) * (elapsedTime/1000) * speed);

        timeRemaining -= elapsedTime;

        if (timeRemaining <= 0) {
            return false;
        } else {
            return true;
        }
    };

    return that;
}

module.exports.create = (spec) => createMissile(spec);
