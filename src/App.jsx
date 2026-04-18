import { useState, useEffect } from "react";
import { Sparkles, ChevronRight, ChevronLeft, Copy, Check } from "lucide-react";

const SITUATIONS = [
  { value: "new-job", label: "New role in same field" },
  { value: "promotion", label: "Internal promotion" },
  { value: "switch", label: "Career switch" },
  { value: "gap", label: "Returning after a gap" },
  { value: "fresher", label: "First job (fresher)" },
];

function inlineBold(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ fontWeight: 600, color: "#1A1520" }}>{p.slice(2, -2)}</strong>
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
          <li key={j} style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 14, color: "#3A3650", lineHeight: 1.65 }}>
            <span style={{ color: "#C8913A", flexShrink: 0, marginTop: 2, fontSize: 12 }}>▸</span>
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
      out.push(<h1 key={i} style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0F0E1A", margin: "20px 0 2px", letterSpacing: "-0.3px" }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      flush(i);
      out.push(
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, margin: "24px 0 8px" }}>
          <div style={{ width: 3, height: 16, background: "#C8913A", borderRadius: 2, flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 13, fontWeight: 700, color: "#C8913A", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{line.slice(3)}</h2>
        </div>
      );
    } else if (line.startsWith("### ")) {
      flush(i);
      out.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: "#1A1520", margin: "14px 0 4px" }}>{inlineBold(line.slice(4))}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      buf.push(line.slice(2));
    } else if (line.startsWith("---")) {
      flush(i);
      out.push(<hr key={i} style={{ border: "none", borderTop: "1px solid #EAE8F0", margin: "20px 0" }} />);
    } else if (line.trim() === "") {
      flush(i);
      out.push(<div key={i} style={{ height: 6 }} />);
    } else {
      flush(i);
      out.push(<p key={i} style={{ fontSize: 13.5, color: "#3A3650", margin: "1px 0", lineHeight: 1.65 }}>{inlineBold(line)}</p>);
    }
  });
  flush("end");
  return <div>{out}</div>;
}

const inp = {
  width: "100%", boxSizing: "border-box",
  background: "#FAFAF8",
  border: "1px solid #E0DDD8",
  borderRadius: 8,
  color: "#1A1520",
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontSize: 13.5,
  padding: "9px 12px",
  outline: "none",
};

const lbl = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#8A8599",
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

export default function ResumeForge() {
  const [phase, setPhase] = useState("intro");
  const [intake, setIntake] = useState({ name: "", role: "", industry: "", situation: "new-job", experience: "", achievements: "", skills: "", jd: "" });
  const [resume, setResume] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);

  const msgs = ["Diagnosing ATS issues...", "Rewriting impact bullets...", "Weaving in keywords...", "Crafting your summary...", "Building LinkedIn section...", "Writing your change log..."];

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

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

Key Achievements:
${intake.achievements || "None provided"}

Skills & Tools:
${intake.skills}

