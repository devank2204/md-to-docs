export const COMPARE_ROUTES = {
  "/text-compare": {
    path: "/text-compare",
    h1: "Text Compare",
    title: "Text Compare — Markdown & AI Revisions | MDToDocs",
    description:
      "Compare text and Markdown revisions locally with editable side-by-side and unified differences.",
    lead: "Review changes in AI drafts, Markdown and plain text. Your inputs stay in this tab.",
    canonical: "https://mdtodocs.com/text-compare/",
  },
  "/json-compare": {
    path: "/json-compare",
    h1: "JSON Compare",
    title: "JSON Compare — Structural Changes | MDToDocs",
    description:
      "Compare JSON specifications locally, ignoring formatting and object key order while preserving array order.",
    lead: "Review structural changes in JSON specifications and API payloads. Your inputs stay in this tab.",
    canonical: "https://mdtodocs.com/json-compare/",
  },
} as const;
export const compareRoute = (path: string) =>
  COMPARE_ROUTES[path as keyof typeof COMPARE_ROUTES];
