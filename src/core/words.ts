// Every user-facing word in Blueprint v1 — REQ-002 § "User-facing wording", verbatim, one constant per row.
// Themes import these; a theme never writes its own copy. A new word starts as a row in REQ-002, never here.
import type { FlowBreakReason, NavItemVM, ParticipantKind, PartKind, StuckKind } from "./theme/contract";

// Page names — the 9 spec pages (REQ-002), the chat (REQ-004 "Chat entry in the page strip") and screen ④ (REQ-007 "Page name")
export const pageLabel: Record<NavItemVM["page"], string> = {
  chat: "แชต",
  overview: "ภาพรวม",
  workOrder: "ลำดับงาน",
  flowchart: "ผังการทำงาน",
  sequence: "ลำดับการโต้ตอบ",
  screens: "หน้าจอ",
  api: "API",
  web: "ใยโหนด",
  stuck: "ติดอยู่ตรงไหน",
  history: "ประวัติ",
  ready: "พร้อมสร้างหรือยัง",
};

// The frame's readiness seal (REQ-007 "Frame readiness seal", D-031): stuck · nothing stuck but not confirmed ·
// confirmed and unchanged (the only พร้อมสร้าง) — empty is emptyProject below
export const readinessStuck = (n: number): string => `ยังติดอยู่ ${n} จุด`;
export const readinessClear = "ไม่มีเรื่องติด";
export const readinessClean = "พร้อมสร้าง";

// New project button · New project steps
export const newProject = "+ โปรเจกต์ใหม่";
export const newProjectSteps: [string, string, string] = ["ตั้งชื่อ", "เลือกธีม", "สร้าง"];

// Stuck rows. `flow_break` has no row of its own in REQ-002: a flow break is shown by its reason
// (StuckItemVM.reason), so the key is left out rather than given an invented word — TASK-B-003 Q1.
export const stuck: Record<Exclude<StuckKind, "flow_break"> | FlowBreakReason, string> = {
  open_question: "ยังมีคำถามที่ยังไม่ได้ตอบ",
  unlinked_part: "ส่วนนี้ยังไม่ได้เชื่อมกับอะไรเลย",
  unreachable: "ไปถึงขั้นนี้จากขั้นแรกไม่ได้",
  dead_end: "ขั้นนี้ไม่ไปต่อ และยังไม่ได้บอกว่าเป็นขั้นสุดท้าย",
  unlabelled_branch: "ทางแยกนี้ยังไม่ได้บอกเงื่อนไข",
  no_interactions: "ยังไม่รู้ว่าใครทำอะไรในขั้นนี้",
  incomplete_interaction: "ยังไม่รู้ว่าใครเป็นคนส่ง หรือใครเป็นคนรับ",
  unconfirmed_guess: "บอทเดาไว้ ยังไม่ได้รับการยืนยัน",
  screen_without_api: "หน้าจอนี้แสดงข้อมูล แต่ยังไม่รู้ว่าดึงมาจาก API ไหน",
};

// Show long text
export const showMore = "ดูรายละเอียด";

// A step where the work ends — beside the end shape, and read by screen readers
export const stepEnds = "จบงาน";

// Skip link, first thing in every theme's shell, visible on keyboard focus
export const skipToContent = "ข้ามไปที่เนื้อหา";

// History entry cause
export const historyCause = {
  operator: "โดยคุณ",
  message: "จากแชต",
  source: "จากเอกสาร",
  undo: "ย้อนการแก้ไข",
} as const;

// Where a part came from — the origin stamp, on its detail panel (D-008)
export const stamp: Record<string, string> = {
  operator: "ยืนยันโดยเจ้าของโปรเจกต์",
  "operator-delegated": "เจ้าของโปรเจกต์ให้ตัดสินแทน",
  "team-proposed": "บอทเสนอ ยังไม่ยืนยัน",
  "customer-asked": "ลูกค้าขอ",
  "customer-validated": "ลูกค้ายืนยันแล้ว",
};

// Group headings inside a screen's / an API's details (D-010)
export const screenGroup = { fields: "ช่องข้อมูล", actions: "ปุ่มและการกระทำ", states: "สถานะของหน้า" } as const;
export const apiGroup = { reads: "ข้อมูลที่อ่าน", writes: "ข้อมูลที่เขียน" } as const;
// An API's request and responses, on the API page (D-014, SPEC-B-001 v1.8)
export const apiDetail = { request: "ข้อมูลที่ส่งเข้า", response: "ผลที่ได้กลับ" } as const;

// ประวัติ before a part is chosen (D-014, SPEC-B-001 v1.8)
export const historyPick = "เลือกส่วนที่ต้องการดูประวัติ";

// What a change did, on ประวัติ — the API's op → its word; any other op shows nothing (D-010, SPEC-B-001 v1.7 mapping)
export const historyWhat: Record<string, string> = {
  add: "เพิ่ม",
  update: "แก้",
  remove: "ลบ",
  restore: "กู้คืน",
  link_add: "เชื่อม",
  link_remove: "เลิกเชื่อม",
  link_update: "แก้การเชื่อม",
};

