"use strict";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const overlay = document.querySelector("#game-overlay");
const overlayKicker = document.querySelector("#overlay-kicker");
const overlayTitle = document.querySelector("#overlay-title");
const overlayMessage = document.querySelector("#overlay-message");
const startButton = document.querySelector("#start-button");

const game = {
  width: 0,
  height: 0,
  groundY: 0,
  state: "ready",
  score: 0,
  speed: 300,
  groundOffset: 0,
  spawnTimer: 0,
  lastTime: 0,
  obstacles: [],
  clouds: [],
  player: {
    x: 0,
    y: 0,
    width: 42,
    height: 42,
    velocityY: 0,
    jumping: false,
    runTime: 0,
  },
};

const gravity = 1900;
const jumpVelocity = -690;
const baseSpeed = 300;
const maxSpeed = 620;

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  game.width = bounds.width;
  game.height = bounds.height;
  game.groundY = game.height - 35;
  canvas.width = Math.round(game.width * pixelRatio);
  canvas.height = Math.round(game.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  game.player.x = Math.max(32, game.width * 0.12);
  if (!game.player.jumping) {
    game.player.y = game.groundY - game.player.height;
  }

  game.clouds = [
    { x: game.width * 0.22, y: game.height * 0.2, size: 1 },
    { x: game.width * 0.66, y: game.height * 0.32, size: 0.75 },
    { x: game.width * 0.9, y: game.height * 0.16, size: 0.55 },
  ];
}

function showOverlay({ kicker, title, message, buttonText }) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  startButton.textContent = buttonText;
  overlay.classList.remove("is-hidden");
}

function startGame() {
  game.state = "running";
  game.score = 0;
  game.speed = baseSpeed;
  game.spawnTimer = 1;
  game.groundOffset = 0;
  game.obstacles = [];
  game.player.y = game.groundY - game.player.height;
  game.player.velocityY = 0;
  game.player.jumping = false;
  scoreElement.textContent = "00000";
  overlay.classList.add("is-hidden");
}

function jump() {
  if (game.state === "ready" || game.state === "gameover") {
    startGame();
    return;
  }

  if (!game.player.jumping) {
    game.player.velocityY = jumpVelocity;
    game.player.jumping = true;
  }
}

function endGame() {
  game.state = "gameover";
  showOverlay({
    kicker: "冒險結束",
    title: "再試一次！",
    message: `這次跑了 ${Math.floor(game.score)} 分，休息一下再出發吧。`,
    buttonText: "重新開始",
  });
}

function spawnObstacle() {
  const height = 30 + Math.random() * 22;
  const width = 20 + Math.random() * 15;
  game.obstacles.push({
    x: game.width + 20,
    y: game.groundY - height,
    width,
    height,
  });
  game.spawnTimer = 0.9 + Math.random() * 0.75;
}

function update(deltaTime) {
  if (game.state !== "running") return;

  const delta = Math.min(deltaTime, 0.035);
  game.score += delta * 10;
  game.speed = Math.min(maxSpeed, baseSpeed + game.score * 1.35);
  scoreElement.textContent = String(Math.floor(game.score)).padStart(5, "0");
  game.groundOffset = (game.groundOffset + game.speed * delta) % 32;
  game.player.runTime += delta * (game.speed / baseSpeed);

  game.player.velocityY += gravity * delta;
  game.player.y += game.player.velocityY * delta;
  if (game.player.y >= game.groundY - game.player.height) {
    game.player.y = game.groundY - game.player.height;
    game.player.velocityY = 0;
    game.player.jumping = false;
  }

  game.spawnTimer -= delta;
  if (game.spawnTimer <= 0) spawnObstacle();

  for (const obstacle of game.obstacles) {
    obstacle.x -= game.speed * delta;
    const cat = getCatBounds();
    if (hasCollision(game.player, obstacle) || hasCollision(cat, obstacle)) {
      endGame();
      return;
    }
  }

  game.obstacles = game.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > -10,
  );
}

function hasCollision(player, obstacle) {
  const inset = 7;
  return (
    player.x + inset < obstacle.x + obstacle.width &&
    player.x + player.width - inset > obstacle.x &&
    player.y + inset < obstacle.y + obstacle.height &&
    player.y + player.height - 3 > obstacle.y
  );
}

function getCatBounds() {
  return {
    x: game.player.x + 38,
    y: game.player.y,
    width: game.player.width,
    height: game.player.height,
  };
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, game.height);
  sky.addColorStop(0, "#e8f4e3");
  sky.addColorStop(1, "#f7f8e9");
  context.fillStyle = sky;
  context.fillRect(0, 0, game.width, game.height);

  for (const cloud of game.clouds) {
    drawCloud(cloud.x, cloud.y, cloud.size);
  }

  context.fillStyle = "#d8e9d0";
  context.beginPath();
  context.ellipse(game.width * 0.76, game.groundY + 16, game.width * 0.45, 49, 0, Math.PI, 0);
  context.fill();

  context.fillStyle = "#b5cfaa";
  context.fillRect(0, game.groundY, game.width, game.height - game.groundY);
  context.fillStyle = "#789d70";
  context.fillRect(0, game.groundY, game.width, 3);

  context.strokeStyle = "#8eae83";
  context.lineWidth = 2;
  for (let x = -game.groundOffset; x < game.width; x += 32) {
    context.beginPath();
    context.moveTo(x, game.groundY + 12);
    context.lineTo(x + 11, game.groundY + 12);
    context.stroke();
  }
}

