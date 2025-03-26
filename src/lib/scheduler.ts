import { nanoid } from "nanoid";
import { db } from "./db.ts";
import { Collection, OAuth2Guild, Snowflake } from "discord.js";
import { client } from "@/bot.ts";
import { toArray } from "./utils.ts";
import { endOfMinute, isAfter, isBefore, startOfMinute } from "date-fns";

export type Task =
  & { id: string; invokeAt: Date }
  & (
    | {
      type: "duck-spawn";
      payload: { guildId: string; duckId: string };
    }
    | {
      type: "duck-leave";
      payload: { guildId: string; duckId: string };
    }
  );

async function handleTasks() {
  const now = new Date();
  const allTasks = await toArray(db.schedulerListTasks());

  const start = startOfMinute(now);
  const end = endOfMinute(now);

  const currentTasks = allTasks.filter((t) => isAfter(t.invokeAt, start) && isBefore(t.invokeAt, end));

  for (const task of currentTasks) {
    await handleTask(task);
    await db.schedulerRemoveTask(task.id);
  }
}

async function handleTask(task: Task) {
  console.log("running task", task);

  if (task.type === "duck-spawn") {
    const channelId = await db.guildSettingsGetChannel({ guildId: task.payload.guildId });
    if (!channelId) return console.warn("No channel set for guild", task.payload.guildId);

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isSendable()) return;
    channel.send("-,_,.-'​`'°​-​,_,.-​''` Quack Quack! A wild duck appeared!");
  } else if (task.type === "duck-leave") {
    const guildDuck = await db.guildGetDuck({ guildId: task.payload.guildId, duckId: task.payload.duckId });
    if (guildDuck?.killedAt !== null) return;
    if (guildDuck?.fledAt !== null) return;

    const channelId = await db.guildSettingsGetChannel({ guildId: task.payload.guildId });
    if (!channelId) return console.warn("No channel set for guild", task.payload.guildId);

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isSendable()) return;
    channel.send("-,_,.-'​`'°​-​,_,.-​''` The duck flew away!");
  }
}

function generateRandomDelay() {
  const now = new Date();

  const startTime = new Date(now.setHours(8, 0, 0, 0)).getTime();
  const endTime = new Date(now.setHours(23, 59, 59, 999)).getTime();

  const currentTime = Date.now();

  const randomTime = startTime + Math.random() * (endTime - startTime);
  const ms = randomTime - currentTime;

  return ms;
}

async function scheduleDuck({ delay, guildId, ttl }: { delay?: number; ttl?: number; guildId: string }) {
  delay ??= generateRandomDelay();
  ttl ??= 2 * 1000 * 60;
  const duckId = nanoid();

  const spawnsAt = startOfMinute(new Date((new Date()).getTime() + delay));
  const leavesAt = startOfMinute(new Date(spawnsAt.getTime() + ttl));

  await db.guildAddDuck({ guildId, duckId, spawnsAt, leavesAt });
  await db.schedulerCreateTask({ invokeAt: spawnsAt, id: nanoid(), type: "duck-spawn", payload: { guildId, duckId } });
  await db.schedulerCreateTask({ invokeAt: leavesAt, id: nanoid(), type: "duck-leave", payload: { guildId, duckId } });
}

async function scheduleDucks() {
  const guilds: Collection<Snowflake, OAuth2Guild> = await client.guilds.fetch();
  for (const guild of guilds.values()) {
    const guildId = guild.id;

    await scheduleDuck({ guildId });
    await scheduleDuck({ guildId });
  }
}

export const scheduler = { handleTask, scheduleDucks, handleTasks };
