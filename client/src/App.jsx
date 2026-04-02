import { useState, useCallback, useRef } from "react";

const SUIT_SYMBOLS = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLORS = { S: "#e2e8f0", H: "#f87171", D: "#f87171", C: "#e2e8f0" };
const SUIT_NAMES = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };

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

function GroupBlock({ group }) {
  const suitKey = Object.keys(SUIT_NAMES).find((k) => SUIT_NAMES[k] === group.suit);
  return (
    <div className="group-block">
      <div className="group-header">
        <span className="group-symbol" style={{ color: SUIT_COLORS[suitKey] || "#e2e8f0" }}>
          {SUIT_SYMBOLS[suitKey] || "🂠"}
        </span>
        <span className="group-name">{group.suit}</span>
        <span className="group-count">{group.cards.length}</span>
      </div>
      <div className="group-cards">
        {group.cards.map((c, i) => <CardChip key={c} card={c} index={i} />)}
      </div>
    </div>
  );
}

export default function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const detect = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append("image", image);
    try {
      const res = await fetch("/api/detect", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Detection failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(result.cards.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0a0f; --surface: #12121a; --surface2: #1a1a26;
          --border: rgba(255,255,255,0.07); --accent: #c9a84c; --accent2: #e8c96d;
          --text: #f0ece0; --muted: #6b6880; --red: #f87171; --radius: 16px;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Mono', monospace; min-height: 100vh; }
        .bg-pattern { position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: radial-gradient(circle at 20% 20%, rgba(201,168,76,0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(248,113,113,0.04) 0%, transparent 50%); }
        .grid-lines { position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px; }
        .app { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }
        .header { text-align: center; margin-bottom: 56px; }
        .logo-suits { display: flex; gap: 6px; font-size: 22px; justify-content: center; margin-bottom: 16px; }
        .logo-suits span:nth-child(1), .logo-suits span:nth-child(4) { color: var(--text); }
        .logo-suits span:nth-child(2), .logo-suits span:nth-child(3) { color: var(--red); }
        h1 { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 900;
          background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 50%, #a07830 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1; }
        .subtitle { font-size: 0.8rem; color: var(--muted); letter-spacing: 0.15em; text-transform: uppercase; margin-top: 10px; }
        .divider { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); margin: 20px auto 0; }
        .upload-zone { border: 1.5px dashed rgba(201,168,76,0.3); border-radius: var(--radius); padding: 48px 24px;
          text-align: center; cursor: pointer; transition: all 0.3s ease; background: var(--surface);
          position: relative; overflow: hidden; margin-bottom: 24px; }
        .upload-zone::before { content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at center, rgba(201,168,76,0.04) 0%, transparent 70%);
          opacity: 0; transition: opacity 0.3s; }
        .upload-zone:hover::before, .upload-zone.drag::before { opacity: 1; }
        .upload-zone.drag { border-color: var(--accent); transform: scale(1.01); }
        .upload-zone.has-image { padding: 0; border-style: solid; border-color: rgba(201,168,76,0.2); }
        .upload-icon { font-size: 3rem; margin-bottom: 16px; }
        .upload-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .upload-sub { font-size: 0.75rem; color: var(--muted); }
        .preview-img { width: 100%; max-height: 420px; object-fit: contain; border-radius: calc(var(--radius) - 2px); display: block; }
        .change-btn { position: absolute; top: 12px; right: 12px; background: rgba(10,10,15,0.85);
          border: 1px solid var(--border); color: var(--muted); font-family: 'DM Mono', monospace;
          font-size: 0.7rem; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
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
        .results { animation: fadeUp 0.5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .result-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; color: var(--accent2); }
        .result-badge { background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.25); color: var(--accent); font-size: 0.75rem; padding: 6px 14px; border-radius: 99px; }
        .all-cards-section { margin-bottom: 32px; }
        .section-label { font-size: 0.65rem; color: var(--muted); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 14px; }
        .cards-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
        .card-chip { display: flex; align-items: center; gap: 4px; background: var(--surface2); border: 1px solid var(--border);
          border-radius: 8px; padding: 6px 12px; font-size: 0.85rem; font-weight: 500;
          animation: popIn 0.3s ease both; animation-delay: var(--delay, 0s); transition: transform 0.15s, border-color 0.15s; }
        .card-chip:hover { transform: translateY(-2px); border-color: rgba(201,168,76,0.3); }
        @keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .card-rank { color: var(--text); }
        .groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .group-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; }
        .group-block:hover { border-color: rgba(201,168,76,0.2); }
        .group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .group-symbol { font-size: 1.4rem; }
        .group-name { font-size: 0.8rem; color: var(--muted); flex: 1; }
        .group-count { background: var(--surface2); color: var(--accent); font-size: 0.7rem; padding: 2px 8px; border-radius: 99px; border: 1px solid rgba(201,168,76,0.2); }
        .group-cards { display: flex; flex-wrap: wrap; gap: 6px; }
        .output-string-box { background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 32px; position: relative; }
        .output-label { font-size: 0.65rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px; }
        .output-string { font-family: 'DM Mono', monospace; font-size: 0.9rem; color: var(--accent2); word-break: break-all; line-height: 1.8; }
        .copy-btn { position: absolute; top: 12px; right: 12px; background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.2); color: var(--accent); font-family: 'DM Mono', monospace;
          font-size: 0.7rem; padding: 5px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .copy-btn:hover { background: rgba(201,168,76,0.2); }
        .summary-bar { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 20px; display: flex; align-items: center; gap: 12px; font-size: 0.8rem; color: var(--muted); }
        .error-box { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25); border-radius: var(--radius); padding: 16px 20px; color: var(--red); font-size: 0.8rem; margin-bottom: 24px; }
      `}</style>

      <div className="bg-pattern" />
      <div className="grid-lines" />

      <div className="app">
        <header className="header">
          <div className="logo-suits"><span>♠</span><span>♥</span><span>♦</span><span>♣</span></div>
          <h1>Card Detector</h1>
          <p className="subtitle">AI-Powered Playing Card Recognition</p>
          <div className="divider" />
        </header>

        <div
          className={`upload-zone ${dragging ? "drag" : ""} ${preview ? "has-image" : ""}`}
          onClick={() => !preview && fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="preview-img" />
              <button className="change-btn" onClick={(e) => { e.stopPropagation(); setPreview(null); setImage(null); setResult(null); }}>
                Change
              </button>
            </>
          ) : (
            <>
              <div className="upload-icon">🃏</div>
              <div className="upload-title">Drop your card image here</div>
              <p className="upload-sub">or click to browse — JPG, PNG, WEBP</p>
            </>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

        {error && <div className="error-box">⚠️ {error}</div>}

        <button className="detect-btn" onClick={detect} disabled={!image || loading}>
          {loading ? "Analyzing Cards..." : "✦ Detect Cards"}
        </button>

        {loading && (
          <div className="loading-state">
            <div className="card-spinner">
              {["♠", "♥", "♦", "♣"].map((s, i) => <div key={i} className="spin-card">{s}</div>)}
            </div>
            <p className="loading-text">Grok Vision is reading the cards...</p>
          </div>
        )}

        {result && (
          <div className="results">
            <div className="result-header">
              <div className="result-title">Detection Complete</div>
              <div className="result-badge">{result.total} cards found</div>
            </div>

            <div className="output-string-box">
              <div className="output-label">Detected Output</div>
              <div className="output-string">{result.cards.join(", ")}</div>
              <button className="copy-btn" onClick={copyOutput}>{copied ? "Copied!" : "Copy"}</button>
            </div>

            <div className="all-cards-section">
              <div className="section-label">All Cards</div>
              <div className="cards-wrap">
                {result.cards.map((card, i) => <CardChip key={`${card}-${i}`} card={card} index={i} />)}
              </div>
            </div>

            {result.groups && result.groups.length > 0 && (
              <>
                <div className="section-label">By Suit</div>
                <div className="groups-grid">
                  {result.groups.map((g) => <GroupBlock key={g.suit} group={g} />)}
                </div>
              </>
            )}

            {result.summary && (
              <div className="summary-bar">
                <span>📊</span>
                <span>{result.summary}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}