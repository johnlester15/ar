"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Point = { x: number; y: number; z?: number };
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

function dist2D(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function isExtended(hand: Point[], tipIdx: number, pipIdx: number, mcpIdx: number): boolean {
  return hand[tipIdx].y < hand[pipIdx].y && hand[pipIdx].y < hand[mcpIdx].y;
}

function isCurled(hand: Point[], tipIdx: number, pipIdx: number): boolean {
  return hand[tipIdx].y > hand[pipIdx].y;
}

function thumbExtended(hand: Point[]): boolean {
  const tip = hand[4], base = hand[2], wrist = hand[0];
  return dist2D(tip, wrist) > dist2D(base, wrist) * 1.3;
}

// ─── ASL Detection ────────────────────────────────────────────────────────────

function detectASLEnhanced(hand: Point[]): string {
  const wrist = hand[0];
  const thumbTip = hand[4], thumbMcp = hand[2];
  const indexTip = hand[8], indexPip = hand[6], indexMcp = hand[5];
  const middleTip = hand[12], middlePip = hand[10], middleMcp = hand[9];
  const ringTip = hand[16], ringPip = hand[14], ringMcp = hand[13];
  const pinkyTip = hand[20], pinkyPip = hand[18], pinkyMcp = hand[17];

  const indexUp = isExtended(hand, 8, 7, 5);
  const middleUp = isExtended(hand, 12, 11, 9);
  const ringUp = isExtended(hand, 16, 15, 13);
  const pinkyUp = isExtended(hand, 20, 19, 17);
  const thumbUp = thumbExtended(hand);

  const allDown = !indexUp && !middleUp && !ringUp && !pinkyUp;
  const allUp = indexUp && middleUp && ringUp && pinkyUp;

  const palmSize = dist2D(wrist, hand[9]);
  const norm = (d: number) => d / palmSize;

  const thumbIndex = dist2D(thumbTip, indexTip);
  const thumbMiddle = dist2D(thumbTip, middleTip);
  const indexMiddle = dist2D(indexTip, middleTip);
  const middleRing = dist2D(middleTip, ringTip);
  const ringPinky = dist2D(ringTip, pinkyTip);

  if (allDown && !thumbUp && norm(thumbIndex) > 0.3 && thumbTip.y < indexMcp.y) return "A";
  if (allUp && !thumbUp && thumbTip.x > indexMcp.x && thumbTip.x < pinkyMcp.x) return "B";
  if (!isCurled(hand, 8, 6) && !isCurled(hand, 12, 10) && !isCurled(hand, 16, 14) && !isCurled(hand, 20, 18) &&
    norm(thumbIndex) > 0.15 && norm(thumbIndex) < 0.5 && indexTip.y > indexMcp.y - palmSize * 0.2) return "C";
  if (indexUp && !middleUp && !ringUp && !pinkyUp && norm(thumbMiddle) < 0.2) return "D";
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbTip.y > indexTip.y && norm(thumbIndex) < 0.25) return "E";
  if (norm(thumbIndex) < 0.1 && middleUp && ringUp && pinkyUp && !indexUp) return "F";
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp && Math.abs(indexTip.x - indexMcp.x) > palmSize * 0.2) return "G";
  if (indexUp && middleUp && !ringUp && !pinkyUp && !thumbUp && indexMiddle < palmSize * 0.25) return "H";
  if (!indexUp && !middleUp && !ringUp && pinkyUp && !thumbUp) return "I";
  if (!indexUp && !middleUp && !ringUp && pinkyUp && thumbUp) return "J";
  if (indexUp && middleUp && !ringUp && !pinkyUp && thumbTip.y < hand[6].y && norm(thumbMiddle) < 0.35) return "K";
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp && Math.abs(indexTip.x - wrist.x) < palmSize * 0.4) return "L";
  if (allDown && thumbTip.y > indexTip.y && thumbTip.y > middleTip.y && thumbTip.y > ringTip.y && thumbTip.x > indexMcp.x) return "M";
  if (allDown && thumbTip.y > indexTip.y && thumbTip.y > middleTip.y && thumbTip.y < ringTip.y && thumbTip.x > indexMcp.x) return "N";
  if (norm(thumbIndex) < 0.15 && norm(indexMiddle) < 0.2 && norm(middleRing) < 0.2 && norm(ringPinky) < 0.2) return "O";
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp && indexTip.y > wrist.y) return "P";
  if (indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp && thumbTip.y > thumbMcp.y && indexTip.y > indexMcp.y) return "Q";
  if (indexUp && middleUp && !ringUp && !pinkyUp && norm(indexMiddle) < 0.06 && indexTip.x > middleTip.x - palmSize * 0.05) return "R";
  if (allDown && thumbTip.y < indexTip.y && norm(thumbIndex) < 0.3) return "S";
  if (allDown && thumbTip.x > indexMcp.x && thumbTip.x < middleMcp.x && thumbTip.y < indexTip.y) return "T";
  if (indexUp && middleUp && !ringUp && !pinkyUp && norm(indexMiddle) < 0.12) return "U";
  if (indexUp && middleUp && !ringUp && !pinkyUp && norm(indexMiddle) > 0.12) return "V";
  if (indexUp && middleUp && ringUp && !pinkyUp) return "W";
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && indexTip.y > indexPip.y && norm(thumbIndex) > 0.2) return "X";
  if (!indexUp && !middleUp && !ringUp && pinkyUp && thumbUp) return "Y";
  if (indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) return "Z";

  return "Unknown";
}

