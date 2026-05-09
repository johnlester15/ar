"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// ─── Enhanced ASL Detection Engine ───────────────────────────────────────────

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);
}

function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Angle between three points (degrees)
function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  return Math.abs(Math.atan2(Math.abs(cross), dot) * 180 / Math.PI);
}

// Is a finger "extended" (straight up)?
function isExtended(hand, tipIdx, pipIdx, mcpIdx) {
  const tip = hand[tipIdx];
  const pip = hand[pipIdx];
  const mcp = hand[mcpIdx];
  return tip.y < pip.y && pip.y < mcp.y;
}

// Is a finger "curled" (bent into palm)?
function isCurled(hand, tipIdx, pipIdx) {
  return hand[tipIdx].y > hand[pipIdx].y;
}

// Thumb extension: horizontal spread from palm
function thumbExtended(hand) {
  const tip = hand[4];
  const base = hand[2];
  const wrist = hand[0];
  return dist2D(tip, wrist) > dist2D(base, wrist) * 1.3;
}

function detectASLEnhanced(hand) {
  const wrist = hand[0];
  const thumbTip = hand[4], thumbIp = hand[3], thumbMcp = hand[2], thumbCmc = hand[1];
  const indexTip = hand[8], indexPip = hand[7], indexDip = hand[6], indexMcp = hand[5];
  const middleTip = hand[12], middlePip = hand[11], middleMcp = hand[10];
  const ringTip = hand[16], ringPip = hand[15], ringMcp = hand[14];
  const pinkyTip = hand[20], pinkyPip = hand[19], pinkyMcp = hand[18];

  const indexUp = isExtended(hand, 8, 7, 5);
  const middleUp = isExtended(hand, 12, 11, 9);
  const ringUp = isExtended(hand, 16, 15, 13);
  const pinkyUp = isExtended(hand, 20, 19, 17);
  const thumbUp = thumbExtended(hand);

  const indexCurled = isCurled(hand, 8, 6);
  const middleCurled = isCurled(hand, 12, 10);
  const ringCurled = isCurled(hand, 16, 14);
  const pinkyCurled = isCurled(hand, 20, 18);

  const allDown = !indexUp && !middleUp && !ringUp && !pinkyUp;
  const allUp = indexUp && middleUp && ringUp && pinkyUp;

  // Key distances
  const thumbIndex = dist2D(thumbTip, indexTip);
  const thumbMiddle = dist2D(thumbTip, middleTip);
  const thumbRing = dist2D(thumbTip, ringTip);
  const thumbPinky = dist2D(thumbTip, pinkyTip);
  const indexMiddle = dist2D(indexTip, middleTip);
  const middleRing = dist2D(middleTip, ringTip);
  const ringPinky = dist2D(ringTip, pinkyTip);

  // Palm size for normalization
  const palmSize = dist2D(wrist, hand[9]);
  const norm = (d) => d / palmSize;

  // ─── Letter detection (improved) ──────────────────────────────────────────

  // A: Fist, thumb to side (not over fingers)
  if (allDown && !thumbUp && norm(thumbIndex) > 0.3 && thumbTip.y < indexMcp.y)
    return "A";

  // B: All four fingers up, thumb tucked across palm
  if (allUp && !thumbUp && thumbTip.x > indexMcp.x && thumbTip.x < pinkyMcp.x)
    return "B";

  // C: Curved, all fingers bent similarly
  if (!indexCurled && !middleCurled && !ringCurled && !pinkyCurled &&
    norm(thumbIndex) > 0.15 && norm(thumbIndex) < 0.5 &&
    indexTip.y > indexMcp.y - palmSize * 0.2)
    return "C";

  // D: Index up, others curled, thumb touches middle
  if (indexUp && !middleUp && !ringUp && !pinkyUp && norm(thumbMiddle) < 0.2)
    return "D";

  // E: All fingers bent, thumb tucked under
  if (!indexUp && !middleUp && !ringUp && !pinkyUp &&
    thumbTip.y > indexTip.y && norm(thumbIndex) < 0.25)
    return "E";

  // F: Index+thumb touch, others up
  if (norm(thumbIndex) < 0.1 && middleUp && ringUp && pinkyUp && !indexUp)
    return "F";

  // G: Index points sideways, thumb parallel
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp &&
    Math.abs(indexTip.x - indexMcp.x) > palmSize * 0.2)
    return "G";

  // H: Index + middle extended sideways
  if (indexUp && middleUp && !ringUp && !pinkyUp && !thumbUp &&
    indexMiddle < palmSize * 0.25)
    return "H";

  // I: Only pinky up
  if (!indexUp && !middleUp && !ringUp && pinkyUp && !thumbUp)
    return "I";

  // J: Only pinky up + thumb out (J involves motion but this is static approximation)
  if (!indexUp && !middleUp && !ringUp && pinkyUp && thumbUp)
    return "J";

  // K: Index + middle up, thumb between them
  if (indexUp && middleUp && !ringUp && !pinkyUp &&
    thumbTip.y < hand[6].y && norm(thumbMiddle) < 0.35)
    return "K";

  // L: Index up + thumb out (L-shape)
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp &&
    Math.abs(indexTip.x - wrist.x) < palmSize * 0.4)
    return "L";

  // M: Thumb under index+middle+ring (3 fingers over thumb)
  if (allDown && thumbTip.y > indexTip.y && thumbTip.y > middleTip.y && thumbTip.y > ringTip.y &&
    thumbTip.x > indexMcp.x)
    return "M";

  // N: Thumb under index+middle
  if (allDown && thumbTip.y > indexTip.y && thumbTip.y > middleTip.y &&
    thumbTip.y < ringTip.y && thumbTip.x > indexMcp.x)
    return "N";

  // O: All fingers curved to touch thumb
  if (norm(thumbIndex) < 0.15 && norm(indexMiddle) < 0.2 &&
    norm(middleRing) < 0.2 && norm(ringPinky) < 0.2)
    return "O";

  // P: Index pointing down, thumb out
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp &&
    indexTip.y > wrist.y)
    return "P";

  // Q: Index + thumb pointing down
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp &&
    thumbTip.y > thumbMcp.y && indexTip.y > indexMcp.y)
    return "Q";

  // R: Index + middle crossed/close
  if (indexUp && middleUp && !ringUp && !pinkyUp &&
    norm(indexMiddle) < 0.06 && indexTip.x > middleTip.x - palmSize * 0.05)
    return "R";

  // S: Fist, thumb over fingers
  if (allDown && thumbTip.y < indexTip.y && norm(thumbIndex) < 0.3)
    return "S";

  // T: Thumb between index and middle
  if (allDown && thumbTip.x > indexMcp.x && thumbTip.x < middleMcp.x &&
    thumbTip.y < indexTip.y)
    return "T";

  // U: Index + middle up, together
  if (indexUp && middleUp && !ringUp && !pinkyUp && norm(indexMiddle) < 0.12)
    return "U";

  // V: Index + middle up, spread apart
  if (indexUp && middleUp && !ringUp && !pinkyUp && norm(indexMiddle) > 0.12)
    return "V";

  // W: Index + middle + ring up
  if (indexUp && middleUp && ringUp && !pinkyUp)
    return "W";

  // X: Index slightly bent/hooked
  if (!indexUp && !middleUp && !ringUp && !pinkyUp &&
    indexTip.y > indexPip.y && norm(thumbIndex) > 0.2)
    return "X";

  // Y: Pinky + thumb out
  if (!indexUp && !middleUp && !ringUp && pinkyUp && thumbUp)
    return "Y";

  // Z: Index pointing, motion-implied
  if (indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp)
    return "Z";

  return "Unknown";
}

