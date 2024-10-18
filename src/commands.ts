import { SlashCommandBuilder } from "npm:@discordjs/builders";
import { REST } from "npm:@discordjs/rest";

import { ChannelType, Routes } from "npm:discord-api-types/v10";

const clientId = Deno.env.get("CLIENT_ID")!;
const guildId = Deno.env.get("GUILD_ID")!;
const token = Deno.env.get("TOKEN")!;

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

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token); // and deploy your commands!

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(
      `Successfully reloaded ${typeof data === "object" && data !== null && "length" in data ? data.length : ""} application (/) commands.`,
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
