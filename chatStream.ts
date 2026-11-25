export type ChatEvent = { type: "delta"; text: string } | { type: "tool"; name: string; ok: boolean } | { type: "done"; conversationId: string } | { type: "error"; message: string };

export async function streamChat(message: string, conversationId: string | undefined, onEvent: (e: ChatEvent) => void, signal?: AbortSignal) {
  const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, conversationId }), signal });
  if (!res.ok || !res.body) throw new Error(await res.text());
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf("\n\n")) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 2); if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6))); }
  }
}
