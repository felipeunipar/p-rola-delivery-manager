import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MapPin,
  Clock,
  Bike,
  CheckCircle2,
  ChevronDown,
  Plus,
  Search,
  X,
  Building2,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Configurações de entrega" },
      { name: "description", content: "Gerencie bairros, taxas e prazos da sua lanchonete." },
    ],
  }),
  component: DeliverySettings,
});

type Neighborhood = {
  id: string;
  name: string;
  active: boolean;
  fee: number;
  deliveryMin: number;
  deliveryMax: number;
  pickupMin: number;
  pickupMax: number;
};

type City = {
  id: string;
  name: string;
  isHome?: boolean;
  neighborhoods: Neighborhood[];
};

const PEROLA_BAIRROS = [
  "Centro",
  "Jardim Iguaçu",
  "Jardim Independência",
  "Jardim Bandeirantes",
  "Vila Nova",
  "Jardim Primavera",
  "Jardim São Paulo",
  "Conjunto Habitacional",
];

const XAMBRE_BAIRROS = ["Centro", "Vila Rural", "Jardim Aeroporto", "Conjunto São José"];
const ALTO_PARAISO_BAIRROS = ["Centro", "Vila Operária", "Jardim das Flores"];
const CAFEZAL_BAIRROS = ["Centro", "Vila Nova", "Jardim Esperança"];

const AVAILABLE_CITIES: { id: string; name: string; uf: string; bairros: string[] }[] = [
  { id: "xambre", name: "Xambrê", uf: "PR", bairros: XAMBRE_BAIRROS },
  { id: "alto-paraiso", name: "Alto Paraíso", uf: "PR", bairros: ALTO_PARAISO_BAIRROS },
  { id: "cafezal", name: "Cafezal do Sul", uf: "PR", bairros: CAFEZAL_BAIRROS },
];

function makeNeighborhood(name: string, active = false): Neighborhood {
  return {
    id: crypto.randomUUID(),
    name,
    active,
    fee: 0,
    deliveryMin: 30,
    deliveryMax: 45,
    pickupMin: 15,
    pickupMax: 20,
  };
}

