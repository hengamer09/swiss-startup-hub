const BASE_URL = "https://swiss-startup-hub.vercel.app";

const PUBLIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/search", priority: "0.9", changefreq: "daily" },
  { path: "/events", priority: "0.8", changefreq: "daily" },
  { path: "/auth/signin", priority: "0.6", changefreq: "monthly" },
  { path: "/auth/signup", priority: "0.7", changefreq: "monthly" },
  { path: "/privacy", priority: "0.4", changefreq: "monthly" },
  { path: "/terms", priority: "0.4", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
];

export function GET() {
  const today = new Date().toISOString().split("T")[0];

  const urls = PUBLIC_PAGES.map(
    ({ path, priority, changefreq }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  ).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
