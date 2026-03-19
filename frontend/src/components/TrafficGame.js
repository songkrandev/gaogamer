import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gameAPI } from '../services/api';
import { useDialog } from './DialogProvider';
import '../styles/TrafficGame.css';
import trafficLevels from '../data/traffic_levels.json';

// Import car images
import car01 from '../assets/cars/car01.png';
import car02 from '../assets/cars/car02.png';
import car03 from '../assets/cars/car03.png';
import car04 from '../assets/cars/car04.png';
import car05 from '../assets/cars/car05.png';
import car06 from '../assets/cars/car06.png';
import car07 from '../assets/cars/car07.png';
import car08 from '../assets/cars/car08.png';
import car09 from '../assets/cars/car09.png';

// Import bus images
import bus01 from '../assets/cars/bus01.png';
import bus02 from '../assets/cars/bus02.png';
import bus03 from '../assets/cars/bus03.png';
import bus04 from '../assets/cars/bus04.png';

const CAR_IMAGES = [car01, car02, car03, car04, car05, car06, car07, car08, car09];
const BUS_IMAGES = [bus01, bus02, bus03, bus04];
const GRID_SIZE = 6;

const LEVELS = trafficLevels;

function solveMinMoves(carDefs, startPos, exitRow) {
  const carCount = carDefs.length;
  const targetIndex = carDefs.findIndex(c => c.isTarget);
  if (targetIndex < 0) return null;

  const keyOf = (pos) => pos.join(',');

  const isWon = (pos) => {
    const row = pos[targetIndex * 2];
    const col = pos[targetIndex * 2 + 1];
    const target = carDefs[targetIndex];
    if (target.orientation !== 'H') return false;
    if (row !== exitRow) return false;
    return col + target.length > GRID_SIZE - 1;
  };

  const buildOccupancy = (pos) => {
    const occ = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    for (let i = 0; i < carCount; i++) {
      const def = carDefs[i];
      const row = pos[i * 2];
      const col = pos[i * 2 + 1];
      for (let k = 0; k < def.length; k++) {
        const r = def.orientation === 'V' ? row + k : row;
        const c = def.orientation === 'H' ? col + k : col;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          occ[r][c] = true;
        }
      }
    }
    return occ;
  };

  const neighbors = (pos) => {
    const occ = buildOccupancy(pos);
    const out = [];

    for (let i = 0; i < carCount; i++) {
      const def = carDefs[i];
      const row = pos[i * 2];
      const col = pos[i * 2 + 1];

      if (def.orientation === 'H') {
        const maxCol = def.isTarget && row === exitRow ? GRID_SIZE - def.length + 1 : GRID_SIZE - def.length;

        const leftCol = col - 1;
        if (leftCol >= 0) {
          const cellR = row;
          const cellC = leftCol;
          if (cellR >= 0 && cellR < GRID_SIZE && !occ[cellR][cellC]) {
            const next = pos.slice();
            next[i * 2 + 1] = leftCol;
            out.push({ next, move: { carIndex: i, row, col: leftCol } });
          }
        }

        const rightCol = col + 1;
        if (rightCol <= maxCol) {
          const enterC = col + def.length;
          if (enterC === GRID_SIZE && def.isTarget && row === exitRow) {
            const next = pos.slice();
            next[i * 2 + 1] = rightCol;
            out.push({ next, move: { carIndex: i, row, col: rightCol } });
          } else if (enterC >= 0 && enterC < GRID_SIZE) {
            const cellR = row;
            const cellC = enterC;
            if (cellR >= 0 && cellR < GRID_SIZE && !occ[cellR][cellC]) {
              const next = pos.slice();
              next[i * 2 + 1] = rightCol;
              out.push({ next, move: { carIndex: i, row, col: rightCol } });
            }
          }
        }
      } else {
        const upRow = row - 1;
        if (upRow >= 0) {
          const cellR = upRow;
          const cellC = col;
          if (!occ[cellR][cellC]) {
            const next = pos.slice();
            next[i * 2] = upRow;
            out.push({ next, move: { carIndex: i, row: upRow, col } });
          }
        }

        const downRow = row + 1;
        const maxRow = GRID_SIZE - def.length;
        if (downRow <= maxRow) {
          const enterR = row + def.length;
          if (enterR >= 0 && enterR < GRID_SIZE) {
            const cellR = enterR;
            const cellC = col;
            if (!occ[cellR][cellC]) {
              const next = pos.slice();
              next[i * 2] = downRow;
              out.push({ next, move: { carIndex: i, row: downRow, col } });
            }
          }
        }
      }
    }

    return out;
  };

  const startKey = keyOf(startPos);
  const queue = [startPos];
  const prev = new Map();
  const moveBy = new Map();
  prev.set(startKey, null);

  let head = 0;
  const visitedLimit = 150000;

  while (head < queue.length) {
    const cur = queue[head++];
    const curKey = keyOf(cur);
    if (isWon(cur)) {
      const moves = [];
      let k = curKey;
      while (k !== startKey) {
        const m = moveBy.get(k);
        moves.push(m);
        k = prev.get(k);
      }
      moves.reverse();
      return moves;
    }

    if (queue.length > visitedLimit) return null;

    for (const { next, move } of neighbors(cur)) {
      const nextKey = keyOf(next);
      if (prev.has(nextKey)) continue;
      prev.set(nextKey, curKey);
      moveBy.set(nextKey, move);
      queue.push(next);
    }
  }

  return null;
}

