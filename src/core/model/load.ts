// One loader per page: the API (through api/load.ts) → the builder → the page's view model, or a state.
// Server-side only — it imports the API client.
import { api } from "@/core/api/client";
import { apiLoad, type ApiResult } from "@/core/api/load";
import type { PageId, PageVMs, ProjectCardVM } from "@/core/theme/contract";
import { confirmedOf, HOME_HREF, works, type ProjectWithSeal } from "./build/common";
import {
  buildApis, buildCard, buildFlowchart, buildHistory, buildOverview, buildScreens, buildSequence, buildStuck, buildWeb,
  buildWorkOrder, defaultStepKey,
} from "./build/pages";
import { realLayouts } from "@/core/layout";
import type {
  ApiFlowchart, ApiHistoryEntry, ApiSequence, ApiSwimlane, Built, Layouts,
} from "./build/types";

/** What a page can be told instead of a view model. The route adds `retry` (a server action) to "unreachable". */
export type LoadState = { kind: "unreachable" } | { kind: "empty"; page: PageId } | { kind: "notFound"; homeHref: string };
export type Loaded<T> = { ok: true; vm: T } | { ok: false; state: LoadState };
export type Query = { work?: string; step?: string; part?: string };

const fail = (state: "unreachable" | "notFound"): { ok: false; state: LoadState } =>
  ({ ok: false, state: state === "notFound" ? { kind: "notFound", homeHref: HOME_HREF } : { kind: "unreachable" } });
const fromBuilt = <T>(b: Built<T>): Loaded<T> => (b.ok ? b : { ok: false, state: b.state });

/** The project, its stuck list, and whether its latest version is confirmed and unchanged (D-031 — the frame's seal).
 *  The versions read failing never fails the page: the seal then just does not claim พร้อมสร้าง. */
export async function loadProjectData(projectId: string): Promise<ApiResult<ProjectWithSeal>> {
  const params = { params: { path: { projectId } } };
  const [spec, stuck, versions] = await Promise.all([
    apiLoad(api.GET("/v1/projects/{projectId}", params)),
    apiLoad(api.GET("/v1/projects/{projectId}/stuck", params)),
    apiLoad(api.GET("/v1/projects/{projectId}/versions", params)),
  ]);
  if (!spec.ok) return spec;
  if (!stuck.ok) return stuck;
  const confirmed = versions.ok && confirmedOf(versions.data);
  return { ok: true, data: { project: spec.data.project, parts: spec.data.parts, links: spec.data.links, stuck: stuck.data.items, confirmed } };
}

function diagram<T>(projectId: string, kind: "flowchart" | "swimlane" | "sequence", key: string) {
  return apiLoad(api.GET("/v1/projects/{projectId}/diagrams/{kind}/{key}", { params: { path: { projectId, kind, key } } })) as Promise<ApiResult<T>>;
}

function history(projectId: string, key: string) {
  return apiLoad(api.GET("/v1/projects/{projectId}/parts/{key}/history", { params: { path: { projectId, key } } })) as Promise<ApiResult<ApiHistoryEntry[]>>;
}

/** The view model of one page of one project. */
export async function loadPage<P extends PageId>(page: P, projectId: string, query: Query = {}, layouts: Layouts = realLayouts): Promise<Loaded<PageVMs[P]>> {
  const res = await loadProjectData(projectId);
  if (!res.ok) return fail(res.state);
  const data = res.data;
  const workKey = (works(data).find((w) => w.key === query.work) ?? works(data)[0])?.key;
  const out = async (): Promise<Loaded<PageVMs[PageId]>> => {
    switch (page) {
      case "overview": return fromBuilt(buildOverview(data));
      case "screens": return fromBuilt(buildScreens(data));
      case "api": return fromBuilt(buildApis(data));
      case "stuck": return fromBuilt(buildStuck(data));
      case "workOrder": {
        if (!workKey) return { ok: false, state: { kind: "empty", page } };
        const d = await diagram<ApiSwimlane>(projectId, "swimlane", workKey);
        return d.ok ? fromBuilt(buildWorkOrder(data, d.data, layouts, workKey)) : fail(d.state);
      }
      case "flowchart": {
        if (!workKey) return { ok: false, state: { kind: "empty", page } };
        const d = await diagram<ApiFlowchart>(projectId, "flowchart", workKey);
        return d.ok ? fromBuilt(buildFlowchart(data, d.data, layouts, workKey)) : fail(d.state);
      }
      case "sequence": {
        const stepKey = defaultStepKey(data, query.step);
        if (!stepKey) return { ok: false, state: { kind: "empty", page } };
        const d = await diagram<ApiSequence>(projectId, "sequence", stepKey);
        return d.ok ? fromBuilt(buildSequence(data, d.data, layouts, stepKey)) : fail(d.state);
      }
      case "web": {
        if (!query.part || !data.parts.some((p) => p.key === query.part)) return fromBuilt(buildWeb(data, layouts));
        const h = await history(projectId, query.part);
        return h.ok ? fromBuilt(buildWeb(data, layouts, query.part, h.data)) : fail(h.state);
      }
      case "history": {
        if (!query.part || !data.parts.some((p) => p.key === query.part)) return fromBuilt(buildHistory(data));
        const h = await history(projectId, query.part);
        return h.ok ? fromBuilt(buildHistory(data, query.part, h.data)) : fail(h.state);
      }
    }
    return { ok: false, state: { kind: "notFound", homeHref: HOME_HREF } };
  };
  return (await out()) as Loaded<PageVMs[P]>;
}

/** The projects home: one card per project, in the API's order. */
export async function loadHome(): Promise<Loaded<ProjectCardVM[]>> {
  const res = await apiLoad(api.GET("/v1/projects"));
  if (!res.ok) return fail(res.state);
  return { ok: true, vm: res.data.map(buildCard) };
}
