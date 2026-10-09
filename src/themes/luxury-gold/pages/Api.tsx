// API — one card per endpoint: method chip, path in mono, title (required), stuck seal. Request and responses as
// formatted JSON behind words.showMore under their headings (words.apiDetail, v1.8), each <pre> scrolling inside itself. Reads / writes are the data parts it touches,
// as links under their group words (words.apiGroup, D-010); a stuck API shows its stuck words on screen (v1.7).
import { Chip } from "@heroui/react";
import type { ApisVM, RequiredItem } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { apiDetail, apiGroup, emptyList, pageLabel } from "@/core/words";
import { MoreDisclosure } from "../client/MoreDisclosure";
import { Seal } from "../primitives/Seal";
import { StuckLines } from "../primitives/StuckLines";

const json = (x: unknown) => JSON.stringify(x, null, 2);

// A drawn cue beside each group word: an arrow into the endpoint for what it reads, out of it for what it writes.
// Hidden from screen readers — the group word says it.
function IoMark({ dir }: { dir: "in" | "out" }) {
  return (
    <svg className="lg-io-mark" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="9" y="3" width="7" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {dir === "in" ? (
        <path d="M1 9h7M5 6l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <path d="M8 9H1M4 6 1 9l3 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      )}
    </svg>
  );
}

export function Api({ vm, required }: { vm: ApisVM; required: RequiredItem[] }) {
  return (
    <div className="lg-page">
      <h1 className="lg-page-title">{pageLabel.api}</h1>
      {/* an empty list says so (D-015), never a blank page */}
      {vm.apis.length === 0 && (
        <div className="lg-plaque lg-empty-list">
          <p>{emptyList.api}</p>
        </div>
      )}
      {vm.apis.length > 0 && (
        <ul className="lg-cards">
          {vm.apis.map((a) => {
            const item = findRequired(required, requiredId.api(a.key));
            const hasDetail = a.request != null || a.responses.length > 0;
            return (
              <li key={a.key} className="lg-item-card" data-stuck={a.stuck || undefined}>
                <div className="lg-item-head">
                  <Chip size="sm" variant="soft" className="lg-method">
                    {a.method}
                  </Chip>
                  <code className="lg-path">{a.path}</code>
                  {a.stuck && <Seal size={22} />}
                </div>
                <h2 className="lg-item-title" {...(item ? requiredProps(item) : {})}>
                  {a.title}
                </h2>
                {a.stuck && <StuckLines wordings={a.stuckWordings} />}
                {(a.reads.length > 0 || a.writes.length > 0) && (
                  <div className="lg-api-io">
                    {a.reads.length > 0 && (
                      <div className="lg-io-row" data-io="reads">
                        <IoMark dir="in" />
                        <span className="lg-group-title">{apiGroup.reads}</span>
                        <ul className="lg-chip-links">
                          {a.reads.map((r) => (
                            <li key={r.key}>
                              <a className="lg-chip-link" href={r.href}>
                                {r.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {a.writes.length > 0 && (
                      <div className="lg-io-row" data-io="writes">
                        <IoMark dir="out" />
                        <span className="lg-group-title">{apiGroup.writes}</span>
                        <ul className="lg-chip-links">
                          {a.writes.map((w) => (
                            <li key={w.key}>
                              <a className="lg-chip-link" href={w.href}>
                                {w.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {hasDetail && (
                  <MoreDisclosure>
                    {a.request != null && (
                      <>
                        <h3 className="lg-group-title">{apiDetail.request}</h3>
                        <pre className="lg-json">{json(a.request)}</pre>
                      </>
                    )}
                    {a.responses.length > 0 && <h3 className="lg-group-title">{apiDetail.response}</h3>}
                    {a.responses.map((r) => (
                      <div key={r.status} className="lg-response">
                        <span className="lg-response-status">{r.status}</span>
                        {r.note && <span className="lg-detail-note">{r.note}</span>}
                        {r.body != null && <pre className="lg-json">{json(r.body)}</pre>}
                      </div>
                    ))}
                  </MoreDisclosure>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
