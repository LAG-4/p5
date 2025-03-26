// --- Game Configuration ---
let player;
let obstacles = [];
let score = 0;
let highScore = 0;
let gameSpeed = 5;
let baseGameSpeed = 5;
let speedIncreaseFactor = 0.0008;
let gravity;
let groundY;
let gameOver = false;
let gameStarted = false;

// --- Dynamic Environment ---
let timeOfDay = 0;
let cycleDuration = 1800; // Frames for a full day-night cycle (e.g., 30 seconds at 60fps)
let transitionAmount = 0; // Current transition progress (0=night, 1=day)
let currentSkyColor;
let currentGroundColor;
let currentBuildingColor;
let currentMonumentTint;
let currentWindowLightColor; // For lit windows

// --- Weather ---
let isRaining = false;
let rain = [];
let rainIntensity = 0; // 0 to 1
let maxRainDrops = 150;
let nextWeatherChange = 1000; // Frame count for next potential weather change
let weatherChangeCheckInterval = 500; // How often to check

// --- Background Elements ---
let bgBuildings = [];
let backgroundPeople = []; // Array for background people
let currentMonument = null;
let monumentScrollSpeedFactor = 0.05; // Relative to gameSpeed
const buildingScrollSpeedFactor = 0.15; // Relative to gameSpeed
const peopleScrollSpeedFactor = 0.12;   // Relative to gameSpeed

// --- Image Loading ---
let modiImage; // Variable to hold the loaded image
// *** IMPORTANT: PASTE A VALID IMAGE URL HERE ***
let modiImageURL = 'URL';


// --- Color Palettes ---

// Declare color variables globally, assign p5.Color objects in setup()
let taxBgColor;
let taxTextColor; // Shared text color
let taxTextOutlineColor; // Shared outline color
let rainColorP5; // p5 color object for rain
let politicsBgColor;
let workBgColor;
let noJobsBgColor;
let inflationBgColor;
let comedyBgColor;
let reservationsBgColor; // For "RESERVATIONS"

// Define color arrays (these are fine globally)
const daySky = [135, 206, 250]; // Light Sky Blue
const nightSky = [25, 25, 112];  // Midnight Blue
const dayGround = [34, 139, 34]; // Forest Green
const nightGround = [19, 77, 19];  // Darker Green
const dayBuilding = [100, 100, 100]; // Greyish silhouettes
const nightBuilding = [40, 40, 40];  // Darker silhouettes
const dayMonumentTint = [255, 255, 255, 255]; // No tint in day
const nightMonumentTint = [150, 150, 200, 230]; // Bluish tint at night
const rainColorArray = [173, 216, 230, 150]; // Light blue, semi-transparent

// Arrays for obstacle backgrounds
const politicsBgArray = [255, 100, 0]; // Strong orange
const workBgArray = [160, 40, 40];      // Dark red / maroon
const noJobsBgArray = [80, 100, 100];  // Dark cyan/grey
const inflationBgArray = [220, 50, 120]; // Magenta/Pink
const comedyBgArray = [0, 150, 150];     // Teal
const reservationsBgArray = [160, 160, 160]; // Grey

const windowLightOnDay = [255, 255, 0]; // Bright yellow
const windowLightOnNight = [255, 223, 100]; // Softer yellow for night
const windowLightOffFactor = 0.5; // How much darker 'off' windows are

const personColors = [ // Colors for background people
    [255, 0, 0], [0, 0, 255], [255, 255, 0], [0, 255, 0], [255, 0, 255], [200, 150, 255]
];


