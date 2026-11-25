# JARVIS AI — honest status (v0.3 core drop)
Nothing here has been compiled or run. No `npm install`/`tsc`/Supabase available in the build sandbox. Expect first-run fixes.

## Written in this drop (untested)
- supabase/migrations/002_brain_memory.sql — tables + RLS (own-rows policy on every table)
- app/api/chat/route.ts — auth-checked, Gemini streaming over SSE, tool loop, saves messages, logs token usage
- lib/ai/tools.ts — save_memory, search_memory, create_task, queue_device_command
- lib/devices/policy.ts — zod allowlist; delete_files/run_script force approval
- hooks/useVoice.ts — browser speech recognition + TTS, interruptible, ur/hi/en
- components/Avatar.tsx — R3F avatar: blink, jaw/lip pulse, expressions per state
- lib/client/chatStream.ts — SSE client

## NOT done yet
- Approve/reject route for pending device commands; Windows agent polling/results (agent/windows/agent.py not reviewed)
- Chat/Voice pages wiring (useVoice + streamChat + Avatar into pages)
- pgvector semantic memory; memory edit/delete/export UI; rate limiting; OpenAI provider
- Website builder sandbox, video worker job queue, calendar, passkeys, admin dashboard

## External requirements
Supabase project (URL, anon key, service role key), GEMINI_API_KEY, a rigged ARKit GLB at public/avatar.glb, ffmpeg for video, Chrome/Edge for Web Speech.