// ─── Gesture Smoothing ────────────────────────────────────────────────────────

class GestureSmoothing {
  buffer: string[] = [];
  bufferSize: number;
  constructor(bufferSize = 15) { this.bufferSize = bufferSize; }
  smooth(gesture: string): string {
    if (gesture === "Unknown" || gesture === "No hand detected") {
      this.buffer = [];
      return gesture;
    }
    this.buffer.push(gesture);
    if (this.buffer.length > this.bufferSize) this.buffer.shift();
    const counts: Record<string, number> = {};
    this.buffer.forEach(g => (counts[g] = (counts[g] || 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : gesture;
  }
}

// ─── Word Suggestions ─────────────────────────────────────────────────────────

const WORD_SUGGESTIONS: Record<string, string[]> = {
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

function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Point[],
  width: number,
  height: number,
  color = "#00ff88"
) {
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  HAND_CONNECTIONS.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height);
    ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height);
    ctx.stroke();
  });
  const tips = [4, 8, 12, 16, 20];
  landmarks.forEach((p, i) => {
    const isTip = tips.includes(i);
    ctx.globalAlpha = isTip ? 1 : 0.6;
    ctx.fillStyle = isTip ? "#ffffff" : color;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, isTip ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ─── AR Label ─────────────────────────────────────────────────────────────────

function ARLabel({ letter, confidence }: { letter: string; confidence: number }) {
  const color = confidence > 70 ? "#00ff88" : confidence > 40 ? "#ffcc00" : "#ff6644";
  return (
    <div style={{
      position: "absolute", top: 12, left: 12,
      fontFamily: "'Space Grotesk', monospace",
      fontWeight: 800,
      display: "flex", flexDirection: "column", gap: 4,
      zIndex: 3,
    }}>
      <div style={{
        fontSize: 72, lineHeight: 1, color,
        textShadow: `0 0 30px ${color}88`,
        letterSpacing: -3,
        transition: "color 0.3s, text-shadow 0.3s",
      }}>{letter}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, color, opacity: 0.8,
        letterSpacing: 2, textTransform: "uppercase",
      }}>
        {confidence > 0 ? `${confidence}% stable` : "detecting..."}
      </div>
    </div>
  );
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GesturaMain() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gesture, setGesture] = useState<string>("—");
  const [confidence, setConfidence] = useState<number>(0);
  const [text, setText] = useState<string>("");
  const [words, setWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [handVisible, setHandVisible] = useState<boolean>(false);
  const [mode, setMode] = useState<"translate" | "guide">("translate");
  const [cameraError, setCameraError] = useState<string>("");

  const smootherRef = useRef(new GestureSmoothing(15));
  const stableCountRef = useRef(0);
  const lastGestureRef = useRef("");
  const noHandCountRef = useRef(0);
  // Keep refs in sync with state for use inside the animation loop
  const currentWordRef = useRef("");
  const textRef = useRef("");

  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);
  useEffect(() => { textRef.current = text; }, [text]);

  const speak = (t: string) => {
    if (!t) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US"; u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const addLetter = useCallback((letter: string) => {
    if (!letter || letter === "Unknown" || letter === "—") return;
    setCurrentWord(prev => {
      const newWord = prev + letter;
      const sug = (WORD_SUGGESTIONS[letter] || []).filter(w => w.startsWith(newWord.slice(0, 3)));
      setSuggestions(sug.slice(0, 3));
      return newWord;
    });
    setText(prev => prev + letter);
  }, []);

  const addSpace = useCallback(() => {
    setCurrentWord(prev => {
      if (prev) setWords(w => [...w, prev]);
      return "";
    });
    setText(prev => prev + " ");
    setSuggestions([]);
  }, []);

  const applyWord = (word: string) => {
    const toRemove = currentWord.length;
    setText(prev => prev.slice(0, -toRemove) + word + " ");
    setWords(prev => [...prev, word]);
    setCurrentWord("");
    setSuggestions([]);
  };

  const handleDelete = () => {
    setText(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last === " ") setWords(w => w.slice(0, -1));
      else setCurrentWord(w => w.slice(0, -1));
      return prev.slice(0, -1);
    });
  };

  // ─── Vision Loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    let handLandmarker: HandLandmarker | undefined;
    let animId: number | undefined;
    let stream: MediaStream | undefined;
    let running = true;

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

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().then(() => {
            setIsLoading(false);
            setIsLive(true);
            if (running) loop();
          });
        };
      } catch (e: unknown) {
        console.error(e);
        setIsLoading(false);
        if (e instanceof Error) {
          if (e.name === "NotAllowedError") {
            setCameraError("Camera permission denied. Please allow camera access and reload.");
          } else if (e.name === "NotFoundError") {
            setCameraError("No camera found on this device.");
          } else {
            setCameraError("Could not start camera: " + e.message);
          }
        }
      }
    };

    const loop = () => {
      if (!running) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && handLandmarker && video.readyState >= 2) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const results = handLandmarker.detectForVideo(video, performance.now());

          if (results.landmarks.length > 0) {
            noHandCountRef.current = 0;
            setHandVisible(true);

            const raw = detectASLEnhanced(results.landmarks[0]);
            const smoothed = smootherRef.current.smooth(raw);

            drawHandSkeleton(
              ctx,
              results.landmarks[0],
              canvas.width,
              canvas.height,
              smoothed !== "Unknown" ? "#00ff88" : "#ff6644"
            );

            const detected = smoothed === "Unknown" ? "?" : smoothed;
            setGesture(detected);

            // Confidence + auto-add letter
            if (smoothed !== "Unknown" && smoothed !== "?") {
              if (smoothed === lastGestureRef.current) {
                stableCountRef.current = Math.min(stableCountRef.current + 1, 45);
              } else {
                stableCountRef.current = 0;
                lastGestureRef.current = smoothed;
              }
              const conf = Math.round((stableCountRef.current / 45) * 100);
              setConfidence(conf);

              // Auto-add letter when held stably for ~45 frames
              if (stableCountRef.current === 45) {
                addLetter(smoothed);
                stableCountRef.current = 0; // reset so it doesn't keep adding
              }
            } else {
              stableCountRef.current = 0;
              setConfidence(0);
            }
          } else {
            noHandCountRef.current++;
            if (noHandCountRef.current > 30) {
              setHandVisible(false);
              setGesture("—");
              setConfidence(0);
              stableCountRef.current = 0;
              lastGestureRef.current = "";
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    void init();

    return () => {
      running = false;
      if (animId !== undefined) cancelAnimationFrame(animId);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [addLetter]);

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
        .btn-back {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          border-radius: 10px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .btn-back:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2); }
        .btn-back:active { transform: scale(0.96); }
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
        .suggestion-chip:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* ← Back button */}
          <button className="btn-back" onClick={() => router.push("/")}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>Gestura</div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginTop: 1 }}>ASL Translator</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isLive ? "#00ff88" : "#555",
            boxShadow: isLive ? "0 0 8px #00ff88" : "none",
            transition: "all 0.3s",
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: isLive ? "#00ff88" : "#555", letterSpacing: 2, textTransform: "uppercase" }}>
            {isLoading ? "Loading" : isLive ? "Live" : "Offline"}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 4 }}>
        {(["translate", "guide"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMode(tab)}
            style={{
              flex: 1, padding: "8px", borderRadius: 10,
              border: "none",
              background: mode === tab ? "#fff" : "transparent",
              color: mode === tab ? "#000" : "#666",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: 1,
              transition: "all 0.2s", fontFamily: "inherit",
            }}
          >{tab}</button>
        ))}
      </div>

      {mode === "translate" ? (
        <>
          {/* Camera Viewport */}
          <div style={{
            position: "relative", width: "100%", aspectRatio: "1",
            background: "#000", borderRadius: 28, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {isLoading && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#000", zIndex: 10, flexDirection: "column", gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36,
                  border: "2px solid rgba(255,255,255,0.1)",
                  borderTop: "2px solid #00ff88",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                <span style={{ fontSize: 11, letterSpacing: 2, color: "#555", textTransform: "uppercase" }}>
                  Loading Vision
                </span>
              </div>
            )}

            {cameraError && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#0a0a0a", zIndex: 10, flexDirection: "column", gap: 12,
                padding: 24, textAlign: "center",
              }}>
                <div style={{ fontSize: 32 }}>📷</div>
                <span style={{ fontSize: 12, color: "#ff6644", lineHeight: 1.6 }}>{cameraError}</span>
              </div>
            )}

            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={640}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                transform: "scaleX(-1)",
                pointerEvents: "none", zIndex: 1,
              }}
            />

            {isLive && <div className="scan-line" />}
            {handVisible && <div className="pulse-ring" />}
            {isLive && <ARLabel letter={cleanLetter} confidence={confidence} />}

            {/* AR corner brackets */}
            {(["tl","tr","bl","br"] as const).map(c => (
              <div key={c} style={{
                position: "absolute", width: 20, height: 20,
                borderColor: "rgba(0,255,136,0.5)", borderStyle: "solid", borderWidth: 0,
                ...(c === "tl" ? { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 } : {}),
                ...(c === "tr" ? { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 } : {}),
                ...(c === "bl" ? { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 } : {}),
                ...(c === "br" ? { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 } : {}),
                zIndex: 3,
              }} />
            ))}

            {/* Confidence pill */}
            <div style={{
              position: "absolute", bottom: 14, right: 14,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
              borderRadius: 12, padding: "8px 12px",
              border: "1px solid rgba(255,255,255,0.08)",
              zIndex: 3, minWidth: 100,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 10, fontWeight: 700, color: "#666",
                textTransform: "uppercase", letterSpacing: 1,
              }}>
                <span>Stable</span>
                <span style={{ color: confidence > 70 ? "#00ff88" : confidence > 40 ? "#ffcc00" : "#666" }}>
                  {confidence}%
                </span>
              </div>
              <div className="confidence-bar">
                <div className="confidence-fill" style={{
                  width: `${confidence}%`,
                  background: confidence > 70 ? "#00ff88" : confidence > 40 ? "#ffcc00" : "#ff6644",
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
          <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              Translation
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 40, marginBottom: 16 }}>
              {words.map((w, i) => <span key={i} className="word-token">{w}</span>)}
              {currentWord && (
                <span className="word-token current">{currentWord}<span style={{ opacity: 0.5 }}>_</span></span>
              )}
              {!words.length && !currentWord && (
                <span style={{ fontSize: 14, color: "#333", fontStyle: "italic" }}>Hold a sign to begin…</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-solid" onClick={() => speak(text)} style={{ flex: 1 }}>▶ Speak</button>
              <button className="btn-ghost" onClick={addSpace}>Space</button>
              <button className="btn-ghost" onClick={handleDelete}>⌫</button>
              <button className="btn-ghost" onClick={() => { setText(""); setWords([]); setCurrentWord(""); setSuggestions([]); }}>✕</button>
            </div>
          </div>

          {/* Alphabet grid */}
          <div style={{ background: "#111", borderRadius: 24, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
              Alphabet
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
              {LETTERS.map(l => (
                <div key={l} className={`letter-key ${cleanLetter === l ? "active" : ""}`}>{l}</div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Guide Mode */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
              ASL Reference
            </div>
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
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, minWidth: 24, color: "#00ff88" }}>{l}</span>
                  <span style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              Tips for Better Detection
            </div>
            {[
              "Hold your hand 30–50cm from the camera",
              "Ensure good, even lighting on your hand",
              "Hold each sign steady for ~1.5 seconds until the letter is added",
              "Keep hand centered in the frame",
              "Lower your hand briefly between letters",
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