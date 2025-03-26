import { client } from "@/bot.ts";
import { Layout } from "@/web/components/layout.tsx";
import { DuckSvg, GunSvg } from "@/web/components/svg.tsx";
import { Suspense } from "hono/jsx";
import { db, GuildDuck } from "../../lib/db.ts";
import { toArray } from "@/lib/utils.ts";

export const AdminPage = ({ params }: { params: Record<string, string> }) => {
  const status = params.status;

  return (
    <Layout>
      {status && <p>{status}</p>}
      <div>
        <DuckSvg />
        <GunSvg />
        <h1>Duckhunt!</h1>
      </div>
      <form action="/admin/schedule">
        <button>schedule</button>
      </form>
      <form action="/admin/sync-commands">
        <button>sync commands</button>
      </form>
      <Suspense fallback={<div>Loading...</div>}>
        <Tasks />
      </Suspense>
    </Layout>
  );
};

const Tasks = async () => {
  const guilds = await client.guilds.fetch();
  const ducks: (GuildDuck & { guildName: string })[] = [];

  for (const guild of guilds.values()) {
    const guildId = guild.id;
    const guildDucks = await db.guildGetAllDucks({ guildId });
    for await (const duck of guildDucks) {
      ducks.push({ ...duck.value, guildName: guild.name });
    }
  }

  ducks.sort((a, b) => b.spawnsAt.getTime() - a.spawnsAt.getTime());

  const tasks = (await toArray(db.schedulerListTasks())).sort((a, b) => b.invokeAt.getTime() - a.invokeAt.getTime());

  return (
    <code>
      <h2>Scheduled Tasks:</h2>
      <ul>
        {tasks.map((t) => <li>{t.invokeAt.toLocaleString()} ({t.type}) in {t.payload.guildId}</li>)}
      </ul>
      <h2>Will spawn:</h2>
      <ul>
        {ducks
          .filter((d) => d.spawnsAt.getTime() > new Date().getTime())
          .map((d) => <li>{d.spawnsAt.toLocaleString()} in {d.guildName}</li>)}
      </ul>
      <h2>Already spawned:</h2>
      <ul>
        {ducks.filter((d) => d.spawnsAt.getTime() < new Date().getTime()).map((d) => <li>{d.spawnsAt.toLocaleString()} in {d.guildName}
        </li>)}
      </ul>
    </code>
  );
};
