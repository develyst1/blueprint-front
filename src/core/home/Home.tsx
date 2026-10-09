// The projects home (R2, AC-4): one card per project, drawn by that project's theme inside its own Root (unknown
// id → default); the new-project dialog with every theme's live preview. Core-owned layout.
import { retryAction } from "@/app/actions";
import { contentHref, contentId } from "@/core/theme/anchors";
import { defaultTheme } from "@/core/theme/default";
import d from "@/core/theme/default/default.module.css"; // the default shell's skip link look — home has no shell
import { skipToContent } from "@/core/words";
import { getTheme, listThemes } from "@/core/theme/registry";
import { loadHome } from "@/core/model/load";
import { samplePreview } from "@/core/model/samples";
import { StateView } from "@/core/render/ProjectPage";
import { NewProject } from "./NewProject";
import s from "./home.module.css";

export async function Home() {
  // one API call: the list carries partCount, so an empty project's card is built from it (D-025)
  const res = await loadHome();
  if (!res.ok) return <StateView theme={defaultTheme} frame={null} state={{ kind: "unreachable", retry: retryAction }} />;
  const cards = res.vm;

  const options = listThemes().map((t) => {
    const Preview = t.preview ?? defaultTheme.preview!;
    return { id: t.id, name: t.name, preview: <t.Root><Preview sample={samplePreview} /></t.Root> };
  });

  return (
    <>
      <a className={d.skip} href={contentHref}>{skipToContent}</a>
      <main id={contentId} tabIndex={-1} className={s.home}>
        <div className={s.top}>
          <h1>Blueprint</h1>
          <NewProject themes={options} />
        </div>
        <ul className={s.grid}>
          {cards.map((card) => {
            const theme = getTheme(card.project.theme);
            const Card = theme.card ?? defaultTheme.card!;
            return (
              <li key={card.project.id}>
                <theme.Root><Card card={card} /></theme.Root>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
