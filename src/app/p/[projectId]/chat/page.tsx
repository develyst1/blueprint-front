import { ChatScreen } from "@/features/chat/ChatScreen";

// /p/<id>/chat — the chat page (REQ-004, SPEC-A-006). A static segment, so it wins over [page].
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ q?: string | string[] }> }) {
  const [{ projectId }, search] = await Promise.all([params, searchParams]);
  return <ChatScreen projectId={projectId} focus={one(search.q) ?? null} />;
}
