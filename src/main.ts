import type { Collection, OAuth2Guild, Snowflake } from "npm:discord.js";
import { Client, IntentsBitField } from "npm:discord.js";
import { nanoid } from "npm:nanoid";
import { kv } from "./kv.ts";
import { queue } from "./queue.ts";
import { generateRandomDelay } from "./schedular.ts";

const prefix = "!";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
  ],
});

async function summonDuck({ delay, guildId, ttl }: { delay?: number; ttl?: number; guildId: string }) {
  delay ??= generateRandomDelay();
  ttl ??= 2 * 1000 * 60;
  const duckId = nanoid();

  const spawnsAt = new Date((new Date()).getTime() + delay);
  await kv.guildAddDuck({ guildId, duckId, spawnsAt, leavesAt: new Date(spawnsAt.getTime() + ttl) });

  queue.scheduleTask({ type: "duck-spawn", payload: { guildId, duckId } }, { delay });
  queue.scheduleTask({ type: "duck-leave", payload: { guildId, duckId } }, { delay: delay + ttl });
}

async function scheduleTasks() {
  const guilds: Collection<Snowflake, OAuth2Guild> = await client.guilds.fetch();
  for (const guild of guilds.values()) {
    const guildId = guild.id;

    await summonDuck({ guildId });
    await summonDuck({ guildId });
    await summonDuck({ guildId, delay: 5 * 1000, ttl: 10 * 1000 });
  }
}

queue.listen(async (task) => {
  console.log("running task", task);

  if (task.type === "duck-spawn") {
    const channelId = await kv.guildSettingsGetChannel({ guildId: task.payload.guildId });
    if (!channelId) return console.warn("No channel set for guild", task.payload.guildId);

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isSendable()) return;
    channel.send("-,_,.-'​`'°​-​,_,.-​''` Quack Quack! A wild duck appeared!");
  } else if (task.type === "duck-leave") {
    const guildDuck = await kv.guildGetDuck({ guildId: task.payload.guildId, duckId: task.payload.duckId });
    if (guildDuck?.killedAt !== null) return;
    if (guildDuck?.fledAt !== null) return;

    const channelId = await kv.guildSettingsGetChannel({ guildId: task.payload.guildId });
    if (!channelId) return console.warn("No channel set for guild", task.payload.guildId);

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isSendable()) return;
    channel.send("-,_,.-'​`'°​-​,_,.-​''` The duck flew away!");
  }
});

client.on("ready", (client) => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (!interaction.guildId) {
    interaction.reply("This command can only be used in a server!");
    return;
  }

  if (!interaction.member) {
    interaction.reply("You need to be in a server to use this command!");
    return;
  }

  if (interaction.commandName === "stats") {
    const killsMap: Record<string, number> = {};

    const allMemberKills = await kv.guildMemberGetAllKills({ guildId: interaction.guildId });
    const guild = await client.guilds.fetch(interaction.guildId);
    for await (const kill of allMemberKills) {
      const member = await guild.members.fetch(kill.key[4]);
      killsMap[member.user.displayName] = Number(kill.value);
    }

    const sortedKills = Object.entries(killsMap).sort((a, b) => b[1] - a[1]);
    const topKills = sortedKills.slice(0, 5);

    const topKillsMessage = topKills.map(([user, kills], i) => `${i + 1}. ${user}: ${kills} kills`).join("\n");

    await interaction.reply({ content: `**Top 5 duck removers**\n${topKillsMessage}` });
  }

  if (interaction.commandName === "kills") {
    const kills = await kv.guildMemberGetKills({ guildId: interaction.guildId, memberId: interaction.member.id! });
    const bullets = await kv.guildMemberGetBullets({ guildId: interaction.guildId, memberId: interaction.member.id! });

    await interaction.reply({ content: `You have ${kills} kills and ${bullets} bullets!`, ephemeral: true });
  }

  if (interaction.commandName === "settings") {
    const subCommand = interaction.options.data.find((option) => option.type === 1);

    if (subCommand?.name === "channel") {
      const channelId = subCommand.options?.[0].value as string;

      await kv.guildSettingsSetChannel({ guildId: interaction.guildId, channelId: channelId });
      interaction.reply({ content: `Set your guilds duck channel to <#${channelId}>!`, ephemeral: true });
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.member) return;

  const memberId = message.member.id;
  const guildId = message.guild.id;

  if (message.content.startsWith(`${prefix}reload`)) {
    const isJammed = await kv.guildMemberGetIsWeaponJammed({ guildId, memberId });
    if (isJammed) await kv.guildMemberUnJamWeapon({ guildId, memberId });

    await kv.guildMemberReload({ guildId, memberId });
    message.reply("You reloaded your gun! You have \`(6/6)\` bullets now!");
  }

  if (message.content.startsWith(`${prefix}shoot`)) {
    const shotAtMemberId = message.content.match(/\!shoot \<\@(\d.+)\>/)?.[1];

    if (shotAtMemberId) {
      const guildDucks = await kv.guildGetAllDucks({ guildId });
      for await (const duck of guildDucks) {
        if (duck.value.leavesAt.getTime() < new Date().getTime()) continue;
        if (duck.value.spawnsAt.getTime() > new Date().getTime()) continue;
        if (duck.value.killedAt !== null) continue;
        if (duck.value.fledAt !== null) continue;

        await kv.guildDuckFlee({ guildId, duckId: duck.key[3] as string, fledAt: message.createdAt });
        message.reply(`You shot at <@${shotAtMemberId}>, they ran away and the duck fled the crime scene!`);

        return;
      }

      message.reply(`You shot at <@${shotAtMemberId}>, they ran away, and you hear a duck happily quacking in the distance...`);
      return;
    }

    const bullets = await kv.guildMemberGetBullets({ guildId, memberId });
    if (bullets <= 0) {
      message.reply("You are out of bullets! You need to `!reload`!");
      return;
    }

    const isJammed = await kv.guildMemberGetIsWeaponJammed({ guildId, memberId });
    if (isJammed) {
      message.reply("Your gun is jammed! You need to `!reload`!");
      return;
    }

    if (Math.random() > 0.9) {
      await kv.guildMemberJamWeapon({ guildId, memberId });
      message.reply("Damn, your gun jammed! You need to `!reload`!");
      return;
    }

    await kv.guildMemberUseBullet({ guildId, memberId });

    const guildDucks = await kv.guildGetAllDucks({ guildId });
    for await (const duck of guildDucks) {
      if (duck.value.leavesAt.getTime() < new Date().getTime()) continue;
      if (duck.value.spawnsAt.getTime() > new Date().getTime()) continue;
      if (duck.value.killedAt !== null) continue;
      if (duck.value.fledAt !== null) continue;

      await kv.guildDuckKill({ guildId, duckId: duck.key[3] as string, killedAt: message.createdAt });
      await kv.guildMemberAddKill({ guildId, memberId });
      message.reply(`You shot the duck! it died! successfully! +1 kill! -1 bullet! for you! \`(${bullets - 1}/6)\``);
      return;
    }

    message.reply(`There are no ducks here.... used a bullet tho... \`(${bullets - 1}/6)\``);
    return;
  }
});

client.login(Deno.env.get("TOKEN"));

Deno.cron("schedular", "0 0 * * *", async () => {
  await scheduleTasks();
});
