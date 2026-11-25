import { z } from "zod";

// Only these actions can ever be queued. Free-form shell text is never accepted.
export const DeviceCommand = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open_app"), app: z.enum(["chrome", "vscode", "explorer", "notepad"]) }),
  z.object({ action: z.literal("open_url"), url: z.string().url().refine((u) => u.startsWith("https://"), "https only") }),
  z.object({ action: z.literal("search_files"), query: z.string().min(1).max(200) }),
  z.object({ action: z.literal("delete_files"), paths: z.array(z.string()).min(1).max(50) }),
  z.object({ action: z.literal("run_script"), name: z.string().regex(/^[\w-]{1,64}$/) }),
]);
export type DeviceCommand = z.infer<typeof DeviceCommand>;

const SENSITIVE = new Set(["delete_files", "run_script"]);
// Sensitive commands stay pending until the owner taps Approve in the UI (plus passkey when enabled).
export const requiresApproval = (c: DeviceCommand) => SENSITIVE.has(c.action);