// --- Monument Definitions ---
const monuments = [
    { name: "Taj Mahal", drawFunc: drawPixelTajMahal, baseW: 250, baseH: 150, rarity: 1 },
    { name: "Red Fort", drawFunc: drawPixelRedFort, baseW: 300, baseH: 100, rarity: 1 },
    { name: "Charminar", drawFunc: drawPixelCharminar, baseW: 150, baseH: 180, rarity: 1 },
    { name: "Qutub Minar", drawFunc: drawPixelQutubMinar, baseW: 80, baseH: 250, rarity: 1 },
    { name: "Lotus Temple", drawFunc: drawPixelLotusTemple, baseW: 200, baseH: 120, rarity: 1 },
    { name: "India Gate", drawFunc: drawPixelIndiaGate, baseW: 180, baseH: 160, rarity: 1 }
];
let lastMonumentTime = 0;
let monumentCooldown = 500; // Min frames between monuments


// --- p5.js Preload Function ---
function preload() {
  // Load the image before the sketch starts
  try {
      if (modiImageURL && modiImageURL !== 'REPLACE_THIS_WITH_ACTUAL_IMAGE_URL.png') {
         modiImage = loadImage(modiImageURL,
            () => console.log("Modi image loaded successfully."),
            () => {
                console.error("Failed to load Modi image. Check URL/CORS:", modiImageURL);
                modiImage = null;
            }
         );
      } else {
          console.log("Modi image URL is placeholder or empty. Skipping load.");
          modiImage = null;
      }
  } catch (e) {
       console.error("Error initiating image load in preload:", e);
       modiImage = null;
  }
}


// --- p5.js Setup Function ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    noSmooth();

    // *** Assign p5.Color objects HERE inside setup() ***
    taxBgColor = color(75, 0, 170);      // Purple background (TAX)
    taxTextColor = color(255, 255, 220); // Light Yellow / Off-White (Shared for all text obstacles)
    taxTextOutlineColor = color(10, 10, 10); // Dark outline (Shared)
    rainColorP5 = color(rainColorArray); // Rain color

    // Assign other obstacle colors
    politicsBgColor = color(politicsBgArray);
    workBgColor = color(workBgArray);
    noJobsBgColor = color(noJobsBgArray);
    inflationBgColor = color(inflationBgArray);
    comedyBgColor = color(comedyBgArray);
    reservationsBgColor = color(reservationsBgArray); // Assign RESERVATIONS color
    // ---

    // Initialize dynamic environment colors
    currentSkyColor = color(daySky);
    currentGroundColor = color(dayGround);
    currentBuildingColor = color(dayBuilding);
    currentMonumentTint = color(dayMonumentTint);
    currentWindowLightColor = color(windowLightOnDay);

    groundY = height - height / 5; // Calculate ground position
    gravity = createVector(0, 0.7); // Set gravity vector

    player = new Player(); // Create the player
    generateInitialBackgroundAssets(); // Create initial background elements

    textAlign(CENTER, CENTER); // Set default text alignment
    textFont('monospace');     // Set default font
}


// --- p5.js Draw Function (Game Loop) ---
function draw() {
    if (gameStarted && !gameOver) { updateEnvironment(); } // Update time/weather if running

    background(currentSkyColor); // Draw sky

    // Draw Modi Image (if loaded)
    if (modiImage && modiImage.width > 0) {
        push();
        let imgHeight = height * 0.25; let imgWidth = modiImage.width * (imgHeight / modiImage.height);
        let imgY = height * 0.05;
        let scrollSpeed = 0.1; let totalScrollWidth = width + imgWidth * 1.5;
        let imgX = width - ((frameCount * scrollSpeed) % totalScrollWidth);
        let alphaValue = map(transitionAmount, 0, 1, 30, 150); // Fade at night
        tint(255, alphaValue); image(modiImage, imgX, imgY, imgWidth, imgHeight);
        pop();
    }

    fill(currentGroundColor); noStroke(); rect(0, groundY, width, height - groundY); // Draw ground

    drawBackgroundElements(); // Draw buildings, people, monuments

    if (rainIntensity > 0) { drawRain(); } // Draw rain if active

    // Handle Game States
    if (!gameStarted) { showStartScreen(); }
    else if (gameOver) { showGameOverScreen(); }
    else { // --- Gameplay ---
        player.applyForce(gravity); player.update(); player.edges(); player.show(); // Player logic
        handleObstacles(); // Obstacle logic
        score++; gameSpeed += speedIncreaseFactor; // Update score & speed
        displayHUD(); // Show UI
    }
}


