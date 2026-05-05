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
    <div className="mb-5 flex min-w-0 max-w-full flex-col gap-3 overflow-hidden sm:mb-6 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-full">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue sm:text-xs">
          {eyebrow}
        </p>
        <h1 className="mt-1 max-w-full break-words text-[1.7rem] font-semibold leading-tight text-navy sm:text-[2.05rem] lg:text-[2.35rem]">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
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
      className={`w-full min-w-0 max-w-[calc(100vw-2rem)] rounded-md border border-cyan-900/10 bg-white/95 shadow-soft sm:max-w-full ${className}`}
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
    <label className="block min-w-0 max-w-full">
      <span className="mb-1.5 block text-[13px] font-semibold text-slate-700 sm:text-sm">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring block min-h-11 w-full min-w-0 max-w-full rounded-md border border-cyan-900/15 bg-white px-3 text-[15px] text-slate-950 shadow-sm transition hover:border-blue/40 sm:text-sm";

export const buttonClass =
  "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";

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
      ? "border-accent/30 bg-accent/10 text-emerald-900"
      : type === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-blue/25 bg-blue/10 text-sky-900";
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] sm:text-sm ${color}`}>
      <Icon className={`h-4 w-4 ${type === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function AvailableBadge() {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-accent/35 bg-accent/12 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-900 sm:text-xs">
      AVAILABLE
    </span>
  );
}
