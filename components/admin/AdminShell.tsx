"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSignOut } from "@/components/auth/RequireRole";
import { useAdminViewer } from "@/components/auth/ViewerContext";
import { Pill } from "@/components/ui/Pill";
import { ProfileMenu } from "@/components/ui/ProfileMenu";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/cn";
import { ClassArchive } from "./ClassArchive";
import { GroupProvider, useGroup } from "./GroupContext";

import { UnsavedWorkProvider, useConfirmLeave } from "./UnsavedWork";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <UnsavedWorkProvider><GroupProvider>
      <div className="flex min-h-full flex-col bg-bg">
        <AdminHeader />
        <ClassContent>{children}</ClassContent>
      </div>
    </GroupProvider></UnsavedWorkProvider>
  );
}

function badgeText(count: number) {
  return count >= 100 ? "99+" : String(count);
}

function AdminHeader() {
  const confirmLeave = useConfirmLeave();
  const viewer = useAdminViewer();
  const signOut = useSignOut();
  const pathname = usePathname();
  const { group, setGroup, classes } = useGroup();
  const badges = useQuery(api.adminNav.badges, { group });

  const links: Array<{ href: string; label: string; badge?: ReactNode }> = [
    { href: "/admin/students", label: "Students" },
    { href: "/admin/curriculum", label: "Curriculum" },
    {
      href: "/admin/assistance",
      label: "Classroom",
      badge: badges && badges.openHelp > 0 && (
        <Pill tone="amberSolid" className="h-5 px-[7px] font-extrabold">
          <span className="sr-only">, </span>
          {badgeText(badges.openHelp)}
          <span className="sr-only"> waiting for help</span>
        </Pill>
      ),
    },
    {
      href: "/admin/review",
      label: "Review",
      badge: badges && badges.unreviewed > 0 && (
        <Pill className="h-5 px-[7px] font-extrabold">
          <span className="sr-only">, </span>
          {badgeText(badges.unreviewed)}
          <span className="sr-only"> waiting for review</span>
        </Pill>
      ),
    },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/history", label: "History" },
  ];

  return (
    <header className="flex h-16 flex-none items-center gap-1 px-6">
      <span className="mr-4 flex items-center gap-2">
        <Link
          href="/admin/students"
          onNavigate={e => { if (!confirmLeave()) e.preventDefault(); }}
          className="text-[21px] leading-none font-extrabold tracking-[-.03em] text-ink no-underline"
        >
          CodeCS
        </Link>
        <Pill tone="ink" shape="tag" className="text-[11px] font-extrabold">
          ADMIN
        </Pill>
      </span>
      <nav aria-label="Admin" className="flex gap-0.5">
        {links.map((link) => {
          const current = pathname === link.href || pathname.startsWith(`${link.href}/`)
            || (link.href === "/admin/curriculum" && (pathname === "/admin/assignments" || pathname.startsWith("/admin/assignments/")));
          return (
            <Link
              key={link.href}
              href={link.href}
              onNavigate={e => { if (!confirmLeave()) e.preventDefault(); }}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-[7px] rounded-[10px] px-[11px] text-[14.5px] no-underline",
                current
                  ? "bg-mint-s font-bold text-mint-i"
                  : "font-semibold text-ink2 hover:bg-sf hover:text-ink",
              )}
            >
              {link.label}
              {link.badge}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-2.5">
        <select aria-label="Class" className="h-9 max-w-60 rounded-xl border border-bd bg-sf px-3 text-sm font-bold" value={classes.some(c => c.group === group && c.status !== "archived") ? group : ""} onChange={e => setGroup(e.target.value)}>
          <option value="" disabled>Select class</option>
          {classes.filter(c => c.status !== "archived").map(c => <option key={c._id} value={c.group}>{c.name} · {c.year}{c.status === "upcoming" ? " · Upcoming" : ""}</option>)}
        </select>
        <ProfileMenu name={viewer.name} color={viewer.avatarColor} onSignOut={() => { if (confirmLeave()) void signOut(); }} />
      </div>
    </header>
  );
}


function ClassContent({ children }: { children: ReactNode }) {
  const { group, selectedClass } = useGroup();
  const pathname = usePathname();
  const archived = selectedClass?.status === "archived" && pathname !== "/admin/settings";
  return <div key={group} className="flex flex-1 flex-col">
    {archived && <p role="status" className="mx-7 rounded-xl bg-amb-s p-3 font-bold">{selectedClass.name} · {selectedClass.year} · Archived — read-only. Open Settings to choose another class.</p>}
    {archived ? <ClassArchive /> : children}
  </div>;
}
