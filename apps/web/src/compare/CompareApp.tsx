import { HomeIntroduction } from "../components/HomeIntroduction";
import { CapacityDecision } from "../components/CapacityDecision";
import { SupportDialog } from "../components/SupportDialog";
import { AppAppearance } from "../components/AppAppearance";
import { useAppAppearance } from "../hooks/useAppAppearance";
import { useStore } from "../store";
import { Button, Menu } from "../components/Controls";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrandWordmark } from "../components/BrandWordmark";
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
const JsonResult = lazy(() => import("./JsonResult"));
// Ephemeral module memory survives tool navigation; never enters document storage or URLs.
const memory = { text: ["", ""], json: ["", ""] };
export default function CompareApp({
  path,
  navigate,
}: {
  path: string;
  navigate: (path: string) => void;
}) {
  useAppAppearance();
  const about = useStore((state) => state.isAboutModalOpen);
  const historyOpen = useStore((state) => state.isHistoryModalOpen);
  const json = path === "/json-compare";
  const spec = compareRoute(path)!;
  const [inputs, setInputs] = useState(() => [
    ...memory[json ? "json" : "text"],
  ]);
  const [mode, setMode] = useState("side");
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  const [whitespace, setWhitespace] = useState(false);
  const [ignoreSpace, setIgnoreSpace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [context, setContext] = useState(3);
  const [count, setCount] = useState(0);
  const [approx, setApprox] = useState(false);
  const [notice, setNotice] = useState("");
  const nav = useRef<((next: boolean) => void) | null>(null);
  const importVersion = useRef(0);
  useEffect(() => {
    const media = matchMedia("(max-width:767px)");
    const change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => {
      media.removeEventListener("change", change);
      importVersion.current++;
    };
  }, []);
  const update = (side: 0 | 1, value: string) =>
    setInputs((old) => {
      const next = [...old];
      next[side] = value;
      memory[json ? "json" : "text"] = next;
      return next;
    });
  const replace = (next: string[]) => {
    importVersion.current++;
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
  const validJSON = inputs.every((value) => {
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
    const version = ++importVersion.current;
    const text = await file.text();
    if (version === importVersion.current) update(side, text);
  };
  const normalized = ignoreSpace || ignoreCase;
  const projection = (value: string) => {
    let result = value;
    if (ignoreSpace)
      result = result.replace(/[^\S\n]+/g, "").replace(/\r/g, "");
    if (ignoreCase) result = result.toLowerCase();
    return result;
  };
  const effectiveMode = mobile ? (mode === "side" ? "original" : mode) : mode;
  return (
    <div
      className="compare-app bg-surface text-on-surface font-body-md text-body-md"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        const side = (event.target as Element).closest(".cm-merge-b") ? 1 : 0;
        void importFile(event.dataTransfer.files[0], side);
      }}
    >
      <header className="compare-header font-code-sm text-code-sm">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <BrandWordmark />
        </a>
        <AppAppearance />
        {mobile ? (
          <Menu
            name="Tools"
            label="Tools"
            className="workspace-menu mobile-tools"
          >
            <a
              href="/text-compare/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/text-compare");
              }}
            >
              Text Compare
            </a>
            <a
              href="/json-compare/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/json-compare");
              }}
            >
              JSON Compare
            </a>
          </Menu>
        ) : (
          <nav aria-label="Tools">
            <a
              href="/text-compare/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/text-compare");
              }}
            >
              Text Compare
            </a>
            <a
              href="/json-compare/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/json-compare");
              }}
            >
              JSON Compare
            </a>
          </nav>
        )}
      </header>
      <div className="compare-layout">
        <div className="compare-sidebar">
          <WorkspaceSidebar
            onNavigateRoute={navigate as (path: LandingRoutePath) => void}
          />
        </div>
        <main className="compare-main">
          <HomeIntroduction content={spec} />
          <div className="compare-title font-code-sm text-code-sm">
            <Button onClick={() => replace([inputs[1], inputs[0]])}>
              Swap
            </Button>
            <details>
              <summary className="ux-button">More</summary>
              <div className="compare-menu">
                <Button onClick={() => replace(["", ""])}>Clear both</Button>
                <Button onClick={() => void copy(inputs[0])}>
                  Copy Original
                </Button>
                <Button onClick={() => void copy(inputs[1])}>
                  Copy Updated
                </Button>
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
            </details>
          </div>
          <div className="compare-toolbar font-code-sm text-code-sm">
            <Button
              onClick={() =>
                replace(
                  json
                    ? [
                        '{"user":{"id":5,"role":"admin"},"active":true}',
                        '{"active":true,"user":{"role":"editor","id":5}}',
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
                  <div
                    role="tablist"
                    aria-label="Comparison view"
                    onKeyDown={(event) => {
                      const tabs = Array.from(
                        event.currentTarget.querySelectorAll<HTMLButtonElement>(
                          "button",
                        ),
                      );
                      const index = tabs.indexOf(
                        event.target as HTMLButtonElement,
                      );
                      let next = index;
                      if (event.key === "ArrowRight")
                        next = (index + 1) % tabs.length;
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
                    {[
                      ["original", "Original"],
                      ["updated", "Updated"],
                      ["unified", "Unified"],
                    ].map(([value, label]) => (
                      <Button
                        key={value}
                        role="tab"
                        aria-selected={effectiveMode === value}
                        tabIndex={effectiveMode === value ? 0 : -1}
                        onClick={() => setMode(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <select
                    className="ux-button"
                    aria-label="Comparison view"
                    value={effectiveMode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    {mobile ? (
                      <>
                        <option value="original">Original</option>
                        <option value="updated">Updated</option>
                      </>
                    ) : (
                      <option value="side">Side by side</option>
                    )}
                    <option value="unified">Unified</option>
                  </select>
                )}
                <span role="status">
                  {count} differences{approx ? " · Approximate matching" : ""}
                </span>
                <Button onClick={() => nav.current?.(false)}>Previous</Button>
                <Button onClick={() => nav.current?.(true)}>Next</Button>
                <details>
                  <summary className="ux-button">Options</summary>
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
                </details>
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
          <div className="compare-input-labels font-code-sm text-code-sm">
            {(["Original", "Updated"] as const).map((label, index) => (
              <label
                key={label}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void importFile(e.dataTransfer.files[0], index as 0 | 1);
                }}
              >
                {label}{" "}
                <input
                  aria-label={`Import ${label}`}
                  type="file"
                  accept="text/*,.json,.md,.csv"
                  onChange={(e) =>
                    void importFile(e.target.files?.[0], index as 0 | 1)
                  }
                />
                {json && (
                  <>
                    <Button
                      onClick={() => {
                        try {
                          update(
                            index as 0 | 1,
                            JSON.stringify(JSON.parse(inputs[index]), null, 2),
                          );
                        } catch {
                          setNotice(`${label} contains invalid JSON.`);
                        }
                      }}
                    >
                      Format input
                    </Button>
                    <textarea
                      aria-label={label}
                      value={inputs[index]}
                      onChange={(e) => update(index as 0 | 1, e.target.value)}
                      spellCheck={false}
                    />
                  </>
                )}
              </label>
            ))}
          </div>
          {json ? (
            <Suspense fallback={<p>Loading JSON comparison…</p>}>
              <JsonResult a={inputs[0]} b={inputs[1]} copy={copy} />
            </Suspense>
          ) : (
            <>
              {normalized && (
                <p>
                  Ignore options show a normalized, read-only comparison below.
                  Original inputs remain unchanged; turn options off to edit.
                </p>
              )}
              <Suspense fallback={<p>Loading comparison editor…</p>}>
                <div>
                  <TextEditors
                    readOnly={normalized}
                    a={normalized ? projection(inputs[0]) : inputs[0]}
                    b={normalized ? projection(inputs[1]) : inputs[1]}
                    onChange={normalized ? () => {} : update}
                    mode={normalized ? "unified" : effectiveMode}
                    whitespace={whitespace}
                    context={context}
                    nav={nav}
                    onStatus={(n, p) => {
                      setCount(n);
                      setApprox(p);
                    }}
                  />
                </div>
              </Suspense>
            </>
          )}
          {!json && inputs.some((value) => value.includes("\r")) && (
            <p>
              Carriage returns are shown as control characters so CRLF and LF
              line endings compare exactly.
            </p>
          )}
          <p role="status">{notice}</p>
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
              semantics: the last value wins. No automatic repair or merging is
              performed.
            </p>
            <p>
              For responsiveness, imports are limited to 2 MB. JSON structural
              comparisons are limited to 200,000 characters per side; larger
              inputs remain available for copying.
            </p>
          </section>
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