// ─── Gesture Smoothing & Word Builder ────────────────────────────────────────

class GestureSmoothing {
  constructor(bufferSize = 15) {
    this.buffer = [];
    this.bufferSize = bufferSize;
  }
  smooth(gesture) {
    if (gesture === "Unknown" || gesture === "No hand detected") {
      this.buffer = [];
      return gesture;
    }
    this.buffer.push(gesture);
    if (this.buffer.length > this.bufferSize) this.buffer.shift();
    const counts = {};
    this.buffer.forEach(g => counts[g] = (counts[g] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : gesture;
  }
}

// Common ASL words for suggestion
const WORD_SUGGESTIONS = {
  H: ["HELLO", "HI", "HELP", "HAND", "HAVE", "HOME"],
  T: ["THANK", "THE", "THIS", "TIME", "TODAY"],
  Y: ["YOU", "YES", "YOUR"],
  N: ["NO", "NAME", "NEED", "NOW"],
  G: ["GOOD", "GO", "GET", "GREAT"],
  W: ["WHAT", "WHERE", "WHEN", "WHO", "WHY", "WANT"],
  P: ["PLEASE", "PEOPLE"],
  L: ["LOVE", "LIKE", "LEARN"],
  S: ["SORRY", "SEE", "SAY"],
  M: ["MY", "ME", "MAYBE", "MORE"],
  I: ["I", "IS"],
  A: ["AND", "ARE", "ASK"],
  D: ["DO", "DONE", "DAY"],
  C: ["CAN", "COME", "CALL"],
  B: ["BUT", "BE", "BECAUSE"],
  F: ["FOR", "FEEL", "FROM", "FINE"],
  E: ["EVERYONE"],
  K: ["KNOW"],
  O: ["OK"],
  R: ["RIGHT", "REALLY"],
  U: ["UNDERSTAND"],
  V: ["VERY"],
};

// ─── Skeleton Renderer ────────────────────────────────────────────────────────

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17]
];

