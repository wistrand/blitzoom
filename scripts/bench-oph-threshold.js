import { MINHASH_K, HASH_PARAMS_A, HASH_PARAMS_B, LARGE_PRIME, hashToken } from '/home/wistrand/private/github/blitzoom/docs/blitzoom-algo.js';

function mersMod(x) {
  x = (x & LARGE_PRIME) + ((x / 0x80000000) | 0);
  return x >= LARGE_PRIME ? x - LARGE_PRIME : x;
}
function hashSlot(a, tv, b) {
  const tvHi = (tv >>> 16), tvLo = tv & 0xFFFF;
  const hi = mersMod(a * tvHi);
  return mersMod(hi * 0x10000 + a * tvLo + b);
}

const _sig = new Float64Array(MINHASH_K);
const _occupied = new Uint8Array(MINHASH_K);

function standardMinHash(tokens, tokenCount) {
  for (let i = 0; i < MINHASH_K; i++) _sig[i] = LARGE_PRIME;
  for (let t = 0; t < tokenCount; t++) {
    const tv = hashToken(tokens[t]);
    for (let j = 0; j < MINHASH_K; j++) {
      const hv = hashSlot(HASH_PARAMS_A[j], tv, HASH_PARAMS_B[j]);
      if (hv < _sig[j]) _sig[j] = hv;
    }
  }
}

function ophMinHash(tokens, tokenCount) {
  for (let i = 0; i < MINHASH_K; i++) { _sig[i] = LARGE_PRIME; _occupied[i] = 0; }
  for (let t = 0; t < tokenCount; t++) {
    const tv = hashToken(tokens[t]);
    const hv = hashSlot(HASH_PARAMS_A[0], tv, HASH_PARAMS_B[0]);
    const bin = hv % MINHASH_K;
    const val = (hv / MINHASH_K) | 0;
    if (val < _sig[bin]) { _sig[bin] = val; _occupied[bin] = 1; }
  }
  for (let i = 0; i < MINHASH_K; i++) {
    if (_occupied[i]) continue;
    let donor = ((i * 2654435761) >>> 0) % MINHASH_K;
    let attempts = 0;
    while (!_occupied[donor] && attempts < MINHASH_K) {
      donor = ((donor * 2654435761 + 1) >>> 0) % MINHASH_K;
      attempts++;
    }
    if (_occupied[donor]) _sig[i] = _sig[donor];
  }
}

// Generate token sets at each size
const REPS = 20000;
const universe = [];
for (let i = 0; i < 500; i++) universe.push('tok:' + i);

console.log('Tokens | Standard (µs) | OPH (µs)  | Winner | Ratio');
console.log('-------|---------------|-----------|--------|------');

for (const size of [1, 2, 3, 5, 8, 10, 12, 15, 18, 20, 25, 30, 40, 50, 80, 128]) {
  const sets = [];
  for (let i = 0; i < REPS; i++) {
    const s = [];
    for (let j = 0; j < size; j++) s.push(universe[Math.floor(Math.random() * 500)]);
    sets.push(s);
  }

  // Warmup
  for (let i = 0; i < 500; i++) { standardMinHash(sets[i % REPS], size); ophMinHash(sets[i % REPS], size); }

  const t0 = performance.now();
  for (let i = 0; i < REPS; i++) standardMinHash(sets[i], size);
  const tStd = (performance.now() - t0) / REPS * 1000;

  const t1 = performance.now();
  for (let i = 0; i < REPS; i++) ophMinHash(sets[i], size);
  const tOph = (performance.now() - t1) / REPS * 1000;

  const winner = tOph < tStd ? 'OPH' : 'Std';
  const ratio = (tStd / tOph).toFixed(2);
  console.log(`${String(size).padStart(6)} | ${tStd.toFixed(1).padStart(13)} | ${tOph.toFixed(1).padStart(9)} | ${winner.padStart(6)} | ${ratio}`);
}