function drawCloud(x, y, scale) {
  context.fillStyle = "#ffffffa8";
  context.beginPath();
  context.arc(x, y, 13 * scale, 0, Math.PI * 2);
  context.arc(x + 15 * scale, y - 6 * scale, 17 * scale, 0, Math.PI * 2);
  context.arc(x + 33 * scale, y, 12 * scale, 0, Math.PI * 2);
  context.fill();
}

function drawPlayer() {
  const player = game.player;
  const running = game.state === "running" && !player.jumping;
  const legSwing = running ? Math.sin(player.runTime * 13) * 4 : 0;

  context.save();
  context.translate(player.x, player.y);

  context.fillStyle = "#46774f";
  context.beginPath();
  context.moveTo(11, 25);
  context.lineTo(0, 31);
  context.lineTo(12, 34);
  context.fill();

  context.fillStyle = "#5b9360";
  context.beginPath();
  context.roundRect(8, 14, 28, 24, 9);
  context.roundRect(22, 2, 20, 20, 8);
  context.fill();

  context.fillStyle = "#d6edb9";
  context.beginPath();
  context.ellipse(27, 29, 10, 6, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#24372c";
  context.beginPath();
  context.arc(36, 9, 2, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#355b3b";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(17, 35);
  context.lineTo(16 + legSwing, 41);
  context.moveTo(30, 35);
  context.lineTo(31 - legSwing, 41);
  context.stroke();
  context.restore();
}

function drawCat() {
  const player = game.player;
  const running = game.state === "running" && !player.jumping;
  const legSwing = running ? Math.sin(player.runTime * 13 + 1) * 3 : 0;
  const tailWag = running ? Math.sin(player.runTime * 9) * 5 : 0;

  context.save();
  context.translate(player.x + 38, player.y);

  context.strokeStyle = "#bf7547";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(12, 28);
  context.quadraticCurveTo(-1, 31 + tailWag, 5, 20 + tailWag);
  context.stroke();

  context.fillStyle = "#e99a62";
  context.beginPath();
  context.roundRect(7, 17, 29, 21, 10);
  context.fill();

  context.fillStyle = "#e99a62";
  context.beginPath();
  context.moveTo(22, 17);
  context.lineTo(24, 4);
  context.lineTo(33, 13);
  context.lineTo(38, 3);
  context.lineTo(42, 17);
  context.quadraticCurveTo(42, 28, 32, 29);
  context.quadraticCurveTo(21, 28, 22, 17);
  context.fill();

  context.fillStyle = "#f8c7a0";
  context.beginPath();
  context.moveTo(27, 14);
  context.lineTo(27, 9);
  context.lineTo(31, 14);
  context.moveTo(36, 13);
  context.lineTo(39, 9);
  context.lineTo(40, 15);
  context.fill();

  context.fillStyle = "#fff0d8";
  context.beginPath();
  context.ellipse(34, 22, 7, 4, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#24372c";
  context.beginPath();
  context.ellipse(35, 17, 1.5, 2.2, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#bd665d";
  context.beginPath();
  context.moveTo(40, 21);
  context.lineTo(43, 23);
  context.lineTo(40, 24);
  context.closePath();
  context.fill();

  context.strokeStyle = "#9b6548";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(34, 22);
  context.lineTo(27, 21);
  context.moveTo(34, 24);
  context.lineTo(28, 26);
  context.stroke();

  context.strokeStyle = "#9b6040";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(14, 35);
  context.lineTo(13 + legSwing, 40);
  context.moveTo(30, 35);
  context.lineTo(31 - legSwing, 40);
  context.stroke();

  context.strokeStyle = "#d27f4f";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(17, 20);
  context.lineTo(20, 23);
  context.moveTo(18, 17);
  context.lineTo(22, 19);
  context.stroke();

  context.strokeStyle = "#355b3b";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(30, 24);
  context.quadraticCurveTo(32, 27, 34, 24);
  context.stroke();
  context.restore();
}

function drawObstacle(obstacle) {
  context.fillStyle = "#d08454";
  context.beginPath();
  context.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 7);
  context.fill();

  context.fillStyle = "#a96543";
  context.fillRect(obstacle.x + 4, obstacle.y + obstacle.height * 0.35, 4, 4);
  context.fillRect(obstacle.x + obstacle.width - 8, obstacle.y + obstacle.height * 0.62, 4, 4);
}

function draw() {
  context.clearRect(0, 0, game.width, game.height);
  drawBackground();
  for (const obstacle of game.obstacles) drawObstacle(obstacle);
  drawPlayer();
  drawCat();
}

function frame(timestamp) {
  if (!game.lastTime) game.lastTime = timestamp;
  const deltaTime = (timestamp - game.lastTime) / 1000;
  game.lastTime = timestamp;

  update(deltaTime);
  draw();
  window.requestAnimationFrame(frame);
}

startButton.addEventListener("click", startGame);

canvas.addEventListener("pointerdown", () => {
  if (game.state === "running") jump();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
    jump();
  }
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
game.player.y = game.groundY - game.player.height;
showOverlay({
  kicker: "HTML5 CANVAS GAME",
  title: "出發去冒險！",
  message: "和貓咪一起跳過障礙，看看能跑多遠。",
  buttonText: "開始遊戲",
});
window.requestAnimationFrame(frame);
