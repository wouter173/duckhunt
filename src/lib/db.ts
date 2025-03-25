import { Task } from "./scheduler.ts";

const kv = await Deno.openKv("./db/db.sqlite");

Deno.addSignalListener("SIGINT", () => {
  kv.close();
  Deno.exit();
});

export type GuildDuck = {
  spawnsAt: Date;
  leavesAt: Date;
  killedAt: Date | null;
  fledAt: Date | null;
};

async function guildGetAllDucks({ guildId }: { guildId: string }) {
  const ducks = await kv.list<GuildDuck>({ prefix: ["guild", guildId, "duck"] });
  return ducks;
}

async function guildGetDuck({ guildId, duckId }: { guildId: string; duckId: string }) {
  const duck = await kv.get<GuildDuck>(["guild", guildId, "duck", duckId]);
  return duck.value;
}

function guildAddDuck({ guildId, duckId, spawnsAt, leavesAt }: { guildId: string; duckId: string; spawnsAt: Date; leavesAt: Date }) {
  const duck: GuildDuck = { spawnsAt, leavesAt, killedAt: null, fledAt: null };
  return kv.set(["guild", guildId, "duck", duckId], duck);
}

async function guildDuckKill({ guildId, duckId, killedAt }: { guildId: string; duckId: string; killedAt: Date }) {
  const duck = await guildGetDuck({ guildId, duckId });
  kv.set(["guild", guildId, "duck", duckId], { ...duck, killedAt });
}

async function guildDuckFlee({ guildId, duckId, fledAt }: { guildId: string; duckId: string; fledAt: Date }) {
  const duck = await guildGetDuck({ guildId, duckId });
  kv.set(["guild", guildId, "duck", duckId], { ...duck, fledAt });
}

async function guildSettingsGetChannel({ guildId }: { guildId: string }) {
  const channel = await kv.get<string>(["guild", guildId, "settings", "channel"]);
  return channel.value;
}

function guildSettingsSetChannel({ guildId, channelId }: { guildId: string; channelId: string }) {
  return kv.set(["guild", guildId, "settings", "channel"], channelId);
}

function guildMemberAddKill({ guildId, memberId }: { guildId: string; memberId: string }) {
  return kv.atomic().sum(["guild", guildId, "member", "kills", memberId], 1n).commit();
}

async function guildMemberGetKills({ guildId, memberId }: { guildId: string; memberId: string }) {
  const kills = await kv.get<bigint>(["guild", guildId, "member", "kills", memberId]);
  return Number(kills.value);
}

async function guildMemberGetAllKills({ guildId }: { guildId: string }) {
  const kills = await kv.list<bigint>({ prefix: ["guild", guildId, "member", "kills"] });
  return kills;
}

async function guildMemberUseBullet({ guildId, memberId }: { guildId: string; memberId: string }) {
  const bullets = await kv.get<bigint>(["guild", guildId, "member", memberId, "bullets"]);
  if (bullets.value === 0n || !bullets.value) return;
  return kv.set(["guild", guildId, "member", memberId, "bullets"], bullets.value - 1n);
}

async function guildMemberGetBullets({ guildId, memberId }: { guildId: string; memberId: string }) {
  const bullets = await kv.get<bigint>(["guild", guildId, "member", memberId, "bullets"]);
  return Number(await bullets.value);
}

function guildMemberReload({ guildId, memberId }: { guildId: string; memberId: string }) {
  return kv.set(["guild", guildId, "member", memberId, "bullets"], 6n);
}

function guildMemberJamWeapon({ guildId, memberId }: { guildId: string; memberId: string }) {
  return kv.set(["guild", guildId, "member", memberId, "jammed"], true);
}

function guildMemberUnJamWeapon({ guildId, memberId }: { guildId: string; memberId: string }) {
  return kv.set(["guild", guildId, "member", memberId, "jammed"], false);
}

async function guildMemberGetIsWeaponJammed({ guildId, memberId }: { guildId: string; memberId: string }) {
  const jammed = await kv.get<boolean>(["guild", guildId, "member", memberId, "jammed"]);
  return jammed.value;
}

function schedulerCreateTask(task: Task) {
  const expireIn = 24 * 60 * 60 * 1000; // day in ms
  return kv.set(["scheduler", "task", task.id], task, { expireIn });
}

function schedulerListTasks() {
  return kv.list<Task>({ prefix: ["scheduler", "task"] });
}

function schedulerRemoveTask(id: string) {
  return kv.delete(["scheduler", "task", id]);
}

const db = {
  guildAddDuck,
  guildGetDuck,
  guildGetAllDucks,
  guildDuckKill,
  guildDuckFlee,
  guildSettingsGetChannel,
  guildSettingsSetChannel,
  guildMemberAddKill,
  guildMemberGetKills,
  guildMemberGetAllKills,
  guildMemberUseBullet,
  guildMemberGetBullets,
  guildMemberReload,
  guildMemberJamWeapon,
  guildMemberUnJamWeapon,
  guildMemberGetIsWeaponJammed,

  schedulerListTasks,
  schedulerCreateTask,
  schedulerRemoveTask,
};

export { db };
