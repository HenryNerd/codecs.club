"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSignOut } from "@/components/auth/RequireRole";
import { useAdminViewer } from "@/components/auth/ViewerContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/cn";
import { GroupProvider, useGroup } from "./GroupContext";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <GroupProvider>
      <div className="flex min-h-full flex-col bg-bg">
        <AdminHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </GroupProvider>
  );
}

function badgeText(count: number) {
  return count >= 100 ? "99+" : String(count);
}

function AdminHeader() {
  const viewer = useAdminViewer();
  const signOut = useSignOut();
  const pathname = usePathname();
  const { group, setGroup } = useGroup();
  const badges = useQuery(api.adminNav.badges);

  const links: Array<{ href: string; label: string; badge?: ReactNode }> = [
    { href: "/admin/students", label: "Students" },
    { href: "/admin/curriculum", label: "Curriculum" },
    { href: "/admin/assignments", label: "Assignments" },
    {
      href: "/admin/assistance",
      label: "Assistance",
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
          const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
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
        <ThemeToggle className="hidden 2xl:inline-flex" />
        <SegmentedControl
          label="Group"
          className="bg-sf"
          options={[
            { value: "basic", label: "basic" },
            { value: "advanced", label: "advanced" },
          ]}
          value={group}
          onChange={setGroup}
        />
        <Avatar name={viewer.name} tone="violet" size={32} className="text-xs" />
        <b className="text-sm font-bold whitespace-nowrap">{viewer.name}</b>
        <Button variant="ghost" size="sm" className="h-[34px]" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
