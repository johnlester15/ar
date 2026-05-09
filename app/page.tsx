"use client"

import { useEffect, useState } from "react"

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [activeGesture, setActiveGesture] = useState(0)
  const [scanLine, setScanLine] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", handleMouse)
    return () => window.removeEventListener("mousemove", handleMouse)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGesture((p) => (p + 1) % 4)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let frame: number
    let start: number | null = null
    const animate = (ts: number) => {
      if (!start) start = ts
      const elapsed = (ts - start) % 3000
      setScanLine(Math.floor((elapsed / 3000) * 100))
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const px = typeof window !== "undefined" ? (mousePos.x / window.innerWidth - 0.5) * 14 : 0
  const py = typeof window !== "undefined" ? (mousePos.y / window.innerHeight - 0.5) * 14 : 0

  const gestures = [
    { label: "Closed Fist", translation: "Letter A", conf: 98.4 },
    { label: "Open Palm", translation: "Letter B", conf: 97.1 },
    { label: "Curved Hand", translation: "Letter C", conf: 99.0 },
    { label: "Circle Sign", translation: "Affirmative", conf: 96.8 },
  ]

  const techs = [
    { id: "CV", name: "Computer Vision", desc: "Hand detection, landmark tracking, gesture segmentation and real-time image preprocessing via device camera." },
    { id: "ML", name: "Machine Learning", desc: "TensorFlow-powered deep learning model trained on ASL datasets for high-accuracy gesture classification." },
    { id: "AR", name: "Augmented Reality", desc: "Live camera overlay renders translated text directly atop the gesture in real time — no context switching." },
    { id: "TTS", name: "Text to Speech", desc: "Optional voice output converts recognized signs to spoken language, bridging deaf and hearing worlds." },
  ]

  const features = [
    { num: "01", title: "Real-Time Gesture Translation", desc: "Processes hand landmarks at inference speeds under 40ms, enabling fluid, uninterrupted communication." },
    { num: "02", title: "Alphabet & Word Recognition", desc: "Covers the full A–Z fingerspelling alphabet and common word-level gestures from ASL datasets." },
    { num: "03", title: "AR Overlay Interface", desc: "Translations are rendered directly over the camera feed, keeping the interaction natural and immediate." },
    { num: "04", title: "Learning Mode", desc: "Practice mode provides guided gesture feedback, helping users build proficiency in sign language." },
    { num: "05", title: "Accessibility First", desc: "Built to bridge the communication gap for the deaf and hard-of-hearing community, not as an afterthought." },
  ]

  const team = [
    { name: "Monleon, John Lawrence" },
    { name: "Defensor, John Lester" },
    { name: "Andales, Ivan-J" },
    { name: "Tripoli, Ivanne" },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Outfit:wght@200;300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:     #060b14;
          --bg2:    #0b1220;
          --panel:  rgba(255,255,255,0.03);
          --border: rgba(0,220,170,0.12);
          --green:  #00dcaa;
          --green2: #00ffcc;
          --text:   rgba(255,255,255,0.92);
          --muted:  rgba(255,255,255,0.45);
          --dim:    rgba(255,255,255,0.18);
          --mono:   'Space Mono', monospace;
          --sans:   'Outfit', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.6;
        }

        /* ── NAV ── */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 2.4rem;
          background: rgba(6,11,20,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          opacity: 0;
          transform: translateY(-20px);
          transition: opacity 600ms ease 200ms, transform 500ms ease 200ms;
        }
        .ready nav { opacity: 1; transform: translateY(0); }

        .nav-brand {
          font-family: var(--mono);
          font-size: 0.95rem;
          letter-spacing: 0.08em;
          color: var(--green);
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-brand span { color: var(--text); }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
        }
        .nav-links a {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--green); }

        .nav-badge {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.5rem 1.1rem;
          border: 1px solid var(--green);
          color: var(--green);
          border-radius: 2px;
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
          flex-shrink: 0;
        }
        .nav-badge:hover { background: var(--green); color: var(--bg); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 7rem 4rem 4rem;
          position: relative;
          overflow: hidden;
          gap: 3rem;
        }

        .hero-glow {
          position: absolute;
          width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,220,170,0.07) 0%, transparent 70%);
          top: 50%; left: 50%;
          pointer-events: none;
          transition: transform 0.1s ease;
        }

        .hero-grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,220,170,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,220,170,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .hero-left { position: relative; z-index: 2; }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--green);
          border: 1px solid rgba(0,220,170,0.25);
          padding: 0.4rem 0.9rem;
          border-radius: 2px;
          margin-bottom: 1.6rem;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 600ms ease 400ms, transform 500ms ease 400ms;
        }
        .hero-tag::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--green);
          animation: pulse 2s infinite;
        }
        .ready .hero-tag { opacity: 1; transform: translateY(0); }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .hero-title {
          font-family: var(--sans);
          font-size: clamp(2.6rem, 5.5vw, 5.4rem);
          font-weight: 700;
          line-height: 1.0;
          letter-spacing: -0.03em;
          margin-bottom: 1.4rem;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 700ms ease 500ms, transform 600ms ease 500ms;
        }
        .ready .hero-title { opacity: 1; transform: translateY(0); }
        .hero-title .accent { color: var(--green); }
        .hero-title .dim-word { color: var(--dim); font-weight: 200; }

        .hero-sub {
          font-size: 1rem;
          font-weight: 300;
          line-height: 1.75;
          color: var(--muted);
          max-width: 40ch;
          margin-bottom: 2rem;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 600ms ease 650ms, transform 500ms ease 650ms;
        }
        .ready .hero-sub { opacity: 1; transform: translateY(0); }

        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.4rem;
          margin-bottom: 2rem;
          opacity: 0;
          transition: opacity 600ms ease 750ms;
        }
        .ready .hero-meta { opacity: 1; }

        .meta-item {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--dim);
          text-transform: uppercase;
        }
        .meta-item span { display: block; color: var(--green); font-size: 0.72rem; margin-bottom: 0.2rem; }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 600ms ease 850ms, transform 500ms ease 850ms;
        }
        .ready .hero-actions { opacity: 1; transform: translateY(0); }

        .btn-solid {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.8rem 1.6rem;
          background: var(--green);
          color: var(--bg);
          border: none;
          border-radius: 2px;
          text-decoration: none;
          font-weight: 700;
          transition: background 0.2s, transform 0.15s;
          display: inline-block;
        }
        .btn-solid:hover { background: var(--green2); transform: translateY(-2px); }

        .btn-ghost {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.8rem 1.4rem;
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 2px;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
          display: inline-block;
        }
        .btn-ghost:hover { border-color: var(--green); color: var(--green); }

        /* ── AR VIEWFINDER ── */
        .ar-viewfinder {
          position: relative;
          aspect-ratio: 4/5;
          max-height: 500px;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(0,220,170,0.2);
          border-radius: 4px;
          overflow: hidden;
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 800ms ease 600ms, transform 700ms ease 600ms;
        }
        .ready .ar-viewfinder { opacity: 1; transform: translateX(0); }

        .ar-viewfinder::before, .ar-viewfinder::after {
          content: '';
          position: absolute;
          width: 22px; height: 22px;
          z-index: 10;
        }
        .ar-viewfinder::before { top: 12px; left: 12px; border-top: 2px solid var(--green); border-left: 2px solid var(--green); }
        .ar-viewfinder::after  { bottom: 12px; right: 12px; border-bottom: 2px solid var(--green); border-right: 2px solid var(--green); }

        .ar-corner-tr { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-top: 2px solid var(--green); border-right: 2px solid var(--green); z-index: 10; }
        .ar-corner-bl { position: absolute; bottom: 12px; left: 12px; width: 22px; height: 22px; border-bottom: 2px solid var(--green); border-left: 2px solid var(--green); z-index: 10; }

        .ar-scan {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--green), transparent);
          z-index: 8;
          box-shadow: 0 0 12px var(--green);
          transition: top 0.05s linear;
        }

        .ar-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,220,170,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,220,170,0.05) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .ar-hand-area {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landmark {
          position: absolute;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          transform: translate(-50%, -50%);
        }

        .ar-readout {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(6,11,20,0.96));
          padding: 2.4rem 1.4rem 1.2rem;
          z-index: 9;
        }

        .readout-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 0.35rem;
        }

        .readout-translation {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
          line-height: 1;
          margin-bottom: 0.55rem;
        }

        .readout-bar {
          height: 2px;
          background: rgba(255,255,255,0.08);
          border-radius: 1px;
          overflow: hidden;
          margin-bottom: 0.35rem;
        }
        .readout-fill { height: 100%; background: var(--green); border-radius: 1px; transition: width 0.6s ease; }

        .readout-conf {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--muted);
          display: flex;
          justify-content: space-between;
        }

        .ar-hud-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          padding: 0.8rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          color: var(--green);
        }

        /* ── MARQUEE ── */
        .marquee {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 0.75rem 0;
          overflow: hidden;
          background: rgba(0,220,170,0.02);
        }
        .marquee-inner {
          display: flex;
          gap: 2.5rem;
          animation: slide 28s linear infinite;
          width: max-content;
        }
        .marquee-item {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--dim);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .marquee-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--green); opacity: 0.5; }
        @keyframes slide { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── SHARED SECTION ── */
        .section-wrap { padding: 5rem 4rem; }

        .section-label {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .section-label::before { content: ''; width: 18px; height: 1px; background: var(--green); }

        .section-heading {
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-bottom: 0.9rem;
        }

        .section-body {
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.75;
          color: var(--muted);
          max-width: 48ch;
        }

        /* ── TECH ── */
        .tech-section { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          margin-top: 2.5rem;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .tech-card { background: var(--bg2); padding: 1.8rem 1.4rem; transition: background 0.2s; }
        .tech-card:hover { background: rgba(0,220,170,0.04); }

        .tech-id {
          font-family: var(--mono);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--green);
          letter-spacing: -0.02em;
          margin-bottom: 0.7rem;
          opacity: 0.6;
        }
        .tech-name { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text); }
        .tech-desc { font-size: 0.84rem; font-weight: 300; line-height: 1.65; color: var(--muted); }

        /* ── ARCHITECTURE ── */
        .arch-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
        }

        .arch-layer {
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 1.1rem 1.4rem;
          margin-bottom: 0.7rem;
          background: var(--panel);
          position: relative;
          overflow: hidden;
        }
        .arch-layer::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--green);
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .arch-layer:hover::before { opacity: 1; }

        .arch-layer-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 0.4rem;
        }
        .arch-layer-title { font-size: 0.9rem; font-weight: 600; color: var(--text); margin-bottom: 0.4rem; }
        .arch-layer-items { display: flex; flex-wrap: wrap; gap: 0.4rem; }

        .arch-tag {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.18rem 0.5rem;
          background: rgba(0,220,170,0.08);
          border: 1px solid rgba(0,220,170,0.15);
          border-radius: 2px;
          color: var(--green);
        }

        .arch-arrow {
          text-align: center;
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--dim);
          margin: 0 0 0.7rem;
          letter-spacing: 0.1em;
        }

        /* ── FEATURES ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          margin-top: 2.5rem;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .feature-card { background: var(--bg); padding: 1.8rem; transition: background 0.2s; }
        .feature-card:hover { background: rgba(0,220,170,0.03); }

        .feat-num { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.1em; color: var(--dim); margin-bottom: 0.9rem; }
        .feat-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text); }
        .feat-desc { font-size: 0.84rem; font-weight: 300; line-height: 1.65; color: var(--muted); }

        /* ── GESTURE TABLE ── */
        .gesture-table-section { background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }

        .gtable { width: 100%; border-collapse: collapse; margin-top: 2.2rem; font-family: var(--mono); font-size: 0.74rem; }
        .gtable thead th {
          padding: 0.7rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--dim);
          font-weight: 400;
        }
        .gtable tbody tr { border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
        .gtable tbody tr:hover { background: rgba(0,220,170,0.03); }
        .gtable td { padding: 0.9rem 1rem; color: var(--muted); vertical-align: middle; }
        .gtable td:first-child { color: var(--text); font-weight: 700; }

        .conf-bar { display: flex; align-items: center; gap: 0.7rem; }
        .conf-track { flex: 1; height: 2px; background: rgba(255,255,255,0.06); border-radius: 1px; overflow: hidden; }
        .conf-fill { height: 100%; background: var(--green); border-radius: 1px; }

        /* mobile table scroll */
        .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

        /* ── TEAM ── */
        .team-section { border-top: 1px solid var(--border); text-align: center; }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          margin-top: 2.5rem;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }

        .team-card { background: var(--bg); padding: 2rem 1.2rem; text-align: center; }

        .team-avatar {
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: linear-gradient(135deg, rgba(0,220,170,0.1), rgba(14,165,233,0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: 1rem;
          color: var(--green);
          margin: 0 auto 0.9rem;
        }

        .team-name { font-size: 0.84rem; font-weight: 500; color: var(--text); line-height: 1.4; }
        .team-role { font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dim); margin-top: 0.3rem; }

        /* ── FOOTER ── */
        footer {
          border-top: 1px solid var(--border);
          padding: 1.8rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: var(--dim);
          flex-wrap: wrap;
          gap: 0.6rem;
        }
        .footer-brand { font-size: 0.78rem; color: var(--green); }

        /* ── RESPONSIVE ── */

        /* Tablet */
        @media (max-width: 1024px) {
          .hero { padding: 7rem 2.4rem 3rem; gap: 2.4rem; }
          .section-wrap { padding: 5rem 2.4rem; }
          .tech-grid { grid-template-columns: 1fr 1fr; }
          footer { padding: 1.8rem 2.4rem; }
        }

        /* Mobile landscape / small tablet */
        @media (max-width: 860px) {
          nav { padding: 1rem 1.4rem; }
          .nav-links { display: none; }

          .hero {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 5.5rem 1.4rem 2.5rem;
            gap: 2rem;
          }

          .hero-title { font-size: clamp(2.2rem, 8vw, 3.2rem); }

          .ar-viewfinder {
            max-height: 320px;
            aspect-ratio: 3/2;
          }

          .section-wrap { padding: 4rem 1.4rem; }

          .arch-section { grid-template-columns: 1fr; gap: 2.4rem; }

          .features-grid { grid-template-columns: 1fr 1fr; }

          .team-grid { grid-template-columns: 1fr 1fr; }

          footer { padding: 1.6rem 1.4rem; flex-direction: column; text-align: center; gap: 0.4rem; }
        }

        /* Mobile portrait */
        @media (max-width: 540px) {
          nav { padding: 0.9rem 1rem; }
          .nav-brand { font-size: 0.82rem; }
          .nav-badge { font-size: 0.58rem; padding: 0.4rem 0.8rem; }

          .hero { padding: 5rem 1rem 2rem; gap: 1.8rem; }
          .hero-title { font-size: clamp(2rem, 9vw, 2.8rem); }
          .hero-sub { font-size: 0.92rem; }
          .hero-meta { gap: 1rem; }

          .ar-viewfinder {
            aspect-ratio: 1/1;
            max-height: 280px;
          }

          .section-wrap { padding: 3.2rem 1rem; }

          .section-heading { font-size: clamp(1.5rem, 6vw, 2rem); }

          .tech-grid { grid-template-columns: 1fr; }

          .features-grid { grid-template-columns: 1fr; }

          .team-grid { grid-template-columns: 1fr 1fr; }

          .gtable { font-size: 0.65rem; }
          .gtable thead th, .gtable td { padding: 0.7rem 0.6rem; }

          footer { padding: 1.4rem 1rem; font-size: 0.58rem; }
        }

        /* Very small phones */
        @media (max-width: 360px) {
          .hero-title { font-size: 1.9rem; }
          .team-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className={mounted ? "ready" : ""}>

        {/* Nav */}
        <nav>
          <a className="nav-brand" href="#">GEST<span>URA</span></a>
          <ul className="nav-links">
            <li><a href="#tech">Technology</a></li>
            <li><a href="#architecture">Architecture</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#team">Team</a></li>
          </ul>
          <a className="nav-badge" href="#features">View Proposal</a>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div
            className="hero-glow"
            style={{ transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))` }}
          />
          <div className="hero-grid-lines" />

          <div className="hero-left">
           
            <h1 className="hero-title">
              Bridging<br />
              <span className="accent">Sign Language</span><br />
              <span className="dim-word">with the World</span>
            </h1>
            <p className="hero-sub">
              An augmented reality mobile system that detects hand gestures in real time,
              translating sign language into text and speech using Computer Vision and Machine Learning.
            </p>
            <div className="hero-meta">
              <div className="meta-item"><span>April 2026</span>Final Project</div>
              <div className="meta-item"><span>4 Members</span>Research Team</div>
              <div className="meta-item"><span>ASL Dataset</span>Training Data</div>
            </div>
            <div className="hero-actions">
              <a className="btn-solid" href="#tech">Explore System</a>
              <a className="btn-ghost" href="#architecture">View Architecture</a>
            </div>
          </div>

          {/* AR Viewfinder */}
          <div className="ar-viewfinder">
            <div className="ar-corner-tr" />
            <div className="ar-corner-bl" />
            <div className="ar-grid" />
            <div className="ar-scan" style={{ top: `${scanLine}%` }} />

            <div className="ar-hud-top">
              <span>GESTURA AR v1.0</span>
              <span style={{ color: "rgba(0,220,170,0.6)" }}>CAM ACTIVE</span>
              <span>FPS 60</span>
            </div>

            <div className="ar-hand-area">
              <div style={{ position: "relative", width: 170, height: 210 }}>
                <svg width="170" height="210" style={{ position: "absolute", top: 0, left: 0 }}>
                  <polygon points="40,160 130,160 140,100 120,80 90,72 60,80 30,100"
                    fill="none" stroke="rgba(0,220,170,0.15)" strokeWidth="1" />
                  <line x1="40" y1="155" x2="18" y2="130" stroke="rgba(0,220,170,0.4)" strokeWidth="1.5" />
                  <line x1="18" y1="130" x2="8"  y2="108" stroke="rgba(0,220,170,0.4)" strokeWidth="1.5" />
                  <line x1="8"  y1="108" x2="4"  y2="92"  stroke="rgba(0,220,170,0.4)" strokeWidth="1.5" />
                  <line x1="60" y1="80"  x2="55" y2="55"  stroke="rgba(0,220,170,0.5)" strokeWidth="1.5" />
                  <line x1="55" y1="55"  x2="52" y2="32"  stroke="rgba(0,220,170,0.5)" strokeWidth="1.5" />
                  <line x1="52" y1="32"  x2="50" y2="14"  stroke="rgba(0,220,170,0.5)" strokeWidth="1.5" />
                  <line x1="85" y1="74"  x2="83" y2="48"  stroke="rgba(0,220,170,0.6)" strokeWidth="1.5" />
                  <line x1="83" y1="48"  x2="82" y2="24"  stroke="rgba(0,220,170,0.6)" strokeWidth="1.5" />
                  <line x1="82" y1="24"  x2="82" y2="6"   stroke="rgba(0,220,170,0.6)" strokeWidth="1.5" />
                  <line x1="110" y1="78" x2="112" y2="52" stroke="rgba(0,220,170,0.5)" strokeWidth="1.5" />
                  <line x1="112" y1="52" x2="114" y2="28" stroke="rgba(0,220,170,0.5)" strokeWidth="1.5" />
                  <line x1="114" y1="28" x2="115" y2="12" stroke="rgba(0,220,170,0.5)" strokeWidth="1.5" />
                  <line x1="130" y1="90" x2="138" y2="68" stroke="rgba(0,220,170,0.4)" strokeWidth="1.5" />
                  <line x1="138" y1="68" x2="144" y2="50" stroke="rgba(0,220,170,0.4)" strokeWidth="1.5" />
                  <line x1="144" y1="50" x2="148" y2="38" stroke="rgba(0,220,170,0.4)" strokeWidth="1.5" />
                </svg>
                {[
                  [85,74],[60,80],[110,78],[130,90],[40,155],
                  [55,55],[52,32],[50,14],
                  [83,48],[82,24],[82,6],
                  [112,52],[114,28],[115,12],
                  [138,68],[144,50],[148,38],
                  [18,130],[8,108],[4,92],
                ].map(([x, y], i) => (
                  <div key={i} className="landmark" style={{ left: x, top: y }} />
                ))}
              </div>
            </div>

            <div className="ar-readout">
              <p className="readout-label">Gesture Detected — {gestures[activeGesture].label}</p>
              <p className="readout-translation">{gestures[activeGesture].translation}</p>
              <div className="readout-bar">
                <div className="readout-fill" style={{ width: `${gestures[activeGesture].conf}%` }} />
              </div>
              <div className="readout-conf">
                <span>Confidence</span>
                <span>{gestures[activeGesture].conf}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="marquee">
          <div className="marquee-inner">
            {Array(2).fill([
              "Computer Vision","Hand Landmark Detection","TensorFlow","ASL Dataset",
              "AR Overlay","Real-Time Translation","Text to Speech","Deep Learning",
              "MediaPipe","Gesture Classification","Mobile Application","Accessibility",
              "Computer Vision","Hand Landmark Detection","TensorFlow","ASL Dataset",
              "AR Overlay","Real-Time Translation","Text to Speech","Deep Learning",
              "MediaPipe","Gesture Classification","Mobile Application","Accessibility",
            ]).flat().map((item, i) => (
              <div className="marquee-item" key={i}>
                {item}<div className="marquee-dot" />
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="section-wrap tech-section" id="tech">
          <div className="section-label">Core Technologies</div>
          <h2 className="section-heading">Built on four<br />technical pillars</h2>
          <p className="section-body">
            Gestura combines industry-grade computer vision, machine learning, and AR rendering
            into a unified mobile pipeline that runs in real time.
          </p>
          <div className="tech-grid">
            {techs.map((t) => (
              <div className="tech-card" key={t.id}>
                <div className="tech-id">{t.id}</div>
                <div className="tech-name">{t.name}</div>
                <div className="tech-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div className="section-wrap" id="architecture">
          <div className="arch-section">
            <div>
              <div className="section-label">System Architecture</div>
              <h2 className="section-heading">Three-layer<br />processing pipeline</h2>
              <p className="section-body">
                Every frame from the camera passes through a sequential stack — from raw image
                to recognized gesture to rendered AR overlay — in milliseconds.
              </p>
            </div>
            <div>
              {[
                {
                  layer: "Input Layer",
                  title: "Camera Capture",
                  tags: ["Smartphone Camera", "Tablet", "30–60 FPS"],
                },
                {
                  layer: "Processing Layer",
                  title: "CV + ML Pipeline",
                  tags: ["Image Preprocessing", "Hand Detection", "Landmark Extraction", "Gesture Classification"],
                },
                {
                  layer: "Output Layer",
                  title: "Translation & Display",
                  tags: ["Text Overlay", "AR Visualization", "Text-to-Speech"],
                },
              ].map((l, i) => (
                <div key={i}>
                  {i > 0 && <div className="arch-arrow">|   SIGNAL FLOW   |</div>}
                  <div className="arch-layer">
                    <div className="arch-layer-label">{l.layer}</div>
                    <div className="arch-layer-title">{l.title}</div>
                    <div className="arch-layer-items">
                      {l.tags.map((t) => <span className="arch-tag" key={t}>{t}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="section-wrap" id="features" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="section-label">Capabilities</div>
          <h2 className="section-heading">What the system does</h2>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.num}>
                <div className="feat-num">{f.num}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gesture Table */}
        <div className="section-wrap gesture-table-section">
          <div className="section-label">Gesture Reference</div>
          <h2 className="section-heading">Sample gesture mappings</h2>
          <p className="section-body">
            The system recognizes hand configurations from ASL datasets and maps them to
            letters, words, or phrases with confidence scoring.
          </p>
          <div className="table-scroll">
            <table className="gtable">
              <thead>
                <tr>
                  <th>Hand Configuration</th>
                  <th>Translation</th>
                  <th>Type</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { config: "Closed Fist",            trans: "Letter A",          type: "Alphabet",        conf: 98 },
                  { config: "Open Palm",              trans: "Letter B",          type: "Alphabet",        conf: 97 },
                  { config: "Thumb + Index Circle",   trans: "Affirmative / OK",  type: "Word",            conf: 96 },
                  { config: "Index + Middle Extended",trans: "Letter V / Peace",  type: "Alphabet / Word", conf: 94 },
                  { config: "All Fingers Extended",   trans: "Letter B / Stop",   type: "Word",            conf: 95 },
                  { config: "Specific Finger Sequence",trans:"Sentence / Phrase", type: "Phrase",          conf: 91 },
                ].map((row, i) => (
                  <tr key={i}>
                    <td>{row.config}</td>
                    <td style={{ color: "var(--green)" }}>{row.trans}</td>
                    <td style={{ textTransform: "uppercase", fontSize: "0.58rem", letterSpacing: "0.1em" }}>{row.type}</td>
                    <td>
                      <div className="conf-bar">
                        <div className="conf-track">
                          <div className="conf-fill" style={{ width: `${row.conf}%` }} />
                        </div>
                        <span style={{ color: "var(--green)", minWidth: "2.4rem", textAlign: "right" }}>{row.conf}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team */}
        <div className="section-wrap team-section" id="team">
          <div className="section-label" style={{ justifyContent: "center" }}>Research Team</div>
          <h2 className="section-heading">April 2026</h2>
          <p className="section-body" style={{ margin: "0 auto" }}>
            Final project by four members of the research group, combining software engineering,
            machine learning, and accessibility-focused design.
          </p>
          <div className="team-grid">
            {team.map((m, i) => (
              <div className="team-card" key={i}>
                <div className="team-avatar">{m.name.split(",")[0][0]}</div>
                <div className="team-name">{m.name}</div>
                <div className="team-role">Researcher</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer>
          <span className="footer-brand">GESTURA</span>
          <span>AR Sign Language Translation System — Final Project 2026</span>
          <span>CV + ML + AR</span>
        </footer>

      </div>
    </>
  )
}
