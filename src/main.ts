import { client } from "./bot.ts";
import { env } from "@/lib/env.ts";

import { scheduler } from "./lib/scheduler.ts";
import { app } from "./web/router.ts";

//Web server
Deno.serve(app.fetch);

//scheduler
Deno.cron("scheduler-schedule-tasks", "0 0 * * *", scheduler.scheduleDucks);
Deno.cron("scheduler-handle-tasks", "* * * * *", scheduler.handleTasks);

//Bot
client.login(env.TOKEN);
