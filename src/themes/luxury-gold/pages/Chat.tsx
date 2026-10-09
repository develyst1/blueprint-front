// Screen ② (`Theme.chat`, contract v1.9, REQ-004) in luxury gold. The whole page is interactive (one pending state
// shared by the box, the pack and the edge), so it lives in ../client/ChatDesk; this entry stays server-side.
import type { ChatPageProps } from "@/core/theme/contract";
import { ChatDesk } from "../client/ChatDesk";

export function Chat(props: ChatPageProps) {
  return <ChatDesk {...props} />;
}
