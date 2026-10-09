import { IconAlertCircleFilled } from "@tabler/icons-react";

// The one mark for "stuck" (blue = "needs you", direction § 5). Decorative: the words beside it carry the meaning.
export function StuckIcon({ size = 20 }: { size?: number }) {
  return <IconAlertCircleFilled size={size} color="#0B57D0" aria-hidden="true" focusable="false" style={{ flex: "none" }} />;
}
