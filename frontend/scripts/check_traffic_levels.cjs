const fs = require('fs');
const path = require('path');

const GRID = 6;

function cells(car) {
  const out = [];
  for (let i = 0; i < car.length; i++) {
    out.push([
      car.orientation === 'V' ? car.row + i : car.row,
      car.orientation === 'H' ? car.col + i : car.col
    ]);
  }
  return out;
}

function key(cars) {
  return cars
    .slice()
    .sort((a, b) => a.id - b.id)
    .map(c => `${c.row},${c.col}`)
    .join('|');
}

function valid(cars, exitRow) {
  const occ = new Map();
  for (const car of cars) {
    for (const [r, c] of cells(car)) {
      if (r < 0 || r >= GRID || c < 0) return false;
      if (!car.isTarget && c >= GRID) return false;
      if (car.isTarget) {
        if (car.orientation !== 'H') return false;
        if (car.row !== exitRow) return false;
        if (c > GRID) return false;
        if (c === GRID && car.row !== exitRow) return false;
      }
      if (c >= 0 && c < GRID) {
        const k = `${r},${c}`;
        if (occ.has(k)) return false;
        occ.set(k, car.id);
      }
    }
  }
  return true;
}

function won(cars, exitRow) {
  const t = cars.find(c => c.isTarget);
  return !!t && t.orientation === 'H' && t.row === exitRow && (t.col + t.length > GRID - 1);
}

function neighbors(cars, exitRow) {
  const res = [];
  for (const car of cars) {
    if (car.orientation === 'H') {
      for (const dc of [-1, 1]) {
        const moved = { ...car, col: car.col + dc };
        const next = cars.map(x => (x.id === car.id ? moved : x));
        if (valid(next, exitRow)) res.push(next);
      }
    } else {
      for (const dr of [-1, 1]) {
        const moved = { ...car, row: car.row + dr };
        const next = cars.map(x => (x.id === car.id ? moved : x));
        if (valid(next, exitRow)) res.push(next);
      }
    }
  }
  return res;
}

function solveMinMoves(start, exitRow, limitStates = 700000) {
  if (!valid(start, exitRow)) return null;
  const q = [start];
  const dist = new Map([[key(start), 0]]);
  let head = 0;

  while (head < q.length) {
    const cur = q[head++];
    const d = dist.get(key(cur));
    if (won(cur, exitRow)) return d;
    for (const nxt of neighbors(cur, exitRow)) {
      const k = key(nxt);
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        q.push(nxt);
        if (dist.size > limitStates) return null;
      }
    }
  }
  return null;
}

function main() {
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'traffic_levels.json');
  const levels = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let ok = true;
  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    if (!Array.isArray(lvl.variants) || lvl.variants.length !== 5) {
      ok = false;
      console.log(`Level ${i + 1} invalid variants length: ${lvl.variants?.length}`);
      continue;
    }
    for (const v of lvl.variants) {
      const exitRow = v.exitRow ?? 2;
      const cars = v.cars;
      const min = solveMinMoves(cars, exitRow);
      if (min === null) {
        ok = false;
        console.log(`Level ${i + 1} ${v.variantId} NOT_SOLVABLE`);
      } else {
        console.log(`Level ${i + 1} ${v.variantId} SOLVABLE minMoves=${min}`);
      }
    }
  }

  if (!ok) process.exit(1);
}

main();