// A part's links on its detail panel — read from this part outward (out) / inward (in) (D-009)
export const linkKind: Record<string, { out: string; in: string }> = {
  has_step: { out: "มีขั้นตอน", in: "เป็นขั้นตอนของ" },
  next: { out: "ไปต่อที่", in: "มาจาก" },
  has_interaction: { out: "มีการโต้ตอบ", in: "อยู่ในขั้นตอน" },
  from: { out: "ส่งโดย", in: "เป็นผู้ส่งใน" },
  to: { out: "ส่งถึง", in: "เป็นผู้รับใน" },
  carries: { out: "ส่งข้อมูล", in: "ถูกส่งใน" },
  reads: { out: "อ่าน", in: "ถูกอ่านโดย" },
  writes: { out: "เขียน", in: "ถูกเขียนโดย" },
  shows: { out: "แสดง", in: "แสดงอยู่ใน" },
  covers: { out: "ใช้กับ", in: "ถูกกำหนดโดย" },
  about: { out: "ถามเรื่อง", in: "มีคำถาม" },
};

// API down
export const apiDown = "ต่อระบบไม่ได้ตอนนี้";
export const retry = "ลองใหม่";

// Empty project — also its readiness: an empty project is never พร้อมสร้าง (D-015)
export const emptyProject = "ยังไม่มีข้อมูลในโปรเจกต์นี้";
// …and where it starts: the link to the chat beside it (D-032, REQ-007 l.55)
export const startInChat = "เริ่มที่แชต";

// A list page with nothing in it, every theme — "ยังไม่มี{…}ในโปรเจกต์นี้" with the page's own noun (D-015).
// The spaces around "API" are SA-B's spelling in TASK-B-010; the REQ-002 row gives no spacing (TASK-B-010 § Questions).
export const emptyList = {
  screens: "ยังไม่มีหน้าจอในโปรเจกต์นี้",
  api: "ยังไม่มี API ในโปรเจกต์นี้",
  data: "ยังไม่มีข้อมูลในโปรเจกต์นี้",
  decision: "ยังไม่มีการตัดสินใจในโปรเจกต์นี้",
  question: "ยังไม่มีคำถามในโปรเจกต์นี้",
} as const;

// Name of the strip that lists the spec pages — the nav landmark's accessible name in every shell (D-018)
export const pageNav = "หน้าใน spec";

// Project not found
export const notFound = "ไม่พบโปรเจกต์นี้";
export const backHome = "กลับหน้าโปรเจกต์";

// A decision's three parts
export const decisionPart = { rule: "กฎ", cases: "กรณี", open: "ยังไม่ได้ตัดสิน" } as const;

// Participant kinds, legend
export const participantKind: Record<ParticipantKind, string> = {
  role: "คน",
  screen: "หน้าจอ",
  api: "API",
  system: "ระบบ",
};

// Part kinds, ใยโหนด legend + detail panel
export const partKind: Record<PartKind, string> = {
  work: "งาน",
  step: "ขั้นตอน",
  interaction: "การโต้ตอบ",
  role: "คน",
  screen: "หน้าจอ",
  api: "API",
  system: "ระบบ",
  data: "ข้อมูล",
  decision: "การตัดสินใจ",
  question: "คำถาม",
};

// A stuck question's proposed answer (REQ-002 Q4 note — Porter on REVIEW-C-001 row 5)
export const proposedAnswer = "คำตอบที่เสนอ";

// ---------- the chat screen (REQ-004 § wording, D-020) — for Team A's chat core and every theme's chat page ----------

// Send (Enter sends; visible button + hint)
export const chatSend = "ส่ง";
export const chatEnterHint = "กด Enter เพื่อส่ง";

// Choose a file (our own button, never the browser's control)
export const chatChooseFile = "เลือกไฟล์";

// Speaker names · pack · the conversation (accessible names)
export const chatSpeaker = { user: "คุณ", bot: "บอท", caw: "ทีมงาน AI" } as const;
export const chatPack = "ชุดคำถาม";
export const chatLog = "บทสนทนา";

// Why a source could not be read — shown in the brackets of อ่านไม่ได้ (…); any other code: อ่านไม่ได้ alone
export const chatSourceReason: Record<string, string> = {
  unreadable_pdf: "เปิดไฟล์ PDF ไม่ได้",
  extract_error: "ดึงข้อความจากไฟล์ไม่ได้",
  text_too_large: "ข้อความในไฟล์ยาวเกินไป",
  link_unreachable: "เปิดลิงก์ไม่ได้",
};

// Upload / undo errors, and the button to try again
export const chatActionError = {
  too_large: "ไฟล์ใหญ่เกิน 20 MB",
  unsupported_file: "ยังไม่รองรับไฟล์ชนิดนี้",
  already_added: "เพิ่มไฟล์นี้ไปแล้ว",
  unreachable: "ต่อระบบไม่ได้ตอนนี้",
} as const;
export const chatTryAgain = "ลองใหม่";
