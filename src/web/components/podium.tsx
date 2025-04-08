import { PropsWithChildren } from "hono/jsx";

export const Podium = ({ winners }: { winners: { name: string; kills: number; imageUrl: string }[] }) => {
  return (
    <div class="grid-cols-3 grid h-64 overflow-hidden">
      <Column
        position={1}
        width={13}
        height={5}
        metric={winners[1].kills + ""}
        name={`2. ${winners[1].name}`}
        imageUrl={winners[1].imageUrl}
      />
      <Column
        position={0}
        width={13}
        height={7}
        metric={winners[0].kills + ""}
        name={`1. ${winners[0].name}`}
        imageUrl={winners[0].imageUrl}
      />
      <Column
        position={2}
        width={13}
        height={3}
        metric={winners[2].kills + ""}
        name={`3. ${winners[2].name}`}
        imageUrl={winners[2].imageUrl}
      />
    </div>
  );
};

const Column = (
  { width, height, metric, name, imageUrl, position }: {
    width: number;
    height: number;
    metric: string;
    name: string;
    imageUrl: string;
    position: number;
  },
) => {
  return (
    <div
      class={`h-full grid place-content-end w-min starting:translate-y-full translate-y-0 starting:opacity-0 opacity-100 transition-transform`}
      style={{
        transitionTimingFunction: `steps(${height}, end)`,
        transitionDelay: `${(2 - position) * 0.5}s`,
        transitionDuration: `${height * 0.1}s`,
      }}
    >
      <div
        class="relative mb-4 delay-2000 starting:scale-0 scale-100 transition-transform"
        style={{ transitionTimingFunction: `steps(3, end)` }}
      >
        <img
          src={imageUrl + "?size=16"}
          class="size-12 rounded-full mx-auto"
          style={{ imageRendering: "pixelated" }}
        />
        <span class="absolute left-1/2 -translate-x-1/2 -bottom-5 text-2xl">{position === 0 ? "🥇" : position === 1 ? "🥈" : "🥉"}</span>
      </div>
      <span class="max-w-full truncate block text-center font-mono px-2">{name}</span>
      <code>
        <pre class="whitespace-pre">
          <span>┌{"-".repeat(width - 2)}┐</span>
          <Segment>({metric})</Segment>
          {new Array(height-1).fill(0).map((_, i) => <Segment key={i} />)}
        </pre>
      </code>
    </div>
  );
};

const Segment = ({ children }: PropsWithChildren) => {
  return (
    <div class="flex justify-between">
      <span>|</span>
      {children}
      <span>|</span>
    </div>
  );
};
