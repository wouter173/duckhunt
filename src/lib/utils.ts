import { Context, Env, Input } from "hono";
import { renderToReadableStream } from "hono/jsx/streaming";
import { JSX } from "hono/jsx/base";

export function raise(msg: string): never {
  throw new Error(msg);
}

export async function toArray<T>(iter: Deno.KvListIterator<T>) {
  const values: T[] = [];
  for await (const res of iter) values.push(res.value);

  return values;
}

export function stream<E extends Env, P extends string, I extends Input>(
  c: Context<E, P, I>,
  Comp: ({ params }: { params: Record<string, string> }) => JSX.Element,
) {
  return c.body(renderToReadableStream(Comp({ params: c.req.query() })), {
    headers: { "Content-Type": "text/html; charset=UTF-8", "Transfer-Encoding": "chunked" },
  });
}
