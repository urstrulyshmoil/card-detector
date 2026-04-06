import { useState, useCallback, useRef } from "react";

const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLORS = { S: "#e2e8f0", H: "#f87171", D: "#f87171", C: "#e2e8f0" };
const SUIT_NAMES = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };

const CARD_POINTS = {
  A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, "10": 10, J: 10, Q: 10, K: 10,
};

function getPoints(cards) {
  return cards.reduce((total, card) => {
    const rank = card.slice(0, -1);
    return total + (CARD_POINTS[rank] || 0);
  }, 0);
}

function CardChip({ card, index }) {
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return (
    <div className="card-chip" style={{ "--delay": `${index * 0.05}s` }}>
      <span className="card-rank">{rank}</span>
      <span className="card-suit" style={{ color: SUIT_COLORS[suit] }}>
        {SUIT_SYMBOLS[suit]}
      </span>
    </div>
  );
}

function PlayerZone({ number, onFile, preview, onClear }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    onFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="player-zone">
      <div className="player-label">
        <span className="player-number">P{number}</span>
        <span className="player-title">Player {number}</span>
      </div>
      <div
        className={`upload-zone ${dragging ? "drag" : ""} ${preview ? "has-image" : ""}`}
        onClick={() => !preview && fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt={`Player ${number}`} className="preview-img" />
            <button className="change-btn" onClick={(e) => { e.stopPropagation(); onClear(); }}>
              Change
            </button>
          </>
        ) : (
          <>
            <div className="upload-icon">🃏</div>
            <div className="upload-title">Player {number} Cards</div>
            <p className="upload-sub">Drop image or click to browse</p>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files[0])}
      />
    </div>
  );
}

