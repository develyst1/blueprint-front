// Dev-only sample words for the isolation screens (TASK-B-002). Never shown to users.
export const SAMPLE = {
  heading: "หัวข้อ",
  text: "ข้อความ",
  link: "ลิงก์",
  button: "ปุ่ม",
  input: "ช่องกรอก",
  card: "การ์ด",
  column: "รายการ",
  rows: ["แถวหนึ่ง", "แถวสอง"],
} as const;

export type Variant = "none" | "antd" | "mantine" | "heroui" | "all";
