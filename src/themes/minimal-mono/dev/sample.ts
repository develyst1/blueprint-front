// Dev only (TASK-A-013): the worked example's six steps, so the foundation can be seen before the core's
// view models exist. Titles copied from blueprint-back/test/fixtures/meeting-room.ts (`steps`, `ends`);
// step 04 is stuck because the fixture's open question Q-001 is `about` it. Deleted when real pages come.
export type SampleStep = { number: string; title: string; ends: boolean; stuck: boolean };

export const SAMPLE_STEPS: SampleStep[] = [
  { number: "01", title: "ค้นหาห้องว่าง", ends: false, stuck: false },
  { number: "02", title: "เลือกห้องและเวลา", ends: false, stuck: false },
  { number: "03", title: "ส่งคำขอจอง", ends: false, stuck: false },
  { number: "04", title: "ผู้ดูแลพิจารณา", ends: false, stuck: true },
  { number: "05", title: "ได้รับการยืนยัน", ends: true, stuck: false },
  { number: "06", title: "แจ้งว่าถูกปฏิเสธ", ends: true, stuck: false },
];

// REQ-002 § "User-facing wording" — the only words the showcase adds.
export const WORDS = {
  stuck: (n: number) => `ติดอยู่ ${n} จุด`,
  ready: "พร้อมสร้าง",
  openQuestion: "ยังมีคำถามที่ยังไม่ได้ตอบ",
} as const;
