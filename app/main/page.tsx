"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { Canvas } from "@react-three/fiber";
import { Center, OrbitControls, Text3D } from "@react-three/drei";

function Letter3D({ letter }: { letter: string }) {
  const display =
    letter === "No hand detected" || letter === "Unknown" || letter === ""
      ? "?"
      : letter;

  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 3, 4]} intensity={2.4} />
      <Center>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={2.25}
          height={0.35}
          curveSegments={18}
          bevelEnabled
          bevelThickness={0.04}
          bevelSize={0.04}
        >
          {display}
          <meshStandardMaterial color="#111827" />
        </Text3D>
      </Center>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2.2} />
    </Canvas>
  );
}

function distance(a: any, b: any) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function detectASL(hand: any[]): string {
  const tip = (i: number) => hand[i];
  const pip = (i: number) => hand[i - 2];

  const indexUp = tip(8).y < pip(8).y;
  const middleUp = tip(12).y < pip(12).y;
  const ringUp = tip(16).y < pip(16).y;
  const pinkyUp = tip(20).y < pip(20).y;

  const thumbTip = hand[4];
  const thumbIp = hand[3];
  const thumbBase = hand[2];

  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];

  const thumbOut = Math.abs(thumbTip.x - thumbBase.x) > 0.085;
  const thumbIndexDist = distance(thumbTip, indexTip);
  const thumbMiddleDist = distance(thumbTip, middleTip);
  const indexMiddleDist = distance(indexTip, middleTip);
  const middleRingDist = distance(middleTip, ringTip);
  const ringPinkyDist = distance(ringTip, pinkyTip);

  const allDown = !indexUp && !middleUp && !ringUp && !pinkyUp;
  const allUp = indexUp && middleUp && ringUp && pinkyUp;

  // F / O first because they use pinching
  if (thumbIndexDist < 0.055 && middleUp && ringUp && pinkyUp) return "F";

  if (
    thumbIndexDist < 0.08 &&
    indexMiddleDist < 0.09 &&
    middleRingDist < 0.1 &&
    ringPinkyDist < 0.12
  )
    return "O";

  // B, C, W
  if (allUp && !thumbOut) return "B";

  if (
    thumbIndexDist > 0.09 &&
    thumbIndexDist < 0.24 &&
    indexUp &&
    middleUp &&
    ringUp &&
    pinkyUp
  )
    return "C";

  if (indexUp && middleUp && ringUp && !pinkyUp) return "W";

  // U, V, R, K
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    if (Math.abs(indexTip.x - middleTip.x) < 0.025 && indexTip.y > middleTip.y)
      return "R";

    if (thumbTip.y < hand[6].y && thumbMiddleDist > 0.08) return "K";

    if (indexMiddleDist < 0.065) return "U";

    return "V";
  }

  // D, G, L, Z
  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    if (thumbMiddleDist < 0.11) return "D";
    if (thumbOut && Math.abs(indexTip.y - hand[5].y) < 0.16) return "G";
    if (thumbOut) return "L";
    return "Z";
  }

  // I, J, Y
  if (!indexUp && !middleUp && !ringUp && pinkyUp) {
    if (thumbOut) return "Y";
    return "I";
  }

  // A, E, M, N, S, T, X
  if (allDown) {
    if (indexTip.y < hand[6].y) return "X";

    if (thumbTip.x > hand[5].x && thumbTip.x < hand[9].x) return "T";

    if (thumbTip.y > hand[10].y && thumbTip.y < hand[14].y) return "M";

    if (thumbTip.y > hand[6].y && thumbTip.y < hand[10].y) return "N";

    if (thumbTip.y < thumbIp.y) return "A";

    if (thumbTip.y > thumbIp.y) return "E";

    if (!thumbOut) return "S";
  }

  // H
  if (
    indexUp &&
    middleUp &&
    !ringUp &&
    !pinkyUp &&
    indexMiddleDist < 0.075
  )
    return "H";

  // P / Q approximations
  if (allDown && thumbOut && thumbTip.y > thumbIp.y) return "Q";
  if (allDown && thumbOut) return "P";

  return "Unknown";
}

