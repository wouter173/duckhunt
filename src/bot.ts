import { Client, IntentsBitField } from "discord.js";
import { db } from "./lib/db.ts";

const prefix = "!";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMembers,
  ],
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

  if (interaction.commandName === "help") {
    await interaction.reply({
      ephemeral: true,

      embeds: [
        {
          title: "Duckhunt",
          url: "https://duckhunt.maishond.nl",
          fields: [
            { name: "/help", value: "this" },
            { name: "/stats", value: "top 5 duck removers" },
            { name: "/kills", value: "your kills and bullets" },
            { name: "!reload", value: "reload your gun" },
            { name: "!shoot or !shoot <@user>", value: "shoot a duck or a user" },
          ],
        },
      ],
    });
  }

  if (interaction.commandName === "stats") {
    const killsMap: Record<string, number> = {};

    const allMemberKills = await db.guildMemberGetAllKills({ guildId: interaction.guildId });
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
    const kills = await db.guildMemberGetKills({ guildId: interaction.guildId, memberId: interaction.member.id! });
    const bullets = await db.guildMemberGetBullets({ guildId: interaction.guildId, memberId: interaction.member.id! });

    await interaction.reply({ content: `You have ${kills} kills and ${bullets} bullets!`, ephemeral: true });
  }

  if (interaction.commandName === "settings") {
    const subCommand = interaction.options.data.find((option) => option.type === 1);

    if (subCommand?.name === "channel") {
      const channelId = subCommand.options?.[0].value as string;

      await db.guildSettingsSetChannel({ guildId: interaction.guildId, channelId: channelId });
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
    const isJammed = await db.guildMemberGetIsWeaponJammed({ guildId, memberId });
    if (isJammed) await db.guildMemberUnJamWeapon({ guildId, memberId });

    await db.guildMemberReload({ guildId, memberId });
    message.reply("You reloaded your gun! You have \`(6/6)\` bullets now!");
  }

  if (message.content.startsWith(`${prefix}shoot`)) {
    const shotAtMemberId = message.content.match(/\!shoot \<\@(\d.+)\>/)?.[1];

    if (shotAtMemberId) {
      const guildDucks = await db.guildGetAllDucks({ guildId });
      for await (const duck of guildDucks) {
        if (duck.value.leavesAt.getTime() < new Date().getTime()) continue;
        if (duck.value.spawnsAt.getTime() > new Date().getTime()) continue;
        if (duck.value.killedAt !== null) continue;
        if (duck.value.fledAt !== null) continue;

        await db.guildDuckFlee({ guildId, duckId: duck.key[3] as string, fledAt: message.createdAt });
        if (shotAtMemberId === memberId) {
          message.reply(`You shot at... yourself? Please go search professional help, and the duck fled the crime scene!`);
          return;
        }

        message.reply(`You shot at <@${shotAtMemberId}>, they ran away and the duck fled the crime scene!`);
        return;
      }

      if (shotAtMemberId === memberId) {
        message.reply(`You shot at... yourself? Please go search professional help`);
        return;
      }

      message.reply(`You shot at <@${shotAtMemberId}>, they almost died man... PLEASE STOP.`);
      return;
    }

    const bullets = await db.guildMemberGetBullets({ guildId, memberId });
    if (bullets <= 0) {
      message.reply("You are out of bullets! You need to `!reload`!");
      return;
    }

    const isJammed = await db.guildMemberGetIsWeaponJammed({ guildId, memberId });
    if (isJammed) {
      message.reply("Your gun is jammed! You need to `!reload`!");
      return;
    }

    if (Math.random() > 0.9) {
      await db.guildMemberJamWeapon({ guildId, memberId });
      message.reply("Damn, your gun jammed! You need to `!reload`!");
      return;
    }

    await db.guildMemberUseBullet({ guildId, memberId });

    const guildDucks = await db.guildGetAllDucks({ guildId });
    for await (const duck of guildDucks) {
      if (duck.value.leavesAt.getTime() < new Date().getTime()) continue;
      if (duck.value.spawnsAt.getTime() > new Date().getTime()) continue;
      if (duck.value.killedAt !== null) continue;
      if (duck.value.fledAt !== null) continue;

      await db.guildDuckKill({ guildId, duckId: duck.key[3] as string, killedAt: message.createdAt });
      await db.guildMemberAddKill({ guildId, memberId });
      message.reply(`You shot the duck! it died! successfully! +1 kill! -1 bullet! for you! \`(${bullets - 1}/6)\``);
      return;
    }

    message.reply(`There are no ducks here.... used a bullet tho... \`(${bullets - 1}/6)\``);
    return;
  }
});

export { client };
