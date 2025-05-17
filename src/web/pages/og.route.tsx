import satori, { init } from "npm:satori@0.0.44/wasm";
import initYoga from "npm:yoga-wasm-web";
import { Resvg } from "npm:@resvg/resvg-js";
import { heading } from "discord.js";
import { Children } from "hono";
// import { render } from "hono/jsx/dom/render";
// render();
const yoga = await initYoga(Deno.readFileSync("src/web/assets/yoga.wasm"));
init(yoga);

export const ogRoute = async () => {
  const svg = await satori(
    {
      "tag": "div",
      "props": {
        "style": {
          "width": "800px",
          "height": "400px",
          "backgroundColor": "#2d2d2d",
          "color": "#ffffff",
          "display": "flex",
          "alignItems": "center",
          "justifyContent": "center",
        },
      },
      children: [
        {
          "tag": "h1",
          "props": {
            "style": {
              "fontSize": "48px",
              "textAlign": "center",
              "margin": 0,
            },
          },
          "children": [
            {
              "tag": "span",
              "props": {
                "style": {
                  "fontFamily": "JetBrainsMono",
                  "fontWeight": 700,
                },
              },
              children: "Duckhunt!",
            },
          ],
        },
      ],
    },
    {
      width: 800,
      height: 400,
      fonts: [{
        name: "JetBrainsMono",
        data: Deno.readFileSync("src/web/assets/JetBrainsMono-Regular.ttf"),
        style: "normal",
        weight: 400,
      }],
      debug: true,
    },
  );

  console.log(svg);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "zoom",
      value: 1,
    },
  });
  const img = resvg.render();

  return new Response(img.asPng(), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, immutable" },
  });
};
