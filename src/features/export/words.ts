// The PDF export's words — REQ-008 § User-facing wording, verbatim (stamp `operator-delegated`, 2026-10-09 standing
// rule). The print view (TASK-A-045) and the button + route (TASK-A-046) take them from here. Page names, the empty
// project sentence and readiness come from @/core/words — never copied.
export const exportPdf = "ส่งออก PDF";
export const building = "กำลังสร้าง PDF…";
export const failed = "สร้าง PDF ไม่สำเร็จ · ลองใหม่";
export const notConfirmed = "ยังไม่ยืนยัน";
export const coverLabels = { project: "โปรเจกต์", version: "เวอร์ชัน", exportDate: "วันที่ส่งออก", readiness: "ความพร้อม" } as const;
export const stuckHeading = (n: number) => `ยังติดอยู่ ${n} เรื่อง`;
export const footer = (n: number | string, m: number | string) => `หน้า ${n} จาก ${m}`;
