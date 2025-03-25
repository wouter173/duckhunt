import { SlashCommandBuilder } from "npm:@discordjs/builders";
import { REST } from "npm:@discordjs/rest";

import { ChannelType, Routes } from "npm:discord-api-types/v10";
import { raise } from "./lib/utils.ts";

const clientId = Deno.env.get("CLIENT_ID") ?? raise("Missing environment variable, CLIENT_ID");
const guildId = Deno.env.get("GUILD_ID") ?? raise("Missing environment variable, GUILD_ID");
const token = Deno.env.get("TOKEN") ?? raise("Missing environment variable, TOKEN");

const commands = [
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show duck stats!"),
  new SlashCommandBuilder()
    .setName("kills")
    .setDescription("Show your duck kills!"),
  new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Configure the bot for your server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("The channel in which the ducks will appear to")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel in which the ducks will appear to")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    ),
];

const rest = new REST().setToken(token);

export async function syncCommands() {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(
      `Successfully reloaded ${typeof data === "object" && data !== null && "length" in data ? data.length : ""} application (/) commands.`,
    );
  } catch (error) {
    console.error(error);
  }
}