Target Job Description:
${intake.jd || "Not provided"}

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
    <div style={{ minHeight: "100vh", background: "#F6F4EF", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#1A1520" }}>
      <style>{`
        input:focus, textarea:focus, select:focus { border-color: #C8913A !important; box-shadow: 0 0 0 3px rgba(200,145,58,0.12); }
        input::placeholder, textarea::placeholder { color: #B0ADBE; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E5E0", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Sparkles size={16} color="#C8913A" />
          <span style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#0F0E1A", letterSpacing: "-0.2px" }}>Résumé Forge</span>
          <span style={{ fontSize: 11, color: "#B0ADBE", marginLeft: 2 }}>· AI-Powered</span>
        </div>
        {phase === "results" && (
          <button onClick={reset} style={{ fontSize: 12, color: "#8A8599", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Start over</button>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 60px" }}>

        {progIdx >= 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
            {["About you", "Your resume", "Results"].map((label, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 2, borderRadius: 2, background: i <= progIdx ? "#C8913A" : "#DDD9D2", marginBottom: 5, transition: "background 0.3s" }} />
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: i === progIdx ? "#C8913A" : i < progIdx ? "#C8913A80" : "#B0ADBE" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {phase === "intro" && (
          <div style={{ textAlign: "center", paddingTop: 40, animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF8EE", border: "1px solid #F0DDB8", borderRadius: 100, padding: "5px 14px", fontSize: 11, fontWeight: 600, color: "#C8913A", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 22 }}>
              <Sparkles size={12} /> Powered by Gemini AI
            </div>
            <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 700, color: "#0F0E1A", letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 14px" }}>
              Your Resume,<br /><em style={{ color: "#C8913A" }}>Forged to Win.</em>
            </h1>
            <p style={{ fontSize: 15, color: "#6A6878", maxWidth: 440, margin: "0 auto 30px", lineHeight: 1.7 }}>
              Paste your resume and tell us your goals. Get an ATS-optimized rewrite, LinkedIn makeover, and personalized coaching — free.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "0 auto 32px", textAlign: "left" }}>
              {["ATS-optimized bullet rewrites", "Keyword gap analysis", "LinkedIn headline + About section", "Change log with explanations", "Personalized coaching tips"].map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#4A4860" }}>
                  <div style={{ width: 5, height: 5, borderRadius: 1, background: "#C8913A", flexShrink: 0 }} />{f}
                </div>
              ))}
            </div>
            <button onClick={() => setPhase("form")} style={{ background: "#C8913A", color: "#FFF", border: "none", borderRadius: 9, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}>
              Get Started <ChevronRight size={15} />
            </button>
          </div>
        )}

        {phase === "form" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0F0E1A", margin: "0 0 4px" }}>Tell us about yourself</h2>
            <p style={{ fontSize: 13, color: "#8A8599", marginBottom: 24 }}>More context = better results. Fields marked * are required.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
              <Field label="Your Full Name" col="1">
                <input value={intake.name} onChange={e => s("name", e.target.value)} style={inp} placeholder="Jane Smith" />
              </Field>
              <Field label="Target Job Title *" col="2">
                <input value={intake.role} onChange={e => s("role", e.target.value)} style={inp} placeholder="Senior Product Manager" />
              </Field>
              <Field label="Industry" col="1">
                <input value={intake.industry} onChange={e => s("industry", e.target.value)} style={inp} placeholder="FinTech, SaaS, Healthcare…" />
              </Field>
              <Field label="Career Situation" col="2">
                <select value={intake.situation} onChange={e => s("situation", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {SITUATIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Years of Experience *">
              <input value={intake.experience} onChange={e => s("experience", e.target.value)} style={inp} placeholder="e.g. 5 years, or 3 yrs in product + 2 in consulting" />
            </Field>
            <Field label="Key Achievements (with numbers where possible)">
              <textarea value={intake.achievements} onChange={e => s("achievements", e.target.value)} style={{ ...inp, minHeight: 80, resize: "vertical", lineHeight: 1.6 }} placeholder="Led product launch driving $2M revenue · Reduced churn 18% · Managed 12-person team…" />
            </Field>
            <Field label="Key Skills & Tools *">
              <textarea value={intake.skills} onChange={e => s("skills", e.target.value)} style={{ ...inp, minHeight: 65, resize: "vertical", lineHeight: 1.6 }} placeholder="Python, Figma, SQL, Agile, Stakeholder Management…" />
            </Field>
            <Field label="Target Job Description (paste keywords or full JD for best ATS matching)">
              <textarea value={intake.jd} onChange={e => s("jd", e.target.value)} style={{ ...inp, minHeight: 100, resize: "vertical", lineHeight: 1.6 }} placeholder="Paste the job description here…" />
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={() => setPhase("resume")} disabled={!canStep1} style={{ background: canStep1 ? "#C8913A" : "#E8E5E0", color: canStep1 ? "#FFF" : "#B0ADBE", border: "none", borderRadius: 9, padding: "11px 24px", fontSize: 13.5, fontWeight: 600, cursor: canStep1 ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                Next: Add Resume <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {phase === "resume" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0F0E1A", margin: "0 0 4px" }}>Paste your current resume</h2>
            <p style={{ fontSize: 13, color: "#8A8599", marginBottom: 20 }}>Plain text is fine — copy from Word, PDF, or any source.</p>
            <textarea value={resume} onChange={e => setResume(e.target.value)} style={{ ...inp, minHeight: 320, resize: "vertical", lineHeight: 1.75, fontSize: 13 }} placeholder={"John Smith\njohn@email.com | New York, NY\n\nEXPERIENCE\nSoftware Engineer — Acme Corp (2021–2024)\n• Responsible for building frontend features...\n\nEDUCATION\nB.Tech Computer Science — IIT Delhi — 2021"} />
            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginTop: 12 }}>{error}</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
              <button onClick={() => setPhase("form")} style={{ background: "none", border: "1px solid #E0DDD8", borderRadius: 8, padding: "9px 16px", fontSize: 13, color: "#6A6878", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                <ChevronLeft size={13} /> Back
              </button>
              <button onClick={generate} disabled={!canStep2} style={{ background: canStep2 ? "#C8913A" : "#E8E5E0", color: canStep2 ? "#FFF" : "#B0ADBE", border: "none", borderRadius: 9, padding: "11px 24px", fontSize: 13.5, fontWeight: 600, cursor: canStep2 ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} /> Optimize My Resume
              </button>
            </div>
          </div>
        )}

        {phase === "gen" && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid #E8E5E0", borderTop: "2px solid #C8913A", margin: "0 auto 28px", animation: "spin 0.9s linear infinite" }} />
            <h3 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 20, fontWeight: 400, fontStyle: "italic", color: "#0F0E1A", marginBottom: 10 }}>Forging your resume…</h3>
            <p style={{ fontSize: 13.5, color: "#C8913A", animation: "fade 1.9s ease-in-out infinite" }}>{msgs[msgIdx]}</p>
            <p style={{ fontSize: 12, color: "#B0ADBE", marginTop: 8 }}>This takes about 15–30 seconds</p>
          </div>
        )}

        {phase === "results" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0F0E1A", margin: "0 0 3px" }}>Your Optimized Resume</h2>
                <p style={{ fontSize: 12.5, color: "#8A8599", margin: 0 }}>Review, copy, and paste into your preferred doc editor.</p>
              </div>
              <button onClick={copy} style={{ flexShrink: 0, background: copied ? "#F0FDF4" : "#FFFFFF", border: `1px solid ${copied ? "#86EFAC" : "#E0DDD8"}`, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, color: copied ? "#16A34A" : "#6A6878", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy all</>}
              </button>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E5E0", borderRadius: 12, padding: "28px 28px 36px" }}>
              <MarkdownView text={result} />
            </div>

            {/* UPI Tip Jar */}
            <div style={{ background: "#FFFBF0", border: "1px solid #F0DDB8", borderRadius: 12, padding: "20px 24px", marginTop: 24, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#6A6050", margin: "0 0 4px", fontWeight: 500 }}>This would cost ₹3,000–₹10,000 at a career coach.</p>
              <p style={{ fontSize: 13, color: "#9A8C7A", margin: "0 0 12px" }}>If this helped you, consider buying me a coffee ☕</p>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#C8913A", fontFamily: "'Libre Baskerville', serif", letterSpacing: "-0.5px" }}>UPI: abhigyan.gupta5@oksbi</div>
              <p style={{ fontSize: 11, color: "#B0A898", marginTop: 6 }}>Google Pay · PhonePe · Paytm — any amount you feel is fair</p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <button onClick={reset} style={{ background: "none", border: "1px solid #E0DDD8", borderRadius: 9, padding: "10px 22px", fontSize: 13, color: "#6A6878", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Optimize another resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
