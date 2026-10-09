// หน้าจอ — one card per screen: its title (required), its stuck seal with the reason on screen, and the parts it shows
// as links. The field / action / state lists sit behind words.showMore under their group words (D-010).
// A null label or note shows the name alone.
import type { RequiredItem, ScreensVM } from "@/core/theme/contract";
import { findRequired, requiredId, requiredProps } from "@/core/theme/required";
import { emptyList, pageLabel, screenGroup } from "@/core/words";
import { MoreDisclosure } from "../client/MoreDisclosure";
import { Seal } from "../primitives/Seal";
import { StuckLines } from "../primitives/StuckLines";

export function Screens({ vm, required }: { vm: ScreensVM; required: RequiredItem[] }) {
  return (
    <div className="lg-page">
      <h1 className="lg-page-title">{pageLabel.screens}</h1>
      {/* an empty list says so (D-015), never a blank page */}
      {vm.screens.length === 0 && (
        <div className="lg-plaque lg-empty-list">
          <p>{emptyList.screens}</p>
        </div>
      )}
      {vm.screens.length > 0 && (
        <ul className="lg-cards">
          {vm.screens.map((s) => {
            const item = findRequired(required, requiredId.screen(s.key));
            const hasDetail = s.fields.length + s.actions.length + s.states.length > 0;
            return (
              <li key={s.key} className="lg-item-card" data-stuck={s.stuck || undefined}>
                <div className="lg-item-head">
                  <h2 className="lg-item-title" {...(item ? requiredProps(item) : {})}>
                    {s.title}
                  </h2>
                  {s.stuck && <Seal size={22} />}
                </div>
                {s.stuck && <StuckLines wordings={s.stuckWordings} />}
                {s.shows.length > 0 && (
                  <ul className="lg-chip-links">
                    {s.shows.map((p) => (
                      <li key={p.key}>
                        <a className="lg-chip-link" href={p.href}>
                          {p.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {hasDetail && (
                  <MoreDisclosure>
                    <div className="lg-screen-lists">
                      {s.fields.length > 0 && (
                        <section>
                          <h3 className="lg-group-title">{screenGroup.fields}</h3>
                          <ul className="lg-detail-list">
                            {s.fields.map((f) => (
                              <li key={f.name}>
                                <span className="lg-detail-name">{f.label ?? f.name}</span>
                                {f.type && <code className="lg-detail-type">{f.type}</code>}
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                      {s.actions.length > 0 && (
                        <section>
                          <h3 className="lg-group-title">{screenGroup.actions}</h3>
                          <ul className="lg-detail-list">
                            {s.actions.map((a) => (
                              <li key={a.name}>
                                <span className="lg-detail-name">{a.label ?? a.name}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                      {s.states.length > 0 && (
                        <section>
                          <h3 className="lg-group-title">{screenGroup.states}</h3>
                          <ul className="lg-detail-list">
                            {s.states.map((st) => (
                              <li key={st.name}>
                                <span className="lg-detail-name">{st.name}</span>
                                {st.note && <span className="lg-detail-note">{st.note}</span>}
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </div>
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