// --- Input Handling ---
function handleInput() { // Called by key/mouse press
     if (!gameStarted) { gameStarted = true; resetGame(); }
     else if (gameOver) { /* Restart handled separately */ }
     else { player.jump(); }
}
function keyPressed() {
    if (gameOver && (key === 'r' || key === 'R')) { resetGame(); }
    else {
        if (!gameOver && gameStarted && (keyCode === UP_ARROW || key === ' ' || key === 'w' || key === 'W')) { player.jump(); }
        else if (!gameStarted) { handleInput(); }
    }
}
function mousePressed() { // Handles click & touch start
    if (gameOver) { resetGame(); } else { handleInput(); }
}


// --- Environment Update ---
function updateEnvironment() {
    // Day/Night Cycle Lerping
    let cycleProgress = (frameCount % cycleDuration) / cycleDuration;
    transitionAmount = (sin(cycleProgress * TWO_PI - HALF_PI) + 1) / 2; // Smooth 0->1->0

    currentSkyColor = lerpColor(color(nightSky), color(daySky), transitionAmount);
    currentGroundColor = lerpColor(color(nightGround), color(dayGround), transitionAmount);
    let baseBuilding = lerpColor(color(nightBuilding), color(dayBuilding), transitionAmount);
    currentBuildingColor = color(red(baseBuilding), green(baseBuilding), blue(baseBuilding), map(transitionAmount, 0, 1, 200, 180));
    currentMonumentTint = lerpColor(color(nightMonumentTint), color(dayMonumentTint), transitionAmount);
    currentWindowLightColor = lerpColor(color(windowLightOnNight), color(windowLightOnDay), transitionAmount);

    // Weather Change Logic & Rain Simulation
    if (frameCount > nextWeatherChange) {
        isRaining = !isRaining;
        nextWeatherChange = frameCount + weatherChangeCheckInterval + random(-weatherChangeCheckInterval/2, weatherChangeCheckInterval/2);
    }
    let targetIntensity = isRaining ? 1 : 0;
    rainIntensity = lerp(rainIntensity, targetIntensity, 0.02);
    let targetRainCount = floor(maxRainDrops * rainIntensity);
    while (rain.length < targetRainCount) { rain.push({ x: random(width), y: random(-height, 0), len: random(10, 20), speed: random(4, 10) * (1 + gameSpeed * 0.05) }); }
    if (rain.length > targetRainCount && targetRainCount > 0) { rain.splice(0, rain.length - targetRainCount); }
    else if (targetRainCount <= 0 && rain.length > 0) { rain = []; }
    for (let i = rain.length - 1; i >= 0; i--) {
        rain[i].y += rain[i].speed;
        if (rain[i].y > height) { rain[i].y = random(-100, 0); rain[i].x = random(width); }
    }
}


// --- Drawing Functions ---

function drawRain() {
    stroke(rainColorP5); strokeWeight(1.5);
    for (let drop of rain) { line(drop.x, drop.y, drop.x, drop.y + drop.len); }
    noStroke();
}

