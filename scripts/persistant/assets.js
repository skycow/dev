Rocket.assets.init = function () {

    let assetOrder = [{
        key: 'user',
        source: 'images/bunny.png'
    }];

    function createImage(tileKey, location) {
        Rocket.assets[tileKey] = {
            image: new Image(),
            key: tileKey,
            source: location
        };
        Rocket.assets[tileKey].image.src = location;
    }

    function prepareTiledImage(assetArray, rootName, rootKey, sizeX, sizeY, tileSize) {
        var numberX = sizeX / tileSize,
            numberY = sizeY / tileSize,
            tileFile = '',
            tileSource = '',
            tileKey = '';

        //
        // Create an entry in the assets that holds the properties of the tiled image
        Rocket.assets[rootKey] = {
            width: sizeX,
            height: sizeY,
            tileSize: tileSize
        };

        for (let tileY = 0; tileY < numberY; tileY += 1) {
            for (let tileX = 0; tileX < numberX; tileX += 1) {
                tileFile =  Rocket.assets.numberPad((tileY * numberX + tileX), 3);
                tileSource = rootName + tileFile + '.jpg';
                tileKey = rootKey + '-' + tileFile;
                // assetArray.push({
                //     key: tileKey,
                //     source: tileSource
                // });
                createImage(tileKey, tileSource);
            }
        }
    }

    prepareTiledImage(assetOrder, 'images/background/tiles', 'background', 2000, 2000, 100);

};

Rocket.assets.numberPad = function (n, p, c) {
    var pad_char = typeof c !== 'undefined' ? c : '0',
        pad = new Array(1 + p).join(pad_char);

    return (pad + n).slice(-pad.length);
}

