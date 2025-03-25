import { Hono } from "npm:hono";

import { renderToReadableStream } from "npm:hono/jsx/streaming";

import { AdminDashboard } from "./admin.tsx";
import { db } from "../../lib/db.ts";
import { toArray } from "@/lib/utils.ts";
import { scheduler } from "@/lib/scheduler.ts";
import { syncCommands } from "@/commands.ts";

const adminRouter = new Hono();

adminRouter.get("/", (c) =>
  c.body(renderToReadableStream(AdminDashboard({ params: c.req.query() })), {
    headers: { "Content-Type": "text/html; charset=UTF-8", "Transfer-Encoding": "chunked" },
  }));

adminRouter.get("/schedule", async (c) => {
  await scheduler.scheduleDucks();
  return c.redirect(`/admin?status=${encodeURIComponent("Tasks scheduled!")}`);
});

adminRouter.get("/dequeue", async (c) => {
  (await toArray(db.schedulerListTasks())).map((t) => db.schedulerRemoveTask(t.id));
  return c.redirect(`/admin?status=${encodeURIComponent("Tasks dequeued!")}`);
});

adminRouter.get("/sync-commands", async (c) => {
  await syncCommands();
  return c.redirect(`/admin?status=${encodeURIComponent("Commands Synced!")}`);
});

export { adminRouter };
