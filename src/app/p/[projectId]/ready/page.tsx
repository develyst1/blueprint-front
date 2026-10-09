import { ReadyScreen } from "@/features/ready/ReadyScreen";

// /p/<id>/ready — screen ④ "พร้อมสร้างหรือยัง" (REQ-007, SPEC-C-002). A static segment, so it wins over [page].
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ReadyScreen projectId={projectId} />;
}
