import { ascii } from "@/lib/ascii.ts";

export const Podium = ({ winners }: { winners: { name: string; kills: number }[] }) => {
  return (
    <code>
      <pre>
        {ascii.podium({first: winners[0], second: winners[1], third: winners[2]})}
      </pre>
    </code>
  );
};

const Column = ({ width, height }: { width: number; height: number }) => {
};
