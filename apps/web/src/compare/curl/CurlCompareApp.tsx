import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useMemo,
  type CSSProperties,
} from "react";
import {
  ArrowLeftRight,
  Copy,
  Search,
  Upload,
  Maximize2,
  Minimize2,
  Link2,
  AlignLeft,
} from "lucide-react";
import { InputTabs } from "../CompareTabs";
import { ComparePaneResize } from "../ComparePaneResize";
import { CompareDialogs } from "../CompareDialogs";
import { CompareHeader } from "../CompareHeader";
import { HomeIntroduction } from "../../components/HomeIntroduction";
import { WorkspaceSidebar } from "../../components/WorkspaceSidebar";
import { Button, Menu } from "../../components/Controls";
import { useStore } from "../../store";
import { useAppAppearance } from "../../hooks/useAppAppearance";
import { useMobileLayout } from "../../hooks/useMobileLayout";
import { compareRoute } from "../../routes/compareRoutes";
import type { LandingRoutePath } from "../../routes/landingData";
import type { Section } from "./parseCurl";
import type { RequestReview } from "./review";
import { requestWarning } from "./messages";
import { curlExample } from "./example";
import { comparisonMemory } from "../memory";
import "../compare.css";
import "./curl.css";
const TextEditors = lazy(() =>
  import("../TextEditors").then((module) => ({ default: module.TextEditors })),
);
const JsonEditors = lazy(() => import("../JsonEditors"));
const sectionLabels: Section[] = [
  "Method",
  "URL",
  "Query",
  "Headers",
  "Auth & cookies",
  "Body",
  "Options",
];
const ignoreEdit = () => {};

