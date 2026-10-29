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
  // REQ-103 has no row for this page's name: the one word the PM's own "เพิ่ม requirement" row uses (TASK-108 Q1)
  requirements: "requirement",
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
// `contradiction` is worded by its two sides (`contradiction` below), so it has no fixed row either (v1.13).
export const stuck: Record<Exclude<StuckKind, "flow_break" | "contradiction"> | FlowBreakReason, string> = {
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

// Two parts that disagree — worded by the two sides, on ติดอยู่ตรงไหน and in the chat (REQ-004 l.61, v1.13)
export const contradiction = (first: string, second: string): string => `สองส่วนนี้ขัดกัน: ${first} กับ ${second}`;

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
  // audit rows of the project-wide history (REQ-103 § Wording, Q4 — the PM's decided copy, 2026-10-29)
  project_create: "สร้างโปรเจกต์",
  settings: "เปลี่ยนการตั้งค่า",
  source_add: "เพิ่มเอกสาร",
  source_refetch: "ดึงลิงก์ใหม่",
  label: "ใส่ป้าย version",
  quiz_start: "เริ่ม quiz",
  quiz_ask: "ถาม quiz",
  quiz_mark: "ตรวจคำตอบ quiz",
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

// REQ-103 § User-facing wording (2026-10-29): the name prompt, the full history's title, the add-requirement button
export const namePrompt = "พิมพ์ชื่อคุณก่อน ระบบจะบันทึกว่าใครแก้";
export const historyAll = "ประวัติการแก้ทั้งหมด";
export const addRequirement = "เพิ่ม requirement";
// the overview / PDF section (REQ-103 § Wording, added 2026-10-29 by the PM, Q6) — the same word as the nav, plural
export const requirementsSection = "Requirements";
// the name button once a name is set: "{ชื่อ} · เปลี่ยนชื่อ" (REQ-103 AC-11, § Wording)
export const changeName = "เปลี่ยนชื่อ";
export const nameButtonText = (name: string): string => `${name} · ${changeName}`;
// The empty requirements list: D-015's pattern "ยังไม่มี{…}ในโปรเจกต์นี้" with the PM's own noun (TASK-108 Q1)
export const emptyRequirements = "ยังไม่มี requirement ในโปรเจกต์นี้";

// Name of the strip that lists the spec pages — the nav landmark's accessible name in every shell (D-018)
export const pageNav = "หน้าใน spec";

// Project not found
export const notFound = "ไม่พบโปรเจกต์นี้";
export const backHome = "กลับหน้าโปรเจกต์";

// Back to the project list, in every frame (AC-22, D-036): the wordmark is the link, and the words say where it goes
export const allProjects = "โปรเจกต์ทั้งหมด";
export const productMark = "Blueprint";

// A stuck node's accessible name on ใยโหนด — a screen reader says which node is stuck, not only "!" (REQ-002 l.92)
export const stuckNodeName = (title: string): string => `${title} · ยังติดอยู่`;

// ใยโหนด opens on the whole picture, then zooms (REQ-009, D-041): back to the whole web · the zoom buttons' accessible
// names (the buttons themselves show + and −) · the side list's heading for a chosen node
export const webAll = "ดูทั้งหมด";
export const zoomIn = "ซูมเข้า";
export const zoomOut = "ซูมออก";
export const linkedWith = "เชื่อมกับ";

// The new-project dialog's close button
export const closeDialog = "ปิด";

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
  requirement: "requirement", // REQ-103: the PM's own noun (TASK-108 Q1)
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

// ---------- REQ-017: the two rooms and the brief (SPEC-C-006 § 4, D-109 — one change: ยังรอคำตอบจากคุณ) ----------

// The two rooms (the frame's main tabs), and room 2's count of views
export const roomLabel = { front: "สิ่งที่เราเข้าใจ", back: "เบื้องหลังเทคนิค" } as const;
export const roomViews = (n: number): string => `${n} มุมมอง`;

// The brief (the overview page, comp A): the goal's source line (the version part only when the version is known),
// the sections, an ending, no open question, and the side rail
export const brief = {
  source: (version: number | null): string => (version === null ? "สรุปจากที่คุณเล่าในแชต" : `สรุปจากที่คุณเล่าในแชต · spec เวอร์ชัน ${version}`),
  roles: "ใครเกี่ยวข้อง",
  path: "เส้นทางของงาน",
  rules: "กติกาที่ตกลงกันแล้ว",
  waiting: "ยังรอคำตอบจากคุณ",
  ending: (n: number, stepTitle: string): string => `จบแบบที่ ${n} — ${stepTitle}`,
  noQuestions: "ไม่มี ทุกคำถามตอบแล้ว",
  rail: {
    title: "เบื้องหลังที่ระบบต้องมี",
    screens: "หน้าจอ",
    apis: "API",
    systems: "ระบบที่ต่อด้วย",
    data: "ข้อมูล",
    interactions: (n: number): string => `ลำดับการโต้ตอบ (${n} ขั้น)`,
    er: "ER diagram",
    services: "service / type",
    notYet: "ยังไม่มี",
  },
} as const;

// REQ-017 back room — the ลำดับงาน matrix (comp C, D-112): the card head, the column cue and the foot line
export const matrix = {
  size: (steps: number, lanes: number): string => `${steps} ขั้น × ${lanes} ผู้มีส่วนร่วม`,
  seen: (n: number, m: number): string => `เห็น ${n} จาก ${m} คอลัมน์`,
  more: (k: number): string => `อีก ${k} คอลัมน์ →`,
  foot: "คอลัมน์ขั้นงานอยู่กับที่เสมอ · เลื่อนด้วย trackpad, Shift+ล้อเมาส์ หรือปุ่มลูกศรเมื่อเลือกตาราง",
} as const;
