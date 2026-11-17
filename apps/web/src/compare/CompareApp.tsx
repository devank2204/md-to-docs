import { useMobileLayout } from "../hooks/useMobileLayout";
import { CompareHeader } from "./CompareHeader";
import type { JSONReviewStatus } from "./JsonResult";
import {
  Upload,
  Copy,
  AlignLeft,
  ArrowLeftRight,
  LockKeyhole,
  Clipboard,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { HomeIntroduction } from "../components/HomeIntroduction";
import { CapacityDecision } from "../components/CapacityDecision";
import { SupportDialog } from "../components/SupportDialog";
import { useAppAppearance } from "../hooks/useAppAppearance";
import { useStore } from "../store";
import { Button, Menu } from "../components/Controls";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { WorkspaceSidebar } from "../components/WorkspaceSidebar";
import { compareRoute } from "../routes/compareRoutes";
import type { LandingRoutePath } from "../routes/landingData";
import "./compare.css";
const TextEditors = lazy(() =>
  import("./TextEditors").then((m) => ({ default: m.TextEditors })),
);
const AboutModal = lazy(() =>
  import("../components/AboutModal").then((m) => ({ default: m.AboutModal })),
);
const DocumentHistoryModal = lazy(() =>
  import("../components/DocumentHistoryModal").then((m) => ({
    default: m.DocumentHistoryModal,
  })),
);
const JsonEditors = lazy(() => import("./JsonEditors"));
const JsonResult = lazy(() => import("./JsonResult"));
// Ephemeral module memory survives tool navigation; never enters document storage or URLs.
const memory = { text: ["", ""], json: ["", ""] };

function InputTabs({
  active,
  onChange,
  unified = false,
  options,
  disabledChanges = false,
}: {
  active: string;
  onChange: (value: string) => void;
  unified?: boolean;
  options?: string[][];
  disabledChanges?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Comparison view"
      onKeyDown={(event) => {
        const tabs = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ),
        );
        const index = tabs.indexOf(event.target as HTMLButtonElement);
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft")
          next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].click();
        tabs[next].focus();
      }}
    >
      {(
        options ?? [
          ["original", "Original"],
          ["updated", "Updated"],
          ...(unified ? [["unified", "Unified"]] : []),
        ]
      ).map(([value, label]) => (
        <Button
          key={value}
          disabled={
            value === "changes" && disabledChanges && active !== "changes"
          }
          role="tab"
          aria-selected={active === value}
          state={active === value ? "selected" : "idle"}
          tabIndex={active === value ? 0 : -1}
          onClick={() => onChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function JSONInputStatus({
  kind,
  label,
  title,
}: {
  kind: string;
  label: string;
  title: string;
}) {
  const Icon =
    kind === "valid"
      ? CheckCircle2
      : kind === "error" || kind === "blocked"
        ? AlertCircle
        : Circle;
  return (
    <span
      className="compare-input-valid"
      data-valid={kind === "error" || kind === "blocked" ? false : undefined}
      title={title}
    >
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}

export default function CompareApp({
  path,
  navigate,
}: {
  path: string;
  navigate: (path: string) => void;
}) {
  useAppAppearance();
  const sidebarOpen = useStore((state) => state.isSidebarOpen);
  const root = useRef<HTMLDivElement>(null);
  const [review, setReview] = useState("inputs");
  const [jsonStatus, setJSONStatus] = useState<JSONReviewStatus>();
  const [activeChange, setActiveChange] = useState(0);
  const [textReady, setTextReady] = useState(false);
  const pendingJump = useRef<boolean | null>(null);
  const about = useStore((state) => state.isAboutModalOpen);
  const historyOpen = useStore((state) => state.isHistoryModalOpen);
  const json = path === "/json-compare";
  const spec = compareRoute(path)!;
  const [inputs, setInputs] = useState(() => [
    ...memory[json ? "json" : "text"],
  ]);
  const [mode, setMode] = useState("side");
  const mobile = useMobileLayout();
  const [whitespace, setWhitespace] = useState(false);
  const [ignoreSpace, setIgnoreSpace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [context, setContext] = useState(3);
  const [count, setCount] = useState(0);
  const [approx, setApprox] = useState(false);
  const [notice, setNotice] = useState("");
  const nav = useRef<((next: boolean) => void) | null>(null);
  const importVersion = useRef([0, 0]);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    return () => {
      importVersion.current[0]++;
      importVersion.current[1]++;
    };
  }, []);
  const update = (side: 0 | 1, value: string) => {
    importVersion.current[side]++;
    setInputs((old) => {
      const next = [...old];
      next[side] = value;
      memory[json ? "json" : "text"] = next;
      return next;
    });
  };
  const replace = (next: string[]) => {
    importVersion.current[0]++;
    importVersion.current[1]++;
    memory[json ? "json" : "text"] = next;
    setInputs(next);
  };
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied");
    } catch {
      setNotice("Clipboard unavailable. Select and copy the input instead.");
    }
  };
  const validJSON =
    !json &&
    inputs.every((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    });
  const importFile = async (file: File | undefined, side: 0 | 1) => {
    if (!file) return;
    if (file.size > 2_000_000) {
      setNotice("Import limit is 2 MB per input.");
      return;
    }
    const version = ++importVersion.current[side];
    try {
      const text = await file.text();
      if (version === importVersion.current[side]) update(side, text);
    } catch {
      setNotice("Could not read this file. Your inputs are unchanged.");
    }
  };
  const normalized = ignoreSpace || ignoreCase;
  const projection = (value: string) => {
    let result = value;
    if (ignoreSpace)
      result = result.replace(/[^\S\n]+/g, "").replace(/\r/g, "");
    if (ignoreCase) result = result.toLowerCase();
    return result;
  };
  const effectiveMode = mobile
    ? mode === "side"
      ? "original"
      : mode
    : mode === "original" || mode === "updated"
      ? "side"
      : mode;
  const currentJSON =
    jsonStatus?.a === inputs[0] && jsonStatus?.b === inputs[1];
  const canReview = currentJSON && jsonStatus.ready;
  const reviewCount = currentJSON ? jsonStatus.count : 0;
  const comparisonBlocked =
    currentJSON && jsonStatus.error && !jsonStatus.errors?.some(Boolean);
  const inputFeedback = (index: number) => {
    if (!inputs[index].trim())
      return {
        kind: "empty",
        label: "Awaiting JSON",
        title: "Paste or import this version.",
      };
    if (!currentJSON)
      return {
        kind: "pending",
        label: "Checking…",
        title: "Checking JSON syntax…",
      };
    const error = jsonStatus?.errors?.[index];
    if (error) return { kind: "error", label: "Invalid JSON", title: error };
    if (comparisonBlocked)
      return {
        kind: "blocked",
        label: "Not compared",
        title: jsonStatus?.error || "Comparison could not run.",
      };
    return {
      kind: "valid",
      label: "Valid JSON",
      title: "Strict JSON syntax is valid",
    };
  };
  const paste = async (side: 0 | 1) => {
    try {
      const text = await navigator.clipboard.readText();
      if (new Blob([text]).size > 2_000_000) {
        setNotice("Paste limit is 2 MB per input.");
        return;
      }
      update(side, text);
    } catch {
      root.current
        ?.querySelector<HTMLElement>(
          `.cm-content[aria-label="${side ? "Updated" : "Original"}"]`,
        )
        ?.focus();
      setNotice(
        "Clipboard access is unavailable. Paste directly into the focused editor.",
      );
    }
  };
  const jump = (next: boolean) => {
    if (mobile && effectiveMode !== "unified") {
      pendingJump.current = next;
      setMode("unified");
    } else nav.current?.(next);
  };
  useEffect(() => {
    if (effectiveMode !== "unified" || pendingJump.current === null) return;
    const next = pendingJump.current;
    pendingJump.current = null;
    const frame = requestAnimationFrame(() => nav.current?.(next));
    return () => cancelAnimationFrame(frame);
  }, [effectiveMode]);
  const showReview = () => setReview("changes");
  const viewOptions = mobile
    ? [
        ["original", "Original"],
        ["updated", "Updated"],
        ["changes", `Changes${canReview ? ` (${reviewCount})` : ""}`],
      ]
    : [
        ["inputs", "Inputs"],
        ["changes", `Changes${canReview ? ` (${reviewCount})` : ""}`],
      ];
  const changeView = (value: string) => {
    if (value === "changes") setReview("changes");
    else {
      setReview("inputs");
      if (value !== "inputs") setMode(value);
    }
  };
  return (
    <div
      ref={root}
      data-sidebar={sidebarOpen}
      onKeyDown={(event) => {
        if (!json && event.key === "F7" && !event.defaultPrevented) {
          event.preventDefault();
          jump(!event.shiftKey);
        }
      }}
      className="compare-app bg-surface text-on-surface font-body-md text-body-md"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        const target = (event.target as Element).closest("[data-compare-side]");
        const side = target
          ? (Number(target.getAttribute("data-compare-side")) as 0 | 1)
          : (event.target as Element).closest(".cm-merge-b")
            ? 1
            : 0;
        void importFile(event.dataTransfer.files[0], side);
      }}
    >
      <CompareHeader path={path} navigate={navigate} />
      <div className="compare-layout">
        <div className="compare-sidebar" hidden={!sidebarOpen}>
          <WorkspaceSidebar
            onNavigateRoute={navigate as (path: LandingRoutePath) => void}
          />
        </div>
        <main className="compare-main">
          <div className="compare-heading">
            <HomeIntroduction content={spec} />
            <div className="compare-title font-code-sm text-code-sm">
              <Button onClick={() => replace([inputs[1], inputs[0]])}>
                <ArrowLeftRight size={14} aria-hidden="true" /> Swap
              </Button>
              <Menu label="More" name="More">
                <div className="compare-menu">
                  <Button onClick={() => replace(["", ""])}>Clear both</Button>

                  {!json && (
                    <Button
                      onClick={async () => {
                        const { createTwoFilesPatch } = await import("diff");
                        await copy(
                          createTwoFilesPatch(
                            "Original",
                            "Updated",
                            inputs[0],
                            inputs[1],
                            undefined,
                            undefined,
                            { context },
                          ),
                        );
                      }}
                    >
                      Copy unified diff
                    </Button>
                  )}
                </div>
              </Menu>
            </div>
          </div>
          <div
            className="compare-tool-surface"
            data-review={json && review === "changes"}
          >
            <div className="compare-toolbar font-code-sm text-code-sm">
              {json && (
                <InputTabs
                  active={
                    review === "changes"
                      ? "changes"
                      : mobile
                        ? effectiveMode
                        : "inputs"
                  }
                  onChange={changeView}
                  options={viewOptions}
                  disabledChanges={!canReview}
                />
              )}
              <Button
                className="compare-example"
                onClick={() =>
                  replace(
                    json
                      ? [
                          JSON.stringify(
                            { user: { id: 5, role: "admin" }, active: true },
                            null,
                            2,
                          ),
                          JSON.stringify(
                            { active: true, user: { role: "editor", id: 5 } },
                            null,
                            2,
                          ),
                        ]
                      : [
                          "# Project plan\n\nReview the first draft.\n",
                          " # Project plan\n\nReview the updated draft.\n",
                        ],
                  )
                }
              >
                Try example
              </Button>

              {!json && (
                <>
                  {mobile ? (
                    <InputTabs
                      active={effectiveMode}
                      onChange={setMode}
                      unified
                    />
                  ) : (
                    <InputTabs
                      active={effectiveMode}
                      onChange={setMode}
                      options={[
                        ["side", "Side by side"],
                        ["unified", "Unified"],
                      ]}
                    />
                  )}
                  <span role="status">
                    {!textReady ? (
                      "Preparing comparison…"
                    ) : (
                      <>
                        {count} {count === 1 ? "difference" : "differences"}
                      </>
                    )}
                    {approx ? " · Approximate matching" : ""}
                  </span>
                  <span className="compare-current-change">
                    {activeChange
                      ? `${activeChange} of ${count}`
                      : "Navigate changes"}
                  </span>
                  <Button
                    disabled={!textReady || !count}
                    title="Previous difference (Shift+F7)"
                    onClick={() => jump(false)}
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={!textReady || !count}
                    title="Next difference (F7)"
                    onClick={() => jump(true)}
                  >
                    Next
                  </Button>
                  <Menu name="Options" label="Options">
                    <label>
                      <input
                        type="checkbox"
                        checked={ignoreSpace}
                        onChange={(e) => setIgnoreSpace(e.target.checked)}
                      />{" "}
                      Ignore whitespace
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={ignoreCase}
                        onChange={(e) => setIgnoreCase(e.target.checked)}
                      />{" "}
                      Ignore case
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={whitespace}
                        onChange={(e) => setWhitespace(e.target.checked)}
                      />{" "}
                      Show whitespace
                    </label>
                    <label>
                      Context lines{" "}
                      <input
                        type="number"
                        onKeyDown={(event) => {
                          if (event.key.startsWith("Arrow"))
                            event.stopPropagation();
                        }}
                        min="0"
                        max="100"
                        value={context}
                        onChange={(e) =>
                          setContext(
                            Math.max(0, Math.min(100, Number(e.target.value))),
                          )
                        }
                      />
                    </label>
                  </Menu>
                </>
              )}
              {!json && validJSON && (
                <Button
                  onClick={() => {
                    memory.json = [...inputs];
                    navigate("/json-compare");
                  }}
                >
                  Compare as JSON
                </Button>
              )}
            </div>
            <div
              className="compare-input-labels font-code-sm text-code-sm"
              hidden={json && review === "changes"}
            >
              {(["Original", "Updated"] as const).map((label, index) => (
                <section
                  key={label}
                  data-compare-side={index}
                  hidden={
                    mobile &&
                    effectiveMode !== "unified" &&
                    (effectiveMode === "updated" ? 1 : 0) !== index
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void importFile(
                      event.dataTransfer.files[0],
                      index as 0 | 1,
                    );
                  }}
                >
                  <div className="compare-input-name">
                    <strong>
                      <span className="compare-step">
                        {index === 0 ? "01" : "02"}
                      </span>{" "}
                      {label}
                    </strong>
                    {json && <JSONInputStatus {...inputFeedback(index)} />}
                    <span className="compare-character-count" hidden={json}>
                      {inputs[index]
                        ? `${inputs[index].length.toLocaleString()} characters`
                        : "Paste text or drop a file"}
                    </span>
                  </div>
                  <div className="compare-input-actions">
                    <input
                      hidden
                      ref={(element) => {
                        fileInputs.current[index] = element;
                      }}
                      aria-label={`Import ${label}`}
                      type="file"
                      accept="text/*,.json,.md,.csv"
                      onChange={(event) => {
                        void importFile(
                          event.target.files?.[0],
                          index as 0 | 1,
                        );
                        event.target.value = "";
                      }}
                    />
                    <Button
                      aria-label={`Open file for ${label}`}
                      onClick={() => fileInputs.current[index]?.click()}
                    >
                      <Upload size={13} aria-hidden="true" /> Import
                    </Button>
                    {json && (
                      <Button
                        aria-label={`Format ${label}`}
                        onClick={() => {
                          try {
                            update(
                              index as 0 | 1,
                              JSON.stringify(
                                JSON.parse(inputs[index]),
                                null,
                                2,
                              ),
                            );
                          } catch {
                            setNotice(`${label} contains invalid JSON.`);
                          }
                        }}
                      >
                        <AlignLeft size={13} aria-hidden="true" /> Format
                      </Button>
                    )}
                    <Button
                      aria-label={`Copy ${label}`}
                      onClick={() => void copy(inputs[index])}
                    >
                      <Copy size={13} aria-hidden="true" />
                      <span className="compare-copy-label">Copy</span>
                    </Button>
                  </div>
                </section>
              ))}
            </div>
            <div
              className="compare-editor-stage"
              data-kind={json ? "json" : "text"}
              hidden={json && review === "changes"}
            >
              {json ? (
                <Suspense fallback={<p>Loading JSON comparison…</p>}>
                  <JsonEditors
                    a={inputs[0]}
                    b={inputs[1]}
                    onChange={update}
                    mobile={mobile}
                    active={effectiveMode === "updated" ? 1 : 0}
                    visible={review === "inputs"}
                  />
                </Suspense>
              ) : (
                <>
                  {normalized && (
                    <p>
                      Ignore options show a normalized, read-only comparison
                      below. Original inputs remain unchanged; turn options off
                      to edit.
                    </p>
                  )}
                  <Suspense fallback={<p>Loading comparison editor…</p>}>
                    <div>
                      <TextEditors
                        readOnly={normalized}
                        a={normalized ? projection(inputs[0]) : inputs[0]}
                        b={normalized ? projection(inputs[1]) : inputs[1]}
                        onChange={normalized ? () => {} : update}
                        mode={effectiveMode}
                        whitespace={whitespace}
                        context={context}
                        nav={nav}
                        onStatus={(n, p, active) => {
                          setTextReady(true);
                          setCount(n);
                          setApprox(p);
                          setActiveChange(active || 0);
                        }}
                      />
                    </div>
                  </Suspense>
                </>
              )}
              {(json || effectiveMode !== "unified") && (
                <div
                  className="compare-empty-hints"
                  aria-label="Input guidance"
                >
                  {["Original", "Updated"].map((label, index) => (
                    <div
                      className="compare-empty-cell"
                      key={label}
                      data-empty={!inputs[index]}
                      data-active={
                        !mobile ||
                        effectiveMode === "unified" ||
                        (effectiveMode === "updated" ? 1 : 0) === index
                      }
                    >
                      <div>
                        <Clipboard size={22} aria-hidden="true" />
                        <p className="font-body-md text-body-md">
                          Paste {label.toLowerCase()} {json ? "JSON" : "text"}
                        </p>
                        <p className="font-code-sm text-code-sm">
                          or drop a {json ? ".json" : "plain-text"} file here
                        </p>
                        <div className="font-code-sm text-code-sm">
                          <Button
                            aria-label={`Paste ${label} from clipboard`}
                            onClick={() => void paste(index as 0 | 1)}
                          >
                            Paste from clipboard
                          </Button>
                          <Button
                            aria-label={`Open ${label} file`}
                            onClick={() => fileInputs.current[index]?.click()}
                          >
                            Open file
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {json ? (
              <Suspense fallback={<p>Checking JSON…</p>}>
                <JsonResult
                  a={inputs[0]}
                  b={inputs[1]}
                  copy={copy}
                  view={review}
                  onReview={showReview}
                  onStatus={setJSONStatus}
                />
              </Suspense>
            ) : (
              <div className="compare-editor-footer font-code-sm text-code-sm">
                <span className="compare-legend">
                  <span>− Removed</span>
                  <span>+ Added</span>
                </span>
                <span>
                  {!textReady
                    ? "Loading comparison editor"
                    : approx
                      ? "Approximate matching · Diff limit reached"
                      : normalized
                        ? "Normalized, read-only view"
                        : "Exact comparison"}{" "}
                  · Updates as you type
                </span>
                <span>F7 Next · Shift+F7 Previous</span>
              </div>
            )}
            {!json && inputs.some((value) => value.includes("\r")) && (
              <p>
                Carriage returns are shown as control characters so CRLF and LF
                line endings compare exactly.
              </p>
            )}
            <p
              role="status"
              className="compare-notice font-code-sm text-code-sm"
            >
              {notice}
            </p>
          </div>
          <p className="compare-privacy font-code-sm text-code-sm">
            <LockKeyhole size={12} aria-hidden="true" /> Your inputs stay in
            this tab. Nothing is saved.
          </p>
          <details className="compare-guidance">
            <summary>About this comparison · privacy and limits</summary>
            <section className="compare-support text-secondary text-sm leading-relaxed">
              <h2 className="font-serif text-lg font-medium text-on-surface mb-3">
                Review technical revisions before sharing
              </h2>
              <p>
                {json
                  ? "Compare API examples and JSON in technical specifications. Object key order and indentation do not affect results. Arrays retain their order; object changes are compared by position without inferred IDs."
                  : "Inspect AI-generated document changes and Markdown revisions in the editors. Unified patches include the original inputs; ignore options only affect the displayed comparison."}
              </p>
              <p>
                Processing stays in your browser. Inputs are held in memory only
                and disappear on refresh. JSON duplicate keys follow JSON.parse
                semantics: the last value wins. No automatic repair or merging
                is performed.
              </p>
              <p>
                For responsiveness, imports are limited to 2 MB. JSON structural
                comparisons are limited to 200,000 characters per side; larger
                inputs remain available for copying.
              </p>
            </section>
          </details>
        </main>
      </div>
      <CapacityDecision />
      <SupportDialog />
      <Suspense fallback={null}>
        {about && <AboutModal />}
        {historyOpen && (
          <DocumentHistoryModal
            isOpen={historyOpen}
            onClose={() => useStore.getState().setIsHistoryModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
