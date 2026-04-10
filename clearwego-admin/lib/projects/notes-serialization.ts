import MarkdownIt from "markdown-it";
import TurndownService from "turndown";

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

/** Stored `projects.notes` is markdown; editor uses HTML internally. */
export function notesMarkdownToHtml(src: string | null | undefined): string {
  if (!src?.trim()) return "";
  return md.render(src.trimEnd());
}

/** Strip trailing empty paragraphs (editor keeps one for placeholder / typing). */
function stripTrailingEmptyParagraphs(html: string): string {
  return html.replace(/(?:<p>\s*(?:<br\s*\/?>)?\s*<\/p>\s*)+$/gi, "").trim();
}

export function notesHtmlToMarkdown(html: string): string {
  const stripped = stripTrailingEmptyParagraphs(html ?? "");
  if (!stripped || stripped === "<p></p>" || stripped === "<p><br></p>") return "";
  return turndown.turndown(stripped).trim();
}
