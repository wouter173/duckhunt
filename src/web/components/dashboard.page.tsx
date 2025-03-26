import { Layout } from "@/web/components/layout.tsx";
import { Suspense } from "hono/jsx";
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
  if (sortedKills.length === 0) return <>No ducks have been removed from the face of the earth yet!</>;

  const topKillsMessage = sortedKills.map(([user, kills], i) => `${i + 1}. ${user}: ${kills} kills`).join("\n");
  return (
    <>
      {topKillsMessage}
    </>
  );
};

export const DashboardPage = ({ params }: { params: Record<string, string> }) => {
  const status = params.status;

  return (
    <Layout>
      {status && <p>{status}</p>}
      <h1 style={{ visibility: "hidden" }}>Duckhunt!</h1>
      <code aria-hidden>
        <pre style={{ width: "min-content", margin: "auto" }}>{`
                             ____             _      _                 _
      _          _          |  _ \\ _   _  ___| | __ | |__  _   _ _ __ | |_     _          _
    >(')____,  >(')____,    | | | | | | |/ __| |/ / | '_ \\| | | | '_ \\| __|  >(')____,  >(') ___,
      (\` =~~/    (\` =~~/    | |_| | |_| | (__|   <  | | | | |_| | | | | |_     (\` =~~/    (\` =~~/
   ~^~^\`---'~^~^~^\`---'~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^~^\`---'~^~^~^\`---'~^~^~
`}
        </pre>
      </code>
      <code>
        <pre style={{ width: "min-content", margin: "auto", marginTop: "1rem" }}>
          <Suspense fallback={<span>Loading...</span>}>
            <LeaderBoard guildId="846468617142009917" />
          </Suspense>
        </pre>
      </code>
    </Layout>
  );
};
