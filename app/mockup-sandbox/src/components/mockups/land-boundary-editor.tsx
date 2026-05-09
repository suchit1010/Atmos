import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { CheckCircle2, Copy, MapPinned, MoveRight, Shapes, Sparkles, Triangle } from "lucide-react";

type BoundaryPoint = { lat: number; lng: number };

type ThemeKey = "orchard" | "biochar" | "solar" | "risk";

const THEME_PRESETS: Array<{
  id: ThemeKey;
  title: string;
  description: string;
  stroke: string;
  fill: string;
  glow: string;
}> = [
  {
    id: "orchard",
    title: "Orchard Green",
    description: "Balanced boundary styling for agroforestry and land restoration.",
    stroke: "#22c55e",
    fill: "rgba(34, 197, 94, 0.20)",
    glow: "rgba(34, 197, 94, 0.35)",
  },
  {
    id: "biochar",
    title: "Biochar Ember",
    description: "Warm, high-contrast treatment for biomass and kiln sites.",
    stroke: "#fb7185",
    fill: "rgba(251, 113, 133, 0.18)",
    glow: "rgba(251, 113, 133, 0.28)",
  },
  {
    id: "solar",
    title: "Solar Pulse",
    description: "Electric yellow for solar, grid, and asset capture zones.",
    stroke: "#facc15",
    fill: "rgba(250, 204, 21, 0.18)",
    glow: "rgba(250, 204, 21, 0.30)",
  },
  {
    id: "risk",
    title: "Fraud Overlay",
    description: "Red-amber attention state for anomalous or disputed parcels.",
    stroke: "#f97316",
    fill: "rgba(249, 115, 22, 0.16)",
    glow: "rgba(249, 115, 22, 0.30)",
  },
];

const MAP_POINTS: BoundaryPoint[] = [
  { lat: 28.6139, lng: 77.209 },
  { lat: 28.6145, lng: 77.2108 },
  { lat: 28.6136, lng: 77.212 },
  { lat: 28.6129, lng: 77.2102 },
];

function stableRound(value: number): number {
  return Number(value.toFixed(6));
}

