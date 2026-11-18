import { inspectJSONBody } from "./jsonBody";
import { tokenize } from "curlconverter/dist/src/shell/tokenizer.js";
import {
  parseArgs,
  curlLongOpts,
  curlLongOptsShortened,
  curlShortOpts,
  type LongOpts,
} from "curlconverter/dist/src/curl/opts.js";
import { buildRequests } from "curlconverter/dist/src/Request.js";
import { Headers } from "curlconverter/dist/src/Headers.js";
import type { Word } from "curlconverter/dist/src/shell/Word.js";
import type { Warnings } from "curlconverter/dist/src/Warnings.js";
import parser, { releaseParseTrees } from "./browserParser";

export const sections = [
  "Method",
  "URL",
  "Query",
  "Headers",
  "Auth & cookies",
  "Body",
  "Options",
] as const;
export type Section = (typeof sections)[number];
export type SourceRange = { from: number; to: number };
export type ParsedCurl = {
  values: Record<Section, unknown>;
  ranges: Partial<Record<Section, SourceRange[]>>;
  warnings: string[];
  bodyJSON: boolean;
  bodySource?: string;
};
const supported = new Set([
  "url",
  "request",
  "get",
  "head",
  "no-head",
  "header",
  "user-agent",
  "referer",
  "cookie",
  "user",
  "basic",
  "no-basic",
  "oauth2-bearer",
  "data",
  "data-raw",
  "data-ascii",
  "data-binary",
  "data-urlencode",
  "json",
  "url-query",
  "form",
  "form-string",
  "upload-file",
  "globoff",
  "proto-default",
  "compressed",
  "no-compressed",
  "location",
  "no-location",
  "location-trusted",
  "no-location-trusted",
  "max-redirs",
  "insecure",
  "no-insecure",
]);
const sectionFor = (name: string): Section => {
  if (["request", "get", "head", "no-head"].includes(name)) return "Method";
  if (name === "url") return "URL";
  if (name === "url-query") return "Query";
  if (["header", "user-agent", "referer"].includes(name)) return "Headers";
  if (["cookie", "user", "basic", "oauth2-bearer"].includes(name))
    return "Auth & cookies";
  if (
    [
      "data",
      "data-raw",
      "data-ascii",
      "data-binary",
      "data-urlencode",
      "json",
      "form",
      "form-string",
      "upload-file",
    ].includes(name)
  )
    return "Body";
  return "Options";
};
const text = (word?: Word | null) => (word == null ? null : word.toString());
// Group by case-insensitive field name, retaining every occurrence in order.
function headersByName(items: [Word, Word | null][]) {
  const grouped = new Map<string, { value: string | null }[]>();
  for (const [name, value] of items) {
    const key = name.toString().toLowerCase();
    grouped.set(key, [...(grouped.get(key) ?? []), { value: text(value) }]);
  }
  return Object.fromEntries(grouped);
}
export function parseCurl(command: string): ParsedCurl {
  if (command.length > 50_000)
    throw new Error("Commands are limited to 50,000 characters per input.");
  const warnings: Warnings = [];
  try {
    const tree = parser.parse(command);
    if (tree.rootNode.hasError)
      throw new Error(
        "Invalid Bash syntax. Check quotes and line continuations. Use Copy as cURL (bash), not CMD or PowerShell.",
      );
    const roots = tree.rootNode.namedChildren.filter(
      (node) => node.type !== "comment",
    );
    if (roots.length !== 1 || roots[0].type !== "command")
      throw new Error(
        "Paste one cURL command per side. Pipelines, redirects, scripts and multiple requests are not supported.",
      );
    const node = roots[0];
    if (
      node.namedChildren.some((child) => child.type === "variable_assignment")
    )
      throw new Error(
        "Environment assignments are not evaluated. Paste a command with literal values.",
      );
    const tokenized = tokenize(command, warnings);
    if (tokenized.length !== 1)
      throw new Error("Paste one cURL command per side.");
    const [argv] = tokenized[0];
    if (argv[0].toString() !== "curl")
      throw new Error(
        "The command must start with curl. Use Copy as cURL (bash).",
      );
    if (
      argv.some((word) =>
        word.tokens.some((token) => typeof token !== "string"),
      )
    )
      throw new Error(
        "Shell variables and substitutions are not evaluated. Paste literal values, or compare the original commands as text.",
      );
    const [config] = parseArgs(
      argv,
      undefined,
      undefined,
      undefined,
      supported,
      warnings,
    );
    if (
      config.configs.length !== 1 ||
      (config.configs[0].url?.length ?? 0) !== 1
    )
      throw new Error(
        "Compare one request URL per side; split multiple requests first.",
      );
    const rawHeaders = [...(config.configs[0].header ?? [])];
    const requests = buildRequests(config);
    if (requests.length !== 1 || requests[0].urls.length !== 1)
      throw new Error("Compare one request per side.");
    const request = requests[0],
      url = request.urls[0],
      part = url.urlObj;
    if (!["http", "https"].includes(part.scheme.toString().toLowerCase()))
      throw new Error("Request comparison supports HTTP and HTTPS URLs only.");
    const ranges: ParsedCurl["ranges"] = {};
    const nodes = node.childrenForFieldName("argument");
    // Source locations use the grammar's exact ranges and upstream option tables.
    // This classifies existing tokens for navigation; upstream still parses values.
    if (nodes.length === argv.length - 1) {
      const long = curlLongOpts as LongOpts,
        shortened = curlLongOptsShortened as LongOpts;
      for (let i = 1, flags = true; i < argv.length; i++) {
        const value = argv[i].toString(),
          names: string[] = [];
        let takesNext = false;
        if (flags && value === "--") {
          flags = false;
          continue;
        }
        if (flags && value.startsWith("--")) {
          const option = shortened[value.slice(2)] ?? long[value.slice(2)];
          if (option) {
            names.push(option.name);
            takesNext = option.type === "string";
          }
        } else if (flags && value.startsWith("-")) {
          for (let offset = 1; offset < value.length; offset++) {
            const option =
              long[curlShortOpts[value[offset] as keyof typeof curlShortOpts]];
            if (!option) break;
            names.push(option.name);
            if (option.type === "string") {
              takesNext = offset === value.length - 1;
              break;
            }
          }
        } else names.push("url");
        const from = nodes[i - 1].startIndex;
        const to =
          nodes[Math.min(nodes.length - 1, i - 1 + Number(takesNext))].endIndex;
        for (const name of names) {
          const section = sectionFor(name);
          (ranges[section] ??= []).push({ from, to });
          if (section === "URL") (ranges.Query ??= []).push({ from, to });
          if (section === "Headers")
            (ranges["Auth & cookies"] ??= []).push({ from, to });
        }
        if (takesNext) i++;
      }
    }
    // Upstream Headers merges some repeated fields. Parse each original header
    // separately to preserve its multiplicity, then overlay generated defaults.
    const explicit = headersByName(
      rawHeaders.flatMap((word) => [...new Headers([word], warnings)]),
    );
    const headers = { ...headersByName([...request.headers]), ...explicit };
    const credentials = Object.fromEntries(
      Object.entries(headers).filter(([key]) =>
        /^(authorization|proxy-authorization|cookie|set-cookie|x-api-key)$/.test(
          key,
        ),
      ),
    );
    const regularHeaders = Object.fromEntries(
      Object.entries(headers).filter(
        ([key]) => !Object.hasOwn(credentials, key),
      ),
    );
    const unread = Boolean(
      request.dataReadsFile ||
      request.cookieFiles?.length ||
      request.cookieJar ||
      url.queryReadsFile ||
      url.uploadFile ||
      request.multipartUploads?.some(
        (item) => "contentFile" in item || item.headerFiles?.length,
      ),
    );
    if (unread)
      warnings.push([
        "external-files",
        "Referenced files are not read; only their names can be compared.",
      ]);
    let body: unknown = request.data == null ? null : request.data.toString();
    let bodyJSON = false;
    if (typeof body === "string") {
      const inspected = inspectJSONBody(body);
      body = inspected.value;
      bodyJSON = inspected.semantic;
      if (
        inspected.limitation &&
        (inspected.limitation !== "invalid-json-body" ||
          request.headers.getContentType()?.includes("json"))
      )
        warnings.push([
          inspected.limitation,
          "Body is compared literally; semantic JSON comparison is unavailable.",
        ]);
    }
    const bodySource = request.data?.toString();
    if (request.multipartUploads)
      body = request.multipartUploads.map((item) => ({
        name: text(item.name),
        ...("contentFile" in item
          ? { fileReference: text(item.contentFile) }
          : { content: text(item.content) }),
        contentType: text(item.contentType),
        filename: text(item.filename),
        encoder: text(item.encoder),
        headers: item.headers?.map(text) ?? [],
        headerFiles: item.headerFiles?.map(text) ?? [],
      }));
    if (url.uploadFile) body = { uploadFileReference: text(url.uploadFile) };
    const endpoint = `${part.scheme}://${part.host}${part.port.toString() ? ":" + part.port : ""}${part.path}`;
    return {
      values: {
        Method: url.method.toString(),
        URL: endpoint,
        Query:
          url.queryList?.map(([name, value]) => ({
            name: name.toString(),
            value: value.toString(),
          })) ??
          (part.query.toString() || []),
        Headers: regularHeaders,
        "Auth & cookies": {
          ...credentials,
          authentication: request.authType,
          user: url.auth
            ? { username: text(url.auth[0]), password: text(url.auth[1]) }
            : null,
          cookieFiles: request.cookieFiles?.map(text) ?? [],
        },
        Body: {
          kind: request.multipartUploads
            ? "multipart"
            : url.uploadFile || request.dataReadsFile
              ? "file reference"
              : bodyJSON
                ? "json"
                : request.data == null
                  ? "none"
                  : "text",
          value: body,
        },
        Options: {
          globoff: Boolean(request.globoff),
          compressed: Boolean(request.compressed),
          redirects: Boolean(request.followRedirects),
          trustedRedirects: Boolean(request.followRedirectsTrusted),
          maxRedirects: text(request.maxRedirects),
          insecure: Boolean(request.insecure),
        },
      },
      ranges,
      bodyJSON,
      bodySource,
      warnings: [
        ...new Set(
          warnings
            .filter(([code]) => code !== "repeated-header")
            .map(([code]) => code),
        ),
      ],
    };
  } finally {
    releaseParseTrees();
  }
}
