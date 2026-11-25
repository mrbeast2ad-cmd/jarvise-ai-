"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { streamChat } from "@/lib/client/chatStream";
import { useVoice, LANGS } from "@/hooks/useVoice";

const Avatar = dynamic(() => import("@/components/Avatar").then((m) => m.Avatar), { ssr: false });
type Msg = { role: "user" | "assistant"; text: string };

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null); const [tool, setTool] = useState<string | null>(null);
  const [hasGlb, setHasGlb] = useState(false); const [speakReplies, setSpeakReplies] = useState(true);
  const conv = useRef<string | undefined>(undefined);
  const sendRef = useRef<(t: string) => void>(() => {});
  const endRef = useRef<HTMLDivElement>(null);
  const voice = useVoice(useCallback((t: string) => sendRef.current(t), []));

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => setAuthed(!!data.user)).catch(() => setAuthed(false));
    fetch("/avatar.glb", { method: "HEAD" }).then((r) => setHasGlb(r.ok)).catch(() => setHasGlb(false));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  sendRef.current = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true); setErr(null); setTool(null); voice.setState("thinking");
    setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", text: "" }]);
    let full = "";
    try {
      await streamChat(text, conv.current, (e) => {
        if (e.type === "delta") { full += e.text; setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", text: full }; return c; }); }
        else if (e.type === "tool") setTool(`${e.name}: ${e.ok ? "done" : "failed"}`);
        else if (e.type === "done") conv.current = e.conversationId;
        else if (e.type === "error") setErr(e.message);
      });
      if (full && speakReplies) voice.speak(full); else voice.setState("idle");
    } catch (e: any) { setErr(e?.message ?? "Request failed"); voice.setState("idle"); }
    setBusy(false);
  };

  if (authed === false) return (<main className="wrap" style={{ gridTemplateColumns: "1fr", maxWidth: 420, marginTop: 60 }}><div className="glass" style={{ padding: 24 }}><h1>JARVIS AI</h1><p>Please sign in, Sir.</p><a href="/login"><button className="primary">Go to login</button></a></div></main>);

  return (
    <main className="wrap">
      <section className="glass avatarBox" aria-label="AI avatar">
        {hasGlb ? <Avatar state={voice.state} mouth={voice.mouth} /> : <div className="orb" aria-hidden />}
        <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 8 }}>
          <span className="badge">{voice.state}</span>{!hasGlb && <span className="badge">avatar.glb missing</span>}
        </div>
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="primary" onClick={voice.state === "listening" ? voice.stopListening : voice.listen} aria-pressed={voice.state === "listening"}>{voice.state === "listening" ? "Stop" : "🎤 Speak"}</button>
          <button onClick={voice.stopSpeaking}>Silence</button>
          <select aria-label="Language" value={voice.lang} onChange={(e) => voice.setLang(e.target.value)}>{Object.entries(LANGS).map(([n, c]) => <option key={c} value={c}>{n}</option>)}</select>
          <label style={{ fontSize: 13 }}><input type="checkbox" checked={speakReplies} onChange={(e) => setSpeakReplies(e.target.checked)} style={{ flex: "none" }} /> Voice replies</label>
        </div>
      </section>
      <section className="glass chat" aria-label="Conversation">
        <div className="msgs" aria-live="polite">
          {msgs.length === 0 && <div style={{ color: "var(--silver)" }}>At your service, Sir. Type or speak.</div>}
          {msgs.map((m, i) => <div key={i} className={`m ${m.role}`}>{m.text || "…"}</div>)}
          <div ref={endRef} />
        </div>
        {tool && <div className="err" style={{ color: "var(--gold)" }}>Tool → {tool}</div>}
        {err && <div role="alert" className="err">{err}</div>}
        {voice.error && <div role="alert" className="err">{voice.error}</div>}
        <form className="bar" onSubmit={(e) => { e.preventDefault(); const t = input; setInput(""); sendRef.current(t); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message JARVIS…" aria-label="Message" />
          <button className="primary" disabled={busy || authed === null}>Send</button>
        </form>
      </section>
    </main>
  );
}
