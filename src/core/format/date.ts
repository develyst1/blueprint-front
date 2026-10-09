// The one place a date becomes words (PM D-006): Thai, Buddhist year, Bangkok time — "9 ต.ค. 2569".
// Builders fill ProjectHeadVM.createdLabel and HistoryEntryVM.atLabel with it; themes never format dates.
const thaiDate = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

export function formatThaiDate(iso: string): string {
  return thaiDate.format(new Date(iso));
}
