import { useState, useEffect } from "react";
import { Sparkles, ChevronRight, ChevronLeft, Copy, Check, Zap } from "lucide-react";

const SITUATIONS = [
  { value: "new-job", label: "New role in same field" },
  { value: "promotion", label: "Internal promotion" },
  { value: "switch", label: "Career switch" },
  { value: "gap", label: "Returning after a gap" },
  { value: "fresher", label: "First job (fresher)" },
];

const C = {
  navy: "#0D1B2A",
  navyMid: "#112236",
  navyLight: "#1A3350",
  navyBorder: "#1E3D5C",
  coral: "#FF6B47",
  coralDim: "#CC5037",
  coralGlow: "rgba(255,107,71,0.12)",
  white: "#F0F4F8",
  whiteDim: "#B8C8D8",
  whiteMuted: "#6A8099",
};

function inlineBold(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ fontWeight: 600, color: "#F0F4F8" }}>{p.slice(2, -2)}</strong>
      : p
  );
}

function MarkdownView({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const out = [];
  let buf = [];
  const flush = (k) => {
    if (!buf.length) return;
    out.push(
      <ul key={`ul-${k}`} style={{ margin: "4px 0 14px", paddingLeft: 0, listStyle: "none" }}>
        {buf.map((item, j) => (
          <li key={j} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13.5, color: "#B8C8D8", lineHeight: 1.7 }}>
            <span style={{ color: "#FF6B47", flexShrink: 0, marginTop: 3, fontSize: 10 }}>◆</span>
            <span>{inlineBold(item)}</span>
          </li>
        ))}
      </ul>
    );
    buf = [];
  };
  lines.forEach((line, i) => {
    if (line.startsWith("# ")) {
      flush(i);
      out.push(<h1 key={i} style={{ fontSize: 20, fontWeight: 700, color: "#F0F4F8", margin: "20px 0 2px", letterSpacing: "-0.3px" }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      flush(i);
      out.push(
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, margin: "22px 0 8px" }}>
          <div style={{ width: 3, height: 14, background: "#FF6B47", borderRadius: 2, flexShrink: 0 }} />
          <h2 style={{ fontSize: 11, fontWeight: 700, color: "#FF6B47", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>{line.slice(3)}</h2>
        </div>
      );
    } else if (line.startsWith("### ")) {
      flush(i);
      out.push(<h3 key={i} style={{ fontSize: 13.5, fontWeight: 600, color: "#F0F4F8", margin: "14px 0 4px" }}>{inlineBold(line.slice(4))}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      buf.push(line.slice(2));
    } else if (line.startsWith("---")) {
      flush(i);
      out.push(<hr key={i} style={{ border: "none", borderTop: "1px solid #1E3D5C", margin: "20px 0" }} />);
    } else if (line.trim() === "") {
      flush(i);
      out.push(<div key={i} style={{ height: 5 }} />);
    } else {
      flush(i);
      out.push(<p key={i} style={{ fontSize: 13.5, color: "#B8C8D8", margin: "1px 0", lineHeight: 1.7 }}>{inlineBold(line)}</p>);
    }
  });
  flush("end");
  return <div>{out}</div>;
}

const inp = {
  width: "100%", boxSizing: "border-box",
  background: "#112236",
  border: "1px solid #1E3D5C",
  borderRadius: 8,
  color: "#F0F4F8",
  fontFamily: "system-ui, sans-serif",
  fontSize: 13.5,
  padding: "9px 12px",
  outline: "none",
};

const lbl = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#6A8099",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  marginBottom: 5,
};

function Field({ label, children, col }) {
  return (
    <div style={{ marginBottom: 16, gridColumn: col }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

export default function Hupply() {
  const [phase, setPhase] = useState("intro");
  const [intake, setIntake] = useState({ name: "", role: "", industry: "", situation: "new-job", experience: "", achievements: "", skills: "", jd: "" });
  const [resume, setResume] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);

  const msgs = ["Scanning for ATS issues...", "Rewriting weak bullets...", "Adding power keywords...", "Crafting your summary...", "Building LinkedIn section...", "Finalising change log..."];

  useEffect(() => {
    if (phase !== "gen") return;
    const t = setInterval(() => setMsgIdx(m => (m + 1) % msgs.length), 1900);
    return () => clearInterval(t);
  }, [phase]);

  const s = (k, v) => setIntake(p => ({ ...p, [k]: v }));
  const canStep1 = intake.role.trim() && intake.experience.trim() && intake.skills.trim();
  const canStep2 = resume.trim().length > 50;

  const generate = async () => {
    setPhase("gen"); setError("");
    const message = `INTAKE FORM:
Name: ${intake.name || "Not provided"}
Target Role: ${intake.role}
Industry: ${intake.industry || "Not specified"}
Situation: ${SITUATIONS.find(x => x.value === intake.situation)?.label}
Experience: ${intake.experience}
Key Achievements: ${intake.achievements || "None provided"}
Skills & Tools: ${intake.skills}
Target Job Description: ${intake.jd || "Not provided"}
---
CURRENT RESUME:
${resume}`;

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
      setPhase("results");
    } catch (e) {
      setError(e.message);
      setPhase("resume");
    }
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const reset = () => { setPhase("intro"); setResult(""); setResume(""); setIntake({ name: "", role: "", industry: "", situation: "new-job", experience: "", achievements: "", skills: "", jd: "" }); };
  const progIdx = { form: 0, resume: 1, results: 2 }[phase] ?? -1;

  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2A", fontFamily: "system-ui, -apple-system, sans-serif", color: "#F0F4F8" }}>
      <style>{`
        input, textarea, select { color-scheme: dark; }
        input:focus, textarea:focus, select:focus { border-color: #FF6B47 !important; box-shadow: 0 0 0 3px rgba(255,107,71,0.12) !important; }
        input::placeholder, textarea::placeholder { color: #6A8099 !important; }
        select option { background: #112236; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ background: "#112236", borderBottom: "1px solid #1E3D5C", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, background: "#FF6B47", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#F0F4F8", letterSpacing: "-0.3px" }}>Hupply</span>
          <span style={{ fontSize: 11, color: "#6A8099", marginLeft: 2 }}>· AI-Powered</span>
        </div>
        {phase === "results" && (
          <button onClick={reset} style={{ fontSize: 12, color: "#6A8099", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Start over</button>
        )}
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "36px 20px 80px" }}>

        {progIdx >= 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
            {["About you", "Your resume", "Results"].map((label, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 2, borderRadius: 2, background: i <= progIdx ? "#FF6B47" : "#1E3D5C", marginBottom: 6, transition: "background 0.3s" }} />
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: i === progIdx ? "#FF6B47" : i < progIdx ? "#CC5037" : "#6A8099" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {phase === "intro" && (
          <div style={{ textAlign: "center", paddingTop: 48, animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,107,71,0.12)", border: "1px solid rgba(255,107,71,0.25)", borderRadius: 100, padding: "5px 14px", fontSize: 11, fontWeight: 600, color: "#FF6B47", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
              <Sparkles size={12} /> Free · No signup · AI-Powered
            </div>
            <h1 style={{ fontSize: "clamp(2.2rem, 7vw, 3.4rem)", fontWeight: 800, color: "#F0F4F8", letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 8px" }}>Your resume,</h1>
            <h1 style={{ fontSize: "clamp(2.2rem, 7vw, 3.4rem)", fontWeight: 800, color: "#FF6B47", letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 20px" }}>job-ready in seconds.</h1>
            <p style={{ fontSize: 15, color: "#B8C8D8", maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.75 }}>
              Paste your resume. Get an ATS-optimized rewrite, LinkedIn makeover, and a full coaching report — completely free.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 360, margin: "0 auto 36px", textAlign: "left" }}>
              {["ATS keyword optimization", "Impact bullet rewrites", "LinkedIn headline & About", "Full change log", "Personalized coaching tips", "Works for all experience levels"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#B8C8D8" }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FF6B47", flexShrink: 0 }} />{f}
                </div>
              ))}
            </div>
            <button onClick={() => setPhase("form")} style={{ background: "#FF6B47", color: "#fff", border: "none", borderRadius: 10, padding: "13px 30px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "system-ui, sans-serif", display: "inline-flex", alignItems: "center", gap: 7 }}>
              Optimize my resume <ChevronRight size={15} />
            </button>
            <p style={{ fontSize: 12, color: "#6A8099", marginTop: 12 }}>No signup. No credit card. Just results.</p>
          </div>
        )}

        {phase === "form" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F0F4F8", margin: "0 0 4px", letterSpacing: "-0.3px" }}>Tell us about yourself</h2>
            <p style={{ fontSize: 13, color: "#6A8099", marginBottom: 28 }}>More context = better output. Fields marked * are required.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
              <Field label="Full Name" col="1"><input value={intake.name} onChange={e => s("name", e.target.value)} style={inp} placeholder="Rahul Sharma" /></Field>
              <Field label="Target Job Title *" col="2"><input value={intake.role} onChange={e => s("role", e.target.value)} style={inp} placeholder="Software Engineer" /></Field>
              <Field label="Industry" col="1"><input value={intake.industry} onChange={e => s("industry", e.target.value)} style={inp} placeholder="IT, FinTech, Healthcare…" /></Field>
              <Field label="Career Situation" col="2">
                <select value={intake.situation} onChange={e => s("situation", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {SITUATIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Years of Experience *"><input value={intake.experience} onChange={e => s("experience", e.target.value)} style={inp} placeholder="2 years, or fresher, or 3 yrs in product + 2 in consulting" /></Field>
            <Field label="Key Achievements (add numbers where possible)">
              <textarea value={intake.achievements} onChange={e => s("achievements", e.target.value)} style={{ ...inp, minHeight: 80, resize: "vertical", lineHeight: 1.6 }} placeholder="Built system used by 200+ students · Won hackathon · Reduced load time by 40%…" />
            </Field>
            <Field label="Skills & Tools *">
              <textarea value={intake.skills} onChange={e => s("skills", e.target.value)} style={{ ...inp, minHeight: 65, resize: "vertical", lineHeight: 1.6 }} placeholder="Python, React, SQL, Git, Figma, REST APIs…" />
            </Field>
            <Field label="Job Description (optional — paste for best ATS match)">
              <textarea value={intake.jd} onChange={e => s("jd", e.target.value)} style={{ ...inp, minHeight: 90, resize: "vertical", lineHeight: 1.6 }} placeholder="Paste the job description here for keyword matching…" />
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={() => setPhase("resume")} disabled={!canStep1} style={{ background: canStep1 ? "#FF6B47" : "#1E3D5C", color: canStep1 ? "#fff" : "#6A8099", border: "none", borderRadius: 9, padding: "11px 24px", fontSize: 13.5, fontWeight: 600, cursor: canStep1 ? "pointer" : "not-allowed", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                Next: Add Resume <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {phase === "resume" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F0F4F8", margin: "0 0 4px", letterSpacing: "-0.3px" }}>Paste your current resume</h2>
            <p style={{ fontSize: 13, color: "#6A8099", marginBottom: 20 }}>Plain text is fine — copy from Word, PDF, or LinkedIn.</p>
            <textarea value={resume} onChange={e => setResume(e.target.value)} style={{ ...inp, minHeight: 320, resize: "vertical", lineHeight: 1.75, fontSize: 13 }} placeholder={"Rahul Sharma\nrahul@email.com | Delhi, India\n\nEXPERIENCE\nWeb Dev Intern — TechStartup (2024)\n• Responsible for building pages...\n\nEDUCATION\nB.Tech CS — Chandigarh University — 2024"} />
            {error && <div style={{ background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#FF8080", marginTop: 12 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
              <button onClick={() => setPhase("form")} style={{ background: "none", border: "1px solid #1E3D5C", borderRadius: 8, padding: "9px 16px", fontSize: 13, color: "#B8C8D8", cursor: "pointer", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                <ChevronLeft size={13} /> Back
              </button>
              <button onClick={generate} disabled={!canStep2} style={{ background: canStep2 ? "#FF6B47" : "#1E3D5C", color: canStep2 ? "#fff" : "#6A8099", border: "none", borderRadius: 9, padding: "11px 24px", fontSize: 13.5, fontWeight: 600, cursor: canStep2 ? "pointer" : "not-allowed", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
                <Sparkles size={14} /> Optimize My Resume
              </button>
            </div>
          </div>
        )}

        {phase === "gen" && (
          <div style={{ textAlign: "center", paddingTop: 100 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #1E3D5C", borderTop: "2px solid #FF6B47", margin: "0 auto 28px", animation: "spin 0.85s linear infinite" }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F0F4F8", marginBottom: 10, letterSpacing: "-0.3px" }}>Optimizing your resume…</h3>
            <p style={{ fontSize: 13.5, color: "#FF6B47", animation: "pulse 1.9s ease-in-out infinite" }}>{msgs[msgIdx]}</p>
            <p style={{ fontSize: 12, color: "#6A8099", marginTop: 8 }}>Takes about 15–30 seconds</p>
          </div>
        )}

        {phase === "results" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F0F4F8", margin: "0 0 3px", letterSpacing: "-0.3px" }}>Your Optimized Resume</h2>
                <p style={{ fontSize: 12.5, color: "#6A8099", margin: 0 }}>Review, copy, and paste into Word or Notion.</p>
              </div>
              <button onClick={copy} style={{ flexShrink: 0, background: copied ? "rgba(255,107,71,0.15)" : "#112236", border: `1px solid ${copied ? "#FF6B47" : "#1E3D5C"}`, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, color: copied ? "#FF6B47" : "#B8C8D8", cursor: "pointer", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy all</>}
              </button>
            </div>
            <div style={{ background: "#112236", border: "1px solid #1E3D5C", borderRadius: 12, padding: "28px 28px 36px" }}>
              <MarkdownView text={result} />
            </div>
            <div style={{ background: "#112236", border: "1px solid #1E3D5C", borderRadius: 12, padding: "20px 24px", marginTop: 20, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#B8C8D8", margin: "0 0 4px", fontWeight: 500 }}>Career coaches charge ₹3,000–₹10,000 for this.</p>
              <p style={{ fontSize: 13, color: "#6A8099", margin: "0 0 12px" }}>If Hupply helped you, buy me a coffee ☕</p>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#FF6B47", letterSpacing: "-0.5px" }}>UPI: yourname@upi</div>
              <p style={{ fontSize: 11, color: "#6A8099", marginTop: 6 }}>Google Pay · PhonePe · Paytm — any amount you feel is fair</p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button onClick={reset} style={{ background: "none", border: "1px solid #1E3D5C", borderRadius: 9, padding: "10px 22px", fontSize: 13, color: "#B8C8D8", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
                Optimize another resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}