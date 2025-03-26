import { Layout } from "@/web/components/layout.tsx";
import { Suspense } from "hono/jsx";
import { DuckSvg } from "@/web/components/svg.tsx";
import { client } from "@/bot.ts";
import { db } from "@/lib/db.ts";

const LeaderBoard = async ({ guildId }: { guildId: string }) => {
  const killsMap: Record<string, number> = {};

  const allMemberKills = await db.guildMemberGetAllKills({ guildId });
  const guild = await client.guilds.fetch(guildId);

  for await (const kill of allMemberKills) {
    const member = await guild.members.fetch(kill.key[4]);
    killsMap[member.user.displayName] = Number(kill.value);
  }

  const sortedKills = Object.entries(killsMap).sort((a, b) => b[1] - a[1]);
  const topKills = sortedKills.slice(0, 5);

  const topKillsMessage = topKills.map(([user, kills], i) => `${i + 1}. ${user}: ${kills} kills`).join("\n");

  return (
    <code>
      <pre>
        {topKillsMessage}
      </pre>
    </code>
  );
};

export const DashboardPage = ({ params }: { params: Record<string, string> }) => {
  const status = params.status;

  return (
    <Layout>
      {status && <p>{status}</p>}
      <div>
        <DuckSvg />
        <h1>Hello Hono!</h1>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <LeaderBoard guildId="846468617142009917" />
      </Suspense>
    </Layout>
  );
};
