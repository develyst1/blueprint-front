// Screen ④'s words — REQ-007 § User-facing wording, verbatim, one constant per row (lines 40–53). Never typed elsewhere:
// pages and the loader take them from here. SA-B's ask 1 re-exports them from @/core/words later.
export const readyPage = "พร้อมสร้างหรือยัง";
export const quizHeading = "ทดสอบความเข้าใจ";
export const quizHint = "ถามเรื่องในโปรเจกต์นี้ 5–10 ข้อ แล้วบอกว่าบอทตอบถูกหรือผิด";
export const markRight = "ถูก";
export const markWrong = "ผิด";
export const wrongNote = "ผิดตรงไหน (ไม่บังคับ)";
export const notInSpec = "spec นี้ยังไม่มีคำตอบเรื่องนี้";
export const score = (n: number, m: number): string => `ได้ ${n}% จาก ${m} ข้อ`;
export const confirm = "ยืนยัน 100%";
export const reasons = {
  stuck: (n: number): string => `ยังติดอยู่ ${n} จุด`,
  noQuiz: "ยังไม่ได้ทดสอบความเข้าใจ",
  notFull: "คะแนนยังไม่ถึง 100%",
  stale: "spec เปลี่ยนหลังทดสอบ ต้องทดสอบใหม่",
  tooFew: "ต้องตอบอย่างน้อย 5 ข้อ",
} as const;
export const confirmed = (n: number, date: string): string => `ยืนยันแล้ว เวอร์ชัน ${n} · ${date}`;
export const changedSince = (n: number): string => `spec เปลี่ยนหลังเวอร์ชัน ${n}`;
export const build = "ส่งไปสร้างที่ CAW";
export const buildNotReady = "CAW ยังไม่พร้อม";
// added 2026-10-09 (SPEC-C-002 Q1, REQ-007 lines 50–53)
export const startQuiz = "เริ่มทดสอบ";
export const restartQuiz = "เริ่มทดสอบใหม่";
export const ask = "ถาม";
export const partsUsed = "ตอบจากส่วนเหล่านี้";
export const scoreEarly = (m: number): string => `ตอบแล้ว ${m} ข้อ · ต้องอย่างน้อย 5 ข้อ`;
// added 2026-10-09 (TASK-C-011 Q4, REQ-007 line 54) — the same text as the chat's, as screen ④'s own row
export const botFailed = "บอทตอบไม่ได้ตอนนี้";
export const retry = "ลองใหม่";
