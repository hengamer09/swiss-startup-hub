// Isomorphic — converts the admin's plain-text newsletter body into safe HTML.
// Supported formatting:
//   "# heading"  -> <h2>
//   "- bullet"   -> <ul><li>
//   blank line   -> paragraph break
//   other text   -> <p> (consecutive lines joined with <br>)
import { escapeHtml } from "@/lib/utils";

export function newsletterTextToHtml(text: string): string {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p style="margin:0 0 12px 0;">${paragraph.map(escapeHtml).join("<br>")}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length) {
      out.push(
        `<ul style="margin:0 0 12px 0;padding-left:20px;">${listItems
          .map((li) => `<li style="margin:0 0 4px 0;">${escapeHtml(li)}</li>`)
          .join("")}</ul>`
      );
      listItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      out.push(
        `<h2 style="margin:0 0 12px 0;font-size:18px;color:#18181b;">${escapeHtml(line.slice(2).trim())}</h2>`
      );
    } else if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return out.join("\n");
}