function drawBackgroundElements() {
    drawMonument(); // Draw monuments first (furthest back)
    // Buildings
    let buildingSpeed = gameSpeed * buildingScrollSpeedFactor;
    let windowOffColor = color(red(currentBuildingColor) * windowLightOffFactor, green(currentBuildingColor) * windowLightOffFactor, blue(currentBuildingColor) * windowLightOffFactor, alpha(currentBuildingColor));
    for (let i = bgBuildings.length - 1; i >= 0; i--) {
        let bldg = bgBuildings[i]; bldg.x -= buildingSpeed;
        fill(currentBuildingColor); noStroke(); rect(bldg.x, bldg.y, bldg.w, bldg.h); // Base
        for (let win of bldg.windows) { // Windows
            fill(win.isOn ? currentWindowLightColor : windowOffColor); rect(bldg.x + win.rx, bldg.y + win.ry, win.rw, win.rh);
        }
        if (bldg.x + bldg.w < 0) { // Wrap building
             let lastX = bgBuildings.reduce((max, b) => Math.max(max, b.x + b.w), 0);
             bldg.x = max(width, lastX) + random(5, 40);
             bldg.h = random(height * 0.1, height * 0.5); bldg.y = groundY - bldg.h;
             bldg.windows = generateWindowsForBuilding(bldg.w, bldg.h);
        }
    }
    // People
    let peopleSpeed = gameSpeed * peopleScrollSpeedFactor;
     for (let i = backgroundPeople.length - 1; i >= 0; i--) {
        let person = backgroundPeople[i]; person.x -= peopleSpeed; person.show();
        if (person.x + person.w < -20) { // Wrap person
            let lastX = backgroundPeople.reduce((max, p) => Math.max(max, p.x), 0);
             person.x = max(width, lastX) + random(width * 0.1, width * 0.5);
             person.color = color(random(personColors));
        }
    }
}


function generateInitialBackgroundAssets() {
    bgBuildings = []; backgroundPeople = []; let currentXBuilding = -100;
    while (currentXBuilding < width * 1.8) { // Generate buildings
        let bW = random(40, 150), bH = random(height*0.1, height*0.5), bY = groundY-bH;
        bgBuildings.push({ x: currentXBuilding, y: bY, w: bW, h: bH, windows: generateWindowsForBuilding(bW, bH) });
        currentXBuilding += bW + random(5, 40);
    }
    let numPpl = floor(width / 150); let currentXPerson = 50;
    for (let i=0; i<numPpl; i++) { // Generate people
        backgroundPeople.push(new BackgroundPerson(currentXPerson));
        currentXPerson += random(100, 350);
    }
}

function generateWindowsForBuilding(bW, bH) { // Helper for building windows
    let windows = [], minWS=4, wW=max(minWS, floor(bW/8)), wH=max(minWS, floor(wW*1.2));
    let gX=max(3, floor(wW*0.7)), gY=max(3, floor(wH*0.7));
    let nX=floor(bW/(wW+gX)), nY=floor(bH/(wH+gY)); if(nX<=0||nY<=0) return[];
    let gridW=nX*wW+max(0,nX-1)*gX, gridH=nY*wH+max(0,nY-1)*gY;
    let sX=(bW-gridW)/2, sY=(bH-gridH)/2;
    for(let r=0;r<nY;r++){for(let c=0;c<nX;c++){
        let wX=sX+c*(wW+gX), wY=sY+r*(wH+gY), isOn=random()<0.35;
        windows.push({rx:wX, ry:wY, rw:wW, rh:wH, isOn:isOn});
    }} return windows;
}


// --- Background Person Class ---
class BackgroundPerson { // Simple pixel people for background
    constructor(startX) { this.w = random(6, 10); this.h = this.w*random(1.6, 2.2); this.x = startX; this.y = groundY-this.h; this.color = color(random(personColors)); }
    show() { push(); translate(this.x, this.y); noStroke(); fill(this.color); let headH=this.h*0.3, bodyH=this.h*0.7, headW=this.w*0.7, bodyW=this.w; rect(0, headH, bodyW, bodyH); rect((bodyW-headW)/2, 0, headW, headH); pop(); }
}


