const $ = s => document.querySelector(s);
const video = $('#cam'), cv = $('#skel'), ctx = cv.getContext('2d');
let W, H;
const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
addEventListener('resize', resize); resize();

const G = { stone: { e: '✊', n: 'Stone' }, paper: { e: '✋', n: 'Paper' }, scissors: { e: '✌️', n: 'Scissors' } };
const BEATS = { stone: 'scissors', scissors: 'paper', paper: 'stone' }; // key beats value
const CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const score = { you: 0, draw: 0, cpu: 0 };
let history = [], camOn = false, camStarted = false, busy = false;

// ---- Gesture detection from 21 hand landmarks ----
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function classify(lm) {
  // finger is "up" if its tip is farther from the wrist than its middle joint (works at any hand angle)
  const up = (tip, pip) => d(lm[0], lm[tip]) > d(lm[0], lm[pip]) * 1.1;
  const [i, m, r, p] = [up(8, 6), up(12, 10), up(16, 14), up(20, 18)];
  const count = i + m + r + p;
  if (i && m && !r && !p) return 'scissors';
  if (count === 0) return 'stone';
  if (count >= 3) return 'paper';
  return null;
}

// ---- Camera + MediaPipe ----
async function startCamera() {
  if (camStarted) return;
  camStarted = true;
  try {
    const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}` });
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
    hands.onResults(onHand);
    const cam = new Camera(video, { onFrame: async () => { await hands.send({ image: video }); }, width: 640, height: 480, facingMode: 'user' });
    await cam.start();
    camOn = true;
  } catch (e) {
    camOn = false;
    $('#manual').hidden = false;
    $('#live').textContent = 'Camera not available. Use the buttons below.';
  }
}
function onHand(res) {
  ctx.clearRect(0, 0, W, H);
  const lm = res.multiHandLandmarks && res.multiHandLandmarks[0];
  if (!lm) { history.push({ g: null, t: performance.now() }); $('#live').textContent = 'Your hand: not visible'; return; }
  const g = classify(lm);
  history.push({ g, t: performance.now() }); if (history.length > 30) history.shift();
  $('#live').textContent = g ? `Your hand: ${G[g].e} ${G[g].n}` : 'Your hand: unclear';
  drawHand(lm);
}
function drawHand(lm) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480, s = Math.max(W / vw, H / vh);
  const ox = (vw * s - W) / 2, oy = (vh * s - H) / 2;
  const P = l => ({ x: W - (l.x * vw * s - ox), y: l.y * vh * s - oy }); // mirrored like the video
  ctx.lineWidth = 4; ctx.strokeStyle = '#5cf2ff'; ctx.shadowColor = '#5cf2ff'; ctx.shadowBlur = 14; ctx.lineCap = 'round';
  for (const [a, b] of CONN) { const A = P(lm[a]), B = P(lm[b]); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); }
  ctx.fillStyle = '#fff';
  for (const l of lm) { const p = P(l); ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill(); }
  ctx.shadowBlur = 0;
}
// most common gesture seen in the last 0.5 seconds
function lockedGesture() {
  const now = performance.now(), c = {};
  history.filter(h => h.g && now - h.t < 500).forEach(h => c[h.g] = (c[h.g] || 0) + 1);
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

// ---- Game ----
function result(you) {
  const cpu = Object.keys(G)[Math.random() * 3 | 0];
  $('#you').textContent = G[you].e; $('#cpu').textContent = G[cpu].e;
  let text;
  if (you === cpu) { score.draw++; text = 'Draw!'; }
  else if (BEATS[you] === cpu) { score.you++; text = 'You win! 🎉'; }
  else { score.cpu++; text = 'Computer wins'; }
  $('#big').textContent = text;
  $('#sYou').textContent = score.you; $('#sDraw').textContent = score.draw; $('#sCpu').textContent = score.cpu;
}
async function playRound() {
  if (busy) return; busy = true; $('#play').disabled = true;
  await startCamera();
  $('#you').textContent = '❔'; $('#cpu').textContent = '❔';
  if (camOn) {
    $('#play').textContent = 'Playing…';
    for (const n of [3, 2, 1]) { $('#big').textContent = n; await sleep(800); }
    $('#big').textContent = 'Show!'; await sleep(500);
    const g = lockedGesture();
    if (g) result(g); else $('#big').textContent = 'No gesture seen. Try again!';
  } else { $('#big').textContent = 'Pick below'; }
  $('#play').textContent = camOn ? 'Play next round' : 'Try camera again';
  $('#play').disabled = false; busy = false;
}
$('#play').onclick = playRound;
document.querySelectorAll('#manual [data-g]').forEach(b => b.onclick = () => result(b.dataset.g));