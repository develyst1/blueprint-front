// Other parts as link chips — each opens that part on ใยโหนด (hrefs from the view model, v1.7).
import s from "./pages.module.css";

export function Refs({ refs }: { refs: { key: string; title: string; href: string }[] }) {
  return (
    <span className={s.tags}>
      {refs.map((r) => <a key={r.key} href={r.href} className={s.linkTag}>{r.title}</a>)}
    </span>
  );
}
