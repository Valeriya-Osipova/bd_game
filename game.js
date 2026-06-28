const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const bucketStatus = document.getElementById('bucketStatus');
const barrelStatus = document.getElementById('barrelStatus');
const statusText = document.getElementById('statusText');
const timerText = document.getElementById('timerText');
const smokeButton = document.getElementById('smokeButton');
const startButton = document.getElementById('startButton');
const introOverlay = document.getElementById('introOverlay');

const keys = {
  left: false,
  right: false,
};

const assets = {
  bg: new Image(),
  nunFront: new Image(),
  nunFrontSmoke: new Image(),
  nunLeft: new Image(),
  nunRight: new Image(),
  nunLeftWalk1: new Image(),
  nunLeftWalk2: new Image(),
  nunRightWalk1: new Image(),
  nunRightWalk2: new Image(),
  nunAngry: new Image(),
  bucket: new Image(),
  barrel: new Image(),
  barrelFallen: new Image(),
  wellFrames: [new Image(), new Image(), new Image(), new Image()],
};

const pourAudio = new Audio('assets/sounds/zvuk-stakan-vody.mp3');
pourAudio.volume = 0.55;

const wellAudio = new Audio('assets/sounds/drawing-water-in-a-well .mp3');
wellAudio.volume = 0.55;

const crashAudio = new Audio('assets/sounds/pogrom-in-a-wooden-warehouse.mp3');
crashAudio.volume = 0.7;

const angryVoiceAudio = new Audio('assets/sounds/angry_nan_voice.mp3');
angryVoiceAudio.volume = 0.75;

const smokeAudio = new Audio('assets/sounds/smoking.mp3');
smokeAudio.volume = 0.7;

const bannerMessages = [
  'Матвей, держись — ещё ведро и бочка полна.',
  'Знаю, как неприятно таскать воду, но ты справишься.',
  'Давай, Матвей, ещё немного — скоро появится старшая.',
  'Тяжело, да? Это делает твою миссию важнее.',
  'Матвей, держи темп, мы уже почти победили.',
];

const barrelPourMessages = [
  'Матвей, ещё одно ведро и бочка чуть ближе к полной.',
  'Старайся не сбавлять темп, у тебя всё получается.',
  'Монашки подружки уже умирают от жажды, а ты так медленно работаешь',
  'Знаю, как неприятно таскать воду, но ты справишься.',
  'Матвеееей быстреее, таймер!!!',
  'Жалко на мопеде нельзя поездить, было бы быстрее.',
  'Понимаю, тяжело, так монотонно и рутинно, но ты справляешься.',
  'Тяжело, но ты уже почти на финише, старайся уложиться в таймер.',
  'Тебя все за это поблагодарят, Матвей, ты герой.',
  'Ну все давай, че такой медленный.',


];

const snowflakes = Array.from({ length: 60 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2 + 1,
  speed: Math.random() * 35 + 20,
}));

const state = {
  playerX: 420,
  playerY: 430,
  speed: 220,
  bucketFill: 0,
  barrelFill: 0,
  message: 'Матвей, не стой на месте — пора поднимать воду.',
  bannerText: 'Матвей, приготовься: нажми «Начать игру».',
  facing: 'front',
  elderVisible: false,
  elderTimer: 0,
  thoughtText: '',
  thoughtTimer: 0,
  thoughtOpacity: 0,
  thoughtShown: false,
  walkFrame: 0,
  walkTimer: 0,
  wellFrame: 0,
  wellTimer: 0.12,
  wellActive: false,
  barrelFallen: false,
  endSequencePhase: 0,
  voicePlayed: false,
  smokingActive: false,
  smokingTimer: 0,
  loading: true,
  started: false,
  assetsReady: false,
  bannerMessageIndex: 0,
  timerActive: false,
  timerRemaining: 0,
};

let loopStarted = false;

