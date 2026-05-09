"use client"

import { useEffect, useState, useMemo } from "react"

export default function GesturaFinal() {
  const [mounted, setMounted] = useState(false)
  const [activeGesture, setActiveGesture] = useState(0)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setActiveGesture((p) => (p + 1) % 4)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const gestures = useMemo(() => [
    { label: "QUIET_MOTION", meaning: "Be Still", context: "Environment" },
    { label: "OPEN_WELCOME", meaning: "Welcome", context: "Social" },
    { label: "SOFT_AFFIRM", meaning: "Understood", context: "Interaction" },
    { label: "GUIDED_DIR", meaning: "Forward", context: "Navigation" },
  ], [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500&family=Instrument+Serif:ital@0;1&display=swap');

        :root {
          --bg: #050505;
          --card: rgba(255, 255, 255, 0.02);
          --border: rgba(255, 255, 255, 0.08);
          --text-main: #ffffff;
          --text-muted: rgba(255, 255, 255, 0.45);
          --accent: #c7d2fe; 
          --font-sans: 'Plus Jakarta Sans', sans-serif;
          --font-serif: 'Instrument Serif', serif;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        body {
          background: var(--bg);
          color: var(--text-main);
          font-family: var(--font-sans);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── LUXURY AMBIENCE ── */
        .aura {
          position: fixed;
          width: 140vw; height: 140vw;
          top: -40vw; right: -30vw;
          background: radial-gradient(circle, rgba(199, 210, 254, 0.03) 0%, transparent 60%);
          z-index: 0;
          pointer-events: none;
        }

        /* ── RESPONSIVE NAVIGATION ── */
        nav {
          position: fixed;
          top: 0; width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          z-index: 100;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        @media (min-width: 1024px) {
          nav { padding: 2.5rem 4rem; border-bottom: none; }
        }

        .brand {
          font-weight: 500;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .nav-links { display: none; }
        @media (min-width: 1024px) {
          .nav-links { display: flex; gap: 3rem; list-style: none; }
          .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 0.8rem; font-weight: 300; letter-spacing: 0.02em; transition: color 0.4s ease; }
          .nav-links a:hover { color: var(--text-main); }
        }

        /* ── LAYOUT SECTIONS ── */
        .section { padding: 60px 1.5rem; position: relative; z-index: 1; }
        @media (min-width: 1024px) { .section { padding: 100px 4rem; } }
        
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding-top: 100px;
        }

        .ready .fade-in { opacity: 1; transform: translateY(0); }
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .super-title {
          font-family: var(--font-serif);
          font-size: clamp(3.2rem, 12vw, 8.5rem);
          font-style: italic;
          line-height: 0.9;
          margin-bottom: 1.5rem;
          font-weight: 400;
          letter-spacing: -0.02em;
        }

        .super-title em { font-family: var(--font-serif); }

        .sub-heading {
          font-size: 0.95rem;
          color: var(--text-muted);
          max-width: 380px;
          margin: 0 auto;
          line-height: 1.6;
          font-weight: 300;
        }

        @media (min-width: 1024px) {
          .sub-heading { font-size: 1.15rem; max-width: 520px; }
        }

        /* ── CINEMATIC AR VIEWFINDER ── */
        .ar-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 1/1.2; /* Taller on mobile for better framing */
          margin: 40px auto 0;
          border-radius: 24px;
          overflow: hidden;
          background: #0a0a0a;
          border: 1px solid var(--border);
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }

        @media (min-width: 1024px) {
          .ar-frame { aspect-ratio: 16/9; max-width: 1100px; margin: 60px auto 0; border-radius: 32px; }
        }

        .ar-video-sim {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #111, #050505);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .floating-interaction {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          padding: 20px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        @media (min-width: 1024px) {
          .floating-interaction { width: auto; min-width: 300px; left: 40px; bottom: 40px; right: auto; padding: 28px 36px; border-radius: 24px; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .interaction-tag {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--accent);
          margin-bottom: 8px;
          display: block;
          opacity: 0.8;
        }

        .interaction-main {
          font-size: 1.5rem;
          font-family: var(--font-serif);
          margin-bottom: 4px;
          font-weight: 400;
        }

        @media (min-width: 1024px) {
          .interaction-main { font-size: 2rem; }
        }

        /* ── FEATURE GRID ── */
        .grid-header {
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        @media (min-width: 1024px) {
          .grid-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; padding-bottom: 30px; }
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: var(--border);
          border-radius: 20px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .feature-grid { grid-template-columns: repeat(3, 1fr); border-radius: 24px; }
        }

        .feature-card {
          background: var(--bg);
          padding: 40px 24px;
          transition: background 0.4s ease;
        }

        @media (min-width: 1024px) {
          .feature-card { padding: 60px 40px; }
        }

        .feature-card:hover { background: rgba(255,255,255,0.015); }

        .feature-num {
          font-size: 0.65rem;
          color: var(--accent);
          margin-bottom: 20px;
          display: block;
          letter-spacing: 0.1em;
        }

        .feature-title-small {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          margin-bottom: 12px;
          font-weight: 400;
        }

        .feature-text {
          color: var(--text-muted);
          font-size: 0.85rem;
          line-height: 1.6;
          font-weight: 300;
        }

        /* ── BUTTONS ── */
        .btn-group { display: flex; gap: 0.75rem; margin-top: 32px; }
        .btn {
          padding: 12px 24px;
          border-radius: 100px;
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }

        @media (min-width: 1024px) {
          .btn { padding: 16px 36px; font-size: 0.85rem; }
          .btn-group { gap: 1.5rem; margin-top: 40px; }
        }

        .btn-p { background: #fff; color: #000; }
        .btn-s { border: 1px solid var(--border); color: #fff; }
        .btn-p:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,255,255,0.05); }

        footer {
          padding: 60px 1.5rem;
          border-top: 1px solid var(--border);
          text-align: center;
        }

        @media (min-width: 1024px) {
          footer { padding: 80px 4rem; display: flex; justify-content: space-between; text-align: left; }
        }
      `}</style>

      <div className={mounted ? "ready" : ""}>
        <div className="aura" />
        
        <nav>
          <div className="brand">Gestura.</div>
          <ul className="nav-links">
            <li><a href="#vision">Vision</a></li>
            <li><a href="#features">Interface</a></li>
            <li><a href="#about">Philosophy</a></li>
          </ul>
         
        </nav>

        <main>
          {/* Hero Section */}
          <section className="section hero">
            <div className="fade-in">
              <h1 className="super-title">
                Art of <br /> 
                <em>Motion.</em>
              </h1>
              <p className="sub-heading">
                A cinematic AR interface translating human motion into fluid 
                digital conversation. Designed for the spatial era.
              </p>
              <div className="btn-group" style={{ justifyContent: 'center' }}>
                <a href="#" className="btn btn-p">Explore System</a>
                <a href="#" className="btn btn-s">The Philosophy</a>
              </div>
            </div>

            <div className="ar-frame fade-in" style={{ transitionDelay: '0.3s' }}>
              <div className="ar-video-sim">
                <div style={{
                  width: '200px', height: '200px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(199, 210, 254, 0.04) 0%, transparent 70%)',
                  animation: 'pulse 4s ease-in-out infinite'
                }} />
              </div>

              <div className="floating-interaction">
                <span className="interaction-tag">{gestures[activeGesture].context} / INFERENCE</span>
                <h2 className="interaction-main">{gestures[activeGesture].meaning}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 300 }}>
                  Active: {gestures[activeGesture].label}
                </p>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="section" id="features">
            <div className="grid-header">
              <h2 className="feature-title-small" style={{ fontSize: '2rem' }}>Core Interface</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '280px', fontSize: '0.8rem', lineHeight: '1.5' }}>
                Refining the boundary between movement and digital intent.
              </p>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <span className="feature-num">01</span>
                <h3 className="feature-title-small">Neural Tracking</h3>
                <p className="feature-text">High-fidelity recognition that captures the nuance of every movement.</p>
              </div>
              <div className="feature-card">
                <span className="feature-num">02</span>
                <h3 className="feature-title-small">Cinematic AR</h3>
                <p className="feature-text">An interface that breathes and lives within your physical environment.</p>
              </div>
              <div className="feature-card">
                <span className="feature-num">03</span>
                <h3 className="feature-title-small">Fluid Design</h3>
                <p className="feature-text">Instant conversion of gestures to digital signals, effortlessly.</p>
              </div>
            </div>
          </section>
        </main>

        <footer>
          <div className="brand" style={{ opacity: 0.4, marginBottom: '16px' }}>Gestura Labs © 2026</div>
          
        </footer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </>
  )
}