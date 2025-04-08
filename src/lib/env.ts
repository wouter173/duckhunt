import { raise } from "@/lib/utils.ts";

const getEnv = (name: string) => Deno.env.get(name) ?? raise(`Missing environment variable, ${name}`);

export const env = {
  CLIENT_ID: getEnv("CLIENT_ID"),
  GUILD_ID: getEnv("GUILD_ID"),
  TOKEN: getEnv("TOKEN"),
  ADMIN_USERNAME: getEnv("ADMIN_USERNAME"),
  ADMIN_PASSWORD: getEnv("ADMIN_PASSWORD"),
};
