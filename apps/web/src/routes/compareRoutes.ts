export const COMPARE_ROUTES = {
  "/curl-compare": {
    path: "/curl-compare",
    h1: "cURL Compare",
    title: "cURL Compare — API Requests & JSON Bodies | MDToDocs",
    description: "Compare pasted cURL requests locally: methods, URLs, query parameters, headers, credentials and JSON bodies. No requests are executed.",
    lead: "Paste two cURL commands. Review request fields and JSON body changes together, without sending either request.",
    canonical: "https://mdtodocs.com/curl-compare/",
  },
  "/text-compare": {
    path: "/text-compare",
    h1: "Text Compare",
    title: "Text Compare — Markdown & AI Revisions | MDToDocs",
    description:
      "Compare text and Markdown revisions locally with editable side-by-side and unified differences.",
    lead: "Paste two versions to see what changed. Edit either side and review the differences as you type.",
    canonical: "https://mdtodocs.com/text-compare/",
  },
  "/json-compare": {
    path: "/json-compare",
    h1: "JSON Compare",
    title: "JSON Compare — Structural Changes | MDToDocs",
    description:
      "Compare JSON specifications locally, ignoring formatting and object key order while preserving array order.",
    lead: "Paste two versions. See changed fields highlighted in context as you edit, ignoring key order and formatting.",
    canonical: "https://mdtodocs.com/json-compare/",
  },
} as const;
export const compareRoute = (path: string) =>
  COMPARE_ROUTES[path as keyof typeof COMPARE_ROUTES];
