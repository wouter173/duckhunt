import type { Collection, OAuth2Guild, Snowflake } from "npm:discord.js";
import { Client, IntentsBitField } from "npm:discord.js";
import { nanoid } from "npm:nanoid";
import { kv } from "./kv.ts";
import { queue } from "./queue.ts";
import { generateRandomDelay } from "./schedular.ts";

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
  guilds.forEach(async (guild) => {
    await summonDuck({ guildId: guild.id });
    await summonDuck({ guildId: guild.id });
    // await summonDuck({ guildId: guild.id, delay: 5 * 1000, ttl: 5 * 1000 });
  });
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

  if (interaction.commandName === "stats") {
    const kills = await kv.guildMemberGetKills({ guildId: interaction.guildId!, memberId: interaction.member.id });
    const bullets = await kv.guildMemberGetBullets({ guildId: interaction.guildId!, memberId: interaction.member.id });

    await interaction.reply({ content: `You have ${kills} kills and ${bullets} bullets!`, ephemeral: true });
  }

  if (interaction.commandName === "settings") {
    const subCommand = interaction.options.data.find((option) => option.type === 1);

    if (subCommand?.name === "channel") {
      const channelId = subCommand.options![0].value as string;

      await kv.guildSettingsSetChannel({ guildId: interaction.guildId!, channelId: channelId });
      interaction.reply({ content: `Set your guilds duck channel to <#${channelId}>!`, ephemeral: true });
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // if (message.content === "ping") {
  //   await scheduleTasks();
  //   await message.reply("Pong!");
  // }

  if (message.content === "!reload") {
    const isJammed = await kv.guildMemberGetIsWeaponJammed({ guildId: message.guild.id, memberId: message.author.id });
    if (isJammed) {
      await kv.guildMemberUnJamWeapon({ guildId: message.guild.id, memberId: message.author.id });
    }
    await kv.guildMemberReload({ guildId: message.guild.id, memberId: message.author.id });
    message.reply("You reloaded your gun! You have \`(6/6)\` bullets now!");
  }

  if (message.content === "!shoot") {
    const bullets = await kv.guildMemberGetBullets({ guildId: message.guild.id, memberId: message.author.id });
    if (bullets <= 0) {
      message.reply("You are out of bullets! You need to `!reload`!");
      return;
    }

    const isJammed = await kv.guildMemberGetIsWeaponJammed({ guildId: message.guild.id, memberId: message.author.id });
    if (isJammed) {
      message.reply("Your gun is jammed! You need to `!reload`!");
      return;
    }

    if (Math.random() > 0.9) {
      await kv.guildMemberJamWeapon({ guildId: message.guild.id, memberId: message.author.id });
      message.reply("Damn, your gun jammed! You need to `!reload`!");
      return;
    }

    await kv.guildMemberUseBullet({ guildId: message.guild.id, memberId: message.author.id });

    const guildDucks = await kv.guildGetAllDucks({ guildId: message.guild.id });
    for await (const duck of guildDucks) {
      if (duck.value.leavesAt.getTime() < new Date().getTime()) continue;
      if (duck.value.spawnsAt.getTime() > new Date().getTime()) continue;
      if (duck.value.killedAt !== null) continue;

      await kv.guildKillDuck({ guildId: message.guild.id, duckId: duck.key[3] as string, killedAt: message.createdAt });
      await kv.guildMemberAddKill({ guildId: message.guild.id, memberId: message.author.id });
      message.reply(`You shot the duck! it died! succesfully! +1 kill! -1 bullet! for you! \`(${bullets - 1}/6)\``);
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
