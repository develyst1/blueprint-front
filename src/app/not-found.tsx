// HTTP 404 for a missing project or an unknown page (TASK-B-007 Q1): a missing project has no theme to draw it in,
// so the default theme says it, with the way home.
import { HOME_HREF } from "@/core/model/build/common";
import { StateView } from "@/core/render/ProjectPage";
import { defaultTheme } from "@/core/theme/default";

export default function NotFound() {
  return <StateView theme={defaultTheme} frame={null} state={{ kind: "notFound", homeHref: HOME_HREF }} />;
}
