import type { Metadata } from "next";
import { AssignmentEditor } from "@/components/admin/AssignmentEditor";

export const metadata: Metadata = { title: "Assignments" };

export default function AssignmentsPage() {
  return <AssignmentEditor />;
}
