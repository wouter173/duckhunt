import { Layout } from "@/web/components/layout.tsx";
import { Suspense } from "hono/jsx";
import { client } from "@/bot.ts";
import { db } from "@/lib/db.ts";
import { env } from "@/lib/env.ts";
import { ascii } from "@/lib/ascii.ts";
import { Podium } from "@/web/components/podium.tsx";

const LeaderBoard = async ({ guildId }: { guildId: string }) => {
  const killsMap: Record<string, number> = {};

  const allMemberKills = await db.guildMemberGetAllKills({ guildId });
  const guild = await client.guilds.fetch(guildId);

  for await (const kill of allMemberKills) {
    const member = await guild.members.fetch(kill.key[4] as string);
    killsMap[member.user.displayName] = Number(kill.value);
  }

  const sortedKills = Object.entries(killsMap).toSorted((a, b) => b[1] - a[1]);
  if (sortedKills.length === 0) return <>No ducks have been removed from the face of the earth yet!</>;

  const topThree = sortedKills.slice(0, 3);
  const rest = sortedKills.slice(3, 10).map(([user, kills], i) => `${i + 1}. ${user}: ${kills} kill${kills !== 1 ? "s" : ""}`);

  return (
    <>
      <Podium winners={topThree.map((stat) => ({ name: stat[0], kills: stat[1] }))} />
      <div style={{ width: "min-content", margin: "auto", marginTop: "2rem" }}>
        <code>
          <pre>
          {rest.join("\n")}
          </pre>
        </code>
      </div>
    </>
  );
};

export const DashboardPage = ({ params }: { params: Record<string, string> }) => {
  const status = params.status;
  const guildId = env.GUILD_ID;

  return (
    <Layout>
      {status && <p>{status}</p>}
      <h1 class="invisible">Duckhunt!</h1>
      <code aria-hidden>
        <pre class="w-full" dangerouslySetInnerHTML={{ __html: ascii.logo }} />
      </code>

      <div style={{ width: "min-content", margin: "auto", marginTop: "4rem" }}>
        <Suspense fallback={<code>Loading...</code>}>
          <LeaderBoard guildId={guildId} />
        </Suspense>
      </div>
    </Layout>
  );
};