function drawHandSkeleton(ctx, landmarks, width, height, color = "#00ff88") {
  ctx.clearRect(0, 0, width, height);

  // Connections
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  HAND_CONNECTIONS.forEach(([a, b]) => {
    const pa = landmarks[a], pb = landmarks[b];
    ctx.beginPath();
    ctx.moveTo(pa.x * width, pa.y * height);
    ctx.lineTo(pb.x * width, pb.y * height);
    ctx.stroke();
  });

  // Fingertip glows
  const tips = [4, 8, 12, 16, 20];
  landmarks.forEach((p, i) => {
    const x = p.x * width, y = p.y * height;
    const isTip = tips.includes(i);
    ctx.globalAlpha = isTip ? 1 : 0.6;
    ctx.fillStyle = isTip ? "#ffffff" : color;
    ctx.beginPath();
    ctx.arc(x, y, isTip ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// ─── AR Label Overlay ─────────────────────────────────────────────────────────

function ARLabel({ letter, confidence }) {
  const color = confidence > 70 ? "#00ff88" : confidence > 40 ? "#ffcc00" : "#ff6644";
  return (
    <div style={{
      position: "absolute",
      top: 12, left: 12,
      fontFamily: "'Space Grotesk', monospace",
      fontWeight: 800,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      zIndex: 3
    }}>
      <div style={{
        fontSize: 72,
        lineHeight: 1,
        color,
        textShadow: `0 0 30px ${color}88`,
        letterSpacing: -3,
        transition: "color 0.3s, text-shadow 0.3s"
      }}>
        {letter}
      </div>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: color,
        opacity: 0.8,
        letterSpacing: 2,
        textTransform: "uppercase"
      }}>
        {confidence > 0 ? `${confidence}% stable` : "detecting..."}
      </div>
    </div>
  );
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function GesturaEnhanced() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [gesture, setGesture] = useState("—");
  const [confidence, setConfidence] = useState(0);
  const [text, setText] = useState("");
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [handVisible, setHandVisible] = useState(false);
  const [mode, setMode] = useState("translate"); // translate | guide
  const [spaceTimer, setSpaceTimer] = useState(0);

  const smootherRef = useRef(new GestureSmoothing(15));
  const stableCountRef = useRef(0);
  const lastGestureRef = useRef("");
  const lastAddedRef = useRef("");
  const noHandCountRef = useRef(0);
  const spaceTimerRef = useRef(null);

  const speak = (t) => {
    if (!t) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const addLetter = useCallback((letter) => {
    if (!letter || letter === "Unknown" || letter === "—") return;
    const newWord = currentWord + letter;
    setCurrentWord(newWord);
    setText(prev => prev + letter);

    const sug = (WORD_SUGGESTIONS[letter] || []).filter(w => w.startsWith(newWord.slice(0, 3)));
    setSuggestions(sug.slice(0, 3));
    lastAddedRef.current = letter;
  }, [currentWord]);

  const addSpace = useCallback(() => {
    if (currentWord) {
      setWords(prev => [...prev, currentWord]);
    }
    setCurrentWord("");
    setText(prev => prev + " ");
    setSuggestions([]);
  }, [currentWord]);

  const applyWord = (word) => {
    const toRemove = currentWord.length;
    setText(prev => prev.slice(0, -toRemove) + word + " ");
    setWords(prev => [...prev, word]);
    setCurrentWord("");
    setSuggestions([]);
  };

  const handleDelete = () => {
    if (text.length === 0) return;
    const last = text[text.length - 1];
    setText(prev => prev.slice(0, -1));
    if (last === " ") {
      setWords(prev => prev.slice(0, -1));
    } else {
      setCurrentWord(prev => prev.slice(0, -1));
    }
  };

  // Main vision loop
  useEffect(() => {
    let handLandmarker;
    let animId;
    let stream;

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 640 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsLoading(false);
            setIsLive(true);
            loop();
          };
        }
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    };

    const loop = () => {
      if (videoRef.current && canvasRef.current && handLandmarker) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const results = handLandmarker.detectForVideo(videoRef.current, performance.now());

        if (results.landmarks.length > 0) {
          noHandCountRef.current = 0;
          setHandVisible(true);
          const raw = detectASLEnhanced(results.landmarks[0]);
          const smoothed = smootherRef.current.smooth(raw);

          drawHandSkeleton(ctx, results.landmarks[0], canvas.width, canvas.height,
            smoothed !== "Unknown" ? "#00ff88" : "#ff6644");

          setGesture(smoothed === "Unknown" ? "?" : smoothed);

          if (smoothed !== "Unknown") {
            if (smoothed === lastGestureRef.current) {
              stableCountRef.current++;
              setConfidence(Math.min(100, Math.round((stableCountRef.current / 40) * 100)));
            } else {
              lastGestureRef.current = smoothed;
              stableCountRef.current = 0;
              setConfidence(0);
              lastAddedRef.current = "";
            }

            if (stableCountRef.current > 40 && lastAddedRef.current !== smoothed) {
              addLetter(smoothed);
            }
          }
        } else {
          noHandCountRef.current++;
          if (noHandCountRef.current > 30) {
            setHandVisible(false);
            setGesture("—");
            setConfidence(0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          // Auto-add space after 1.5s no hand
          if (noHandCountRef.current === 45 && lastAddedRef.current !== " ") {
            lastAddedRef.current = " ";
            addSpace();
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    init();
    return () => {
      cancelAnimationFrame(animId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [addLetter, addSpace]);

  const cleanLetter = gesture === "Unknown" || gesture === "" ? "?" : gesture;

  return (
    <main style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "'Space Grotesk', 'DM Sans', system-ui, sans-serif",
      padding: "16px",
      maxWidth: 420,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        
        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.25); }
        .btn-ghost:active { transform: scale(0.96); }
        .btn-solid {
          background: #fff;
          border: none;
          color: #000;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .btn-solid:hover { background: #e5e5e5; }
        .btn-solid:active { transform: scale(0.96); }
        .letter-key {
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.3);
          transition: all 0.2s;
          font-family: 'DM Mono', monospace;
        }
        .letter-key.active {
          color: #fff;
          border-color: #00ff88;
          background: rgba(0,255,136,0.1);
          box-shadow: 0 0 12px rgba(0,255,136,0.3);
        }
        .suggestion-chip {
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 1px;
          color: #aaa;
        }
        .suggestion-chip:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: rgba(255,255,255,0.3);
        }
        .pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 32px;
          border: 2px solid rgba(0,255,136,0.4);
          animation: pulse-ring 1.5s ease infinite;
        }
        @keyframes pulse-ring {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.03); }
        }
        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,255,136,0.6), transparent);
          animation: scan 3s linear infinite;
          pointer-events: none;
          z-index: 2;
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .confidence-bar {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 6px;
        }
        .confidence-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.2s ease, background 0.3s;
        }
        .word-token {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(255,255,255,0.08);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #ccc;
        }
        .word-token.current {
          background: rgba(0,255,136,0.12);
          color: #00ff88;
          border: 1px solid rgba(0,255,136,0.3);
        }
      `}</style>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Gestura</div>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>ASL Translator</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isLive ? "#00ff88" : "#555",
            boxShadow: isLive ? "0 0 8px #00ff88" : "none",
            transition: "all 0.3s"
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: isLive ? "#00ff88" : "#555", letterSpacing: 2, textTransform: "uppercase" }}>
            {isLoading ? "Loading" : isLive ? "Live" : "Offline"}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 4 }}>
        {["translate", "guide"].map(tab => (
          <button
            key={tab}
            onClick={() => setMode(tab)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: 10,
              border: "none",
              background: mode === tab ? "#fff" : "transparent",
              color: mode === tab ? "#000" : "#666",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: 1,
              transition: "all 0.2s",
              fontFamily: "inherit"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {mode === "translate" ? (
        <>
          {/* Camera viewport */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: "#000", borderRadius: 28, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {isLoading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000", zIndex: 10, flexDirection: "column", gap: 12 }}>
                <div style={{ width: 36, height: 36, border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #00ff88", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 11, letterSpacing: 2, color: "#555", textTransform: "uppercase" }}>Loading Vision</span>
              </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} playsInline muted />
            <canvas ref={canvasRef} width={640} height={640} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "scaleX(-1)", pointerEvents: "none", zIndex: 1 }} />

            {isLive && <div className="scan-line" />}
            {handVisible && <div className="pulse-ring" />}

            {/* AR Letter overlay */}
            {isLive && <ARLabel letter={cleanLetter} confidence={confidence} />}

            {/* Corner brackets (AR aesthetic) */}
            {["tl","tr","bl","br"].map(c => (
              <div key={c} style={{
                position: "absolute",
                width: 20, height: 20,
                borderColor: "rgba(0,255,136,0.5)",
                borderStyle: "solid",
                borderWidth: 0,
                ...(c === "tl" ? { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 } : {}),
                ...(c === "tr" ? { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 } : {}),
                ...(c === "bl" ? { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 } : {}),
                ...(c === "br" ? { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 } : {}),
                zIndex: 3
              }} />
            ))}

            {/* Status pill */}
            <div style={{
              position: "absolute", bottom: 14, right: 14,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: 12,
              padding: "8px 12px",
              border: "1px solid rgba(255,255,255,0.08)",
              zIndex: 3,
              minWidth: 100
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>
                <span>Stable</span>
                <span style={{ color: confidence > 70 ? "#00ff88" : confidence > 40 ? "#ffcc00" : "#666" }}>{confidence}%</span>
              </div>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{
                  width: `${confidence}%`,
                  background: confidence > 70 ? "#00ff88" : confidence > 40 ? "#ffcc00" : "#ff6644"
                }} />
              </div>
            </div>
          </div>

          {/* Word suggestions */}
          {suggestions.length > 0 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              {suggestions.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => applyWord(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Translation output */}
          <div style={{
            background: "#111",
            borderRadius: 24,
            padding: 20,
            border: "1px solid rgba(255,255,255,0.07)"
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Translation</div>

            {/* Word tokens */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 40, marginBottom: 16 }}>
              {words.map((w, i) => (
                <span key={i} className="word-token">{w}</span>
              ))}
              {currentWord && (
                <span className="word-token current">{currentWord}<span style={{ opacity: 0.5 }}>_</span></span>
              )}
              {!words.length && !currentWord && (
                <span style={{ fontSize: 14, color: "#333", fontStyle: "italic" }}>Hold a sign to begin…</span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-solid" onClick={() => speak(text)} style={{ flex: 1 }}>
                ▶ Speak
              </button>
              <button className="btn-ghost" onClick={addSpace}>Space</button>
              <button className="btn-ghost" onClick={handleDelete}>⌫</button>
              <button className="btn-ghost" onClick={() => { setText(""); setWords([]); setCurrentWord(""); setSuggestions([]); }}>✕</button>
            </div>
          </div>

          {/* Alphabet indicator */}
          <div style={{ background: "#111", borderRadius: 24, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Alphabet</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
              {LETTERS.map(l => (
                <div key={l} className={`letter-key ${cleanLetter === l ? "active" : ""}`}>{l}</div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Guide mode */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>ASL Reference</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {[
                { l: "A", d: "Fist, thumb to side" },
                { l: "B", d: "All fingers up, thumb tucked" },
                { l: "C", d: "Curved hand open" },
                { l: "D", d: "Index up, thumb+middle touch" },
                { l: "E", d: "Fingers bent, thumb under" },
                { l: "F", d: "Index+thumb pinch, others up" },
                { l: "G", d: "Index+thumb point sideways" },
                { l: "H", d: "Index+middle flat sideways" },
                { l: "I", d: "Pinky only up" },
                { l: "L", d: "L-shape: index up, thumb out" },
                { l: "O", d: "All fingertips meet thumb" },
                { l: "V", d: "Index+middle V spread apart" },
                { l: "Y", d: "Pinky + thumb extended" },
                { l: "W", d: "3 fingers up (idx+mid+ring)" },
              ].map(({ l, d }) => (
                <div key={l} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.06)"
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, minWidth: 24, color: "#00ff88" }}>{l}</span>
                  <span style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Tips for Better Detection</div>
            {[
              "Hold your hand 30–50cm from the camera",
              "Ensure good, even lighting on your hand",
              "Hold each sign steady for ~1.5 seconds",
              "Keep hand centered in the frame",
              "Lower your hand briefly to add a space between letters",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, minWidth: 18, paddingTop: 1 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}