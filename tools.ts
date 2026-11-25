import type { SupabaseClient } from "@supabase/supabase-js";
import { DeviceCommand, requiresApproval } from "@/lib/devices/policy";

export const toolDeclarations = [
  { name: "save_memory", description: "Save a fact ONLY when the owner explicitly asks you to remember it or clearly approves.",
    parameters: { type: "OBJECT", properties: { category: { type: "STRING", description: "preference|date|project|workflow|decision|instruction" }, content: { type: "STRING" } }, required: ["content"] } },
  { name: "search_memory", description: "Search the owner's saved memories by keyword.",
    parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] } },
  { name: "create_task", description: "Create a to-do/task for the owner.",
    parameters: { type: "OBJECT", properties: { title: { type: "STRING" } }, required: ["title"] } },
  { name: "queue_device_command", description: "Queue an allowlisted command for the owner's paired Windows PC. It is NOT executed here; sensitive ones wait for approval.",
    parameters: { type: "OBJECT", properties: { action: { type: "STRING", description: "open_app|open_url|search_files|delete_files|run_script" }, app: { type: "STRING" }, url: { type: "STRING" }, query: { type: "STRING" }, paths: { type: "ARRAY", items: { type: "STRING" } }, name: { type: "STRING" } }, required: ["action"] } },
];

export async function runTool(db: SupabaseClient, userId: string, name: string, a: any): Promise<Record<string, unknown>> {
  try {
    if (name === "save_memory") {
      const { data, error } = await db.from("memories").insert({ user_id: userId, category: a.category ?? "preference", content: String(a.content).slice(0, 2000) }).select("id").single();
      return error ? { ok: false, error: error.message } : { ok: true, id: data.id };
    }
    if (name === "search_memory") {
      const q = String(a.query).replace(/[%,]/g, " ").slice(0, 100);
      const { data, error } = await db.from("memories").select("id,category,content").ilike("content", `%${q}%`).limit(10);
      return error ? { ok: false, error: error.message } : { ok: true, results: data };
    }
    if (name === "create_task") {
      const { data, error } = await db.from("tasks").insert({ user_id: userId, title: String(a.title).slice(0, 300) }).select("id").single();
      return error ? { ok: false, error: error.message } : { ok: true, id: data.id };
    }
    if (name === "queue_device_command") {
      const parsed = DeviceCommand.safeParse(a);
      if (!parsed.success) return { ok: false, error: "Command not allowed or malformed", issues: parsed.error.issues.map((i) => i.message) };
      const needs = requiresApproval(parsed.data);
      const { data, error } = await db.from("device_commands").insert({ user_id: userId, action: parsed.data.action, args: parsed.data, status: needs ? "pending_approval" : "approved" }).select("id").single();
      return error ? { ok: false, error: error.message } : { ok: true, id: data.id, status: needs ? "pending_approval" : "approved_waiting_for_agent", executed: false };
    }
    return { ok: false, error: `Unknown tool ${name}` };
  } catch (e: any) { return { ok: false, error: e?.message ?? "tool failed" }; }
}
