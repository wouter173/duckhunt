const INTERNAL_kv = await Deno.openKv("./db/db.sqlite");

Deno.addSignalListener("SIGINT", () => {
  INTERNAL_kv.close();
  Deno.exit();
});

export type GuildDuck = {
  spawnsAt: Date;
  leavesAt: Date;
  killedAt: Date | null;
};

async function guildGetAllDucks({ guildId }: { guildId: string }) {
  const ducks = await INTERNAL_kv.list<GuildDuck>({ prefix: ["guild", guildId, "duck"] });
  return ducks;
}

async function guildGetDuck({ guildId, duckId }: { guildId: string; duckId: string }) {
  const duck = await INTERNAL_kv.get<GuildDuck>(["guild", guildId, "duck", duckId]);
  return duck.value;
}

function guildAddDuck({ guildId, duckId, spawnsAt, leavesAt }: { guildId: string; duckId: string; spawnsAt: Date; leavesAt: Date }) {
  return INTERNAL_kv.set(["guild", guildId, "duck", duckId], {
    spawnsAt,
    leavesAt,
    killedAt: null,
  } as GuildDuck);
}

async function guildKillDuck({ guildId, duckId, killedAt }: { guildId: string; duckId: string; killedAt: Date }) {
  const duck = await guildGetDuck({ guildId, duckId });
  INTERNAL_kv.set(["guild", guildId, "duck", duckId], { ...duck, killedAt });
}

async function guildSettingsGetChannel({ guildId }: { guildId: string }) {
  const channel = await INTERNAL_kv.get<string>(["guild", guildId, "settings", "channel"]);
  return channel.value;
}

function guildSettingsSetChannel({ guildId, channelId }: { guildId: string; channelId: string }) {
  return INTERNAL_kv.set(["guild", guildId, "settings", "channel"], channelId);
}

function guildMemberAddKill({ guildId, memberId }: { guildId: string; memberId: string }) {
  return INTERNAL_kv.atomic().sum(["guild", guildId, "member", "kills", memberId], 1n).commit();
}

async function guildMemberGetKills({ guildId, memberId }: { guildId: string; memberId: string }) {
  const kills = await INTERNAL_kv.get<bigint>(["guild", guildId, "member", "kills", memberId]);
  return Number(kills.value);
}

async function guildMemberGetAllKills({ guildId }: { guildId: string }) {
  const kills = await INTERNAL_kv.list<bigint>({ prefix: ["guild", guildId, "member", "kills"] });
  return kills;
}

async function guildMemberUseBullet({ guildId, memberId }: { guildId: string; memberId: string }) {
  const bullets = await INTERNAL_kv.get<bigint>(["guild", guildId, "member", memberId, "bullets"]);
  if (bullets.value === 0n || !bullets.value) return;
  return INTERNAL_kv.set(["guild", guildId, "member", memberId, "bullets"], bullets.value - 1n);
}

async function guildMemberGetBullets({ guildId, memberId }: { guildId: string; memberId: string }) {
  const bullets = await INTERNAL_kv.get<bigint>(["guild", guildId, "member", memberId, "bullets"]);
  return Number(await bullets.value);
}

function guildMemberReload({ guildId, memberId }: { guildId: string; memberId: string }) {
  return INTERNAL_kv.set(["guild", guildId, "member", memberId, "bullets"], 6n);
}

function guildMemberJamWeapon({ guildId, memberId }: { guildId: string; memberId: string }) {
  return INTERNAL_kv.set(["guild", guildId, "member", memberId, "jammed"], true);
}

function guildMemberUnJamWeapon({ guildId, memberId }: { guildId: string; memberId: string }) {
  return INTERNAL_kv.set(["guild", guildId, "member", memberId, "jammed"], false);
}

async function guildMemberGetIsWeaponJammed({ guildId, memberId }: { guildId: string; memberId: string }) {
  const jammed = await INTERNAL_kv.get<boolean>(["guild", guildId, "member", memberId, "jammed"]);
  return jammed.value;
}

const kv = {
  guildAddDuck,
  guildGetDuck,
  guildGetAllDucks,
  guildKillDuck,
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
};

export { INTERNAL_kv as INTERNAL_kv, kv };
