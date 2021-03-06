var width = 600;
var height = 400;
var playerTexture = new ex.Texture("culling-sprite.png");
var speed = 100;
var engine = new ex.Engine(width, height, 'game');
engine.backgroundColor = ex.Color.Black;
var player = new ex.Actor(width / 2, height / 2, 30, 30, ex.Color.Red);
var playerSprite = playerTexture.asSprite();
player.addDrawing("default", playerSprite);
player.currentDrawing.anchor = new ex.Vector(0.5, 0.5); //TODO what if we don't do this?
//player.currentDrawing.scale = new ex.Point(0.5, 0.5);
engine.currentScene.add(player);
engine.input.keyboard.on('down', function (keyDown) {
    if (keyDown.key === ex.Input.Keys.D) {
        engine.isDebug = !engine.isDebug;
    }
    else if (keyDown.key === ex.Input.Keys.Up) {
        player.vel.y = -speed;
    }
    else if (keyDown.key === ex.Input.Keys.Down) {
        player.vel.y = speed;
    }
    else if (keyDown.key === ex.Input.Keys.Left) {
        player.vel.x = -speed;
    }
    else if (keyDown.key === ex.Input.Keys.Right) {
        player.vel.x = speed;
    }
});
engine.input.keyboard.on('up', function (keyUp) {
    if (keyUp.key === ex.Input.Keys.Up) {
        player.vel.y = 0;
    }
    else if (keyUp.key === ex.Input.Keys.Down) {
        player.vel.y = 0;
    }
    else if (keyUp.key === ex.Input.Keys.Left) {
        player.vel.x = 0;
    }
    else if (keyUp.key === ex.Input.Keys.Right) {
        player.vel.x = 0;
    }
});
engine.start(new ex.Loader([playerTexture])).then(function () {
});
