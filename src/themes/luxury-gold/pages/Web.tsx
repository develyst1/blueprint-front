// ใยโหนด — a map table (REQ-009, TASK-C-026): the whole web on open, each part a small pill with its kind's shape and its
// name (never hidden: a long name ends in … and shows in full on hover / focus), threads lighter than nodes. The view —
// fit, zoom, pan, the chosen node centred — is the core's `useWebView`, drawn by client/WebView together with the chosen
// part's plaque, so choosing and clearing a node never reloads the page (R7, TASK-C-027). This server page resolves the
// required markers and draws the title and the legend. Required: the stuck parts' titles (by id).
import type { RequiredItem, WebVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { pageLabel, partKind } from "@/core/words";
import { WebView } from "../client/WebView";
import { PartMark } from "../primitives/PartMark";

export function Web({ vm, required }: { vm: WebVM; required: RequiredItem[] }) {
  const L = vm.layout;
  const sel = vm.selected;
  const present = [...new Set(L.nodes.map((n) => n.kind))];
  const titleProps = Object.fromEntries(
    L.nodes.map((n) => {
      const item = findRequired(required, requiredId.part(n.key));
      return [n.key, item ? requiredProps(item) : {}];
    }),
  );
  const head = (
    <>
      <h1 className="lg-page-title">{pageLabel.web}</h1>
      <ul className="lg-legend lg-web-legend">
        {present.map((k) => (
          <li key={k}>
            <PartMark kind={k} />
            {partKind[k]}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    // Stage + plaque only when a part is chosen (the plaque); otherwise the web takes the full width.
    <div className={sel ? "lg-page lg-page-split" : "lg-page"}>
      <WebView head={head} wide={L} tall={vm.tall} selected={sel} allHref={vm.allHref} titleProps={titleProps} />
    </div>
  );
}
