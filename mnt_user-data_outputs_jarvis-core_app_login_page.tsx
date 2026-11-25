"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  async function go(mode: "in" | "up") {
    setBusy(true); setMsg(null);
    try {
      const db = supabaseBrowser();
      const { error } = mode === "in" ? await db.auth.signInWithPassword({ email, password }) : await db.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else if (mode === "up") setMsg("Account created. If email confirmation is enabled, check your inbox, then sign in.");
      else window.location.href = "/";
    } catch (e: any) { setMsg(e?.message ?? "Supabase is not configured (check environment variables)."); }
    setBusy(false);
  }
  return (
    <main className="wrap" style={{ gridTemplateColumns: "1fr", maxWidth: 420, marginTop: 60 }}>
      <div className="glass" style={{ padding: 24, display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>JARVIS <span style={{ color: "var(--gold)" }}>AI</span></h1>
        <p style={{ margin: 0, color: "var(--silver)" }}>Your Personal Intelligent Assistant</p>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={{ width: "100%" }} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ width: "100%" }} /></label>
        {msg && <div role="alert" className="err" style={{ padding: 0 }}>{msg}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="primary" disabled={busy} onClick={() => go("in")}>Sign in</button>
          <button disabled={busy} onClick={() => go("up")}>Register</button>
        </div>
      </div>
    </main>
  );
}
