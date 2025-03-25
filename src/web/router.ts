import { adminRouter } from "@/web/admin/router.ts";
import { Hono } from "npm:hono";
import { logger } from "npm:hono/logger";
import { client } from "@/bot.ts";

const app = new Hono();

app.use(logger());
app.route("/admin", adminRouter);
app.get("/health", (c) => {
  if (!client.isReady) return c.text("NOT READY");
  if (client.user === null) return c.text("NOT CONNECTED");

  return c.text("OK");
});

export { app };