// --- Monument Drawing ---
function drawMonument() { // Draws and scrolls the current monument
    if (currentMonument) {
        currentMonument.x -= gameSpeed * monumentScrollSpeedFactor;
        push(); tint(currentMonumentTint);
        currentMonument.details.drawFunc(currentMonument.x, currentMonument.y, currentMonument.w, currentMonument.h);
        pop();
        if (currentMonument.x + currentMonument.w < 0) { currentMonument = null; lastMonumentTime = frameCount; }
    } else if (gameStarted && frameCount > lastMonumentTime + monumentCooldown) { // Check cooldown to spawn new one
         if (random(1) < 0.005) { currentMonument = createMonumentInstance(); if (currentMonument) { lastMonumentTime = frameCount; } }
    }
}
function createMonumentInstance() { // Selects and scales a monument to spawn
    if (monuments.length === 0) return null; let sel = random(monuments);
    let scF = (height * 0.45) / sel.baseH, mH = sel.baseH * scF, mW = sel.baseW * scF;
    let mY = groundY - mH, mX = width + random(100, 300);
    return { details: sel, x: mX, y: mY, w: mW, h: mH };
}
// --- Pixel Art Monument Drawing Functions --- (Unchanged - Abstract representations)
function drawPixelTajMahal(x, y, w, h) { push(); translate(x, y); noStroke(); fill(245, 245, 245); rect(w*0.2,h*0.3,w*0.6,h*0.7); rect(w*0.3,h*0.1,w*0.4,h*0.3); rect(w*0.4,h*0.05,w*0.2,h*0.1); fill(255,215,0); rect(w*0.48,h*0.0,w*0.04,h*0.08); fill(230,230,230); rect(w*0.05,h*0.2,w*0.1,h*0.8); rect(w*0.85,h*0.2,w*0.1,h*0.8); fill(200); rect(w*0.05,h*0.15,w*0.1,h*0.05); rect(w*0.85,h*0.15,w*0.1,h*0.05); rect(0,h*0.95,w,h*0.05); pop(); }
function drawPixelRedFort(x, y, w, h) { push(); translate(x, y); noStroke(); fill(188,70,70); rect(0,h*0.2,w,h*0.8); let bw=w/10; for(let i=0; i<10; i+=2){rect(i*bw,h*0.05,bw,h*0.15);} fill(150,50,50); rect(w*0.4,h*0.3,w*0.2,h*0.7); fill(100,30,30); rect(w*0.45,h*0.5,w*0.1,h*0.4); pop(); }
function drawPixelCharminar(x, y, w, h) { push(); translate(x,y); noStroke(); fill(230,220,200); rect(w*0.1,h*0.4,w*0.8,h*0.6); let mw=w*0.2, mh=h*0.9; fill(210,200,180); rect(0,h*0.1,mw,mh); rect(w-mw,h*0.1,mw,mh); fill(190,180,160); rect(w*0.15,h*0.05,mw*0.8,mh*0.9); rect(w*0.85-mw*0.8,h*0.05,mw*0.8,mh*0.9); fill(230,220,200); rect(w*0.1,h*0.3,w*0.8,h*0.1); fill(180,170,150); rect(w*0.3,h*0.2,w*0.4,h*0.1); pop(); }
function drawPixelQutubMinar(x, y, w, h) { push(); translate(x,y); noStroke(); let s=5, cY=h, cW=w, sH=h/s; for(let i=0;i<s;i++){fill(i%2===0?color(210,180,140):color(195,165,125)); rect((w-cW)/2,cY-sH,cW,sH); cY-=sH; cW*=0.9;} fill(180,150,110); rect((w-cW)/2*0.8,cY-sH*0.1,cW*1.2,sH*0.2); pop(); }
function drawPixelLotusTemple(x, y, w, h) { push(); translate(x,y); noStroke(); fill(255); rect(w*0.1,h*0.5,w*0.8,h*0.5); rect(w*0.2,h*0.2,w*0.6,h*0.6); rect(w*0.1,h*0.3,w*0.3,h*0.5); rect(w*0.6,h*0.3,w*0.3,h*0.5); rect(w*0.3,h*0.1,w*0.4,h*0.4); rect(w*0.4,h*0.0,w*0.2,h*0.2); fill(220); rect(w*0.2,h*0.48,w*0.6,h*0.04); rect(w*0.3,h*0.18,w*0.4,h*0.04); pop(); }
function drawPixelIndiaGate(x, y, w, h) { push(); translate(x,y); noStroke(); fill(245,222,179); let pw=w*0.25, ath=h*0.3, ph=h-ath; rect(0,ath,pw,ph); rect(w-pw,ath,pw,ph); rect(0,0,w,ath); fill(139,69,19,150); rect(pw,ath*0.5,w-2*pw,h-ath*0.5); fill(210,180,140); rect(w*0.1,0,w*0.8,ath*0.3); pop(); }


