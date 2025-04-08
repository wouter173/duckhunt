// deno-lint-ignore-file no-regex-spaces
import { fitName } from "@/lib/utils.ts";

const logo = `
<span class='w-full text-center inline-block dark:bg-blue-950/10'>                          ____             <span>_</span>      <span>_</span>                 <span>_</span>                            </span>
<span class='w-full text-center inline-block dark:bg-blue-950/20'>   _          _          |  _ \\ _   _  ___| | __ | |__  _   _ _ __ | |_     _          _         </span>
<span class='w-full text-center inline-block dark:bg-blue-950/40'> >(')____,  >(')____,    | | | | | | |/ __| |/ / | '_ \\| | | | '_ \\| __|  >(')____,  >(')____,   </span>
<span class='w-full text-center inline-block dark:bg-blue-950/50'>   (\` =~~/    (\` =~~/    | |_| | |_| | (__|   <  | | | | |_| | | | | |_     (\` =~~/    (\` =~~/   </span>
<span class='w-full text-center inline-block dark:bg-blue-950/60 text-blue-400'>,.-​'\`---'°​-​,,.-\`---'-,,.-'​\`'°​-​,,.-​''\`-,,.-'​\`'°​-​,,.-​''\`-,,.-'\`'°​-​,,.-​''\`-,,.-'​\`---'.-​''\`-\`---''°​-​,</span>
`.replace(/ >/g, "<span class='text-orange-400'> \></span>")
  .replace(/\('\)____,/g, "<span class='dark:text-yellow-300 text-yellow-400 font-semibold'>(')____,</span>")
  .replace(/\(\` =~~\//g, "<span class='dark:text-yellow-300 text-yellow-400 font-semibold'>(` =~~/</span>")
  .replace(/\`---'/g, "<span class='dark:text-yellow-300 text-yellow-400 font-semibold'>`---'</span>")
  .replace(/  _      /g, "<span class='dark:text-yellow-300 text-yellow-400 font-semibold'>  _      </span>");

type Stat = { name: string; kills: number };
const podium = (positions: { first: Stat; second: Stat; third: Stat }) => {
  const firstName = fitName(`1. ${positions.first.name}`, 14);
  const secondName = fitName(`2. ${positions.second.name}`, 14);
  const thirdName = fitName(`3. ${positions.third.name}`, 14);

  const firstKills = fitName(`(${positions.first.kills})`, 12);
  const secondKills = fitName(`(${positions.second.kills})`, 12);
  const thirdKills = fitName(`(${positions.third.kills})`, 12);

  return `
              ${firstName}
              ┌------------┐
${secondName}|            |
┌------------┐|${firstKills}|
|            ||            |${thirdName}
|${secondKills}||            |┌------------┐
|            ||            ||            |
|            ||            ||${thirdKills}|
`;
};

export const ascii = {
  logo,
  podium,
};
