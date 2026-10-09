import { notFound } from "next/navigation";
import { ProjectPage } from "@/core/render/ProjectPage";
import { pageFromUrl } from "@/core/render/pages";

export const dynamic = "force-dynamic";

type Search = { work?: string | string[]; step?: string | string[]; part?: string | string[] };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ params, searchParams }: { params: Promise<{ projectId: string; page: string }>; searchParams: Promise<Search> }) {
  const [{ projectId, page: segment }, search] = await Promise.all([params, searchParams]);
  const page = pageFromUrl(segment);
  if (!page) notFound(); // an unknown page is a 404, never a 500
  return <ProjectPage projectId={projectId} page={page} query={{ work: one(search.work), step: one(search.step), part: one(search.part) }} />;
}