// --- Player Class --- (Formal Attire Version)
class Player {
  constructor() {
    this.w = 40; this.h = 60; this.x = this.w * 2; this.y = groundY - this.h;
    this.velocity = createVector(0, 0); this.acceleration = createVector(0, 0);
    this.jumpForce = -15; this.isOnGround = true;
    this.skinColor = color(140, 82, 45); this.hairColor = color(15, 15, 15);
    this.shirtColor = color(245, 245, 245); this.pantsColor = color(40, 40, 50);
    this.tieColor = color(180, 0, 0); this.shoeColor = color(25, 25, 25); this.eyeColor = color(255);
  }
  applyForce(force) { this.acceleration.add(force); }
  update() {
    this.velocity.add(this.acceleration); this.y += this.velocity.y; this.acceleration.mult(0);
    if (this.y + this.h >= groundY) { this.y = groundY - this.h; this.velocity.y = 0; this.isOnGround = true; } else { this.isOnGround = false; }
  }
  jump() { if (this.isOnGround) { this.velocity.y = this.jumpForce; this.isOnGround = false; } }
  edges() {
    if (this.y + this.h > groundY) { this.y = groundY - this.h; this.velocity.y = 0; this.isOnGround = true; }
    if (this.y < 0) { this.y = 0; this.velocity.y = max(0, this.velocity.y); }
  }
  hits(obstacle) { let pR=this.x+this.w, pB=this.y+this.h, oR=obstacle.x+obstacle.w, oB=obstacle.y+obstacle.h; return (pR>obstacle.x && this.x<oR && pB>obstacle.y && this.y<oB); }
  show() {
    push(); translate(this.x, this.y); noStroke();
    let hh=this.h*0.3, hw=this.w*0.6, hx=this.w*0.1, nh=this.h*0.1, nw=hw*0.3, nx=hx+hw*0.4, ny=hh;
    let th=this.h*0.4, ty=ny+nh, tw=this.w*0.9, tx=(this.w-tw)/2, ph=this.h*0.3, py=ty+th, pw=tw*0.7, px=(this.w-pw)/2;
    let sw=this.w*0.2, sh=th*0.5, sx=tx+tw*0.7, sy=ty+th*0.1, hndW=sw*0.8, hndH=th*0.2, hndX=sx+(sw-hndW)/2, hndY=sy+sh;
    let tkw=tw*0.15, tkh=th*0.15, tkx=tx+(tw-tkw)/2, tky=ty, tbw=tkw*0.8, tbh=th*0.6, tbx=tkx+(tkw-tbw)/2, tby=tky+tkh;
    let shoeH=ph*0.25, shoeW=pw*0.7, shoeX=px+pw*0.1, shoeY=py+ph-shoeH;
    fill(this.pantsColor); rect(px,py,pw,ph); fill(this.shoeColor); rect(shoeX,shoeY,shoeW,shoeH); fill(this.shirtColor); rect(tx,ty,tw,th);
    fill(this.tieColor); rect(tkx,tky,tkw,tkh); rect(tbx,tby,tbw,tbh); fill(this.shirtColor); rect(sx,sy,sw,sh); fill(180); rect(sx,sy+sh-2,sw,2);
    fill(this.skinColor); rect(hndX,hndY,hndW,hndH); fill(this.skinColor); rect(nx,ny,nw,nh); fill(this.skinColor); rect(hx,0,hw,hh);
    fill(this.hairColor); rect(hx-hw*0.05,0,hw*0.9,hh*0.6); rect(hx+hw*0.5,-hh*0.15,hw*0.4,hh*0.4); rect(hx+hw*0.2,hh*0.6,hw*0.5,hh*0.2);
    fill(this.eyeColor); rect(hx+hw*0.65,hh*0.25,hw*0.1,hh*0.15); pop();
  }
}


