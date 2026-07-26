import type { APIRoute } from "astro";
import { getCanonicalUrl } from "../utils/urls";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(
    [
      "User-agent: *",
      "Allow: /",
      `Sitemap: ${getCanonicalUrl("/sitemap-index.xml")}`,
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
