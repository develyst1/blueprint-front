import { redirect } from "next/navigation";
import { href } from "@/core/model/build/common";

// /p/<id> → the project's overview.
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(href(projectId, "overview"));
}
