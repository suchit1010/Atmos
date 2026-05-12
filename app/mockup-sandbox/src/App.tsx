import { useEffect, useState, type ComponentType } from "react";

import { modules as discoveredModules } from "./.generated/mockup-components";
import { API_BASE, checkApiHealth, type ApiHealthResult } from "./lib/api";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `No exported React component found in ${componentPath}.tsx\n\nMake sure the file has at least one exported function component.`,
          );
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return (
      <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>
        {error}
      </pre>
    );
  }

  if (!Component) return null;

  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function getPreviewExamplePath(): string {
  const basePath = getBasePath();
  return `${basePath}/preview/ComponentName`;
}

function Gallery() {
  const [health, setHealth] = useState<ApiHealthResult | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const runtimeMode = import.meta.env.MODE;
  const configuredApi = import.meta.env["VITE_API_BASE_URL"] as string | undefined;

  async function refreshHealth(): Promise<void> {
    setChecking(true);
    const controller = new AbortController();

    try {
      const result = await checkApiHealth(controller.signal);
      setHealth(result);
    } catch {
      setHealth({
        ok: false,
        status: 0,
        url: `${API_BASE}/api/healthz`,
        message: "Cannot reach backend API",
      });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void refreshHealth();
  }, []);

  const statusClass =
    health?.ok === true
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          Component Preview Server
        </h1>
        <p className="text-gray-500 mb-4">
          This server renders individual components for the workspace canvas.
        </p>
        <p className="text-sm text-gray-400">
          Access component previews at{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
            {getPreviewExamplePath()}
          </code>
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Deployment Status
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-gray-50 px-2 py-1 text-gray-500">
              Mode
              <div className="font-semibold text-gray-800">{runtimeMode}</div>
            </div>
            <div className="rounded-md bg-gray-50 px-2 py-1 text-gray-500">
              API Source
              <div className="font-semibold text-gray-800">{configuredApi ? "Env" : "Default"}</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 break-all">{API_BASE}</p>

          <div className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs ${statusClass}`}>
            {checking ? "Checking..." : health?.message ?? "Not checked"}
          </div>

          <button
            type="button"
            className="mt-3 inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            onClick={() => {
              void refreshHealth();
            }}
          >
            Retry API Check
          </button>
        </div>
      </div>
    </div>
  );
}

function getPreviewPath(): string | null {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const match = local.match(/^\/preview\/(.+)$/);
  return match ? match[1] : null;
}

function App() {
  const previewPath = getPreviewPath();

  if (previewPath) {
    return (
      <PreviewRenderer
        componentPath={previewPath}
        modules={discoveredModules}
      />
    );
  }

  return <Gallery />;
}

export default App;
