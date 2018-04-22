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

    let inventory = {
        health: 100,
        ammo: 0,
        weapon: -1
    };

    let size = {
        width: 0.05,
        height: 0.05,
    };

    let radius = .025;

    let worldView = {
      x: position.x + view.left,
      y: position.y + view.top
    };

    let projected = {
        x: position.x + view.left,
        y: position.y + view.top
    };

    let orientation = 0;
    let rotateRate = Math.PI;
    let speed = .2;
    let flipped = true;
    let reportUpdate = false;

    Object.defineProperty(that, 'reportUpdate', {
        get: () => reportUpdate,
        set: value => reportUpdate = value
    });
    Object.defineProperty(that, 'inventory', {
        get: () => inventory,
        set: value => inventory = value
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
        get: () => worldView,
        set: value => { worldView = value; }
    });

    Object.defineProperty(that, 'projected', {
        get: () => projected,
        set: value => { projected = value; }
    });

    Object.defineProperty(that, 'myPosition', {
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

    Object.defineProperty(that, 'radius', {
        get: () => radius
    });

    that.moveUp = function(elapsedTime) {
        reportUpdate = true;
        if (projected.y - speed * (elapsedTime / 1000) > (1/3)){
            projected.y -= speed * (elapsedTime / 1000);
        }
    };

    that.moveDown = function(elapsedTime) {
        reportUpdate = true;
        if (projected.y + speed * (elapsedTime / 1000) < 5 - (1/3)){
            projected.y += speed * (elapsedTime / 1000);
        }
    };

    that.moveLeft = function(elapsedTime) {
        reportUpdate = true;
        if (projected.x - speed * (elapsedTime / 1000) > (1/3)){
            projected.x -= speed * (elapsedTime / 1000);
        }
    };

    that.moveRight = function(elapsedTime) {
        reportUpdate = true;
        if (projected.x + speed * (elapsedTime / 1000) < 5 - (1/3)){
            projected.x += speed * (elapsedTime / 1000);
        }
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

function makeTrees(){

    let that = {};

    let treeArray = [],
        treeIndex = [ [1, .5], [.5, 2.75], [1.5, 4.5], [2.3, 2.5], [2.5, 2.3], [3.25, 2], [4.5, 2.5], [3.5, 4]],
        Trees = {
            num: 8
        },
        treeSize = {
            width: .2,
            height: .4
        };

    for (let i = 0; i < Trees.num; i++){
        treeArray.push( {
            model: {
                position : {
                    x: treeIndex[i][0],
                    y: treeIndex[i][1]
                },
                size: {
                    height: treeSize.height,
                    width: treeSize.width
                },
                radius: .1
            },
            id: i+1
        });
    }

    Object.defineProperty(that, 'treeArray', {
        get: () => treeArray,
        set: value => { treeArray = value; }
    });

    return that;
}

module.exports.makeplayer = makePlayer;
module.exports.makeTrees = makeTrees;