const ASL_GUIDE = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export default function Gestura() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentGesture, setCurrentGesture] = useState("No hand detected");
  const [detectedText, setDetectedText] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const lastGestureRef = useRef("");
  const stableCountRef = useRef(0);
  const lastAddedRef = useRef("");
  const gestureBufferRef = useRef<string[]>([]);

  const smoothGesture = (gesture: string) => {
    if (gesture === "Unknown" || gesture === "No hand detected") return gesture;

    gestureBufferRef.current.push(gesture);
    if (gestureBufferRef.current.length > 12) {
      gestureBufferRef.current.shift();
    }

    const count: Record<string, number> = {};
    gestureBufferRef.current.forEach((g) => {
      count[g] = (count[g] || 0) + 1;
    });

    return Object.keys(count).reduce((a, b) => (count[a] > count[b] ? a : b));
  };

  const addStableGesture = useCallback((gesture: string) => {
    if (gesture === "Unknown" || gesture === "No hand detected") return;

    if (gesture === lastGestureRef.current) {
      stableCountRef.current += 1;
      setConfidence(
        Math.min(100, Math.round((stableCountRef.current / 45) * 100))
      );
    } else {
      lastGestureRef.current = gesture;
      stableCountRef.current = 0;
      setConfidence(0);
    }

    if (stableCountRef.current > 45 && lastAddedRef.current !== gesture) {
      lastAddedRef.current = gesture;
      setDetectedText((prev) => (prev ? `${prev}${gesture}` : gesture));
    }
  }, []);

  const speakText = () => {
    if (!detectedText) return;
    const utterance = new SpeechSynthesisUtterance(detectedText);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  const clearText = () => {
    setDetectedText("");
    lastGestureRef.current = "";
    lastAddedRef.current = "";
    stableCountRef.current = 0;
    gestureBufferRef.current = [];
    setConfidence(0);
  };

  const deleteChar = () => {
    setDetectedText((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let animationId = 0;
    let stream: MediaStream | undefined;
    let isMounted = true;

    const start = async () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        video.srcObject = stream;
        await video.play();

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (!isMounted) return;
        setIsLoading(false);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const connections = [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
          [0, 5],
          [5, 6],
          [6, 7],
          [7, 8],
          [5, 9],
          [9, 10],
          [10, 11],
          [11, 12],
          [9, 13],
          [13, 14],
          [14, 15],
          [15, 16],
          [13, 17],
          [17, 18],
          [18, 19],
          [19, 20],
          [0, 17],
        ];

        const detect = () => {
          if (!video || !canvas || !handLandmarker) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          let gesture = "No hand detected";

          if (video.readyState >= 2) {
            const results = handLandmarker.detectForVideo(
              video,
              performance.now()
            );

            if (results.landmarks.length > 0) {
              const hand = results.landmarks[0];
              const rawGesture = detectASL(hand);
              gesture = smoothGesture(rawGesture);

              ctx.lineWidth = 2;
              ctx.strokeStyle = "rgba(17, 24, 39, 0.75)";

              connections.forEach(([a, b]) => {
                ctx.beginPath();
                ctx.moveTo(
                  hand[a].x * canvas.width,
                  hand[a].y * canvas.height
                );
                ctx.lineTo(
                  hand[b].x * canvas.width,
                  hand[b].y * canvas.height
                );
                ctx.stroke();
              });

              hand.forEach((point, index) => {
                ctx.beginPath();
                ctx.arc(
                  point.x * canvas.width,
                  point.y * canvas.height,
                  index === 0 ? 7 : 5,
                  0,
                  Math.PI * 2
                );
                ctx.fillStyle = index === 0 ? "#111827" : "#fff8e8";
                ctx.fill();
                ctx.strokeStyle = "#111827";
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });
            } else {
              gestureBufferRef.current = [];
              setConfidence(0);
            }
          }

          setCurrentGesture(gesture);
          addStableGesture(gesture);

          animationId = requestAnimationFrame(detect);
        };

        detect();
      } catch (error) {
        console.error("Camera or MediaPipe failed:", error);
        setCurrentGesture("Camera error");
        setIsLoading(false);
      }
    };

    start();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [addStableGesture]);

  const cleanGesture =
    currentGesture === "No hand detected" ||
    currentGesture === "Unknown" ||
    currentGesture === "Camera error"
      ? "?"
      : currentGesture;

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="label">Sign Language Alphabet</p>
          <h1>Gestura</h1>
          <p className="sub">Minimal ASL-based AR translator</p>
        </div>

        <span className={`status ${isLoading ? "loading" : ""}`}>
          {isLoading ? "Loading" : "Live"}
        </span>
      </section>

      <section className="cameraCard">
        <canvas ref={canvasRef} className="camera" />
        <video ref={videoRef} style={{ display: "none" }} />

        {isLoading && <div className="loadingBox">Initializing camera…</div>}

        <div className="letterBubble">
          <Letter3D letter={cleanGesture} />
        </div>

        <div className="detectedPill">
          <div>
            <span>Detected letter</span>
            <strong>{cleanGesture}</strong>
          </div>
          <div className="miniConfidence">
            <b>{confidence}%</b>
            <i>
              <em style={{ width: `${confidence}%` }} />
            </i>
          </div>
        </div>
      </section>

      <section className="outputCard">
        <div className="outputTop">
          <div>
            <span className="small">Translated Text</span>
            <h2>{detectedText || "—"}</h2>
          </div>
        </div>

        <div className="actions">
          <button onClick={speakText}>Speak</button>
          <button onClick={deleteChar}>Delete</button>
          <button onClick={clearText}>Clear</button>
        </div>
      </section>

      <section className="guide">
        <div className="guideTitle">
          <h3>ASL Alphabet</h3>
          <p>Based on the reference chart</p>
        </div>

        <div className="chips">
          {ASL_GUIDE.map((letter) => (
            <span
              key={letter}
              className={cleanGesture === letter ? "active" : ""}
            >
              {letter}
            </span>
          ))}
        </div>

        <p className="note">
          J and Z are movement-based signs, so this prototype approximates them
          using static hand posture. For 90%+ accuracy, use a trained ML model.
        </p>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .app {
          min-height: 100vh;
          padding: 14px;
          background: #f7ead0;
          color: #111827;
          font-family: Arial, sans-serif;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .label {
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.24em;
          font-size: 10px;
          font-weight: 900;
        }

        h1 {
          margin: 2px 0;
          font-family: Georgia, serif;
          font-size: 44px;
          line-height: 1;
        }

        .sub {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }

        .status {
          padding: 8px 14px;
          border-radius: 999px;
          background: #111827;
          color: #f7ead0;
          font-size: 13px;
          font-weight: 800;
        }

        .status.loading {
          opacity: 0.55;
        }

        .cameraCard {
          position: relative;
          overflow: hidden;
          border: 2px solid #111827;
          border-radius: 30px;
          background: #111827;
          box-shadow: 0 18px 35px rgba(17, 24, 39, 0.18);
        }

        .camera {
          width: 100%;
          display: block;
          aspect-ratio: 3 / 4;
          object-fit: cover;
        }

        .loadingBox {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(247, 234, 208, 0.92);
          font-weight: 900;
        }

        .letterBubble {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 118px;
          height: 118px;
          border-radius: 26px;
          background: rgba(247, 234, 208, 0.92);
          border: 2px solid #111827;
          overflow: hidden;
          box-shadow: 0 10px 20px rgba(17, 24, 39, 0.18);
        }

        .detectedPill {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 22px;
          background: rgba(247, 234, 208, 0.94);
          border: 2px solid #111827;
        }

        .detectedPill span {
          display: block;
          color: #6b7280;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .detectedPill strong {
          display: block;
          font-size: 34px;
          line-height: 1;
        }

        .miniConfidence {
          width: 92px;
          text-align: right;
          font-weight: 900;
        }

        .miniConfidence i {
          display: block;
          height: 8px;
          margin-top: 6px;
          border-radius: 999px;
          background: #eadfca;
          overflow: hidden;
        }

        .miniConfidence em {
          display: block;
          height: 100%;
          background: #111827;
          border-radius: 999px;
        }

        .outputCard,
        .guide {
          margin-top: 14px;
          padding: 16px;
          border: 2px solid #111827;
          border-radius: 26px;
          background: #fff8e8;
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.08);
        }

        .small {
          color: #6b7280;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        h2 {
          min-height: 48px;
          margin: 6px 0 0;
          font-size: 32px;
          word-break: break-all;
          letter-spacing: 0.06em;
        }

        .actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 14px;
        }

        button {
          padding: 13px 10px;
          border-radius: 16px;
          border: 2px solid #111827;
          background: #111827;
          color: #f7ead0;
          font-weight: 900;
          cursor: pointer;
        }

        button:nth-child(2),
        button:nth-child(3) {
          background: transparent;
          color: #111827;
        }

        .guideTitle {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: end;
          margin-bottom: 12px;
        }

        .guide h3 {
          margin: 0;
          font-size: 20px;
        }

        .guideTitle p {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
        }

        .chips {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .chips span {
          display: grid;
          place-items: center;
          height: 40px;
          border-radius: 14px;
          border: 2px solid #111827;
          font-weight: 900;
          background: #f7ead0;
        }

        .chips span.active {
          background: #111827;
          color: #f7ead0;
        }

        .note {
          margin: 12px 0 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.45;
        }

        @media (min-width: 900px) {
          .app {
            max-width: 1180px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1.3fr 0.7fr;
            gap: 18px;
          }

          .hero {
            grid-column: 1 / -1;
          }

          .camera {
            aspect-ratio: 16 / 9;
          }

          .outputCard,
          .guide {
            margin-top: 0;
          }

          .guide {
            align-self: start;
          }
        }a

        @media (max-width: 390px) {
          h1 {
            font-size: 36px;
          }

          .letterBubble {
            width: 100px;
            height: 100px;
          }

          .chips {
            grid-template-columns: repeat(6, 1fr);
          }
        }
      `}</style>
    </main>
  );
}