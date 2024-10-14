import { Client, IntentsBitField } from "npm:discord.js";

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

client.on("messageCreate", async (msg) => {
  console.log(msg);
  if (msg.content === "ping") {
    await msg.reply("Pong!");
  }
});

client.login(Deno.env.get("TOKEN"));