// --- Obstacle Class --- (Handles 'normal' and VERTICAL 'text' types - Added Reservations)
class Obstacle {
  constructor() {
    this.minH = 30; this.maxH = 80; this.minW = 20; this.maxW = 50;
    let typeChance = random(1);
    let textObstacleProbability = 0.65; // Probability of getting a text obstacle

    if (typeChance < textObstacleProbability) {
        this.type = 'text';
        this.w = 40; this.h = 90; // Tall, narrow dimensions for all text obstacles

        // Determine which text obstacle (0 to 6, now 7 types total)
        let textType = floor(random(7));

        switch (textType) { // Set text content (with line breaks) and color
            case 0: this.text = "NO\nJOBS"; this.color = noJobsBgColor; break;
            case 1: this.text = "70hr\nWORK"; this.color = workBgColor; break;
            case 2: this.text = "POLITICS"; this.color = politicsBgColor; break;
            case 3: this.text = "INFLATION"; this.color = inflationBgColor; break;
            case 4: this.text = "COMEDY"; this.color = comedyBgColor; break;
            case 5: this.text = "TAX"; this.color = taxBgColor; break;
            case 6: this.text = "RESERVATION"; this.color = reservationsBgColor; break; // Added RESERVATIONS
            default: this.text = "TAX"; this.color = taxBgColor; break; // Fallback
        }
    } else { // Normal obstacle
        this.type = 'normal'; this.text = null;
        this.h = random(this.minH, this.maxH); this.w = random(this.minW, this.maxW);
        this.color = color(139, 69, 19, 220); // Brown color object
    }
    this.x = width; this.y = groundY - this.h; // Initial position off-screen right
  }

  update() { this.x -= gameSpeed; } // Move obstacle left

  show() { // Call appropriate drawing function based on type
    if (this.type === 'text') { this.drawTextObstacle(); }
    else { fill(this.color); noStroke(); rect(this.x, this.y, this.w, this.h); }
  }

  drawTextObstacle() { /* Draws vertical text dynamically sized within the block */
    push(); // Isolate styles and transformations
    fill(this.color); noStroke(); rect(this.x, this.y, this.w, this.h); // Draw background rect

    textFont('monospace'); textAlign(CENTER, CENTER); // Set text properties

    // --- Dynamic Text Size Calculation for Vertical Fit ---
    let availW = this.h * 0.8; // Available width after rotation (based on original height)
    let availH = this.w * 0.8; // Available height after rotation (based on original width)
    let longestLine = this.text.split('\n').reduce((a, b) => a.length > b.length ? a : b, ""); // Find longest line
    let tsW = availW / (longestLine.length * 0.6); // Est. size based on horizontal fit
    let numLines = (this.text.match(/\n/g) || []).length + 1; // Count lines
    let tsH = availH / (numLines * 1.2); // Est. size based on vertical fit
    let targetTs = constrain(min(tsW, tsH), 8, 24); // Use smaller size, limit range
    textSize(targetTs);
    // --- End Text Size Calculation ---

    // Draw Text with outline
    fill(taxTextColor); stroke(taxTextOutlineColor); strokeWeight(1.5);
    translate(this.x + this.w / 2, this.y + this.h / 2); // Move origin to center of obstacle
    rotate(HALF_PI); // Rotate 90 degrees
    text(this.text, 0, 0); // Draw text at the (now rotated) origin

    pop(); // Restore original state
  }

