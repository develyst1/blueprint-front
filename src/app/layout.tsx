import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import s from "./core.module.css";

export const metadata: Metadata = { title: "Blueprint" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className={s.body}>
        {/* Ant Design's server-side style extraction; it only emits styles for Ant components a route renders. */}
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
