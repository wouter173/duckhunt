import { Hono } from "hono";
import { logger } from "hono/logger";
import { client } from "@/bot.ts";
import { stream, toArray } from "@/lib/utils.ts";
import { AdminPage } from "./components/admin.page.tsx";
import { scheduler } from "@/lib/scheduler.ts";
import { basicAuth } from "hono/basic-auth";
import { db } from "@/lib/db.ts";
import { syncCommands } from "@/commands.ts";
import { DashboardPage } from "@/web/components/dashboard.page.tsx";
import { env } from "@/lib/env.ts";

const app = new Hono();

app.use(logger());
app.get("/health", (c) => {
  if (!client.isReady) return c.text("NOT READY");
  if (client.user === null) return c.text("NOT CONNECTED");

  return c.text("OK");
});
app.get("/", (c) => stream(c, DashboardPage));

app.use("/admin/*", basicAuth({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }));

app.get("/admin", (c) => stream(c, AdminPage));
app.get("/admin/schedule", async (c) => {
  await scheduler.scheduleDucks();
  return c.redirect(`/admin?status=${encodeURIComponent("Tasks scheduled!")}`);
});
app.get("/admin/schedule-now", async (c) => {
  await scheduler.scheduleDuck({ delay: 1 * 1000 * 60, guildId: env.GUILD_ID });
  return c.redirect(`/admin?status=${encodeURIComponent("Tasks scheduled for in 1 minute!")}`);
});
app.get("/admin/dequeue", async (c) => {
  (await toArray(db.schedulerListTasks())).map((t) => db.schedulerRemoveTask(t.id));
  return c.redirect(`/admin?status=${encodeURIComponent("Tasks dequeued!")}`);
});
app.get("/admin/sync-commands", async (c) => {
  await syncCommands();
  return c.redirect(`/admin?status=${encodeURIComponent("Commands Synced!")}`);
});

export { app };
