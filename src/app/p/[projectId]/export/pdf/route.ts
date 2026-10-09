// GET /p/<id>/export/pdf — the whole project's spec as one PDF (REQ-008, SPEC-A-007 § E2). The local Chrome prints
// this app's own print page; the answer is the complete file or an error with no body — never a partial PDF (R7).
import { api } from "@/core/api/client";
import { apiLoad } from "@/core/api/load";
import { contentDisposition, pdfFileName, PdfFailed, renderPdf } from "@/features/export/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The page Chrome prints (TASK-A-045's print view).
const printPath = (projectId: string) => `/p/${encodeURIComponent(projectId)}/export/print`;
const bangkokToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const empty = (status: number) => new Response(null, { status });

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const path = { params: { path: { projectId } } };
  const [project, feed] = await Promise.all([
    apiLoad(api.GET("/v1/projects/{projectId}", path)),
    apiLoad(api.GET("/v1/projects/{projectId}/versions", path)),
  ]);
  if (!project.ok) return empty(project.state === "notFound" ? 404 : 503);
  if (!feed.ok) return empty(feed.state === "notFound" ? 404 : 503);

  const started = Date.now();
  try {
    // BLUEPRINT_PDF_CHROME_CHANNEL exists only so a test can force the launch to fail (TASK-A-046 DoD 4); unset = "chrome".
    const { pdf, requests } = await renderPdf(new URL(printPath(projectId), req.url).toString(),
      { channel: process.env.BLUEPRINT_PDF_CHROME_CHANNEL || undefined });
    // codes and counts only — never a URL, a name or spec text
    console.log(`[pdf] 200 allowed=${requests.allowed} aborted=${requests.aborted} ms=${Date.now() - started}`);
    const name = pdfFileName(project.data.project.name, feed.data.latest?.version ?? null, bangkokToday());
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: { "content-type": "application/pdf", "content-disposition": contentDisposition(name), "cache-control": "no-store" },
    });
  } catch (e) {
    console.error(`[pdf] 500 reason=${e instanceof PdfFailed ? e.reason : "error"} ms=${Date.now() - started}`);
    return empty(500);
  }
}
