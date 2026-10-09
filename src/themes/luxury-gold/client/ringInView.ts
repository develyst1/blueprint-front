// Keep a focused link's whole focus ring (3 px outline + 2 px offset) inside its scrolling list (REVIEW-A-002 row 3).
// Chrome does not scroll a partly visible element on focus, and when it does scroll it stops at the edge, so the ring
// was cut. Moves the list's own scrollLeft / scrollTop only — never scrollIntoView (TASK-C-006 lesson).
const RING = 5;

export function keepRingInView(box: HTMLElement, el: HTMLElement) {
  const b = box.getBoundingClientRect(), e = el.getBoundingClientRect();
  const left = b.left + box.clientLeft, right = left + box.clientWidth;
  const top = b.top + box.clientTop, bottom = top + box.clientHeight;
  if (e.left - RING < left) box.scrollLeft -= left - (e.left - RING);
  else if (e.right + RING > right) box.scrollLeft += e.right + RING - right;
  if (e.top - RING < top) box.scrollTop -= top - (e.top - RING);
  else if (e.bottom + RING > bottom) box.scrollTop += e.bottom + RING - bottom;
}
