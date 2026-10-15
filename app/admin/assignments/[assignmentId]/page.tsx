import type { Metadata } from "next";
import { AssignmentEditor } from "@/components/admin/AssignmentEditor";

export const metadata: Metadata = { title: "Assignment" };

// Phase 7 loads the assignment by id; until then the editor shows sample data.
export default function AssignmentEditorPage() {
  return <AssignmentEditor />;
}
