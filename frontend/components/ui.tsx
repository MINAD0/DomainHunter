import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export function PageTitle({
  title,
  eyebrow,
  actions
}: {
  title: string;
  eyebrow: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy sm:text-3xl">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white shadow-soft ${className}`}
    >
      {children}
    </section>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring min-h-11 w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm";

export const buttonClass =
  "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export function StatusMessage({
  type,
  children
}: {
  type: "success" | "error" | "loading";
  children: React.ReactNode;
}) {
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? XCircle : Loader2;
  const color =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : type === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-blue-200 bg-blue-50 text-blue-800";
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${color}`}>
      <Icon className={`h-4 w-4 ${type === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function AvailableBadge() {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full bg-emerald-100 px-2.5 text-xs font-semibold text-emerald-800">
      AVAILABLE
    </span>
  );
}
