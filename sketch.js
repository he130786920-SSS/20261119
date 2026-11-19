let bgImage;
let heroSheet;
let heroClean;
let player1;

let bgScrollX = 0; 
let moveSpeed = 8;

let lightningActive = false;
let lightningTimer = 0;
let lightningWorldX = 0;
let noiseGen, env;
let audioUnlocked = false;

function preload() {
  bgImage = loadImage('bg/bg1.png');
  heroSheet = loadImage('1/hero.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  /* 建立小尺寸緩衝圖層去背，秒開不卡死 */
  heroClean = createFastTransparentSprite(heroSheet);

  player1 = new Character(heroClean);
  player1.setup(width / 2, height * 0.88);

  noiseGen = new p5.Noise('brown');
  env = new p5.Envelope();
  env.setADSR(0.02, 0.2, 0.3, 0.8);
  env.setRange(0.8, 0);
}

function createFastTransparentSprite(img) {
  let targetH = 180;
  let targetW = floor(targetH * (img.width / img.height));
  let pg = createGraphics(targetW, targetH);
  pg.image(img, 0, 0, targetW, targetH);
  pg.loadPixels();
  for (let i = 0; i < pg.pixels.length; i += 4) {
    if (pg.pixels[i] > 230 && pg.pixels[i + 1] > 230 && pg.pixels[i + 2] > 230) {
      pg.pixels[i + 3] = 0;
    }
  }
  pg.updatePixels();
  return pg;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  player1.y = height * 0.88;
}

function mousePressed() {
  unlockAudio();
}

function keyPressed() {
  unlockAudio();
}

function unlockAudio() {
  if (!audioUnlocked) {
    userStartAudio();
    noiseGen.start();
    noiseGen.amp(0);
    audioUnlocked = true;
  }
}

function draw() {
  background(30, 15, 45);

  handleMovementAndScroll();

  /* 左、中、右三張鏡像無縫拼接背景 */
  image(bgImage, bgScrollX, 0, width, height);

  push();
  translate(bgScrollX, 0);
  scale(-1, 1);
  image(bgImage, 0, 0, width, height);
  pop();

  push();
  translate(bgScrollX + width * 2, 0);
  scale(-1, 1);
  image(bgImage, 0, 0, width, height);
  pop();

  checkLightningTrigger();

  if (lightningActive) {
    drawLightningEffect();
  }

  player1.display();
}

function handleMovementAndScroll() {
  let isMoving = false;

  if (keyIsDown(RIGHT_ARROW)) {
    isMoving = true;
    player1.direction = 1;
    player1.state = 'run';

    if (player1.x < width / 2) {
      player1.x += moveSpeed;
    } else if (bgScrollX > -width) {
      bgScrollX -= moveSpeed;
    } else if (player1.x < width - 70) {
      player1.x += moveSpeed;
    }
  } else if (keyIsDown(LEFT_ARROW)) {
    isMoving = true;
    player1.direction = -1;
    player1.state = 'run';

    if (player1.x > width / 2) {
      player1.x -= moveSpeed;
    } else if (bgScrollX < width) {
      bgScrollX += moveSpeed;
    } else if (player1.x > 70) {
      player1.x -= moveSpeed;
    }
  }

  if (!isMoving) {
    player1.state = 'stop';
  }
}

function checkLightningTrigger() {
  let worldX = player1.x - bgScrollX;
  let triggerZoneStart = width * 1.25; 

  if (worldX >= triggerZoneStart) {
    if (!lightningActive) {
      lightningActive = true;
      lightningTimer = 0;
      lightningWorldX = worldX + 130;
      if (lightningWorldX > width * 1.9) lightningWorldX = width * 1.75;
      
      if (audioUnlocked) {
        env.play(noiseGen);
      }
    }
  } else {
    lightningActive = false;
    lightningTimer = 0;
  }
}

function drawLightningEffect() {
  lightningTimer++;
  let screenX = lightningWorldX + bgScrollX;

  push();
  if (lightningTimer <= 35) {
    stroke(0, 255, 255);
    strokeWeight(8);
    noFill();
    beginShape();
    let curX = screenX;
    for (let y = 0; y <= height * 0.88; y += 45) {
      vertex(curX, y);
      curX += random(-25, 25);
    }
    endShape();

    stroke(255);
    strokeWeight(3);
    line(screenX, 0, screenX, height * 0.88);
  }

  if (lightningTimer > 25) {
    let blastProgress = (lightningTimer - 25) % 40;
    noStroke();
    fill(0, 220, 255, 200 - blastProgress * 4);
    ellipse(screenX, height * 0.88, blastProgress * 6, blastProgress * 2.5);
    
    fill(255, 255, 255, 220 - blastProgress * 5);
    ellipse(screenX, height * 0.88, blastProgress * 3, blastProgress * 1.2);
  }
  pop();
}

class Character {
  constructor(spriteImg) {
    this.img = spriteImg;
    this.state = 'stop';
    this.x = 0;
    this.y = 0;
    this.direction = 1;
  }

  setup(startX, startY) {
    this.x = startX;
    this.y = startY;
  }

  display() {
    if (this.img && this.img.width > 0) {
      let totalFrames = 6;
      let frameWidth = this.img.width / totalFrames; 
      let frameHeight = this.img.height;
      
      let currentFrame = 0;
      if (this.state === 'run') {
        currentFrame = 1 + (floor(frameCount / 5) % (totalFrames - 1));
      }
      
      let drawH = height / 3;
      let drawW = drawH * (frameWidth / frameHeight);

      push();
      translate(this.x, this.y);
      scale(this.direction, 1);
      image(this.img, -drawW / 2, -drawH, drawW, drawH, 
            currentFrame * frameWidth, 0, frameWidth, frameHeight);
      pop();
    }
  }
}