function PlayerResult({ number, result, isWinner }) {
  const points = getPoints(result.cards);
  return (
    <div className={`player-result ${isWinner ? "winner" : "loser"}`}>
      <div className="player-result-header">
        <div className="player-result-title">
          {isWinner ? "👑 " : ""}Player {number}
        </div>
        <div className="player-result-badges">
          <span className="badge-cards">{result.total} cards</span>
          <span className={`badge-points ${isWinner ? "badge-winner" : "badge-loser"}`}>
            {points} pts
          </span>
        </div>
      </div>

      <div className="output-string-box">
        <div className="output-label">Detected Cards</div>
        <div className="output-string">{result.cards.join(", ")}</div>
      </div>

      <div className="cards-wrap">
        {result.cards.map((card, i) => (
          <CardChip key={`${card}-${i}`} card={card} index={i} />
        ))}
      </div>

      {result.groups && result.groups.length > 0 && (
        <div className="groups-mini">
          {result.groups.map((g) => {
            const suitKey = Object.keys(SUIT_NAMES).find((k) => SUIT_NAMES[k] === g.suit);
            return (
              <div key={g.suit} className="group-mini-item">
                <span style={{ color: SUIT_COLORS[suitKey] }}>{SUIT_SYMBOLS[suitKey]}</span>
                <span>{g.cards.join(", ")}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [p1Image, setP1Image] = useState(null);
  const [p2Image, setP2Image] = useState(null);
  const [p1Preview, setP1Preview] = useState(null);
  const [p2Preview, setP2Preview] = useState(null);
  const [p1Result, setP1Result] = useState(null);
  const [p2Result, setP2Result] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleP1File = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setP1Image(file);
    setP1Preview(URL.createObjectURL(file));
    setP1Result(null);
  };

  const handleP2File = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setP2Image(file);
    setP2Preview(URL.createObjectURL(file));
    setP2Result(null);
  };

  const detectAll = async () => {
    if (!p1Image || !p2Image) return;
    setLoading(true);
    setError(null);
    setP1Result(null);
    setP2Result(null);

    const apiUrl = import.meta.env.VITE_API_URL || "";

    try {
      const detect = async (image) => {
        const formData = new FormData();
        formData.append("image", image);
        const res = await fetch(`${apiUrl}/api/detect`, { method: "POST", body: formData });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.includes("<!DOCTYPE") ? "Backend is waking up, please try again in 30 seconds!" : text);
        }
        return res.json();
      };

      const [r1, r2] = await Promise.all([detect(p1Image), detect(p2Image)]);
      setP1Result(r1);
      setP2Result(r2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const p1Points = p1Result ? getPoints(p1Result.cards) : 0;
  const p2Points = p2Result ? getPoints(p2Result.cards) : 0;
  const winner = p1Result && p2Result ? (p1Points > p2Points ? 1 : p2Points > p1Points ? 2 : 0) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0a0f; --surface: #12121a; --surface2: #1a1a26;
          --border: rgba(255,255,255,0.07); --accent: #c9a84c; --accent2: #e8c96d;
          --text: #f0ece0; --muted: #6b6880; --red: #f87171; --radius: 16px;
          --green: #4ade80;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Mono', monospace; min-height: 100vh; }
        .bg-pattern { position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: radial-gradient(circle at 20% 20%, rgba(201,168,76,0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(248,113,113,0.04) 0%, transparent 50%); }
        .grid-lines { position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px; }
        .app { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; padding: 48px 24px 80px; }
        .header { text-align: center; margin-bottom: 48px; }
        .logo-suits { display: flex; gap: 6px; font-size: 22px; justify-content: center; margin-bottom: 16px; }
        .logo-suits span:nth-child(1), .logo-suits span:nth-child(4) { color: var(--text); }
        .logo-suits span:nth-child(2), .logo-suits span:nth-child(3) { color: var(--red); }
        h1 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 900;
          background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 50%, #a07830 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1; }
        .subtitle { font-size: 0.8rem; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; margin-top: 10px; }
        .divider { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); margin: 20px auto 0; }
        .wake-notice { background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
          border-radius: var(--radius); padding: 10px 20px; color: var(--accent);
          font-size: 0.72rem; margin-bottom: 32px; text-align: center; }
        .players-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .player-zone {}
        .player-label { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .player-number { background: linear-gradient(135deg, #c9a84c, #a07830); color: #0a0a0f;
          font-family: 'Playfair Display', serif; font-weight: 900; font-size: 0.8rem;
          width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .player-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; color: var(--accent2); }
        .upload-zone { border: 1.5px dashed rgba(201,168,76,0.3); border-radius: var(--radius); padding: 32px 16px;
          text-align: center; cursor: pointer; transition: all 0.3s ease; background: var(--surface);
          position: relative; overflow: hidden; }
        .upload-zone::before { content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(201,168,76,0.04) 0%, transparent 70%);
          opacity: 0; transition: opacity 0.3s; }
        .upload-zone:hover::before, .upload-zone.drag::before { opacity: 1; }
        .upload-zone.drag { border-color: var(--accent); transform: scale(1.01); }
        .upload-zone.has-image { padding: 0; border-style: solid; border-color: rgba(201,168,76,0.2); }
        .upload-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .upload-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .upload-sub { font-size: 0.7rem; color: var(--muted); }
        .preview-img { width: 100%; max-height: 280px; object-fit: contain; border-radius: calc(var(--radius) - 2px); display: block; }
        .change-btn { position: absolute; top: 8px; right: 8px; background: rgba(10,10,15,0.85);
          border: 1px solid var(--border); color: var(--muted); font-family: 'DM Mono', monospace;
          font-size: 0.65rem; padding: 5px 10px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .change-btn:hover { color: var(--text); border-color: var(--accent); }
        .detect-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #c9a84c, #a07830);
          border: none; border-radius: var(--radius); font-family: 'Playfair Display', serif;
          font-size: 1.1rem; font-weight: 700; color: #0a0a0f; cursor: pointer; transition: all 0.3s ease; margin-bottom: 40px; }
        .detect-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(201,168,76,0.35); }
        .detect-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .loading-state { text-align: center; padding: 48px; }
        .card-spinner { display: inline-flex; gap: 8px; margin-bottom: 24px; }
        .spin-card { width: 32px; height: 44px; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 6px; animation: flipCard 1.2s ease-in-out infinite; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .spin-card:nth-child(2) { animation-delay: 0.15s; }
        .spin-card:nth-child(3) { animation-delay: 0.3s; }
        .spin-card:nth-child(4) { animation-delay: 0.45s; }
        @keyframes flipCard { 0%, 100% { transform: rotateY(0deg); opacity: 0.4; } 50% { transform: rotateY(180deg); opacity: 1; } }
        .loading-text { font-size: 0.8rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }
        .error-box { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25);
          border-radius: var(--radius); padding: 16px 20px; color: var(--red); font-size: 0.8rem; margin-bottom: 24px; }
        .winner-banner { text-align: center; margin-bottom: 32px; animation: fadeUp 0.5s ease both; }
        .winner-text { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 900;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .tie-text { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 900; color: var(--muted); }
        .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; animation: fadeUp 0.5s ease both; }
        .player-result { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
        .player-result.winner { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.04); }
        .player-result.loser { opacity: 0.75; }
        .player-result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .player-result-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--accent2); }
        .player-result-badges { display: flex; gap: 8px; }
        .badge-cards { background: var(--surface2); color: var(--muted); font-size: 0.7rem; padding: 4px 10px; border-radius: 99px; border: 1px solid var(--border); }
        .badge-points { font-size: 0.7rem; padding: 4px 10px; border-radius: 99px; font-weight: 700; }
        .badge-winner { background: rgba(201,168,76,0.15); color: var(--accent); border: 1px solid rgba(201,168,76,0.3); }
        .badge-loser { background: var(--surface2); color: var(--muted); border: 1px solid var(--border); }
        .output-string-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; }
        .output-label { font-size: 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 6px; }
        .output-string { font-size: 0.8rem; color: var(--accent2); word-break: break-all; line-height: 1.8; }
        .cards-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .card-chip { display: flex; align-items: center; gap: 3px; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 6px; padding: 4px 10px; font-size: 0.8rem; font-weight: 500;
          animation: popIn 0.3s ease both; animation-delay: var(--delay, 0s); }
        @keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .card-rank { color: var(--text); }
        .groups-mini { display: flex; flex-direction: column; gap: 6px; }
        .group-mini-item { display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--muted); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 600px) {
          .players-grid, .results-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="bg-pattern" />
      <div className="grid-lines" />

      <div className="app">
        <header className="header">
          <div className="logo-suits"><span>♠</span><span>♥</span><span>♦</span><span>♣</span></div>
          <h1>Card Detector</h1>
          <p className="subtitle">AI-Powered Rummy Card Detection & Scoring</p>
          <div className="divider" />
        </header>

        <div className="wake-notice">
          ⚡ First request may take 30–60 seconds to wake the server. Subsequent requests are instant!
        </div>

        <div className="players-grid">
          <PlayerZone
            number={1}
            preview={p1Preview}
            onFile={handleP1File}
            onClear={() => { setP1Image(null); setP1Preview(null); setP1Result(null); }}
          />
          <PlayerZone
            number={2}
            preview={p2Preview}
            onFile={handleP2File}
            onClear={() => { setP2Image(null); setP2Preview(null); setP2Result(null); }}
          />
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}

        <button className="detect-btn" onClick={detectAll} disabled={!p1Image || !p2Image || loading}>
          {loading ? "Analyzing Both Players..." : "✦ Detect & Score Both Players"}
        </button>

        {loading && (
          <div className="loading-state">
            <div className="card-spinner">
              {["♠", "♥", "♦", "♣"].map((s, i) => <div key={i} className="spin-card">{s}</div>)}
            </div>
            <p className="loading-text">AI is reading both hands...</p>
          </div>
        )}

        {p1Result && p2Result && (
          <>
            <div className="winner-banner">
              {winner === 0 ? (
                <div className="tie-text">🤝 It's a Tie!</div>
              ) : (
                <div className="winner-text">👑 Player {winner} Wins with {winner === 1 ? p1Points : p2Points} points!</div>
              )}
            </div>
            <div className="results-grid">
              <PlayerResult number={1} result={p1Result} isWinner={winner === 1} />
              <PlayerResult number={2} result={p2Result} isWinner={winner === 2} />
            </div>
          </>
        )}
      </div>
    </>
  );
}