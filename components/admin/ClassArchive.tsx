"use client";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useNow } from "@/lib/useNow";
import { useGroup } from "./GroupContext";
export function ClassArchive() {
  const { group, selectedClass } = useGroup();
  const now = useNow();
  const curriculum = useQuery(api.adminCurriculum.overview, { group });
  const roster = useQuery(api.adminStudents.roster, { group, now });
  const [tab, setTab] = useState("curriculum");
  return <main className="flex flex-col gap-4 px-7 pb-10">
    <h1 className="text-4xl font-extrabold">{selectedClass?.name} · {selectedClass?.year}</h1>
    <nav aria-label="Archive sections" className="flex gap-3"><button className="rounded-xl border border-bd px-4 py-2" aria-pressed={tab === "curriculum"} onClick={() => setTab("curriculum")}>Lessons</button><button className="rounded-xl border border-bd px-4 py-2" aria-pressed={tab === "students"} onClick={() => setTab("students")}>Students ({roster?.students.length ?? "…"})</button></nav>
    {tab === "curriculum" ? curriculum?.days.map(day => <section key={day._id} className="rounded-2xl bg-sf p-5"><h2 className="text-xl font-bold">{day.order}. {day.topic}</h2><p className="text-sm text-ink3">{day.schedule ? new Intl.DateTimeFormat("en-US", { timeZone: curriculum.timeZone, dateStyle: "medium", timeStyle: "short" }).format(day.schedule.lessonAt) : "Unscheduled"}</p>{day.slidesUrl && <a href={day.slidesUrl} target="_blank" rel="noreferrer">Open slides</a>}{day.assignments.map(a => <ArchivedAssignment key={a._id} id={a._id} title={a.title} />)}</section>) : <div className="rounded-2xl bg-sf p-5">{roster?.students.map(s => <p key={s._id} className="border-b border-ln py-2">{s.firstName} {s.lastName} · Student since {s.sinceYear}</p>)}</div>}
    {tab === "curriculum" && curriculum?.days.length === 0 && <p>No lessons were added to this class.</p>}
  </main>;
}
function ArchivedAssignment({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const data = useQuery(api.adminAssignments.get, open ? { assignmentId: id } : "skip");
  return <div className="mt-3 border-t border-ln pt-3"><button className="font-bold underline" aria-expanded={open} onClick={() => setOpen(!open)}>{title}</button>{open && data && <div className="mt-2 whitespace-pre-wrap text-sm"><p>{data.revision?.summary}</p><p>{data.revision?.instructions}</p>{data.revision?.starterFiles.map(f => <pre key={f.name} className="mt-3 overflow-auto rounded-xl bg-bg p-3">{f.name}{"\n"}{f.content}</pre>)}</div>}</div>;
}
