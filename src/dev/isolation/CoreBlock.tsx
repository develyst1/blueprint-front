import s from "../../app/core.module.css";
import { SAMPLE } from "./sample";

// Plain elements styled only by core.module.css — the test checks no library changes them.
export function CoreBlock() {
  return (
    <section className={s.core} data-core-block="">
      <h1 data-probe="h1">{SAMPLE.heading}</h1>
      <p data-probe="p">{SAMPLE.text}</p>
      <a data-probe="a" href="#">{SAMPLE.link}</a>
      <button data-probe="button" type="button">{SAMPLE.button}</button>
      <input data-probe="input" placeholder={SAMPLE.input} />
      <ul data-probe="ul">
        {SAMPLE.rows.map((r) => <li key={r}>{r}</li>)}
      </ul>
      <table data-probe="table">
        <thead><tr><th>{SAMPLE.column}</th></tr></thead>
        <tbody>{SAMPLE.rows.map((r) => <tr key={r}><td>{r}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