function formatPoint(point: BoundaryPoint): string {
  return `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
}

function polygonCentroid(points: BoundaryPoint[]): BoundaryPoint {
  if (!points.length) return { lat: 0, lng: 0 };
  const sum = points.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 },
  );
  return {
    lat: stableRound(sum.lat / points.length),
    lng: stableRound(sum.lng / points.length),
  };
}

function approximateArea(points: BoundaryPoint[]): number {
  if (points.length < 3) return 0;
  const avgLat = points.reduce((acc, point) => acc + point.lat, 0) / points.length;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((avgLat * Math.PI) / 180);
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const ax = a.lng * metersPerDegLng;
    const ay = a.lat * metersPerDegLat;
    const bx = b.lng * metersPerDegLng;
    const by = b.lat * metersPerDegLat;
    area += ax * by - bx * ay;
  }
  return Math.abs(area) / 2 / 10_000;
}

function interpolate(points: BoundaryPoint[], index: number, axis: "lat" | "lng", delta: number): BoundaryPoint[] {
  return points.map((point, i) =>
    i === index ? { ...point, [axis]: stableRound(point[axis] + delta) } : point,
  );
}

function polygonPath(points: BoundaryPoint[]): string {
  if (!points.length) return "";
  return `${points.map((point) => `${point.lng},${point.lat}`).join(" ")} ${points[0].lng},${points[0].lat}`;
}

export default function LandBoundaryEditorMockup() {
  const [themeId, setThemeId] = useState<ThemeKey>("orchard");
  const [points, setPoints] = useState<BoundaryPoint[]>(MAP_POINTS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const theme = THEME_PRESETS.find((t) => t.id === themeId) ?? THEME_PRESETS[0];
  const centroid = polygonCentroid(points);
  const areaHectares = approximateArea(points);
  const exportPayload = useMemo(
    () =>
      JSON.stringify(
        {
          landBoundaryPolygon: points,
          landBoundaryPointCount: points.length,
          landLatitude: centroid.lat,
          landLongitude: centroid.lng,
          landAccuracyMeters: 8.4,
          landAreaHectares: Number(areaHectares.toFixed(2)),
          boundaryStyle: theme.id,
        },
        null,
        2,
      ),
    [areaHectares, centroid.lat, centroid.lng, points, theme.id],
  );

  function addPoint() {
    const next = {
      lat: stableRound(centroid.lat + (Math.random() - 0.5) * 0.0018),
      lng: stableRound(centroid.lng + (Math.random() - 0.5) * 0.0018),
    };
    setPoints((prev) => [...prev, next]);
    setSelectedIndex(points.length);
  }

  function removePoint(index: number) {
    setPoints((prev) => {
      if (prev.length <= 3) return prev;
      const next = prev.filter((_, i) => i !== index);
      setSelectedIndex((current) => Math.min(current, Math.max(0, next.length - 1)));
      return next;
    });
  }

  function nudgeSelected(axis: "lat" | "lng", delta: number) {
    setPoints((prev) => interpolate(prev, selectedIndex, axis, delta));
  }

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(exportPayload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#07110f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.25),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(250,204,21,0.14),_transparent_24%),linear-gradient(135deg,_rgba(6,10,8,1),_rgba(13,24,19,1)_55%,_rgba(5,9,7,1))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:84px_84px] opacity-30" />

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_28px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between lg:p-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-white/10 bg-white/10 text-emerald-200 hover:bg-white/10">
                Google Maps boundary editor
              </Badge>
              <Badge className="border border-white/10 bg-white/10 text-yellow-100 hover:bg-white/10">
                DDS polygon styling flow
              </Badge>
              <Badge className="border border-white/10 bg-white/10 text-white/80 hover:bg-white/10">
                Export-ready payload
              </Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Draw the parcel, style the boundary, ship the payload.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
                This mockup mirrors the Google Maps DDS boundary workflow: select a style preset,
                edit the polygon, preview the map-like canvas, and export the exact JSON shape the
                verification backend expects.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px] lg:grid-cols-1">
            <StatCard icon={Shapes} label="Boundary points" value={`${points.length}`} accent={theme.stroke} />
            <StatCard icon={MapPinned} label="Area estimate" value={`${areaHectares.toFixed(2)} ha`} accent={theme.stroke} />
            <StatCard icon={Sparkles} label="Active style" value={theme.title} accent={theme.stroke} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <Card className="overflow-hidden border-white/10 bg-[#0a1512]/90 text-white shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <CardHeader className="border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-white">Boundary canvas</CardTitle>
                  <CardDescription className="text-white/58">
                    A stylized parcel view with roads, signal noise, and editable polygon points.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Google-boundary compatible payload
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(14,32,23,1),_rgba(9,20,15,1))] p-4 shadow-inner">
                <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:26px_26px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(34,197,94,0.15),_transparent_40%),radial-gradient(circle_at_15%_85%,_rgba(251,113,133,0.14),_transparent_30%),radial-gradient(circle_at_85%_40%,_rgba(250,204,21,0.12),_transparent_26%)]" />

                <div className="relative flex h-[460px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(13,22,19,0.96),_rgba(8,15,12,0.96))]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/60">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.9)]" />
                      Live-style preview
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Centroid</span>
                      <span className="font-medium text-white/90">
                        {centroid.lat.toFixed(4)}, {centroid.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="relative flex-1">
                    <div className="absolute left-6 top-5 text-[10px] uppercase tracking-[0.3em] text-white/24">
                      N
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 top-5 rounded-[1.25rem] border border-white/5 bg-[linear-gradient(135deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.01))]">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.12),transparent_30%),radial-gradient(circle_at_75%_35%,rgba(250,204,21,0.12),transparent_20%),radial-gradient(circle_at_55%_78%,rgba(56,189,248,0.10),transparent_25%)]" />

                      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible p-3">
                        <defs>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        <path
                          d={polygonPath(points)}
                          fill={theme.fill}
                          stroke={theme.stroke}
                          strokeWidth="1.3"
                          strokeLinejoin="round"
                          filter="url(#glow)"
                        />
                        {points.map((point, index) => {
                          const x = ((point.lng - centroid.lng) * 2600) + 50;
                          const y = ((point.lat - centroid.lat) * -2600) + 50;
                          const active = index === selectedIndex;
                          return (
                            <g key={`${point.lat}-${point.lng}-${index}`}>
                              <circle cx={x} cy={y} r={active ? 2.8 : 2.1} fill={active ? "#fff" : theme.stroke} />
                              <circle cx={x} cy={y} r={active ? 5.5 : 4.2} fill={theme.glow} opacity="0.65" />
                            </g>
                          );
                        })}
                      </svg>

                      <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-white/70">
                        DDS boundary
                      </div>

                      <div className="absolute left-3 top-3 flex gap-2 text-[11px] text-white/55">
                        <div className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1">Map ID ready</div>
                        <div className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1">Locality layer</div>
                      </div>

                      <div className="absolute bottom-3 left-3 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-[11px] text-white/70">
                        Click points in the real map version; this mockup simulates the same polygon data flow.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setThemeId(preset.id)}
                    className={cn(
                      "group rounded-2xl border p-4 text-left transition-all duration-200",
                      themeId === preset.id
                        ? "border-white/30 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.25)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]",
                    )}
                    style={
                      themeId === preset.id
                        ? {
                            boxShadow: `0 0 0 1px ${preset.glow}, 0 18px 50px rgba(0,0,0,0.25)`,
                          }
                        : undefined
                    }
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: preset.stroke, boxShadow: `0 0 18px ${preset.glow}` }}
                      />
                      {themeId === preset.id ? (
                        <Badge className="border-white/10 bg-white/10 text-white/80">Active</Badge>
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-white">{preset.title}</div>
                    <div className="mt-1 text-xs leading-5 text-white/58">{preset.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-white/10 bg-white/6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Polygon editor</CardTitle>
                <CardDescription className="text-white/58">
                  Adjust the boundary in a way the backend can verify immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <ControlTile
                    label="Add point"
                    detail="Append a new vertex near the centroid"
                    action={<MoveRight className="h-4 w-4" />}
                    onClick={addPoint}
                  />
                  <ControlTile
                    label="Copy export"
                    detail="Send JSON to mobile or backend"
                    action={copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    onClick={copyPayload}
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-white/46">
                    <span>Selected vertex</span>
                    <span>{selectedIndex + 1} / {points.length}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => nudgeSelected("lat", 0.00018)}
                      >
                        North
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => nudgeSelected("lat", -0.00018)}
                      >
                        South
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => nudgeSelected("lng", -0.00018)}
                      >
                        West
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => nudgeSelected("lng", 0.00018)}
                      >
                        East
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {points.map((point, index) => (
                    <button
                      key={`${point.lat}-${point.lng}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                        index === selectedIndex
                          ? "border-white/25 bg-white/10"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
                      )}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">Vertex {index + 1}</div>
                        <div className="text-xs text-white/50">{formatPoint(point)}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full px-3 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePoint(index);
                        }}
                      >
                        Remove
                      </Button>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0c1714]/92 text-white shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Payload export</CardTitle>
                <CardDescription className="text-white/58">
                  The exact boundary JSON to feed into capture or backend verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  readOnly
                  value={exportPayload}
                  className="min-h-[270px] resize-none border-white/10 bg-black/35 font-mono text-xs leading-5 text-emerald-50/90 placeholder:text-white/35"
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 text-white/58">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${accent}55, rgba(255,255,255,0.06))` }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs uppercase tracking-[0.22em]">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function ControlTile({
  label,
  detail,
  action,
  onClick,
}: {
  label: string;
  detail: string;
  action: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
    >
      <div className="mb-8 flex items-center justify-between text-white/70">
        <Shapes className="h-4 w-4" />
        {action}
      </div>
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="mt-1 text-xs leading-5 text-white/50">{detail}</div>
    </button>
  );
}
