import type { RequiredItem } from "@/core/theme/contract";
import { requiredProps } from "@/core/theme/required";
import s from "./parts.module.css";

// Required items (TASK-A-017). The contract does not say which item belongs to which piece of a view model, and
// the id format has already changed once (v1 `stuck:Q-001` → v1.1 `stuck:Q-001:open_question`), so ids are never
// built or parsed here. An item is paired with the element that shows the same text — exactly what the check
// verifies (the element's visible text contains item.text). Anything left unpaired is still shown, as a short
// line, so no required item can go missing.
export class RequiredPicker {
  private readonly left: RequiredItem[];

  constructor(required: RequiredItem[]) {
    this.left = [...required];
  }

  /** v1.3: the item with this id (`requiredId.*`), once — spread its props on the element that shows it. */
  takeId(id: string): Record<string, string> {
    const i = this.left.findIndex((item) => item.id === id);
    if (i < 0) return {};
    const [item] = this.left.splice(i, 1);
    return requiredProps(item);
  }

  /** v1.1 interim (TASK-A-017's pages): the first not-yet-used item whose text is `text`. */
  take(text: string): Record<string, string> {
    const i = this.left.findIndex((item) => item.text === text);
    if (i < 0) return {};
    const [item] = this.left.splice(i, 1);
    return requiredProps(item);
  }

  /** Everything no element has claimed. */
  rest(): RequiredItem[] {
    return [...this.left];
  }
}

export function RequiredList({ items }: { items: RequiredItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className={s.requiredList}>
      {items.map((item) => (
        <li key={item.id} {...requiredProps(item)}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}
