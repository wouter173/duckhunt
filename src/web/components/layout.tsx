import { PropsWithChildren } from "hono/jsx";

export const Layout = (props: PropsWithChildren) => {
  return (
    <html>
      <body>{props.children}</body>
    </html>
  );
};
