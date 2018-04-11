// ------------------------------------------------------------------
//
// This is the graphics rendering code for the game.
//
// ------------------------------------------------------------------
Rocket.graphics = (function() {
    let canvas = document.getElementById('canvas-main');
    let context = canvas.getContext('2d');

    let images = {};
    let world = {
        size: 0,
        top: 0,
        left: 0
    }

    function resizeCanvas() {
        var smallestSize = 0;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        //
        // Have to figure out where the upper left corner of the unit world is
        // based on whether the width or height is the largest dimension.
        if (canvas.width < canvas.height) {
            smallestSize = canvas.width;
            world.size = smallestSize * 0.9;
            world.left = Math.floor(canvas.width * 0.05);
            world.top = (canvas.height - world.size) / 2;
        } else {
            smallestSize = canvas.height;
            world.size = smallestSize * 0.9;
            world.top = Math.floor(canvas.height * 0.05);
            world.left = (canvas.width - world.size) / 2;
        }

        /*//
        // Notify interested parties of the canvas resize event.
        for (handler in resizeHandlers) {
            resizeHandlers[handler](true);
        }*/
    }

    function initGraphics() {
        resizeCanvas();
    }

    //------------------------------------------------------------------
    //
    // Place a 'clear' function on the Canvas prototype, this makes it a part
    // of the canvas, rather than making a function that calls and does it.
    //
    //------------------------------------------------------------------
    CanvasRenderingContext2D.prototype.clear = function() {
        this.save();
        this.setTransform(1, 0, 0, 1, 0, 0);
        this.clearRect(0, 0, canvas.width, canvas.height);
        this.restore();
    };

    //------------------------------------------------------------------
    //
    // Public function that allows the client code to clear the canvas.
    //
    //------------------------------------------------------------------
    function clear() {
        context.clear();
    }

    //------------------------------------------------------------------
    //
    // Simple pass-through to save the canvas context.
    //
    //------------------------------------------------------------------
    function saveContext() {
        context.save();
    }

    //------------------------------------------------------------------
    //
    // Simple pass-through the restore the canvas context.
    //
    //------------------------------------------------------------------
    function restoreContext() {
        context.restore();
    }

    //------------------------------------------------------------------
    //
    // Rotate the canvas to prepare it for rendering of a rotated object.
    //
    //------------------------------------------------------------------
    function rotateCanvas(center, rotation) {
        context.translate(center.x * canvas.width, center.y * canvas.height);
        context.rotate(rotation);
        context.translate(-center.x * canvas.width, -center.y * canvas.height);
        // context.translate(center.x * world.size + world.left, center.y * world.size + world.top);
        // context.rotate(rotation);
        // context.translate(-(center.x * world.size + world.left), -(center.y * world.size + world.top));

    }

    //------------------------------------------------------------------
    //
    // Draw an image into the local canvas coordinate system.
    //
    //------------------------------------------------------------------
    function draw(texture, center, size, orientation) {
        context.save();

        let localCenter = {
            x: center.x * canvas.width,
            // x: center.x ,
            y: center.y * canvas.height
            // y: center.y
        };

        let localSize = {
            width: size.width * canvas.width,
            height: size.height * canvas.height
        };

        rotateCanvas(center, orientation);

        context.drawImage(images[texture],
            localCenter.x - localSize.width / 2,
            localCenter.y - localSize.height / 2,
            localSize.width,
            localSize.height);
        context.restore();

    }

    function createImage(location) {
        images[location] = new Image();
        images[location].src = 'images/' + location;
    }

    function TiledImage(spec) {
        var RENDER_POS_EPISILON = 0.00001;

        var viewport = {
                left: 0,
                top: 0
            },
            that = {
                get viewport() { return viewport; },
                get tileSize() { return spec.tileSize; },
                get size() { return spec.size; },
                get pixel() { return spec.pixel; },
                get assetKey() { return spec.assetKey; },
                get tilesX() { return spec.pixel.width / spec.tileSize; },
                get tilesY() { return spec.pixel.height / spec.tileSize; }
            };

        //------------------------------------------------------------------
        //
        // Set the top/left corner of the image viewport.  By definition the
        // size of the viewport is square and of size 1,1 in world coordinates.
        //
        //------------------------------------------------------------------
        that.setViewport = function(left, top) {
            viewport.left = left;
            viewport.top = top;
        };

        //------------------------------------------------------------------
        //
        // Move the viewport by the distance vector.
        //
        //------------------------------------------------------------------
        that.move = function(vector) {
            viewport.left += vector.x;
            viewport.top += vector.y;

            //
            // Make sure we don't move beyond the viewport bounds
            viewport.left = Math.max(viewport.left, 0);
            viewport.top = Math.max(viewport.top, 0);

            viewport.left = Math.min(viewport.left, spec.size.width - 1);
            viewport.top = Math.min(viewport.top, spec.size.height - 1);
        }

        that.render = function() {
            var tileSizeWorldCoords = spec.size.width * (spec.tileSize / spec.pixel.width),
                oneOverTileSizeWorld = 1 / tileSizeWorldCoords,	// Combination of DRY and eliminating a bunch of divisions
                imageWorldXPos = viewport.left,
                imageWorldYPos = viewport.top,
                worldXRemain = 1.0,
                worldYRemain = 1.0,
                renderPosX = 0.0,
                renderPosY = 0.0,
                tileLeft,
                tileTop,
                tileAssetName,
                tileRenderXStart,
                tileRenderYStart,
                tileRenderXDist,
                tileRenderYDist,
                tileRenderWorldWidth,
                tileRenderWorldHeight;

            while (worldYRemain > RENDER_POS_EPISILON) {
                tileLeft = Math.floor(imageWorldXPos * oneOverTileSizeWorld);
                tileTop = Math.floor(imageWorldYPos * oneOverTileSizeWorld);

                if (worldXRemain === 1.0) {
                    tileRenderXStart = imageWorldXPos * oneOverTileSizeWorld - tileLeft;
                } else {
                    tileRenderXStart = 0.0;
                }
                if (worldYRemain === 1.0) {
                    tileRenderYStart = imageWorldYPos * oneOverTileSizeWorld - tileTop;
                } else {
                    tileRenderYStart = 0.0;
                }
                tileRenderXDist = 1.0 - tileRenderXStart;
                tileRenderYDist = 1.0 - tileRenderYStart;
                tileRenderWorldWidth = tileRenderXDist / oneOverTileSizeWorld;
                tileRenderWorldHeight = tileRenderYDist / oneOverTileSizeWorld;
                if (renderPosX + tileRenderWorldWidth > 1.0) {
                    tileRenderWorldWidth = 1.0 - renderPosX;
                    tileRenderXDist = tileRenderWorldWidth * oneOverTileSizeWorld;
                }
                if (renderPosY + tileRenderWorldHeight > 1.0) {
                    tileRenderWorldHeight = 1.0 - renderPosY;
                    tileRenderYDist = tileRenderWorldHeight * oneOverTileSizeWorld;
                }

                tileAssetName = spec.assetKey + '-' + Rocket.assets.numberPad(tileTop * that.tilesX + tileLeft, 3);

                console.log(tileAssetName);
                context.drawImage(
                    Rocket.assets[tileAssetName].image,
                    tileRenderXStart * spec.tileSize, tileRenderYStart * spec.tileSize,
                    tileRenderXDist * spec.tileSize, tileRenderYDist * spec.tileSize,
                    Math.floor(renderPosX * world.size + world.left), Math.floor(renderPosY * world.size + world.top),
                    Math.ceil(tileRenderWorldWidth * world.size), Math.ceil(tileRenderWorldHeight * world.size));

                imageWorldXPos += tileRenderWorldWidth;
                renderPosX += tileRenderWorldWidth;

                //
                // Subtract off how much of the current tile we used, if there isn't any
                // X distance to render, then move down to the next row of tiles.
                worldXRemain -= tileRenderWorldWidth;
                if (worldXRemain <= RENDER_POS_EPISILON) {
                    imageWorldYPos += tileRenderWorldHeight;
                    renderPosY += tileRenderWorldHeight;
                    worldYRemain -= tileRenderWorldHeight;

                    imageWorldXPos = viewport.left;
                    renderPosX = 0.0;
                    worldXRemain = 1.0;
                }
            }
        };

        return that;
    };

    return {
        clear: clear,
        saveContext: saveContext,
        restoreContext: restoreContext,
        rotateCanvas: rotateCanvas,
        draw: draw,
        createImage: createImage,
        TiledImage: TiledImage,
        initGraphics: initGraphics
    };
}());
