"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking";
export const LANGS = { English: "en-US", Urdu: "ur-PK", Hindi: "hi-IN" } as const;

// Browser Web Speech API: works in Chrome/Edge/Android Chrome. Not available in Firefox.
export function useVoice(onFinalText: (t: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [lang, setLang] = useState<string>(LANGS.English);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const mouth = useRef(0); // 0..1, read every frame by the avatar
  const rec = useRef<any>(null);
  const supported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopSpeaking = useCallback(() => { speechSynthesis.cancel(); mouth.current = 0; }, []);

  const listen = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition is not supported in this browser. Use Chrome or Edge."); return; }
    stopSpeaking(); // interrupt JARVIS when the owner starts talking
    const r = new SR(); r.lang = lang; r.interimResults = false; r.continuous = false;
    r.onstart = () => { setError(null); setState("listening"); };
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setState("thinking"); onFinalText(t); };
    r.onerror = (e: any) => { setError(e.error === "not-allowed" ? "Microphone permission was denied." : `Voice error: ${e.error}`); setState("idle"); };
    r.onend = () => setState((s) => (s === "listening" ? "idle" : s));
    rec.current = r; r.start();
  }, [lang, onFinalText, stopSpeaking]);

  const stopListening = useCallback(() => { rec.current?.stop(); setState("idle"); }, []);

  const speak = useCallback((text: string) => {
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate;
    const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith(lang.slice(0, 2)));
    if (v) u.voice = v;
    u.onstart = () => setState("speaking");
    u.onboundary = () => { mouth.current = 0.6 + Math.random() * 0.4; }; // word-boundary pulse (approximate lip-sync)
    u.onend = u.onerror = () => { mouth.current = 0; setState("idle"); };
    speechSynthesis.speak(u);
  }, [lang, rate, stopSpeaking]);

  useEffect(() => () => { rec.current?.abort(); speechSynthesis.cancel(); }, []);
  return { state, setState, lang, setLang, rate, setRate, error, supported, mouth, listen, stopListening, speak, stopSpeaking };
}
