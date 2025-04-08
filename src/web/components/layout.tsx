import { PropsWithChildren } from "hono/jsx";

export const Layout = (props: PropsWithChildren) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Duckhunt</title>
        <link rel="stylesheet" href="/tailwind.generated.css" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body class="dark:bg-[#161616] dark:text-stone-200 text-sm">{props.children}</body>
    </html>
  );
};