  isOffscreen() { return this.x + this.w < 0; } // Check if completely off-screen left
}


// --- Helper Functions ---

function handleObstacles() { /* Spawns, updates, draws, checks collision */
  let spawnRate = map(gameSpeed, baseGameSpeed, baseGameSpeed * 3, 100, 50, true);
  if (frameCount % int(random(spawnRate * 0.8, spawnRate * 1.2)) === 0) {
     if (obstacles.length === 0 || width - obstacles[obstacles.length - 1].x > width / 3.5) {
          obstacles.push(new Obstacle());
     }
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update(); obstacles[i].show();
    if (player.hits(obstacles[i])) { triggerGameOver(); break; }
    if (obstacles[i].isOffscreen()) { obstacles.splice(i, 1); }
  }
}
function displayHUD() { /* Shows score and instructions */
  fill(255); stroke(0); strokeWeight(2); textSize(24); textAlign(LEFT, TOP);
  text(`SCORE: ${score}`, 20, 20); text(`HI: ${highScore}`, 20, 50);
  textSize(16); textAlign(CENTER, BOTTOM); fill(255, 255, 255, 180); noStroke();
  let jumpInstr = isTouchDevice() ? "TAP to JUMP" : "SPACE / UP / W / CLICK to JUMP";
  text(jumpInstr, width / 2, height - 10);
}
function showStartScreen() { /* Initial screen */
  fill(0,0,0,150); rect(0,0,width,height); fill(255); stroke(0); strokeWeight(3);
  textSize(48); textAlign(CENTER, CENTER); text("Avg INDIAN Experience", width/2, height/2 - 50);
  textSize(24); noStroke(); let startInstr = isTouchDevice() ? "TAP screen to START" : "Press ANY KEY or CLICK to START";
  text(startInstr, width/2, height/2 + 20); if(!isTouchDevice()){ text("(Jump: SPACE / UP / W / CLICK)", width/2, height/2 + 60); }
}
function showGameOverScreen() { /* Game over display */
  fill(0,0,0,180); rect(0,0,width,height); fill(255,0,0); stroke(0); strokeWeight(4);
  textSize(64); textAlign(CENTER, CENTER); text("GAME OVER", width/2, height/2 - 60);
  fill(255); noStroke(); textSize(32); text(`Score: ${score}`, width/2, height/2);
  if(score>highScore){ text(`New High Score!`, width/2, height/2 + 40); } else { text(`High Score: ${highScore}`, width/2, height/2 + 40); }
  textSize(24); let restartInstr = isTouchDevice() ? "TAP screen to RESTART" : "Press 'R' or CLICK to RESTART";
  text(restartInstr, width/2, height/2 + 100);
}
function triggerGameOver() { /* Ends the game */
  gameOver = true; if (score > highScore) { highScore = score; }
}
function resetGame() { /* Resets state for new game */
  score = 0; gameSpeed = baseGameSpeed; obstacles = []; player = new Player();
  gameOver = false; gameStarted = true; generateInitialBackgroundAssets();
  currentMonument = null; lastMonumentTime = frameCount + monumentCooldown;
  timeOfDay = 0; isRaining = false; rainIntensity = 0; rain = [];
  nextWeatherChange = frameCount + weatherChangeCheckInterval * 2;
  updateEnvironment();
}
function isTouchDevice() { /* Simple touch detection */
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}
function windowResized() { /* Handles browser resize for responsiveness */
    resizeCanvas(windowWidth, windowHeight);
    groundY = height - height / 5;
    if(player) { player.y = min(player.y, groundY - player.h); }
    generateInitialBackgroundAssets(); // Regenerate background
    currentMonument = null; lastMonumentTime = frameCount;
}