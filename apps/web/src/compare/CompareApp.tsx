import { InputTabs } from "./CompareTabs";
import {
  changeTypes,
  visibleJSONChanges,
  type IgnoredPath,
} from "./jsonFilters";
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
  Link2,
  Unlink2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Search,
  Maximize2,
  Minimize2,
  X,
  Filter,
  EyeOff,
} from "lucide-react";
import { HomeIntroduction } from "../components/HomeIntroduction";
import { CompareDialogs } from "./CompareDialogs";
import { useAppAppearance } from "../hooks/useAppAppearance";
import { useStore } from "../store";
import { Button, Menu } from "../components/Controls";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useMemo,
  type CSSProperties,
} from "react";
import { WorkspaceSidebar } from "../components/WorkspaceSidebar";
import { compareRoute } from "../routes/compareRoutes";
import type { LandingRoutePath } from "../routes/landingData";
import "./compare.css";
const TextEditors = lazy(() =>
  import("./TextEditors").then((m) => ({ default: m.TextEditors })),
);
const JsonEditors = lazy(() => import("./JsonEditors"));
const JsonResult = lazy(() => import("./JsonResult"));
// Ephemeral module memory survives tool navigation; never enters document storage or URLs.
import { comparisonMemory as memory } from "./memory";

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
      <span className="compare-input-status-text">{label}</span>
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
  const [focusMode, setFocusMode] = useState(false);
  const [split, setSplit] = useState(50);
  const [changesOnly, setChangesOnly] = useState(false);
  const [includedTypes, setIncludedTypes] = useState<string[]>([
    ...changeTypes,
  ]);
  const [ignoredPaths, setIgnoredPaths] = useState<IgnoredPath[]>([]);
  const [editorReady, setEditorReady] = useState(false);
  const find = useRef<((side: 0 | 1) => void) | null>(null);
  const pendingFind = useRef<0 | 1 | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const [selectedJSON, setSelectedJSON] = useState(-1);
  const [jsonStatus, setJSONStatus] = useState<JSONReviewStatus>();
  const [activeChange, setActiveChange] = useState(0);
  const [textReady, setTextReady] = useState(false);
  const pendingJump = useRef<boolean | null>(null);
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
  const jsonChanges = useMemo(
    () =>
      canReview
        ? visibleJSONChanges(
            jsonStatus.changes ?? [],
            includedTypes,
            ignoredPaths,
          )
        : [],
    [canReview, jsonStatus, includedTypes, ignoredPaths],
  );
  const filtersActive = includedTypes.length !== 3 || ignoredPaths.length > 0;
  const restoreFilters = () => {
    setIncludedTypes([...changeTypes]);
    setIgnoredPaths([]);
    setSelectedJSON(-1);
  };
  const selectedJSONChange = jsonChanges[selectedJSON];
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
    const selectedPath = index
      ? selectedJSONChange?.updatedPath
      : selectedJSONChange?.originalPath;
    return {
      kind: "valid",
      label: selectedJSONChange
        ? (selectedPath ?? "Not present here")
        : "Valid JSON",
      title: selectedJSONChange
        ? `Valid JSON · ${selectedPath ?? "This field is not present in this input"}`
        : "Strict JSON syntax is valid",
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
  const runFind = (side: 0 | 1) => {
    if (!json && effectiveMode === "unified" && side === 0) {
      pendingFind.current = side;
      setMode(mobile ? "original" : "side");
    } else find.current?.(side);
  };
  useEffect(() => {
    if (pendingFind.current === null || !editorReady) return;
    const side = pendingFind.current;
    const frame = requestAnimationFrame(() => {
      pendingFind.current = null;
      find.current?.(side);
    });
    return () => cancelAnimationFrame(frame);
  }, [effectiveMode, editorReady]);
  useEffect(() => {
    if (focusMode) window.scrollTo({ top: 0, behavior: "instant" });
  }, [focusMode]);
  const actions = (
    <div className="compare-title font-code-sm text-code-sm">
      {focusMode && (
        <span className="compare-focus-title">
          {json ? "JSON Compare" : "Text Compare"}
        </span>
      )}
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
  );
  return (
    <div
      ref={root}
      data-sidebar={sidebarOpen}
      data-focus={focusMode}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          focusMode &&
          !event.defaultPrevented &&
          !(event.target as Element).closest(".ux-menu, .cm-search")
        )
          setFocusMode(false);
        if (event.key === "F7" && !event.defaultPrevented) {
          event.preventDefault();
          if (json) nav.current?.(!event.shiftKey);
          else jump(!event.shiftKey);
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
            {!focusMode && actions}
          </div>
          <div
            className="compare-tool-surface"
            style={{ "--compare-split": `${split}%` } as CSSProperties}
          >
            <div className="compare-toolbar font-code-sm text-code-sm">
              {json && (
                <>
                  {mobile && (
                    <InputTabs active={effectiveMode} onChange={setMode} />
                  )}
                  <Suspense
                    fallback={
                      <span role="status">Preparing JSON comparison…</span>
                    }
                  >
                    <JsonResult
                      a={inputs[0]}
                      b={inputs[1]}
                      selected={selectedJSON}
                      onSelect={setSelectedJSON}
                      nav={nav}
                      onStatus={setJSONStatus}
                      visibleChanges={jsonChanges}
                    />
                  </Suspense>
                  {!mobile && (
                    <Button
                      className="json-sync-scroll"
                      state={syncScroll ? "selected" : "idle"}
                      aria-pressed={syncScroll}
                      title={
                        canReview
                          ? "Keep corresponding JSON fields together while scrolling. Turn off to scroll independently."
                          : "Scroll together by position until both inputs contain valid JSON."
                      }
                      onClick={() => setSyncScroll((value) => !value)}
                    >
                      {syncScroll ? (
                        <Link2 size={14} aria-hidden="true" />
                      ) : (
                        <Unlink2 size={14} aria-hidden="true" />
                      )}
                      Sync scroll
                    </Button>
                  )}
                </>
              )}
              <label className="compare-changes-only">
                <input
                  type="checkbox"
                  checked={changesOnly}
                  onChange={(event) => {
                    setChangesOnly(event.target.checked);
                    if (!json && mobile && event.target.checked)
                      setMode("unified");
                  }}
                />{" "}
                Changes only
              </label>
              {json && (
                <Menu
                  name={filtersActive ? "Filters: active" : "Filters"}
                  label={
                    <>
                      <Filter size={13} aria-hidden="true" /> Filters
                      {filtersActive ? " · on" : ""}
                    </>
                  }
                >
                  <div className="json-filter-options">
                    <strong>Show change types</strong>
                    {changeTypes.map((type) => (
                      <label key={type}>
                        <input
                          type="checkbox"
                          checked={includedTypes.includes(type)}
                          onChange={(event) => {
                            setIncludedTypes((old) =>
                              event.target.checked
                                ? [...old, type]
                                : old.filter((value) => value !== type),
                            );
                            setSelectedJSON(-1);
                          }}
                        />{" "}
                        {type}
                      </label>
                    ))}
                    <p>
                      Select a changed field, then choose Ignore field to remove
                      noise. Ignoring a child keeps parent changes visible.
                    </p>
                    <Button disabled={!filtersActive} onClick={restoreFilters}>
                      Show all changes
                    </Button>
                  </div>
                </Menu>
              )}
              <Button
                className="compare-focus-button"
                aria-pressed={focusMode}
                title={
                  focusMode
                    ? "Exit focus workspace (Esc)"
                    : "Give the comparison the full workspace"
                }
                onClick={() => setFocusMode((value) => !value)}
              >
                {focusMode ? (
                  <Minimize2 size={13} aria-hidden="true" />
                ) : (
                  <Maximize2 size={13} aria-hidden="true" />
                )}
                {focusMode ? "Exit focus" : "Focus"}
              </Button>
              {focusMode && actions}
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
            {json && filtersActive && (
              <div
                className="json-active-filters font-code-sm text-code-sm"
                aria-label="Active JSON filters"
              >
                {changeTypes
                  .filter((type) => !includedTypes.includes(type))
                  .map((type) => (
                    <Button
                      key={type}
                      onClick={() => {
                        setIncludedTypes((old) => [...old, type]);
                        setSelectedJSON(-1);
                      }}
                    >
                      Show {type.toLowerCase()}{" "}
                      <X size={12} aria-hidden="true" />
                    </Button>
                  ))}
                {ignoredPaths.map((item) => (
                  <Button
                    key={item.path}
                    aria-label={`Include ${item.path}`}
                    onClick={() => {
                      setIgnoredPaths((old) =>
                        old.filter((path) => path !== item),
                      );
                      setSelectedJSON(-1);
                    }}
                  >
                    <EyeOff size={12} aria-hidden="true" /> {item.path}{" "}
                    <X size={12} aria-hidden="true" />
                  </Button>
                ))}
                <Button onClick={restoreFilters}>Show all changes</Button>
              </div>
            )}
            {json && (
              <div
                className="json-context-bar font-code-sm text-code-sm"
                aria-label="Current JSON change"
                data-kind={selectedJSONChange?.type.toLowerCase()}
                data-selected={!!selectedJSONChange}
              >
                {selectedJSONChange ? (
                  <>
                    <span className="json-context-kind">
                      {selectedJSONChange.type}
                    </span>
                    <code>{selectedJSONChange.path}</code>
                    <span className="json-context-values">
                      <span className="json-context-old">
                        {selectedJSONChange.old === undefined
                          ? "Not present in Original"
                          : JSON.stringify(selectedJSONChange.old)?.slice(
                              0,
                              100,
                            )}
                      </span>
                      <span aria-hidden="true">→</span>
                      <span className="json-context-new">
                        {selectedJSONChange.next === undefined
                          ? "Not present in Updated"
                          : JSON.stringify(selectedJSONChange.next)?.slice(
                              0,
                              100,
                            )}
                      </span>
                    </span>
                    <Button
                      aria-label={`Copy path ${selectedJSONChange.path}`}
                      onClick={() => void copy(selectedJSONChange.path)}
                    >
                      <Copy size={13} />
                    </Button>
                    <Button
                      className="json-ignore-field"
                      onClick={() => {
                        setIgnoredPaths((old) => [
                          ...old,
                          {
                            path: selectedJSONChange.path,
                            segments: selectedJSONChange.segments,
                          },
                        ]);
                        setSelectedJSON(-1);
                      }}
                    >
                      <EyeOff size={13} aria-hidden="true" /> Ignore field
                    </Button>
                  </>
                ) : (
                  <span>
                    {canReview && !jsonChanges.length
                      ? jsonStatus.count
                        ? "No changes match these filters. Show all changes to restore them."
                        : "Object key order and formatting are ignored."
                      : canReview
                        ? "Changes are highlighted below · Next jumps to both locations."
                        : "Edit either input · Differences update automatically when both contain valid JSON."}
                  </span>
                )}
              </div>
            )}
            {json && currentJSON && jsonStatus.error && (
              <div className="json-error" role="alert">
                <strong>
                  {jsonStatus.errors?.some(Boolean)
                    ? "Fix JSON syntax"
                    : "Comparison unavailable"}
                </strong>
                <p>{jsonStatus.error}</p>
                <p>Both inputs are preserved.</p>
              </div>
            )}
            <div className="compare-input-labels font-code-sm text-code-sm">
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
                    <Button
                      aria-label={`Find in ${label}`}
                      title={`Find in ${label} (Ctrl/Cmd+F)`}
                      disabled={!editorReady}
                      onClick={() => runFind(index as 0 | 1)}
                    >
                      <Search size={13} aria-hidden="true" /> Find
                    </Button>
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
            >
              {json ? (
                <Suspense fallback={<p>Loading JSON comparison…</p>}>
                  <JsonEditors
                    a={inputs[0]}
                    b={inputs[1]}
                    onChange={update}
                    mobile={mobile}
                    active={effectiveMode === "updated" ? 1 : 0}
                    changes={jsonChanges}
                    changesOnly={changesOnly && !!canReview}
                    find={find}
                    onReady={() => setEditorReady(true)}
                    selected={selectedJSON}
                    onSelect={setSelectedJSON}
                    syncScroll={syncScroll}
                    scrollPairs={
                      canReview ? (jsonStatus.scrollPairs ?? []) : []
                    }
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
                        find={find}
                        onReady={() => setEditorReady(true)}
                        changesOnly={changesOnly}
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
              {!mobile && (json || effectiveMode === "side") && (
                <div
                  className="compare-pane-resize"
                  role="separator"
                  aria-label="Resize comparison panes"
                  aria-orientation="vertical"
                  tabIndex={0}
                  aria-valuemin={25}
                  aria-valuemax={75}
                  aria-valuenow={split}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId))
                      return;
                    const bounds =
                      event.currentTarget.parentElement!.getBoundingClientRect();
                    setSplit(
                      Math.max(
                        25,
                        Math.min(
                          75,
                          Math.round(
                            ((event.clientX - bounds.left) / bounds.width) *
                              100,
                          ),
                        ),
                      ),
                    );
                  }}
                  onKeyDown={(event) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    ) {
                      event.preventDefault();
                      setSplit((value) =>
                        event.key === "Home"
                          ? 25
                          : event.key === "End"
                            ? 75
                            : Math.max(
                                25,
                                Math.min(
                                  75,
                                  value + (event.key === "ArrowLeft" ? -5 : 5),
                                ),
                              ),
                      );
                    }
                  }}
                  onDoubleClick={() => setSplit(50)}
                />
              )}
            </div>
            <div className="compare-editor-footer font-code-sm text-code-sm">
              <span className="compare-legend">
                <span>− Removed</span>
                <span>+ Added</span>
                {json && <span>~ Modified</span>}
              </span>
              <span>
                {json
                  ? "Key order and formatting ignored · Array order matters"
                  : !textReady
                    ? "Loading comparison editor"
                    : approx
                      ? "Approximate matching · Diff limit reached"
                      : normalized
                        ? "Normalized, read-only view"
                        : "Exact comparison"}
                {!json && " · Updates as you type"}
              </span>
              <span>F7 Next · Shift+F7 Previous</span>
            </div>
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
      <CompareDialogs />
    </div>
  );
}
