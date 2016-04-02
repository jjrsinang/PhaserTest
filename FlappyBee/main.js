var game = new Phaser.Game(400, 490, Phaser.AUTO, 'gameDiv');
var w = 400, h = 490;

var mainState = {

    preload: function() {
        game.load.image("background", "assets/background.png");
        game.stage.backgroundColor = '#71c5cf';
        game.load.spritesheet('bee', 'assets/sprites/bee50x50.png', 50, 50, 4);
        game.load.image('dying', 'assets/dying.png');
        game.load.image('poison', 'assets/poison.png'); 

        // Load the jump sound
        game.load.audio('jump', 'assets/jump.wav');     
    },

    create: function() { 
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        game.add.tileSprite(0, 0, w, h, 'background');
        
        this.pipes = game.add.group();
        this.pipes.enableBody = true;
        this.pipes.createMultiple(20, 'poison');  
        this.timer = this.game.time.events.loop(1500, this.addRowOfPipes, this);           

        this.bird = this.game.add.sprite(100, 245, 'bee');
        var flying = this.bird.animations.add('flying');
        this.bird.animations.play('flying', 30, true);
        
        game.physics.arcade.enable(this.bird);
        this.bird.body.gravity.y = 1000; 

        // New anchor position
        this.bird.anchor.setTo(-0.2, 0.5); 
 
        var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(this.jump, this);

        this.score = 0;
        this.labelScore = this.game.add.text(20, 20, "0", { font: "30px Arial", fill: "#ffffff" });  

        // Add the jump sound
        this.jumpSound = this.game.add.audio('jump');
        
        // Create a label to use as a button
        this.pause_label = game.add.text(w - 100, 20, 'Pause', { font: '24px Arial', fill: '#fff' });
        this.pause_label.inputEnabled = true;
        this.pause_label.events.onInputUp.add(this.pause);
        
        // Add a input listener that can help us return from being paused
        game.input.onDown.add(this.unpause, this);
        
        this.choiseLabel = null;
    },

    update: function() {
        if (this.bird.inWorld == false) {
            this.pause();
            //this.restartGame();
        }
        if (this.deadBird && this.deadBird.inWorld == false) {
            this.pause();
            //this.restartGame();
        }
        
        if (this.bird.alive == false) {
            this.bird.visible = false;
            if (this.deadBird) this.deadBird.visible = true;
        } else {
            this.bird.visible = true;
            if (this.deadBird) this.deadBird.visible = false;
        }

        game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);

        // Slowly rotate the bird downward, up to a certain point.
        if (this.bird.angle < 20)
            this.bird.angle += 1;
    },

    jump: function() {
        // If the bird is dead, he can't jump
        if (this.bird.alive == false)
            return; 

        this.bird.body.velocity.y = -350;

        // Jump animation
        game.add.tween(this.bird).to({angle: -20}, 100).start();

        // Play sound
        this.jumpSound.play();
    },

    hitPipe: function() {
        // If the bird has already hit a pipe, we have nothing to do
        if (this.bird.alive == false)
            return;
            
        // Set the alive property of the bird to false
        this.bird.alive = false;
        this.bird.animations.stop();
        this.deadBird = this.game.add.sprite(100, 245, 'dying');
        this.deadBird.angle = this.bird.angle;
        this.deadBird.position = this.bird.position;
        game.physics.arcade.enable(this.deadBird);
        this.deadBird.body.gravity.y = 1000; 
        this.deadBird.anchor.setTo(-0.2, 0.5);

        // Prevent new pipes from appearing
        this.game.time.events.remove(this.timer);
    
        // Go through all the pipes, and stop their movement
        this.pipes.forEachAlive(function(p){
            p.body.velocity.x = 0;
        }, this);
    },

    restartGame: function() {
        game.state.start('main');
    },

    addOnePipe: function(x, y) {
        var pipe = this.pipes.getFirstDead();

        pipe.reset(x, y);
        pipe.body.velocity.x = -200;  
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },

    addRowOfPipes: function() {
        var hole = Math.floor(Math.random()*5)+1;
        
        for (var i = 0; i < 8; i++)
            if (i != hole && i != hole +1) 
                this.addOnePipe(400, i*60+10);   
    
        this.score += 1;
        this.labelScore.text = this.score;  
    },
    
    pause: function(){
        // When the pause button is pressed, we pause the game
        game.paused = true;

        // And a label to illustrate which menu item was chosen. (This is not necessary)
        choiseLabel = game.add.text(w/2, h-150, 'Click to continue', { font: '30px Arial', fill: '#fff' });
        choiseLabel.anchor.setTo(0.5, 0.5);
    },
    
    unpause: function(event) {
        // Only act if paused
        if(game.paused){
            if (choiseLabel) {
                choiseLabel.destroy();
            }
            if (this.bird.inWorld == false) {
                this.restartGame();
            }
            if (this.deadBird && this.deadBird.inWorld == false) {
                this.deadBird = null;
                this.restartGame();
            }
            // Unpause the game
            game.paused = false;
        }
    }
};

game.state.add('main', mainState);  
game.state.start('main'); 