function formatTimer(value) {
  const total = Math.max(0, Math.ceil(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function showNextBarrelMessage() {
  if (!barrelPourMessages.length) return;
  const index = state.bannerMessageIndex % barrelPourMessages.length;
  state.bannerText = barrelPourMessages[index];
  state.bannerMessageIndex = (state.bannerMessageIndex + 1) % barrelPourMessages.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isNearWell() {
  return Math.abs(state.playerX - 160) < 70;
}

function isNearBarrel() {
  return Math.abs(state.playerX - 820) < 85;
}

function startGame() {
  state.started = true;
  state.loading = false;
  if (introOverlay) {
    introOverlay.classList.add('hidden');
  }
  state.message = 'Подойди к колодцу и нажимай Пробел.';
  state.bannerText = 'Наполни бочку поскорее. У тебя получится! Не забудь включить звук!';
  updateHud();
  if (!loopStarted) {
    loopStarted = true;
    requestAnimationFrame(loop);
  }
}

function beginGame() {
  if (state.started) return;

  state.started = true;
  state.loading = true;
  if (introOverlay) {
    introOverlay.classList.add('hidden');
  }
  state.message = 'Подготовка к игре…';
  state.bannerText = 'Сейчас всё загрузится — держись.';
  updateHud();

  if (state.assetsReady) {
    startGame();
  }
}

function loadAssets() {
  const pendingAssets = [];
  const addAsset = (image, src) => {
    pendingAssets.push({ image, src });
  };

  let loaded = 0;
  const total = 17;
  const onAssetReady = () => {
    loaded += 1;
    if (loaded === total) {
      state.assetsReady = true;
      if (state.started) {
        startGame();
      } else {
        render();
      }
    }
  };

  addAsset(assets.bg, 'assets/images/background/Image_5xbgg55xbgg55xbg.png');
  addAsset(assets.nunFront, 'assets/images/nan/nun_front.png');
  addAsset(assets.nunFrontSmoke, 'assets/images/nan/nun_front_smoke.png');
  addAsset(assets.nunLeft, 'assets/images/nan/nun_left.png');
  addAsset(assets.nunRight, 'assets/images/nan/nun_right.png');
  addAsset(assets.nunLeftWalk1, 'assets/images/nan/nan_left/nun_left_1.png');
  addAsset(assets.nunLeftWalk2, 'assets/images/nan/nan_left/nun_left_2.png');
  addAsset(assets.nunRightWalk1, 'assets/images/nan/nan_right/nun_right_1.png');
  addAsset(assets.nunRightWalk2, 'assets/images/nan/nan_right/nun_right_2.png');
  addAsset(assets.nunAngry, 'assets/images/nan/nun_angry.png');
  addAsset(assets.bucket, 'assets/images/backet/bucket.png');
  addAsset(assets.barrel, 'assets/images/barrel/barrel.png');
  addAsset(assets.barrelFallen, 'assets/images/barrel/barrel_fallen.png');
  addAsset(assets.wellFrames[0], 'assets/images/well/well_1.png');
  addAsset(assets.wellFrames[1], 'assets/images/well/well_2.png');
  addAsset(assets.wellFrames[2], 'assets/images/well/well_3.png');
  addAsset(assets.wellFrames[3], 'assets/images/well/well_4.png');

  pendingAssets.forEach(({ image, src }) => {
    image.onload = onAssetReady;
    image.onerror = onAssetReady;
    image.src = src;
  });
}


function resetCycle() {
  state.bucketFill = 0;
  state.barrelFill = 0;
  state.elderVisible = false;
  state.elderTimer = 0;
  state.thoughtText = '';
  state.thoughtTimer = 0;
  state.thoughtOpacity = 0;
  state.thoughtShown = false;
  state.walkFrame = 0;
  state.walkTimer = 0;
  state.wellFrame = 0;
  state.wellTimer = 0.12;
  state.wellActive = false;
  state.barrelFallen = false;
  state.endSequencePhase = 0;
  state.voicePlayed = false;
  state.smokingActive = false;
  state.smokingTimer = 0;
  state.timerActive = false;
  state.timerRemaining = 0;
  state.message = 'Подойди к колодцу и нажимай Пробел.';
  state.bannerText = 'Наполни бочку водой из колодца поскорее. Не забудь включить звук!';
  state.bannerMessageIndex = 0;
}

function updateHud() {
  bucketStatus.textContent = state.bucketFill >= 100 ? 'Полное' : state.bucketFill > 0 ? `Частично (${Math.round(state.bucketFill)}%)` : 'Пустое';
  barrelStatus.textContent = `${state.barrelFill} / 10`;
  statusText.textContent = state.message;
  if (timerText) {
    if (state.timerActive) {
      timerText.textContent = `Таймер: ${formatTimer(state.timerRemaining)}`;
      timerText.classList.toggle('timer-warning', state.timerRemaining <= 15);
      timerText.style.display = '';
    } else {
      timerText.style.display = 'none';
    }
  }
  if (smokeButton) {
    smokeButton.disabled = state.loading || state.smokingActive || state.elderVisible || !state.started;
  }
}


function startSmoking() {
  if (!state.started || state.loading || state.smokingActive || state.elderVisible) return;

  state.smokingActive = true;
  state.smokingTimer = 3;
  state.message = 'Матвей затягивается…';
  state.bannerText = 'Тихо, только дым и тишина.';
  updateHud();

  if (smokeAudio.paused || smokeAudio.ended) {
    smokeAudio.currentTime = 0;
    smokeAudio.play().catch(() => {});
  }
}

function update(delta) {
  if (!state.started) return;

  if (state.barrelFill >= 5 && !state.timerActive && !state.elderVisible && !state.barrelFallen) {
    state.timerActive = true;
    state.timerRemaining = 90;
    state.message = 'Спеши, вода должна попасть в бочку быстрее.';
    state.bannerText = 'Задача усложняется, действуй аккуратно.';
  }

  if (state.timerActive && !state.elderVisible) {
    state.timerRemaining -= delta;
    if (state.timerRemaining <= 0) {
      state.timerActive = false;
      state.timerRemaining = 0;
      state.message = 'Время вышло — монашка пришла.';
      state.bannerText = 'Смотри, что получилось — потом начнём заново.';
      state.elderVisible = true;
      state.elderTimer = 4;
      state.endSequencePhase = 1;
      if (!state.voicePlayed) {
        state.voicePlayed = true;
        angryVoiceAudio.currentTime = 0;
        angryVoiceAudio.play().catch(() => {});
      }
    } else {
      state.message = `Таймер: ${formatTimer(state.timerRemaining)}`;
    }
  }

  if (state.smokingActive) {
    state.smokingTimer -= delta;
    if (state.smokingTimer <= 0) {
      state.smokingActive = false;
      state.smokingTimer = 0;
      state.message = 'Можно снова действовать.';
      state.bannerText = 'Таскаешь воду из колодца к бочке. Держись!';
    }
    updateHud();
  }

  const move = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
  let speedMultiplier = 1;

  if (state.barrelFill >= 9) {
    speedMultiplier = 0.25;
    if (!state.thoughtText || state.thoughtText !== 'Я капец устала') {
      state.thoughtText = 'Я капец устала';
      state.thoughtTimer = 2;
      state.thoughtOpacity = 1;
    }
  } else if (state.barrelFill >= 5) {
    speedMultiplier = 0.5;
    if (!state.thoughtText || state.thoughtText !== 'Я устала...') {
      state.thoughtText = 'Я устала...';
      state.thoughtTimer = 2;
      state.thoughtOpacity = 1;
    }
  }
  if (state.smokingActive) {
    speedMultiplier *= 1.1;
  }

  state.playerX = clamp(state.playerX + move * state.speed * speedMultiplier * delta, 120, 920);
  state.facing = keys.left ? 'left' : keys.right ? 'right' : 'front';

  if (move !== 0) {
    state.walkTimer -= delta;
    if (state.walkTimer <= 0) {
      state.walkTimer = 0.12;
      state.walkFrame = 1 - state.walkFrame;
    }
  } else {
    state.walkFrame = 0;
    state.walkTimer = 0;
  }

  if (state.elderVisible) {
    state.elderTimer -= delta;
    if (state.elderTimer <= 0) {
      if (state.endSequencePhase === 1) {
        state.barrelFallen = true;
        state.barrelFill = 0;
        state.elderTimer = 1;
        state.endSequencePhase = 2;
        state.message = 'Бочка перевернулась! Сейчас всё вернётся на место.';
        state.bannerText = 'Смотри, что получилось — потом начнём заново.';
        if (crashAudio.paused || crashAudio.ended) {
          crashAudio.currentTime = 0;
          crashAudio.play().catch(() => {});
        }
      } else {
        resetCycle();
      }
    }
  }

  if (state.wellActive) {
    state.wellTimer -= delta;
    if (state.wellTimer <= 0) {
      state.wellTimer = 0.12;
      state.wellFrame += 1;
      if (state.wellFrame >= 4) {
        state.wellFrame = 0;
        state.wellActive = false;
      }
    }
  } else {
    state.wellFrame = 0;
    state.wellTimer = 0.12;
  }

  if (state.thoughtTimer > 0) {
    state.thoughtTimer -= delta;
    state.thoughtOpacity = Math.max(0, state.thoughtTimer / 2);
    if (state.thoughtTimer <= 0) {
      state.thoughtText = '';
    }
  }

  updateHud();
}

function drawBackground() {
  if (assets.bg.complete && !state.loading) {
    ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#22364b');
    sky.addColorStop(1, '#5b6d7a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 180);
    ctx.lineTo(140, 130);
    ctx.lineTo(260, 180);
    ctx.lineTo(380, 120);
    ctx.lineTo(520, 178);
    ctx.lineTo(700, 140);
    ctx.lineTo(1000, 182);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(5, 10, 18, 0.35)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Убираем дополнительный тёмный слой снизу — оставляем только фон и дорожку.

  ctx.fillStyle = '#f8f4e8';
  snowflakes.forEach((flake) => {
    flake.y += flake.speed * 0.016;
    if (flake.y > canvas.height) {
      flake.y = -10;
      flake.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPath() {
  ctx.strokeStyle = '#6d5c4a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(80, 460);
  ctx.lineTo(920, 460);
  ctx.stroke();

  ctx.strokeStyle = '#9b8771';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 460);
  ctx.lineTo(920, 460);
  ctx.stroke();
}

function drawWell() {
  const wellX = 90;
  const wellY = 180;
  const wellWidth = 200;
  const wellHeight = 260;
  const frame = assets.wellFrames[state.wellFrame];

  if (frame && frame.complete) {
    ctx.drawImage(frame, wellX, wellY, wellWidth, wellHeight);
  } else {
    ctx.fillStyle = '#4d3529';
    ctx.fillRect(130, 435, 140, 70);
    ctx.fillStyle = '#6f4d38';
    ctx.fillRect(140, 415, 120, 32);
    ctx.fillStyle = '#2f261d';
    ctx.fillRect(155, 390, 90, 34);
    ctx.fillStyle = '#8f6a49';
    ctx.fillRect(162, 396, 76, 14);
    ctx.fillStyle = '#5d7a8a';
    ctx.fillRect(160, 450, 70, 18);
    ctx.fillStyle = '#2c3d4a';
    ctx.fillRect(160, 470, 70, 10);
  }
}

function drawBarrel() {
  const barrelX = 760;
  const barrelY = 440;
  const width = 124;
  const height = 132;

  const waterHeight = (state.barrelFill / 10) * 84;
  if (waterHeight > 0) {
    ctx.fillStyle = 'rgba(91, 163, 207, 0.82)';
    ctx.fillRect(barrelX + 18, barrelY - 16 - waterHeight, 88, waterHeight);
  }

  if (state.barrelFallen && assets.barrelFallen.complete) {
    ctx.drawImage(assets.barrelFallen, barrelX - 20, barrelY - height + 20, width + 40, height - 20);
  } else if (assets.barrel.complete) {
    ctx.drawImage(assets.barrel, barrelX, barrelY - height, width, height);
  } else {
    ctx.fillStyle = '#6b4a2d';
    ctx.beginPath();
    ctx.roundRect(barrelX, barrelY - 80, 120, 90, 16);
    ctx.fill();
    ctx.fillStyle = '#8b6036';
    ctx.fillRect(barrelX + 10, barrelY - 75, 100, 80);
    ctx.fillStyle = '#5a3c23';
    ctx.fillRect(barrelX + 30, barrelY - 110, 12, 40);
  }
}

function drawPlayer() {
  const width = 90;
  const height = 130;
  let sprite = assets.nunFront;

  if (state.smokingActive) {
    sprite = assets.nunFrontSmoke;
  } else if (state.facing === 'left') {
    sprite = state.walkFrame === 0 ? assets.nunLeftWalk1 : assets.nunLeftWalk2;
  } else if (state.facing === 'right') {
    sprite = state.walkFrame === 0 ? assets.nunRightWalk1 : assets.nunRightWalk2;
  }

  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, state.playerX - width / 2, state.playerY - height, width, height);
  } else {
    ctx.save();
    ctx.translate(state.playerX, state.playerY);
    ctx.fillStyle = '#2f2c2b';
    ctx.fillRect(-14, -50, 28, 28);
    ctx.fillStyle = '#f1caa0';
    ctx.fillRect(-20, -22, 40, 34);
    ctx.fillStyle = '#403939';
    ctx.fillRect(-10, -18, 8, 24);
    ctx.restore();
  }
}

function drawBucket() {
  const x = state.playerX + 20;
  const y = state.playerY - 60;
  const width = 72;
  const height = 76;

  const fillHeight = Math.max(8, (state.bucketFill / 100) * 28);
  if (state.bucketFill > 0) {
    ctx.fillStyle = 'rgba(91, 163, 207, 0.82)';
    ctx.fillRect(x + 16, y + height - fillHeight - 8, width - 32, fillHeight);
  }

  if (assets.bucket.complete) {
    ctx.drawImage(assets.bucket, x, y, width, height);
  } else {
    ctx.fillStyle = '#6a4a3d';
    ctx.fillRect(x, y, width, height);
  }
}

function drawElder() {
  if (!state.elderVisible) return;

  const width = 130;
  const height = 180;
  const x = 930;
  const y = 430;

  if (assets.nunAngry.complete) {
    ctx.drawImage(assets.nunAngry, x - width / 2, y - height, width, height);
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#3e2f2b';
    ctx.fillRect(-12, -42, 24, 24);
    ctx.fillStyle = '#f1caa0';
    ctx.fillRect(-18, -18, 36, 32);
    ctx.fillStyle = '#3b2f2c';
    ctx.fillRect(-8, -10, 8, 24);
    ctx.fillStyle = '#788062';
    ctx.fillRect(-30, 8, 60, 12);
    ctx.restore();
  }
}

function drawThoughtBubble() {
  if (!state.thoughtText || state.thoughtOpacity <= 0) return;

  const bubbleX = state.playerX;
  const bubbleY = state.playerY - 170;
  const padding = 12;
  const text = state.thoughtText;

  ctx.font = '16px Trebuchet MS';
  const textWidth = ctx.measureText(text).width;
  const width = textWidth + padding * 2;
  const height = 36;

  ctx.globalAlpha = state.thoughtOpacity * 0.95;
  ctx.fillStyle = 'rgba(24, 30, 45, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bubbleX - width / 2, bubbleY - height / 2, width, height, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(236, 237, 241, 0.96)';
  ctx.fillText(text, bubbleX - textWidth / 2, bubbleY + 6);
  ctx.globalAlpha = 1;
}

function render() {
  drawBackground();
  drawWell();
  drawPlayer();
  drawBucket();
  drawBarrel();
  drawElder();
  drawThoughtBubble();

  ctx.fillStyle = 'rgba(10, 14, 19, 0.7)';
  ctx.fillRect(36, 20, 928, 52);
  ctx.fillStyle = '#f7ead6';
  ctx.font = '18px Trebuchet MS';
  ctx.fillText(state.bannerText, 56, 54);
}

function handleKeyDown(event) {
  if (!state.started) {
    event.preventDefault();
    return;
  }

  if (state.smokingActive) {
    event.preventDefault();
    return;
  }

  const supportedKeys = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyE'];
  if (!supportedKeys.includes(event.code)) {
    state.message = 'Не та кнопка — используй ← →, Пробел или E.';
    updateHud();
    event.preventDefault();
    return;
  }

  if (state.smokingActive) {
    event.preventDefault();
    return;
  }

  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    keys.left = true;
    event.preventDefault();
  }
  if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    keys.right = true;
    event.preventDefault();
  }
  if (event.code === 'Space') {
    if (state.wellActive) {
      event.preventDefault();
      return;
    }

    if (!state.elderVisible && state.bucketFill < 100 && isNearWell()) {
      state.bucketFill = Math.min(100, state.bucketFill + 10);
      state.message = state.bucketFill >= 100 ? 'Ведро полное. Неси его к бочке.' : 'Крути ручку колодца сильнее.';
      state.wellFrame = 0;
      state.wellTimer = 0.12;
      state.wellActive = true;
      if (wellAudio.paused || wellAudio.ended) {
        wellAudio.currentTime = 0;
        wellAudio.play().catch(() => {});
      }
    } else if (!isNearWell()) {
      state.message = 'Сначала подойди к колодцу.';
    }
    event.preventDefault();
  }
  if (event.code === 'KeyE') {
    if (!state.elderVisible && state.bucketFill >= 100 && isNearBarrel()) {
      state.barrelFill += 1;
      state.bucketFill = 0;
      state.message = state.barrelFill >= 10 ? 'Бочка полна! Старшая монашка уже близко…' : 'Вода вылита. Ещё одно ведро!';
      if (state.barrelFill < 10) {
        showNextBarrelMessage();
      }
      if (!state.thoughtShown && state.barrelFill >= 1) {
        state.thoughtShown = true;
        state.thoughtText = 'Я устала...';
        state.thoughtTimer = 2;
        state.thoughtOpacity = 1;
      }
      pourAudio.currentTime = 0;
      pourAudio.play().catch(() => {});
      if (state.barrelFill >= 10) {
        state.message = 'Бочка полна. Старая монашка приходит…';
        state.bannerText = bannerMessages[Math.floor(Math.random() * bannerMessages.length)];
        state.elderVisible = true;
        state.elderTimer = 4;
        state.endSequencePhase = 1;
        if (!state.voicePlayed) {
          state.voicePlayed = true;
          angryVoiceAudio.currentTime = 0;
          angryVoiceAudio.play().catch(() => {});
        }
      }
    } else if (!isNearBarrel()) {
      state.message = 'Сначала подойди к бочке.';
    }
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  if (!state.started) return;

  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    keys.left = false;
  }
  if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    keys.right = false;
  }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
if (smokeButton) {
  smokeButton.addEventListener('click', startSmoking);
}
if (startButton) {
  startButton.addEventListener('click', beginGame);
}

let lastTime = 0;
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;

  update(delta);
  render();
  requestAnimationFrame(loop);
}

render();
loadAssets();
