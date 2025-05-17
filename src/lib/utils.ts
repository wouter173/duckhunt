import { Context, Env, Input } from "hono";
import { renderToReadableStream } from "hono/jsx/streaming";
import { JSX } from "hono/jsx/base";
import { JSXNode } from "hono/jsx";

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

export function fitName(name: string, maxLength: number) {
  if (name.length > maxLength) {
    return name.slice(0, maxLength - 3) + "...";
  }

  if (name.length === maxLength) {
    return name;
  }

  const padding = (maxLength - name.length) / 2;
  const paddingStart = Math.floor(padding);
  const paddingEnd = Math.ceil(padding);

  return " ".repeat(paddingStart) + name + " ".repeat(paddingEnd);
}
