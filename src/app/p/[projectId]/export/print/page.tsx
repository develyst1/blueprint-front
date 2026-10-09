import { PrintView } from "@/features/export/PrintView";

// /p/<id>/export/print — the page Chrome prints to PDF (REQ-008, SPEC-A-007 § E1). Not linked from the nav.
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <PrintView projectId={projectId} />;
}