function DeliverySettings() {
  const [cities, setCities] = useState<City[]>(() => [
    {
      id: "perola",
      name: "Pérola",
      isHome: true,
      neighborhoods: PEROLA_BAIRROS.map((n, i) => ({
        ...makeNeighborhood(n, i < 3),
        fee: i === 0 ? 0 : 5 + i,
      })),
    },
  ]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ perola: true });
  const [pickupTime, setPickupTime] = useState({ min: 15, max: 20 });
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const totalActive = cities.reduce(
    (acc, c) => acc + c.neighborhoods.filter((n) => n.active).length,
    0,
  );

  const updateNeighborhood = (cityId: string, nbId: string, patch: Partial<Neighborhood>) => {
    setCities((prev) =>
      prev.map((c) =>
        c.id !== cityId
          ? c
          : { ...c, neighborhoods: c.neighborhoods.map((n) => (n.id === nbId ? { ...n, ...patch } : n)) },
      ),
    );
  };

  const toggleCity = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const addCity = (cityKey: string) => {
    const def = AVAILABLE_CITIES.find((c) => c.id === cityKey);
    if (!def) return;
    if (cities.some((c) => c.id === cityKey)) return;
    setCities((p) => [
      ...p,
      {
        id: cityKey,
        name: def.name,
        neighborhoods: def.bairros.map((b) => makeNeighborhood(b, false)),
      },
    ]);
    setExpanded((p) => ({ ...p, [cityKey]: false }));
    setModalOpen(false);
    setSearch("");
  };

  const removeCity = (id: string) => {
    setCities((p) => p.filter((c) => c.id !== id));
  };

  const filteredAvailable = useMemo(
    () =>
      AVAILABLE_CITIES.filter(
        (c) =>
          !cities.some((x) => x.id === c.id) &&
          c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [cities, search],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-accent/40 via-background to-background">
        <div className="absolute right-0 top-0 hidden h-full w-1/2 opacity-90 md:block">
          <CityIllustration />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Configurações · Entrega
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-none tracking-tight text-foreground md:text-6xl">
            Configurações de{" "}
            <span className="italic text-primary">entrega</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Gerencie os bairros atendidos, taxas, prazos e sincronize com o seu site.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">
                Bairros <span className="italic font-medium text-primary">& entregas</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalActive} bairro{totalActive === 1 ? "" : "s"} ativo
                {totalActive === 1 ? "" : "s"} em {cities.length} cidade
                {cities.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Retirada</span>
              <RangeInput
                tone="muted"
                min={pickupTime.min}
                max={pickupTime.max}
                onChange={(min, max) => setPickupTime({ min, max })}
              />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success-soft px-4 py-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Sincronizado com o site
            </div>
          </div>
        </div>

        {/* City sections */}
        <div className="space-y-4">
          {cities.map((city) => {
            const isOpen = !!expanded[city.id];
            const activeCount = city.neighborhoods.filter((n) => n.active).length;
            const total = city.neighborhoods.length;
            return (
              <section
                key={city.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(20,20,40,0.08)]"
              >
                {/* Collapsible bar */}
                <button
                  type="button"
                  onClick={() => toggleCity(city.id)}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/30"
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      city.isHome
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {city.isHome ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {city.name}
                      </h3>
                      {city.isHome && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                          Cidade da loja
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {city.isHome
                        ? "Bairros padrão de Pérola — ative e configure os tempos."
                        : "Bairros adicionais — ative os que sua loja atende."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-baseline gap-1 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums",
                        activeCount > 0
                          ? "bg-success-soft text-success"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span>{activeCount}</span>
                      <span className="text-muted-foreground/70">/</span>
                      <span className="text-muted-foreground">{total}</span>
                      <span className="ml-1 text-xs font-medium opacity-70">ativos</span>
                    </div>

                    {!city.isHome && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCity(city.id);
                        }}
                        className="rounded-full p-2 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remover ${city.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-300",
                        isOpen && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                {/* Expanded content */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border/70 bg-gradient-to-b from-accent/10 to-transparent">
                      {/* Header row */}
                      <div className="hidden grid-cols-[80px_1.4fr_1fr_1.2fr] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
                        <div>Ativo</div>
                        <div>Bairro</div>
                        <div>Taxa (R$)</div>
                        <div>Entrega (min)</div>
                      </div>

                      <ul className="divide-y divide-border/60">
                        {city.neighborhoods.map((nb) => (
                          <li
                            key={nb.id}
                            className={cn(
                              "grid grid-cols-1 gap-3 px-5 py-4 transition-colors md:grid-cols-[80px_1.4fr_1fr_1.2fr] md:items-center md:gap-4",
                              !nb.active && "opacity-75",
                            )}
                          >
                            <div className="flex items-center">
                              <Switch
                                checked={nb.active}
                                onCheckedChange={(v) =>
                                  updateNeighborhood(city.id, nb.id, { active: v })
                                }
                              />
                            </div>

                            <div className="font-medium text-foreground">{nb.name}</div>

                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">R$</span>
                              <Input
                                inputMode="decimal"
                                value={nb.fee.toString().replace(".", ",")}
                                onChange={(e) => {
                                  const v = parseFloat(
                                    e.target.value.replace(",", ".").replace(/[^\d.]/g, ""),
                                  );
                                  updateNeighborhood(city.id, nb.id, {
                                    fee: isNaN(v) ? 0 : v,
                                  });
                                }}
                                className="h-9 w-24"
                              />
                            </div>

                            <RangeInput
                              icon={<Clock className="h-3.5 w-3.5" />}
                              tone="primary"
                              min={nb.deliveryMin}
                              max={nb.deliveryMax}
                              onChange={(min, max) =>
                                updateNeighborhood(city.id, nb.id, {
                                  deliveryMin: min,
                                  deliveryMax: max,
                                })
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Add city CTA */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="group flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-border bg-card/50 px-6 py-5 text-left transition-all hover:border-primary/60 hover:bg-accent/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">
                  Entrega em <span className="italic text-primary">outra cidade?</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Adicione uma cidade vizinha e ative os bairros atendidos.
                </p>
              </div>
            </div>
            <span className="hidden text-sm font-medium text-primary md:inline">Adicionar cidade →</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <InfoTile
            icon={<Bike className="h-5 w-5" />}
            tone="primary"
            title="Entrega"
            text="O cliente verá no checkout o prazo estimado antes de finalizar o pedido."
          />
        </div>
      </main>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Adicionar <span className="italic text-primary">cidade</span>
            </DialogTitle>
            <DialogDescription>
              Escolha uma cidade vizinha para liberar a configuração dos bairros.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {filteredAvailable.length === 0 && (
              <li className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma cidade encontrada.
              </li>
            )}
            {filteredAvailable.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => addCity(c.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/30"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {c.name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">/ {c.uf}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.bairros.length} bairros disponíveis
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RangeInput({
  min,
  max,
  onChange,
  icon,
  tone,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
  icon?: React.ReactNode;
  tone: "primary" | "muted";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums",
        tone === "primary"
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-border bg-muted text-foreground/80",
      )}
    >
      {icon && <span className="opacity-70">{icon}</span>}
      <input
        type="number"
        value={min}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10), max)}
        className="w-10 bg-transparent text-right outline-none"
      />
      <span className="opacity-60">–</span>
      <input
        type="number"
        value={max}
        onChange={(e) => onChange(min, parseInt(e.target.value || "0", 10))}
        className="w-10 bg-transparent text-left outline-none"
      />
      <span className="text-xs opacity-70">min</span>
    </div>
  );
}

function InfoTile({
  icon,
  title,
  text,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: "primary" | "secondary";
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground",
        )}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function CityIllustration() {
  return (
    <svg
      viewBox="0 0 600 320"
      className="h-full w-full text-primary/25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* skyline */}
      <g opacity="0.7" fill="currentColor">
        <rect x="40" y="170" width="60" height="120" rx="4" opacity="0.4" />
        <rect x="110" y="140" width="50" height="150" rx="4" opacity="0.5" />
        <rect x="170" y="190" width="40" height="100" rx="4" opacity="0.35" />
        <rect x="220" y="120" width="70" height="170" rx="6" opacity="0.55" />
        <rect x="300" y="180" width="50" height="110" rx="4" opacity="0.4" />
        <rect x="360" y="160" width="40" height="130" rx="4" opacity="0.45" />
      </g>
      {/* house */}
      <g transform="translate(420,150)">
        <path d="M0 60 L60 10 L120 60 L120 140 L0 140 Z" fill="currentColor" opacity="0.5" />
        <rect x="48" y="80" width="24" height="60" fill="currentColor" opacity="0.9" />
        <rect x="14" y="80" width="22" height="22" fill="currentColor" opacity="0.7" />
        <rect x="84" y="80" width="22" height="22" fill="currentColor" opacity="0.7" />
      </g>
      {/* pin */}
      <g transform="translate(470,80)">
        <path
          d="M30 0C13.4 0 0 13.4 0 30c0 22.5 30 50 30 50s30-27.5 30-50C60 13.4 46.6 0 30 0z"
          fill="currentColor"
        />
        <circle cx="30" cy="30" r="10" fill="white" />
      </g>
      {/* scooter */}
      <g transform="translate(310,240)" fill="currentColor" opacity="0.85">
        <circle cx="20" cy="40" r="14" />
        <circle cx="20" cy="40" r="6" fill="white" />
        <circle cx="80" cy="40" r="14" />
        <circle cx="80" cy="40" r="6" fill="white" />
        <path d="M15 20 L65 20 L80 40 L20 40 Z" />
        <path d="M60 5 L72 5 L78 22 L66 22 Z" />
      </g>
    </svg>
  );
}
