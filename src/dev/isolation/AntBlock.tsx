"use client";

// Ant Design: no reset.css. Styles arrive only through AntdRegistry (layout) + this block's ConfigProvider,
// and Ant's CSS-in-JS scopes every rule to its own .ant-* classes.
import { Button, Card, ConfigProvider, Input, Table } from "antd";
import { SAMPLE } from "./sample";

const rows = SAMPLE.rows.map((name, i) => ({ key: String(i), name }));

export function AntBlock() {
  return (
    <div data-theme-root="antd">
      <ConfigProvider>
        <Card title={SAMPLE.card}>
          <Button type="primary">{SAMPLE.button}</Button>
          <Input placeholder={SAMPLE.input} style={{ marginTop: 12 }} />
          <Table
            style={{ marginTop: 12 }}
            size="small"
            pagination={false}
            columns={[{ title: SAMPLE.column, dataIndex: "name", key: "name" }]}
            dataSource={rows}
          />
        </Card>
      </ConfigProvider>
    </div>
  );
}
