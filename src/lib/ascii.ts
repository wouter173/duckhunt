// deno-lint-ignore-file no-regex-spaces

const logo = `
<span class='w-full text-center inline-block dark:bg-blue-950/80'>       </span>
<span class='w-full text-center inline-block dark:bg-blue-950/70'>       </span>
<span class='w-full text-center inline-block dark:bg-blue-950/60'>                          ____             <span>_</span>      <span>_</span>                 <span>_</span>                            </span>
<span class='w-full text-center inline-block dark:bg-blue-950/50'>   _          _          |  _ \\ _   _  ___| | __ | |__  _   _ _ __ | |_     _          _         </span>
<span class='w-full text-center inline-block dark:bg-blue-950/40'> >(')____,  >(')____,    | | | | | | |/ __| |/ / | '_ \\| | | | '_ \\| __|  >(')____,  >(')____,   </span>
<span class='w-full text-center inline-block dark:bg-blue-950/20'>   (\` =~~/    (\` =~~/    | |_| | |_| | (__|   <  | | | | |_| | | | | |_     (\` =~~/    (\` =~~/   </span>
<span class='w-full text-center inline-block dark:bg-blue-950/10 text-blue-400'>,.-​'\`---'°​-​,,.-\`---'-,,.-'​\`'°​-​,,.-​''\`-,,.-'​\`'°​-​,,.-​''\`-,,.-'\`'°​-​,,.-​''\`-,,.-'​\`---'.-​''\`-\`---''°​-​,</span>
`.replace(/ >/g, "<span class='text-orange-400 '> \></span>")
  .replace(/\('\)____,/g, "<span class='dark:text-yellow-300 text-black'>(')____,</span>")
  .replace(/\(\` =~~\//g, "<span class='dark:text-yellow-300 text-black'>(` =~~/</span>")
  .replace(/\`---'/g, "<span class='dark:text-yellow-300 text-black'>`---'</span>")
  .replace(/  _      /g, "<span class='dark:text-yellow-300 text-black'>  _      </span>");

export const ascii = {
  logo,
};