function TrafficGame({ onGameEnd, onScoreUpdate, onBackToMenu }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [level, setLevel] = useState(0); // 0-indexed
  const [exitRow, setExitRow] = useState(2);
  const [levelVariantId, setLevelVariantId] = useState(null);
  const [parMoves, setParMoves] = useState(null);
  const [moves, setMoves] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [cars, setCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [canvasSize, setCanvasSize] = useState(480);
  const [showLevelSelect, setShowLevelSelect] = useState(true);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [levelScores, setLevelScores] = useState({});
  const [isSolving, setIsSolving] = useState(false);
  const [solvedByHint, setSolvedByHint] = useState(false);
  const carImagesRef = useRef([]);
  const busImagesRef = useRef([]);
  const timerRef = useRef(null);
  const dragRef = useRef(null);
  const solveTimerRef = useRef(null);
  const winHandledRef = useRef(false);
  const solvedByHintRef = useRef(false);
  const movesRef = useRef(0);
  const carsRef = useRef([]);
  const checkWinRef = useRef(null);
  const handleWinRef = useRef(null);
  const { alert } = useDialog();

  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  useEffect(() => {
    carsRef.current = cars;
  }, [cars]);

  const stopSolving = useCallback(() => {
    if (solveTimerRef.current) clearInterval(solveTimerRef.current);
    solveTimerRef.current = null;
    setIsSolving(false);
  }, []);

  useEffect(() => {
    return () => {
      if (solveTimerRef.current) clearInterval(solveTimerRef.current);
    };
  }, []);

  // ====== LOAD CAR & BUS IMAGES ======
  useEffect(() => {
    const loadImages = async () => {
      const loadedCars = await Promise.all(
        CAR_IMAGES.map(src => new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        }))
      );
      const loadedBuses = await Promise.all(
        BUS_IMAGES.map(src => new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        }))
      );
      carImagesRef.current = loadedCars;
      busImagesRef.current = loadedBuses;
    };
    loadImages();
  }, []);

  // ====== RESPONSIVE CANVAS ======
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const maxSize = Math.min(width - 20, 480);
        setCanvasSize(maxSize);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ====== TIMER ======
  useEffect(() => {
    if (gameStarted && !gameWon) {
      timerRef.current = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameWon]);

  // ====== FORMAT TIME ======
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ====== INITIALIZE LEVEL ======
  const startLevel = useCallback((levelIndex) => {
    const levelData = LEVELS[levelIndex];
    const variants = levelData.variants;
    const variant = variants ? variants[Math.floor(Math.random() * variants.length)] : null;
    const selectedExitRow = variant?.exitRow ?? 2;
    const selectedCars = (variant?.cars ?? levelData.cars).map(car => ({ ...car }));

    winHandledRef.current = false;
    solvedByHintRef.current = false;
    setSolvedByHint(false);
    stopSolving();
    setExitRow(selectedExitRow);
    setLevelVariantId(variant?.variantId ?? null);
    setParMoves(variant?.minMoves ?? null);
    const newCars = selectedCars;
    setCars(newCars);
    setMoves(0);
    setGameTime(0);
    setGameWon(false);
    setGameStarted(true);
    setSelectedCarId(null);
    setShowLevelSelect(false);
    setLevel(levelIndex);
  }, [stopSolving]);

  // ====== CHECK WIN ======
  const checkWin = useCallback((carsArray) => {
    const targetCar = carsArray.find(c => c.isTarget);
    if (!targetCar) return false;
    if (targetCar.orientation !== 'H') return false;
    if (targetCar.row !== exitRow) return false;
    return targetCar.col + targetCar.length > GRID_SIZE - 1;
  }, [exitRow]);
  checkWinRef.current = checkWin;

  // ====== CALCULATE SCORE ======
  const calculateScore = useCallback((movesCount) => {
    const par = Number.isFinite(parMoves) ? parMoves : movesCount;
    const extra = Math.max(0, movesCount - par);
    const penalty = extra;
    return Math.max(10 - penalty, 0);
  }, [parMoves]);

  // ====== SAVE SCORE TO BACKEND ======
  const saveScoreToBackend = useCallback(async (movesCount, timeSeconds, levelIdx, totalScore) => {
    try {
      // Start session
      const sessionRes = await gameAPI.startSession('traffic_game');
      const sessionId = sessionRes.data.data.session_id;

      // End session
      await gameAPI.endSession(sessionId);

      // Save score with level info
      await gameAPI.saveScore(sessionId, 'traffic_game', totalScore, levelIdx + 1);

      console.log('Score saved to backend:', { totalScore, level: levelIdx + 1, moves: movesCount, time: timeSeconds });
    } catch (err) {
      console.error('Failed to save score to backend:', err);
    }
  }, []);

  // ====== HANDLE WIN ======
  const handleWin = useCallback((carsArray, movesCount) => {
    if (winHandledRef.current) return;
    winHandledRef.current = true;
    stopSolving();
    setGameWon(true);
    if (timerRef.current) clearInterval(timerRef.current);

    if (solvedByHintRef.current) return;

    const totalScore = calculateScore(movesCount);

    // Track completed levels
    setCompletedLevels(prev => {
      if (!prev.includes(level)) return [...prev, level];
      return prev;
    });

    // Track best scores for each level
    setLevelScores(prev => {
      const current = prev[level];
      if (!current || totalScore > current.score) {
        return { ...prev, [level]: { score: totalScore, moves: movesCount, time: gameTime } };
      }
      return prev;
    });

    // Notify parent
    if (onScoreUpdate) {
      onScoreUpdate(totalScore);
    }

    const shouldAutoAdvance = level < LEVELS.length - 1;
    void (async () => {
      await alert({
        variant: 'success',
        title: 'คุณชนะแล้ว',
        message: `ระดับ ${level + 1} สำเร็จ\nคะแนนของคุณคือ ${totalScore}/10`
      });
      if (shouldAutoAdvance) startLevel(level + 1);
    })();

    // Save to backend
    saveScoreToBackend(movesCount, gameTime, level, totalScore);
  }, [alert, level, gameTime, calculateScore, onScoreUpdate, saveScoreToBackend, stopSolving, startLevel]);
  handleWinRef.current = handleWin;

  // ====== DRAW GAME ======
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cellSize = canvasSize / GRID_SIZE;

    // Clear
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background - parking lot
    ctx.fillStyle = '#0F2A1D';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw grid lines
    ctx.strokeStyle = '#375534';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasSize, i * cellSize);
      ctx.stroke();
    }

    // Draw EXIT marker on the right side at exitRow
    const exitY = exitRow * cellSize;
    ctx.fillStyle = '#6B9071';
    ctx.fillRect(canvasSize - 4, exitY + 4, 4, cellSize - 8);

    // EXIT arrow
    ctx.fillStyle = '#6B9071';
    ctx.font = `bold ${Math.max(10, cellSize * 0.3)}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT →', canvasSize - 8, exitY + cellSize / 2);

    // Draw cars
    cars.forEach(car => {
      const x = car.col * cellSize;
      const y = car.row * cellSize;
      const w = car.orientation === 'H' ? car.length * cellSize : cellSize;
      const h = car.orientation === 'V' ? car.length * cellSize : cellSize;
      const padding = 3;
      const isSelected = selectedCarId === car.id;
      // Pick image based on vehicle length: buses (length 3) vs cars (length 2)
      let img;
      if (car.length >= 3) {
        const busIndex = car.id % busImagesRef.current.length;
        img = busImagesRef.current[busIndex];
      } else {
        const carIndex = car.id % carImagesRef.current.length;
        img = carImagesRef.current[carIndex];
      }

      // Draw car body
      if (img) {
        ctx.save();
        // Rounded rect clip
        const rx = x + padding;
        const ry = y + padding;
        const rw = w - padding * 2;
        const rh = h - padding * 2;
        const radius = 6;

        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.clip();

        // Original images: front of car faces UP (portrait)
        // Vertical (V): draw as-is, front faces up naturally
        // Horizontal (H): rotate -90° so front faces RIGHT (toward EXIT)
        if (car.orientation === 'H') {
          ctx.translate(rx + rw / 2, ry + rh / 2);
          ctx.rotate(-Math.PI / 2);
          // After rotation, swap width/height so image fills the horizontal slot
          ctx.drawImage(img, -rh / 2, -rw / 2, rh, rw);
        } else {
          ctx.drawImage(img, rx, ry, rw, rh);
        }

        ctx.restore();
      } else {
        // Fallback: solid color
        ctx.fillStyle = car.color;
        ctx.beginPath();
        const rx = x + padding;
        const ry = y + padding;
        const rw = w - padding * 2;
        const rh = h - padding * 2;
        const radius = 6;
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();
      }

      // Overlay color tint for car identification
      ctx.fillStyle = car.color + '80'; // semi-transparent
      ctx.beginPath();
      const rx2 = x + padding;
      const ry2 = y + padding;
      const rw2 = w - padding * 2;
      const rh2 = h - padding * 2;
      const radius2 = 6;
      ctx.moveTo(rx2 + radius2, ry2);
      ctx.lineTo(rx2 + rw2 - radius2, ry2);
      ctx.quadraticCurveTo(rx2 + rw2, ry2, rx2 + rw2, ry2 + radius2);
      ctx.lineTo(rx2 + rw2, ry2 + rh2 - radius2);
      ctx.quadraticCurveTo(rx2 + rw2, ry2 + rh2, rx2 + rw2 - radius2, ry2 + rh2);
      ctx.lineTo(rx2 + radius2, ry2 + rh2);
      ctx.quadraticCurveTo(rx2, ry2 + rh2, rx2, ry2 + rh2 - radius2);
      ctx.lineTo(rx2, ry2 + radius2);
      ctx.quadraticCurveTo(rx2, ry2, rx2 + radius2, ry2);
      ctx.closePath();
      ctx.fill();

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rx2 + radius2, ry2);
        ctx.lineTo(rx2 + rw2 - radius2, ry2);
        ctx.quadraticCurveTo(rx2 + rw2, ry2, rx2 + rw2, ry2 + radius2);
        ctx.lineTo(rx2 + rw2, ry2 + rh2 - radius2);
        ctx.quadraticCurveTo(rx2 + rw2, ry2 + rh2, rx2 + rw2 - radius2, ry2 + rh2);
        ctx.lineTo(rx2 + radius2, ry2 + rh2);
        ctx.quadraticCurveTo(rx2, ry2 + rh2, rx2, ry2 + rh2 - radius2);
        ctx.lineTo(rx2, ry2 + radius2);
        ctx.quadraticCurveTo(rx2, ry2, rx2 + radius2, ry2);
        ctx.closePath();
        ctx.stroke();
      }

      // Target car label
      if (car.isTarget) {
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(11, cellSize * 0.3)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚗', x + w / 2, y + h / 2);
      }
    });

  }, [cars, selectedCarId, canvasSize, exitRow]);

  // ====== RENDER LOOP ======
  useEffect(() => {
    if (gameStarted) {
      drawGame();
    }
  }, [drawGame, gameStarted]);

  // ====== GET CAR AT POSITION ======
  const getCarAtPos = useCallback((pixelX, pixelY) => {
    const cellSize = canvasSize / GRID_SIZE;
    for (let i = cars.length - 1; i >= 0; i--) {
      const car = cars[i];
      const cx = car.col * cellSize;
      const cy = car.row * cellSize;
      const cw = car.orientation === 'H' ? car.length * cellSize : cellSize;
      const ch = car.orientation === 'V' ? car.length * cellSize : cellSize;
      if (pixelX >= cx && pixelX < cx + cw && pixelY >= cy && pixelY < cy + ch) {
        return car;
      }
    }
    return null;
  }, [cars, canvasSize]);

  // ====== MOVE CAR ======
  const moveCar = useCallback((carId, newRow, newCol) => {
    setCars(prevCars => {
      const newCars = prevCars.map(c => {
        if (c.id === carId) {
          return { ...c, row: newRow, col: newCol };
        }
        return c;
      });

      // Check grid validity
      const car = newCars.find(c => c.id === carId);
      if (!car) return prevCars;

      // Validate all cells for this car are within bounds (allow target car to exit)
      for (let i = 0; i < car.length; i++) {
        const r = car.orientation === 'V' ? car.row + i : car.row;
        const c = car.orientation === 'H' ? car.col + i : car.col;

        if (r < 0 || r >= GRID_SIZE) return prevCars;
        if (c < 0) return prevCars;
        if (!car.isTarget && c >= GRID_SIZE) return prevCars;
        if (car.isTarget) {
          if (car.orientation !== 'H') return prevCars;
          if (c > GRID_SIZE) return prevCars;
          if (c === GRID_SIZE && car.row !== exitRow) return prevCars;
        }
      }

      // Check for overlap with other cars
      for (const otherCar of newCars) {
        if (otherCar.id === carId) continue;
        for (let i = 0; i < car.length; i++) {
          const r1 = car.orientation === 'V' ? car.row + i : car.row;
          const c1 = car.orientation === 'H' ? car.col + i : car.col;
          for (let j = 0; j < otherCar.length; j++) {
            const r2 = otherCar.orientation === 'V' ? otherCar.row + j : otherCar.row;
            const c2 = otherCar.orientation === 'H' ? otherCar.col + j : otherCar.col;
            if (r1 === r2 && c1 === c2) return prevCars;
          }
        }
      }

      return newCars;
    });
  }, [exitRow]);

  // ====== HANDLE CLICK/TAP TO SELECT ======
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, [canvasSize]);

  const handlePointerDown = useCallback((e) => {
    if (gameWon || isSolving) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const car = getCarAtPos(pos.x, pos.y);

    if (car) {
      setSelectedCarId(car.id);
      dragRef.current = {
        carId: car.id,
        startX: pos.x,
        startY: pos.y,
        origCol: car.col,
        origRow: car.row,
        orientation: car.orientation
      };
    } else {
      setSelectedCarId(null);
    }
  }, [getCanvasPos, getCarAtPos, gameWon, isSolving]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current || gameWon || isSolving) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const cellSize = canvasSize / GRID_SIZE;
    const drag = dragRef.current;

    if (drag.orientation === 'H') {
      const dx = pos.x - drag.startX;
      const colDelta = Math.round(dx / cellSize);
      if (colDelta !== 0) {
        const newCol = drag.origCol + colDelta;
        moveCar(drag.carId, drag.origRow, newCol);
      }
    } else {
      const dy = pos.y - drag.startY;
      const rowDelta = Math.round(dy / cellSize);
      if (rowDelta !== 0) {
        const newRow = drag.origRow + rowDelta;
        moveCar(drag.carId, newRow, drag.origCol);
      }
    }
  }, [getCanvasPos, canvasSize, moveCar, gameWon, isSolving]);

  const handlePointerUp = useCallback((e) => {
    if (!dragRef.current || gameWon || isSolving) return;
    const drag = dragRef.current;
    const currentCar = cars.find(c => c.id === drag.carId);

    if (currentCar && (currentCar.col !== drag.origCol || currentCar.row !== drag.origRow)) {
      setMoves(prev => {
        const newMoves = prev + 1;
        setCars(prevCars => {
          if (checkWinRef.current?.(prevCars)) {
            handleWinRef.current?.(prevCars, newMoves);
          }
          return prevCars;
        });
        return newMoves;
      });
    }

    dragRef.current = null;
  }, [cars, gameWon, isSolving]);

  // ====== KEYBOARD CONTROLS ======
  const handleKeyDown = useCallback((e) => {
    if (selectedCarId === null || gameWon || isSolving) return;
    const car = cars.find(c => c.id === selectedCarId);
    if (!car) return;

    let newRow = car.row;
    let newCol = car.col;

    if (car.orientation === 'H') {
      if (e.key === 'ArrowLeft') newCol -= 1;
      else if (e.key === 'ArrowRight') newCol += 1;
      else return;
    } else {
      if (e.key === 'ArrowUp') newRow -= 1;
      else if (e.key === 'ArrowDown') newRow += 1;
      else return;
    }

    e.preventDefault();
    const prevCol = car.col;
    const prevRow = car.row;
    moveCar(car.id, newRow, newCol);

    setCars(prevCars => {
      const movedCar = prevCars.find(c => c.id === car.id);
      if (movedCar && (movedCar.col !== prevCol || movedCar.row !== prevRow)) {
        setMoves(prev => {
          const newMoves = prev + 1;
          if (checkWinRef.current?.(prevCars)) {
            handleWinRef.current?.(prevCars, newMoves);
          }
          return newMoves;
        });
      }
      return prevCars;
    });
  }, [selectedCarId, cars, moveCar, gameWon, isSolving]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ====== MOBILE DIRECTION BUTTONS ======
  const handleMoveBtn = useCallback((direction) => {
    if (selectedCarId === null || gameWon || isSolving) return;
    const car = cars.find(c => c.id === selectedCarId);
    if (!car) return;

    let newRow = car.row;
    let newCol = car.col;

    if (direction === 'up' && car.orientation === 'V') newRow -= 1;
    else if (direction === 'down' && car.orientation === 'V') newRow += 1;
    else if (direction === 'left' && car.orientation === 'H') newCol -= 1;
    else if (direction === 'right' && car.orientation === 'H') newCol += 1;
    else return;

    const prevCol = car.col;
    const prevRow = car.row;
    moveCar(car.id, newRow, newCol);

    setCars(prevCars => {
      const movedCar = prevCars.find(c => c.id === car.id);
      if (movedCar && (movedCar.col !== prevCol || movedCar.row !== prevRow)) {
        setMoves(prev => {
          const newMoves = prev + 1;
          if (checkWinRef.current?.(prevCars)) {
            handleWinRef.current?.(prevCars, newMoves);
          }
          return newMoves;
        });
      }
      return prevCars;
    });
  }, [selectedCarId, cars, moveCar, gameWon, isSolving]);

  const handleSolve = useCallback(() => {
    if (gameWon || isSolving) return;
    const currentCars = cars;
    if (!currentCars.length) return;
    carsRef.current = currentCars;

    const carDefs = currentCars.map(c => ({
      id: c.id,
      orientation: c.orientation,
      length: c.length,
      isTarget: !!c.isTarget
    }));
    const startPos = currentCars.flatMap(c => [c.row, c.col]);
    const solution = solveMinMoves(carDefs, startPos, exitRow);

    if (!solution || solution.length === 0) {
      return;
    }

    solvedByHintRef.current = true;
    setSolvedByHint(true);
    dragRef.current = null;
    setSelectedCarId(null);
    setIsSolving(true);

    let stepIndex = 0;
    let movesCount = movesRef.current;
    const stepMs = 220;

    if (solveTimerRef.current) clearInterval(solveTimerRef.current);
    solveTimerRef.current = setInterval(() => {
      if (stepIndex >= solution.length) {
        stopSolving();
        return;
      }

      const step = solution[stepIndex++];
      const carId = carDefs[step.carIndex].id;
      const beforeCars = carsRef.current;
      const nextCars = beforeCars.map(c => {
        if (c.id !== carId) return c;
        return { ...c, row: step.row, col: step.col };
      });
      carsRef.current = nextCars;
      setCars(nextCars);

      movesCount += 1;
      movesRef.current = movesCount;
      setMoves(movesCount);

      if (checkWinRef.current?.(nextCars)) {
        stopSolving();
        handleWinRef.current?.(nextCars, movesCount);
      }
    }, stepMs);
  }, [cars, exitRow, gameWon, isSolving, stopSolving]);

  // ====== NEXT LEVEL ======
  const handleNextLevel = useCallback(() => {
    stopSolving();
    const nextLevel = level + 1;
    if (nextLevel < LEVELS.length) {
      startLevel(nextLevel);
    } else {
      // All levels completed
      setShowLevelSelect(true);
      setGameStarted(false);
    }
  }, [level, startLevel, stopSolving]);

  // ====== RESTART LEVEL ======
  const handleRestart = useCallback(() => {
    solvedByHintRef.current = false;
    setSolvedByHint(false);
    stopSolving();
    startLevel(level);
  }, [level, startLevel, stopSolving]);

  // ====== BACK TO MENU ======
  const handleBackToMenuLocal = useCallback(() => {
    winHandledRef.current = false;
    stopSolving();
    setShowLevelSelect(true);
    setGameStarted(false);
    setGameWon(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (onBackToMenu) onBackToMenu(); // เรียกใช้ฟังก์ชันกลับเมนูหลักจาก Parent
  }, [onBackToMenu, stopSolving]);

  // ====== RENDER ======
  if (showLevelSelect) {
    return (
      <div className="traffic-game">
        <div className="game-header">
          <h3>🚗 จอดรถให้ได้ - Car Park Puzzle</h3>
          <p className="game-subtitle">เลื่อนรถให้รถสีแดงออกจากลานจอดได้</p>
        </div>

        <div className="level-select">
          <h4>เลือกระดับ</h4>
          <div className="level-grid">
            {LEVELS.map((lvl, idx) => (
              <button
                key={idx}
                className={`level-btn ${completedLevels.includes(idx) ? 'completed' : ''} ${idx === 0 || completedLevels.includes(idx - 1) || completedLevels.includes(idx) ? '' : 'locked'}`}
                onClick={() => {
                  if (idx === 0 || completedLevels.includes(idx - 1) || completedLevels.includes(idx)) {
                    startLevel(idx);
                  }
                }}
                disabled={idx > 0 && !completedLevels.includes(idx - 1) && !completedLevels.includes(idx)}
              >
                <div className="level-number">{idx + 1}</div>
                <div className="level-name">{lvl.name}</div>
                <div className="level-cars">{lvl.cars.length} คัน</div>
                {completedLevels.includes(idx) && (
                  <div className="level-stars">⭐</div>
                )}
                {levelScores[idx] && (
                  <div className="level-best">
                    Best: {levelScores[idx].score}/10
                  </div>
                )}
                {idx > 0 && !completedLevels.includes(idx - 1) && !completedLevels.includes(idx) && (
                  <div className="level-lock">🔒</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="game-instructions">
          <p>📌 คลิก/แตะเลือกรถ → ลากหรือใช้ปุ่มลูกศรเลื่อน</p>
          <p>🚗 รถแนวนอนเลื่อนได้เฉพาะซ้าย-ขวา</p>
          <p>🚙 รถแนวตั้งเลื่อนได้เฉพาะขึ้น-ลง</p>
          <p>🎯 นำรถสีแดงออกทางขวา (EXIT) เพื่อชนะ!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="traffic-game">
      <div className="game-header">
        <h3>🚗 {LEVELS[level].name}{levelVariantId ? ` ${levelVariantId}` : ''}</h3>
        <div className="game-stats">
          <div className="stat">⏱️ {formatTime(gameTime)}</div>
          <div className="stat">🔄 {moves} ครั้ง</div>
          <div className="stat">📊 Lv.{level + 1}/{LEVELS.length}</div>
        </div>
      </div>

      <div className="game-toolbar">
        <button onClick={handleRestart} className="toolbar-btn restart-btn" title="เริ่มใหม่" disabled={isSolving}>
          🔄 เริ่มใหม่
        </button>
        <button onClick={handleSolve} className="toolbar-btn solve-btn" title="เฉลย" disabled={isSolving || gameWon}>
          💡 เฉลย
        </button>
      </div>

      <div className="canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="game-canvas"
        />
      </div>

      <div className="game-instructions">
        <p>📌 คลิกเลือกรถ → ลาก หรือ ใช้ลูกศร/ปุ่มเคลื่อนที่</p>
        <p>🎯 นำรถสีแดง 🚗 ไปทาง EXIT ด้านขวาเพื่อชนะ!</p>
      </div>

      {/* Mobile Controls */}
      {selectedCarId !== null && !gameWon && !isSolving && (
        <div className="mobile-controls">
          <button
            className="direction-btn up-btn"
            onClick={() => handleMoveBtn('up')}
          >
            ▲
          </button>
          <div className="horizontal-buttons">
            <button
              className="direction-btn left-btn"
              onClick={() => handleMoveBtn('left')}
            >
              ◀
            </button>
            <button
              className="direction-btn down-btn"
              onClick={() => handleMoveBtn('down')}
            >
              ▼
            </button>
            <button
              className="direction-btn right-btn"
              onClick={() => handleMoveBtn('right')}
            >
              ▶
            </button>
          </div>
          <p className="control-hint">
            {cars.find(c => c.id === selectedCarId)?.orientation === 'H' ? '← → เลื่อนซ้าย-ขวา' : '↑ ↓ เลื่อนขึ้น-ลง'}
          </p>
        </div>
      )}

      {/* Win Modal */}
      {gameWon && !solvedByHint && (
        <div className="win-modal">
          <div className="win-content">
            <div className="win-icon">🎉</div>
            <h2>ยอดเยี่ยม!</h2>
            <p className="win-level">ผ่านระดับ {level + 1} แล้ว!</p>
            <div className="win-stats">
              <div className="win-stat">
                <span className="win-stat-label">เวลา</span>
                <span className="win-stat-value">{formatTime(gameTime)}</span>
              </div>
              <div className="win-stat">
                <span className="win-stat-label">จำนวนครั้ง</span>
                <span className="win-stat-value">{moves}</span>
              </div>
              <div className="win-stat">
                <span className="win-stat-label">คะแนน</span>
                <span className="win-stat-value">{calculateScore(moves)}/10</span>
              </div>
            </div>
            <div className="button-group">
              {level < LEVELS.length - 1 ? (
                <button onClick={handleNextLevel} className="next-btn">
                  ระดับถัดไป →
                </button>
              ) : (
                <div className="all-clear">
                  <p>🏆 คุณผ่านทุกระดับแล้ว!</p>
                </div>
              )}
              <button onClick={handleRestart} className="restart-game-btn">
                🔄 เล่นอีกครั้ง
              </button>
              <button onClick={() => { handleBackToMenuLocal(); if (onGameEnd) onGameEnd(); }} className="end-btn">
                จบเกม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrafficGame;
