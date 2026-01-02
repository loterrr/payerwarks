const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const TEXT = "tanginamo reymark";
const FONT_SIZE = 30;
const MAX_CHARS_PER_LINE = 15;

ctx.font = `${FONT_SIZE}px Arial`;

const fireworks = [];
const letters = [];
const particles = [];
let floatingTriggered = false;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

// fireworks
function Firework(x, targetY, char) {
  this.x = x;
  this.y = canvas.height;
  this.targetY = targetY;
  this.char = char;
  this.speed = random(5, 8);
  this.exploded = false;
  this.color = `hsl(${(x / canvas.width) * 360},80%,60%)`;
}

Firework.prototype.update = function () {
  if (!this.exploded) {
    this.y -= this.speed;
    if (this.y <= this.targetY) {
      this.exploded = true;
      explode(this.x, this.y, this.color);
      letters.push(new Letter(this.char, this.x, this.y, this.color));
    }
  }
};

Firework.prototype.draw = function () {
  if (!this.exploded) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

// text
function Letter(char, x, y, color) {
  this.char = char;
  this.x = x;
  this.y = y;
  this.baseX = x;
  this.color = color;
  this.floating = false;
  this.drift = Math.random() * 1000;
}

Letter.prototype.update = function (time) {
  if (this.floating) {
    this.y -= random(0.4, 0.8);
    this.x = this.baseX + Math.sin((time + this.drift) * 0.002) * 0.6;
  }
};

Letter.prototype.draw = function () {
  ctx.fillStyle = this.color;
  ctx.fillText(this.char, this.x, this.y);

  if (this.floating) {
    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(this.x + 10, this.y - FONT_SIZE);
    ctx.lineTo(this.x + 10, this.y - FONT_SIZE - 30);
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(
      this.x + 10,
      this.y - FONT_SIZE - 45,
      12,
      16,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
};

// particles
function Particle(x, y, color) {
  this.x = x;
  this.y = y;
  this.vx = random(-3, 3);
  this.vy = random(-3, 3);
  this.life = random(30, 50);
  this.color = color;
}

Particle.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  this.life--;
};

Particle.prototype.draw = function () {
  ctx.globalAlpha = this.life / 50;
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
};

function explode(x, y, color) {
  const count = Math.floor(random(20, 40));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}

// lines
function createLines(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let w of words) {
    if ((currentLine + " " + w).trim().length <= maxChars) {
      currentLine += (currentLine ? " " : "") + w;
    } else {
      lines.push(currentLine);
      currentLine = w;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

const lines = createLines(TEXT, MAX_CHARS_PER_LINE);

const lineQueues = [];
lines.forEach((line, lineIndex) => {
  let totalWidth = 0;
  for (let c of line) totalWidth += ctx.measureText(c).width;

  let startX = canvas.width / 2 - totalWidth / 2;
  const y = canvas.height / 2 + (lineIndex - lines.length / 2) * (FONT_SIZE + 20);

  const queue = [];
  for (let c of line) {
    if (c !== " ") queue.push({ char: c, x: startX, y });
    startX += ctx.measureText(c).width;
  }

  shuffle(queue);
  lineQueues.push(queue);
});

// launch fireworks
lineQueues.forEach(queue => {
  function launch() {
    if (queue.length === 0) return;

    const groupSize = Math.floor(random(1, 3));
    for (let i = 0; i < groupSize && queue.length; i++) {
      const fw = queue.pop();
      fireworks.push(new Firework(fw.x, fw.y, fw.char));
    }

    const delay = Math.random() < 0.5 ? 0 : random(300, 900);
    setTimeout(launch, delay);
  }
  launch();
});

// float
function startFloating() {
  const pool = shuffle([...letters]);

  function floatBatch() {
    if (pool.length === 0) return;
    const batchSize = Math.floor(random(1, 3));
    for (let i = 0; i < batchSize && pool.length; i++) {
      pool.pop().floating = true;
    }
    const delay = Math.random() < 0.5 ? 0 : random(500, 1200);
    setTimeout(floatBatch, delay);
  }

  floatBatch();
}

// animation
function animate(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  fireworks.forEach(f => { f.update(); f.draw(); });
  letters.forEach(l => { l.update(time); l.draw(); });

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  if (!floatingTriggered && letters.length > 0) {
    floatingTriggered = true;
    setTimeout(startFloating, 3500);
  }

  requestAnimationFrame(animate);
}

animate();
