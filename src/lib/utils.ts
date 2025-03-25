export function raise(msg: string): never {
  throw new Error(msg);
}

export async function toArray<T>(iter: Deno.KvListIterator<T>) {
  const values: T[] = [];
  for await (const res of iter) values.push(res.value);

  return values;
}