export default function CurlCompareApp({
  path,
  navigate,
}: {
  path: string;
  navigate: (path: string) => void;
}) {
  useAppAppearance();
  const sidebar = useStore((state) => state.isSidebarOpen);
  const mobile = useMobileLayout();
  const [inputs, setInputs] = useState(() => [...comparisonMemory.curl]);
  const [review, setReview] = useState<RequestReview>();
  const [section, setSection] = useState<Section>("Body");
  const [selected, setSelected] = useState(0);
  const [split, setSplit] = useState(50);
  const [active, setActive] = useState<0 | 1>(0);
  const [bodyView, setBodyView] = useState(false);
  const [formatBodyView, setFormatBodyView] = useState(false);
  const [mode, setMode] = useState("side");
  const [focus, setFocus] = useState(false);
  const [changesOnly, setChangesOnly] = useState(false);
  const [mask, setMask] = useState(true);
  const [sync, setSync] = useState(true);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(0);
  const [bodyReady, setBodyReady] = useState(false);
  const [rawStatus, setRawStatus] = useState({ count: 0, approximate: false });
  const find = useRef<((side: 0 | 1) => void) | null>(null);
  const bodyFind = useRef<((side: 0 | 1) => void) | null>(null);
  const nav = useRef<((next: boolean) => void) | null>(null);
  const reveal = useRef<
    ((ranges: ({ from: number; to: number } | undefined)[]) => void) | null
  >(null);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const versions = useRef([0, 0]);
  const pendingReveal = useRef<Section | null>(null);
  const pendingFind = useRef<0 | 1 | null>(null);
  useEffect(() => {
    const current = versions.current;
    return () => {
      current[0]++;
      current[1]++;
    };
  }, []);
  const update = (side: 0 | 1, value: string) => {
    versions.current[side]++;
    setBodyView(false);
    setInputs((old) => {
      const next = [...old];
      next[side] = value;
      comparisonMemory.curl = next;
      return next;
    });
  };
  const replace = (next: string[]) => {
    versions.current[0]++;
    versions.current[1]++;
    comparisonMemory.curl = next;
    setNotice("");
    setInputs(next);
    setSelected(0);
    setBodyView(false);
  };
  const copy = async (value: string, message = "Copied.") => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
    } catch {
      setNotice(
        "Clipboard unavailable. Select and copy directly from the editor.",
      );
    }
  };
  const importFile = async (file: File | undefined, side: 0 | 1) => {
    if (!file) return;
    if (file.size > 200_000) {
      setNotice("Command files are limited to 200 KB.");
      return;
    }
    const version = ++versions.current[side];
    try {
      const value = await file.text();
      if (versions.current[side] === version) update(side, value);
    } catch {
      if (versions.current[side] === version)
        setNotice("Could not read that file. Paste the command instead.");
    }
  };
  useEffect(() => {
    let stale = false;
    const timer = setTimeout(() => {
      import("./review")
        .then((module) => {
          if (!stale) {
            setReview(module.reviewRequests(inputs));
            setSelected(0);
          }
        })
        .catch(() => {
          if (!stale)
            setReview({
              sources: inputs,
              parsed: [],
              errors: [],
              changes: [],
              bodyChanges: [],
              bodyPairs: [],
              error:
                "The local request parser could not load. Reload to retry. Raw command comparison remains available.",
            });
        });
    }, 200);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [inputs]);
  const current =
    review?.sources[0] === inputs[0] && review?.sources[1] === inputs[1];
  const result = current ? review : undefined;
  const both = !!result?.parsed[0] && !!result?.parsed[1] && !result.error;
  const incomplete = result?.parsed.some((item) => item?.warnings.length);
  const canShowBody = both && result!.parsed.every((item) => item?.bodyJSON);
  const showingBody = bodyView && canShowBody;
  const bodySources = useMemo(
    () =>
      [0, 1].map((side) => {
        const source = result?.parsed[side]?.bodySource ?? "";
        return canShowBody && formatBodyView
          ? JSON.stringify(JSON.parse(source), null, 2)
          : source;
      }),
    [result, canShowBody, formatBodyView],
  );
  const allChanges = both ? result!.changes : [];
  const changes = allChanges.filter((item) => item.section === section);
  const selectedChange = changes[selected];
  const bodyIndex = selectedChange?.bodyIndex ?? -1;
  const textMode = mobile ? (active ? "updated" : "original") : mode;
  const revealSection = (next: Section) => {
    pendingReveal.current = next;
    setSection(next);
    setSelected(0);
    setBodyView(next === "Body" && canShowBody);
  };
  useEffect(() => {
    if (!showingBody && current && pendingReveal.current && ready) {
      const target = pendingReveal.current;
      pendingReveal.current = null;
      reveal.current?.(
        [0, 1].map((side) => result?.parsed[side]?.ranges[target]?.[0]),
      );
    }
  }, [section, ready, textMode, showingBody, current, result]);
  useEffect(() => {
    if (focus) window.scrollTo({ top: 0, behavior: "instant" });
  }, [focus]);
  const runFind = (side: 0 | 1) => {
    if (!showingBody && !mobile && mode === "unified" && side === 0) {
      pendingFind.current = side;
      setMode("side");
    } else (showingBody ? bodyFind : find).current?.(side);
  };
  useEffect(() => {
    if (pendingFind.current === null || !ready || mode !== "side") return;
    const frame = requestAnimationFrame(() => {
      if (pendingFind.current !== null) find.current?.(pendingFind.current);
      pendingFind.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, ready]);
  const move = (next: boolean) => {
    if (!changes.length) return;
    setSelected(
      (old) => (old + (next ? 1 : -1) + changes.length) % changes.length,
    );
  };
  const actions = (
    <div className="compare-title font-code-sm text-code-sm">
      <Button onClick={() => replace([inputs[1], inputs[0]])}>
        <ArrowLeftRight size={14} aria-hidden="true" /> Swap
      </Button>
      <Menu name="More" label="More">
        <label className="compare-changes-only">
          <input
            type="checkbox"
            checked={mask}
            onChange={(event) => setMask(event.target.checked)}
          />{" "}
          Hide auth in details
        </label>
        <Button
          onClick={() => {
            replace(["", ""]);
            setBodyView(false);
          }}
        >
          Clear both
        </Button>
        <Button
          onClick={async () => {
            const { createTwoFilesPatch } = await import("diff");
            await copy(
              createTwoFilesPatch("Original", "Updated", inputs[0], inputs[1]),
              "Unified command diff copied.",
            );
          }}
        >
          Copy unified command diff
        </Button>
      </Menu>
    </div>
  );
  const status = !inputs.some((value) => value.trim())
    ? "Paste two requests to compare"
    : !result
      ? "Checking requests…"
      : result.error || result.errors.some(Boolean)
        ? "Request comparison unavailable"
        : !both
          ? "Awaiting both requests"
          : incomplete
            ? `${allChanges.length} ${allChanges.length === 1 ? "change" : "changes"} in interpreted fields · Partial comparison`
            : allChanges.length
              ? `${allChanges.length} request ${allChanges.length === 1 ? "change" : "changes"}`
              : "Compared request fields match";
  const valueLabel = (value: unknown, side: 0 | 1) => {
    if (value === undefined)
      return `Not present in ${side ? "Updated" : "Original"}`;
    if (mask && section === "Auth & cookies") return "•••• (hidden)";
    const formatted = JSON.stringify(value, null, 2);
    return formatted && formatted.length > 4000
      ? formatted.slice(0, 4000) + "\n… Preview truncated; source is intact."
      : formatted;
  };
  return (
    <div
      className="compare-app curl-app bg-surface text-on-surface font-body-md text-body-md"
      data-sidebar={sidebar}
      data-focus={focus}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          !event.defaultPrevented &&
          !(event.target as Element).closest(".ux-menu, .cm-search")
        )
          setFocus(false);
        if (event.key === "F7" && !event.defaultPrevented) {
          event.preventDefault();
          move(!event.shiftKey);
        }
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        const side = Number(
          (event.target as Element)
            .closest("[data-compare-side]")
            ?.getAttribute("data-compare-side") ??
            ((event.target as Element).closest(".cm-merge-b")
              ? 1
              : (event.target as Element).closest(".cm-merge-a")
                ? 0
                : active),
        ) as 0 | 1;
        void importFile(event.dataTransfer.files[0], side);
      }}
    >
      <CompareHeader path={path} navigate={navigate} />
      <div className="compare-layout">
        <div className="compare-sidebar" hidden={!sidebar}>
          <WorkspaceSidebar
            onNavigateRoute={navigate as (path: LandingRoutePath) => void}
          />
        </div>
        <main className="compare-main">
          <div className="compare-heading">
            <HomeIntroduction content={compareRoute(path)!} />
            {!focus && actions}
          </div>
          <div
            className="compare-tool-surface"
            style={{ "--compare-split": `${split}%` } as CSSProperties}
          >
            <div className="compare-toolbar font-code-sm text-code-sm">
              <span className="curl-status" role="status">
                {status}
              </span>
              <Button
                aria-pressed={focus}
                onClick={() => setFocus((value) => !value)}
              >
                {focus ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                {focus ? "Exit focus" : "Focus"}
              </Button>
              {focus && actions}
              <Button
                className="compare-example"
                onClick={() => replace([...curlExample])}
              >
                Try example
              </Button>
              <label className="compare-changes-only">
                <input
                  type="checkbox"
                  checked={changesOnly}
                  onChange={(event) => setChangesOnly(event.target.checked)}
                />{" "}
                Changes only
              </label>
            </div>
            <nav
              className="curl-sections font-code-sm text-code-sm"
              aria-label="Request sections"
            >
              {mobile ? (
                <select
                  aria-label="Request section"
                  value={section}
                  onChange={(event) =>
                    revealSection(event.target.value as Section)
                  }
                >
                  {sectionLabels.map((label) => (
                    <option key={label} value={label}>
                      {label} ·{" "}
                      {both
                        ? allChanges.filter((item) => item.section === label)
                            .length
                        : "—"}
                    </option>
                  ))}
                </select>
              ) : (
                sectionLabels.map((label) => (
                  <Button
                    key={label}
                    aria-pressed={section === label}
                    state={section === label ? "selected" : "idle"}
                    onClick={() => revealSection(label)}
                  >
                    {label}
                    <span>
                      {both
                        ? allChanges.filter((item) => item.section === label)
                            .length
                        : "—"}
                    </span>
                  </Button>
                ))
              )}
            </nav>
            {(result?.error || result?.errors.some(Boolean) || incomplete) && (
              <div
                className="curl-messages font-code-sm text-code-sm"
                role="alert"
              >
                {result?.error && <p>{result.error}</p>}
                {(["Original", "Updated"] as const).map((label, side) => (
                  <div key={label}>
                    {result?.errors[side] && (
                      <p>
                        <strong>{label}:</strong> {result.errors[side]}
                      </p>
                    )}
                    {!!result?.parsed[side]?.warnings.length && (
                      <p>
                        <strong>{label}: partial comparison.</strong>{" "}
                        {result.parsed[side]!.warnings.map(requestWarning).join(
                          " ",
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div
              className="curl-inspector font-code-sm text-code-sm"
              aria-label={`${section} details`}
            >
              <div className="curl-change-nav">
                <strong>{section}</strong>
                {changes.length ? (
                  <>
                    <span>
                      {selected + 1} of {changes.length}
                    </span>
                    <Button
                      aria-label="Previous request change"
                      onClick={() => move(false)}
                    >
                      Previous
                    </Button>
                    <Button
                      aria-label="Next request change"
                      onClick={() => move(true)}
                    >
                      Next
                    </Button>
                    <select
                      aria-label="Changed request field"
                      value={selected}
                      onChange={(event) =>
                        setSelected(Number(event.target.value))
                      }
                    >
                      {changes.map((item, index) => (
                        <option key={index} value={index}>
                          {item.change.type} {item.change.path}
                        </option>
                      ))}
                    </select>
                    <Button
                      aria-label="Copy request path"
                      onClick={() => void copy(selectedChange!.change.path)}
                    >
                      Copy path
                    </Button>
                  </>
                ) : (
                  <span>
                    {both
                      ? "No changes in interpreted fields"
                      : "Paste two valid Bash cURL commands"}
                  </span>
                )}
              </div>
              {(selectedChange || (both && section !== "Body")) && (
                <div
                  className="curl-change-values"
                  data-auth-hidden={mask && section === "Auth & cookies"}
                >
                  <div>
                    <span>
                      Original ·{" "}
                      {selectedChange?.change.type ?? "Interpreted value"}
                    </span>
                    <pre>
                      {valueLabel(
                        selectedChange
                          ? selectedChange.change.old
                          : result!.parsed[0]!.values[section],
                        0,
                      )}
                    </pre>
                  </div>
                  <div>
                    <span>Updated</span>
                    <pre>
                      {valueLabel(
                        selectedChange
                          ? selectedChange.change.next
                          : result!.parsed[1]!.values[section],
                        1,
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <div className="compare-toolbar curl-view-options font-code-sm text-code-sm">
              <Button
                aria-pressed={!showingBody}
                onClick={() => {
                  pendingReveal.current = section;
                  setBodyView(false);
                }}
              >
                Commands
              </Button>
              <Button
                disabled={!canShowBody}
                aria-pressed={showingBody}
                onClick={() => {
                  setBodyView(true);
                  setSection("Body");
                  setSelected(0);
                }}
              >
                JSON body
              </Button>
              <span>
                {showingBody
                  ? formatBodyView
                    ? "Formatted view · read only · Commands unchanged"
                    : mobile && focus
                      ? "Read only · edit Commands to change"
                      : "Decoded JSON · read only · edit Commands to change"
                  : "Original commands · credentials remain visible"}
              </span>
              {mobile ? (
                <InputTabs
                  active={active ? "updated" : "original"}
                  onChange={(value) => setActive(value === "updated" ? 1 : 0)}
                />
              ) : showingBody ? (
                <Button
                  aria-pressed={sync}
                  onClick={() => setSync((value) => !value)}
                >
                  <Link2 size={13} /> Sync scroll
                </Button>
              ) : (
                <>
                  <Button
                    aria-pressed={mode === "side"}
                    onClick={() => setMode("side")}
                  >
                    Side by side
                  </Button>
                  <Button
                    aria-pressed={mode === "unified"}
                    onClick={() => setMode("unified")}
                  >
                    Unified
                  </Button>
                </>
              )}
            </div>
            <div className="compare-input-labels font-code-sm text-code-sm">
              {(["Original", "Updated"] as const).map((label, side) => (
                <section
                  key={label}
                  hidden={mobile && active !== side}
                  data-compare-side={side}
                >
                  <div className="compare-input-name">
                    <strong>{label}</strong>
                  </div>
                  <div className="compare-input-actions">
                    <Button
                      aria-label={`Find in ${label}`}
                      disabled={showingBody ? !bodyReady : !ready}
                      onClick={() => runFind(side as 0 | 1)}
                    >
                      <Search size={13} /> Find
                    </Button>
                    {showingBody && (
                      <Button
                        aria-label="Format both body views"
                        title="Change the read-only layout of both bodies. Commands and copied payloads stay unchanged."
                        aria-pressed={formatBodyView}
                        onClick={() => setFormatBodyView((value) => !value)}
                      >
                        <AlignLeft size={13} />
                        {formatBodyView ? "Raw spacing" : "Format"}
                      </Button>
                    )}
                    {!showingBody && (
                      <>
                        <input
                          hidden
                          type="file"
                          aria-label={`Import ${label}`}
                          ref={(element) => {
                            fileInputs.current[side] = element;
                          }}
                          accept="text/*,.sh,.txt"
                          onChange={(event) => {
                            void importFile(
                              event.target.files?.[0],
                              side as 0 | 1,
                            );
                            event.target.value = "";
                          }}
                        />
                        <Button
                          aria-label={`Open file for ${label}`}
                          onClick={() => fileInputs.current[side]?.click()}
                        >
                          <Upload size={13} /> Import
                        </Button>
                      </>
                    )}
                    <Button
                      aria-label={`Copy ${label}`}
                      onClick={() =>
                        void copy(
                          showingBody
                            ? result!.parsed[side]!.bodySource!
                            : inputs[side],
                          showingBody
                            ? "JSON body copied."
                            : `${label} command copied.`,
                        )
                      }
                    >
                      <Copy size={13} /> Copy
                    </Button>
                  </div>
                </section>
              ))}
            </div>
            <div
              className="compare-editor-stage curl-command-stage"
              data-kind="text"
              hidden={showingBody}
            >
              <Suspense fallback={<p>Loading command editors…</p>}>
                <div>
                  <TextEditors
                    a={inputs[0]}
                    b={inputs[1]}
                    onChange={update}
                    mode={textMode}
                    whitespace={false}
                    changesOnly={changesOnly}
                    context={3}
                    onStatus={(count, approximate) =>
                      setRawStatus((old) =>
                        old.count === count && old.approximate === approximate
                          ? old
                          : { count, approximate },
                      )
                    }
                    nav={nav}
                    find={find}
                    reveal={reveal}
                    placeholders={[
                      "Paste original cURL (bash)…",
                      "Paste updated cURL (bash)…",
                    ]}
                    onReady={() => setReady((value) => value + 1)}
                  />
                </div>
              </Suspense>
              {!mobile && mode === "side" && (
                <ComparePaneResize value={split} onChange={setSplit} />
              )}
            </div>
            {showingBody && (
              <div className="compare-editor-stage" data-kind="json">
                <Suspense fallback={<p>Loading body comparison…</p>}>
                  <JsonEditors
                    readOnly
                    containScroll
                    focusMode={focus}
                    a={bodySources[0]}
                    b={bodySources[1]}
                    onChange={ignoreEdit}
                    active={active}
                    mobile={mobile}
                    changes={result!.bodyChanges}
                    selected={bodyIndex}
                    onSelect={(index) =>
                      setSelected(
                        changes.findIndex((item) => item.bodyIndex === index),
                      )
                    }
                    syncScroll={sync}
                    scrollPairs={result!.bodyPairs}
                    find={bodyFind}
                    changesOnly={changesOnly}
                    onReady={() => setBodyReady(true)}
                  />
                </Suspense>
                {!mobile && (
                  <ComparePaneResize value={split} onChange={setSplit} />
                )}
              </div>
            )}
            <div className="compare-legend font-code-sm text-code-sm">
              <span>
                {showingBody
                  ? "Object key order ignored · Array order matters"
                  : `${rawStatus.count} raw command differences${rawStatus.approximate ? " · Approximate matching" : ""}`}
              </span>
              <span>Query order and repeated values preserved</span>
            </div>
          </div>
          <p className="compare-privacy font-code-sm text-code-sm">
            Local comparison only. Commands are never executed; referenced files
            and variables are not resolved. Inputs are not saved.
          </p>
          {notice && (
            <p role="status" className="font-code-sm text-code-sm">
              {notice}
            </p>
          )}
          <details className="compare-guidance">
            <summary>Comparing requests from technical specifications</summary>
            <section className="compare-support text-secondary text-sm leading-relaxed">
              <p>
                Use Copy as cURL (bash) from browser developer tools. Compare
                method, URL, ordered query values, case-insensitive header
                names, authentication, cookies and bodies. Choose Body to
                inspect decoded JSON in this workspace; the pasted commands
                remain intact.
              </p>
              <p>
                This interprets request fields, not live server behavior.
                Unsupported options and external file references make the
                comparison partial. Windows CMD/PowerShell commands, shell
                expansion and multiple requests are not interpreted. Auth hiding
                applies only to the details strip; raw commands, bodies and
                clipboard copies may contain secrets.
              </p>
            </section>
          </details>
        </main>
      </div>
      <CompareDialogs />
    </div>
  );
}
