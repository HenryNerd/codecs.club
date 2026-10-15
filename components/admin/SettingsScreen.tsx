"use client";

import { useQuery } from "convex/react";
import { Panel } from "@/components/ui/Panel";
import { LoadingState } from "@/components/ui/States";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { api } from "@/convex/_generated/api";
import { formatYear, timeZoneLabel } from "@/lib/format";

/** Approved behavior settings. Read-only until editing lands (Phase 10). */
export function SettingsScreen() {
  const settings = useQuery(api.adminSettings.get);
  return (
    <main className="flex max-w-3xl flex-col gap-4 px-7 pt-4 pb-10">
      <h1 className="m-0 text-[46px] leading-[1.04] font-extrabold tracking-[-.035em]">Settings</h1>
      {settings === undefined ? (
        <LoadingState label="Loading settings…" />
      ) : (
        <Panel tone="surface" className="flex flex-col gap-3 p-5" aria-label="Turn-in timing">
          <h2 className="m-0 text-[22px] font-bold tracking-[-.02em]">Turn-in timing</h2>
          <dl className="m-0 grid grid-cols-[200px_1fr] gap-x-4 gap-y-2 text-[15px]">
            <dt className="font-bold">Current school year</dt>
            <dd className="m-0">{formatYear(settings.currentYear)}</dd>
            <dt className="font-bold">Turn-in window</dt>
            <dd className="m-0">{settings.turnInDays} days after each lesson</dd>
            <dt className="font-bold">Closes at</dt>
            <dd className="m-0">
              {settings.closeTime} on the last day ({timeZoneLabel(settings.timeZone)})
            </dd>
          </dl>
          <p className="m-0 text-sm text-ink3">
            Moving a lesson date moves its turn-in close. Editing these values from the dashboard
            arrives in Phase 10.
          </p>
        </Panel>
      )}
      <Panel tone="surface" className="flex items-center gap-4 p-5" aria-label="Appearance">
        <div className="flex-1">
          <h2 className="m-0 text-[22px] font-bold tracking-[-.02em]">Appearance</h2>
          <p className="m-0 text-sm text-ink3">Saved on this device only.</p>
        </div>
        <ThemeToggle />
      </Panel>
    </main>
  );
}
