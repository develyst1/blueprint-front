// Snapshot of blueprint-back API responses, captured 2026-10-09 from pglite:memory by tests/harness/req002/capture-meeting-room.ts — mockup only; built pages read the live API (REQ-002 R4).
window.BLUEPRINT_MOCK = {
  "projects": [
    {
      "id": "d01a63a7-c48d-4eea-9a85-4fca1b8501e3",
      "organisationId": "00000000-0000-0000-0000-000000000001",
      "name": "จองห้องประชุม",
      "createdAt": "2026-10-08T17:42:17.814Z",
      "stuckCount": 1
    }
  ],
  "project": {
    "project": {
      "id": "d01a63a7-c48d-4eea-9a85-4fca1b8501e3",
      "organisationId": "00000000-0000-0000-0000-000000000001",
      "name": "จองห้องประชุม",
      "createdAt": "2026-10-08T17:42:17.814Z"
    },
    "parts": [
      {
        "key": "API-001",
        "kind": "api",
        "title": "ค้นหาห้องว่าง",
        "body": {
          "path": "/rooms",
          "method": "GET",
          "responses": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "API-002",
        "kind": "api",
        "title": "สร้างการจอง",
        "body": {
          "path": "/bookings",
          "method": "POST",
          "responses": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "API-003",
        "kind": "api",
        "title": "อนุมัติการจอง",
        "body": {
          "path": "/bookings/{id}/approve",
          "method": "POST",
          "responses": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "DATA-001",
        "kind": "data",
        "title": "Room",
        "body": {
          "fields": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "DATA-002",
        "kind": "data",
        "title": "Booking",
        "body": {
          "fields": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "DEC-001",
        "kind": "decision",
        "title": "ห้องที่จุเกิน 10 คนต้องให้ผู้ดูแลอนุมัติ",
        "body": {
          "open": "ห้องพอดี 10 คน",
          "rule": "ห้องที่จุเกิน 10 คนต้องให้ผู้ดูแลอนุมัติ",
          "cases": [
            "ห้องใหญ่ → ผู้ดูแลอนุมัติ",
            "ห้องเล็ก → ยืนยันทันที"
          ]
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-001",
        "kind": "interaction",
        "title": "เลือกวันที่",
        "body": {
          "text": "เลือกวันที่"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-002",
        "kind": "interaction",
        "title": "ขอรายการห้องว่าง",
        "body": {
          "text": "ขอรายการห้องว่าง"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-003",
        "kind": "interaction",
        "title": "อ่านห้องว่างจากปฏิทิน",
        "body": {
          "text": "อ่านห้องว่างจากปฏิทิน"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-004",
        "kind": "interaction",
        "title": "เลือกห้องและช่วงเวลา",
        "body": {
          "text": "เลือกห้องและช่วงเวลา"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-005",
        "kind": "interaction",
        "title": "เปิดหน้ายืนยันพร้อมห้องที่เลือก",
        "body": {
          "text": "เปิดหน้ายืนยันพร้อมห้องที่เลือก"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-006",
        "kind": "interaction",
        "title": "กดยืนยันการจอง",
        "body": {
          "text": "กดยืนยันการจอง"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-007",
        "kind": "interaction",
        "title": "ส่ง Booking",
        "body": {
          "text": "ส่ง Booking"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-008",
        "kind": "interaction",
        "title": "ตรวจเวลาว่างและบันทึก",
        "body": {
          "text": "ตรวจเวลาว่างและบันทึก"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-009",
        "kind": "interaction",
        "title": "201 · status pending | confirmed",
        "body": {
          "text": "201 · status pending | confirmed"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-010",
        "kind": "interaction",
        "title": "เปิดคำขอแล้วกดอนุมัติหรือปฏิเสธ",
        "body": {
          "text": "เปิดคำขอแล้วกดอนุมัติหรือปฏิเสธ"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-011",
        "kind": "interaction",
        "title": "ส่งผลการพิจารณา",
        "body": {
          "text": "ส่งผลการพิจารณา"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-012",
        "kind": "interaction",
        "title": "อัปเดตสถานะการจอง",
        "body": {
          "text": "อัปเดตสถานะการจอง"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-013",
        "kind": "interaction",
        "title": "แสดงว่าการจองสำเร็จ",
        "body": {
          "text": "แสดงว่าการจองสำเร็จ"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "INT-014",
        "kind": "interaction",
        "title": "แสดงว่าถูกปฏิเสธ พร้อมเหตุผล",
        "body": {
          "text": "แสดงว่าถูกปฏิเสธ พร้อมเหตุผล"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "Q-001",
        "kind": "question",
        "title": "ผู้ดูแลไม่ตอบใน 24 ชม. ทำอย่างไร",
        "body": {
          "text": "ผู้ดูแลไม่ตอบใน 24 ชม. ทำอย่างไร",
          "status": "open",
          "proposedAnswer": "ยกเลิกอัตโนมัติและแจ้งพนักงาน"
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "ROLE-001",
        "kind": "role",
        "title": "พนักงาน",
        "body": {},
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "ROLE-002",
        "kind": "role",
        "title": "ผู้ดูแลห้อง",
        "body": {},
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "SCR-001",
        "kind": "screen",
        "title": "หน้าค้นหาห้อง",
        "body": {
          "fields": [],
          "states": [],
          "actions": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "SCR-002",
        "kind": "screen",
        "title": "หน้ายืนยันการจอง",
        "body": {
          "fields": [],
          "states": [],
          "actions": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "SCR-003",
        "kind": "screen",
        "title": "หน้าอนุมัติคำขอ",
        "body": {
          "fields": [],
          "states": [],
          "actions": []
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "STEP-001",
        "kind": "step",
        "title": "ค้นหาห้องว่าง",
        "body": {
          "ends": false
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "STEP-002",
        "kind": "step",
        "title": "เลือกห้องและเวลา",
        "body": {
          "ends": false
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "STEP-003",
        "kind": "step",
        "title": "ส่งคำขอจอง",
        "body": {
          "ends": false
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "STEP-004",
        "kind": "step",
        "title": "ผู้ดูแลพิจารณา",
        "body": {
          "ends": false
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "STEP-005",
        "kind": "step",
        "title": "ได้รับการยืนยัน",
        "body": {
          "ends": true
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "STEP-006",
        "kind": "step",
        "title": "แจ้งว่าถูกปฏิเสธ",
        "body": {
          "ends": true
        },
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "SYS-001",
        "kind": "system",
        "title": "ระบบปฏิทิน",
        "body": {},
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      },
      {
        "key": "WRK-001",
        "kind": "work",
        "title": "จองห้องประชุม",
        "body": {},
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        },
        "createdIn": "b7460d64-a794-48a4-acf6-06a0067de16d"
      }
    ],
    "links": [
      {
        "id": "5e863626-6d3c-4600-87c3-9671b2cbf398",
        "kind": "reads",
        "fromKey": "API-001",
        "toKey": "DATA-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "02c042a4-857c-4e45-9a99-6b3d6462b85b",
        "kind": "writes",
        "fromKey": "API-002",
        "toKey": "DATA-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "c20b2706-6fb1-4f6a-84ae-e3035797f251",
        "kind": "writes",
        "fromKey": "API-003",
        "toKey": "DATA-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "3d6318f8-05b4-47bc-8056-4192b8d59891",
        "kind": "covers",
        "fromKey": "DEC-001",
        "toKey": "STEP-003",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "234bfe16-d014-4110-87de-03eb2888ad01",
        "kind": "covers",
        "fromKey": "DEC-001",
        "toKey": "STEP-004",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "b877cbea-a7a3-4aca-a9ba-e2b5c8a586a1",
        "kind": "from",
        "fromKey": "INT-001",
        "toKey": "ROLE-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "b5e6d235-9f1d-448a-987e-22fd355501ea",
        "kind": "to",
        "fromKey": "INT-001",
        "toKey": "SCR-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "5b0f4f1f-ae7d-4fb7-9580-d60039d0c751",
        "kind": "from",
        "fromKey": "INT-002",
        "toKey": "SCR-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "191df8af-f6cc-4d89-8307-9ff903471f3b",
        "kind": "to",
        "fromKey": "INT-002",
        "toKey": "API-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "50b18a70-fc7f-469e-889c-087f50526635",
        "kind": "carries",
        "fromKey": "INT-003",
        "toKey": "DATA-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "9747cee7-87df-4676-a531-27d49e919419",
        "kind": "from",
        "fromKey": "INT-003",
        "toKey": "API-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "7ff04c0c-8f9a-46d1-88a0-a8b89300c9ef",
        "kind": "to",
        "fromKey": "INT-003",
        "toKey": "SYS-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "3aa9b418-ccf1-4768-a13e-9c441167233c",
        "kind": "from",
        "fromKey": "INT-004",
        "toKey": "ROLE-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "7cb4b0c5-e846-48d0-a006-8f17ead98326",
        "kind": "to",
        "fromKey": "INT-004",
        "toKey": "SCR-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "525569ee-2891-4e97-9e36-d7cf55b67490",
        "kind": "from",
        "fromKey": "INT-005",
        "toKey": "SCR-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "e72fce0a-8398-467c-85e5-da2974c4b13f",
        "kind": "to",
        "fromKey": "INT-005",
        "toKey": "SCR-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "433dd6d8-23d1-4c72-a393-f4d1059441b8",
        "kind": "from",
        "fromKey": "INT-006",
        "toKey": "ROLE-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "04ce65e0-6372-4d1e-b980-a332bfa308bd",
        "kind": "to",
        "fromKey": "INT-006",
        "toKey": "SCR-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "978b495f-fbfd-473e-a27e-6380f3b7bed9",
        "kind": "carries",
        "fromKey": "INT-007",
        "toKey": "DATA-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "5948a619-b3be-4d63-9107-592148f0b89c",
        "kind": "from",
        "fromKey": "INT-007",
        "toKey": "SCR-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "1f4f2d71-53f8-426f-9ca0-4826cfccbaf6",
        "kind": "to",
        "fromKey": "INT-007",
        "toKey": "API-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "320e59ea-2a91-40f6-a873-c1c03a817296",
        "kind": "from",
        "fromKey": "INT-008",
        "toKey": "API-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "fc009a9c-4eea-4283-8c6d-42305d81e0c2",
        "kind": "to",
        "fromKey": "INT-008",
        "toKey": "SYS-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "00ab35b5-9afc-4eec-8f2e-e32d1ae495f1",
        "kind": "from",
        "fromKey": "INT-009",
        "toKey": "API-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "5f8fe13b-b89e-4ac9-8a84-1abc0c16deec",
        "kind": "to",
        "fromKey": "INT-009",
        "toKey": "SCR-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "cae835fa-0bed-4dac-aaa2-15c7a35fdded",
        "kind": "from",
        "fromKey": "INT-010",
        "toKey": "ROLE-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "0165d517-2d9a-4048-8c0b-0369d7414716",
        "kind": "to",
        "fromKey": "INT-010",
        "toKey": "SCR-003",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "b5ad9104-4796-4448-bd4a-2c0ac16e02c1",
        "kind": "from",
        "fromKey": "INT-011",
        "toKey": "SCR-003",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "3cde2c1a-ae35-4f51-914e-049d6b29e092",
        "kind": "to",
        "fromKey": "INT-011",
        "toKey": "API-003",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "452dd445-fc78-4ec2-bf3e-2d6661c89f1a",
        "kind": "carries",
        "fromKey": "INT-012",
        "toKey": "DATA-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "4a588d94-1bf3-4a40-af9d-462b08b4e5d0",
        "kind": "from",
        "fromKey": "INT-012",
        "toKey": "API-003",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "e4ceb590-d191-4232-a625-cf790095fdd3",
        "kind": "to",
        "fromKey": "INT-012",
        "toKey": "SYS-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "e86509d4-79a9-4461-aeda-6c4c8b08ebd5",
        "kind": "from",
        "fromKey": "INT-013",
        "toKey": "SCR-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "62810070-541c-4524-aa1f-1878475781f3",
        "kind": "to",
        "fromKey": "INT-013",
        "toKey": "ROLE-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "a959e312-cb99-48e0-af5f-4d82458f8c1f",
        "kind": "from",
        "fromKey": "INT-014",
        "toKey": "SCR-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "73d3de71-3396-4a6a-8171-8d8cac4635d9",
        "kind": "to",
        "fromKey": "INT-014",
        "toKey": "ROLE-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "89cc75bd-f5e4-4496-acc0-c3f55ca81212",
        "kind": "about",
        "fromKey": "Q-001",
        "toKey": "STEP-004",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "e98aa3d8-1443-4547-873d-9eee3008e6eb",
        "kind": "shows",
        "fromKey": "SCR-001",
        "toKey": "DATA-001",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "0e9804a6-5652-4ed3-9398-34aee7d6b381",
        "kind": "shows",
        "fromKey": "SCR-002",
        "toKey": "DATA-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "94a27e88-9916-4d47-b90c-6fd2db65dd31",
        "kind": "shows",
        "fromKey": "SCR-003",
        "toKey": "DATA-002",
        "position": null,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "2683c5a8-62ba-41e9-bd67-c5c9c98095c3",
        "kind": "has_interaction",
        "fromKey": "STEP-001",
        "toKey": "INT-001",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "730a97ff-62e9-4fda-b1e3-d01b828b67ed",
        "kind": "has_interaction",
        "fromKey": "STEP-001",
        "toKey": "INT-002",
        "position": 2,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "e7242569-da2d-4e1e-abbe-60c8189e863f",
        "kind": "has_interaction",
        "fromKey": "STEP-001",
        "toKey": "INT-003",
        "position": 3,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "26235171-f3d9-4423-8049-6c302c05df65",
        "kind": "next",
        "fromKey": "STEP-001",
        "toKey": "STEP-002",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "efaf8585-33e9-4f30-b7e8-491c5f4b7152",
        "kind": "has_interaction",
        "fromKey": "STEP-002",
        "toKey": "INT-004",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "656d7ba9-19f8-4bb5-9df5-faf0b5b35482",
        "kind": "has_interaction",
        "fromKey": "STEP-002",
        "toKey": "INT-005",
        "position": 2,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "6ba60c74-76c0-4244-8534-2dbce09fbb4f",
        "kind": "next",
        "fromKey": "STEP-002",
        "toKey": "STEP-003",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "eb4cf49c-09cb-40ba-8241-697975b04230",
        "kind": "has_interaction",
        "fromKey": "STEP-003",
        "toKey": "INT-006",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "da831c68-26d1-4c56-ae73-2ce2c9786f75",
        "kind": "has_interaction",
        "fromKey": "STEP-003",
        "toKey": "INT-007",
        "position": 2,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "784136f8-2ceb-448d-b443-c3e70d7fc63d",
        "kind": "has_interaction",
        "fromKey": "STEP-003",
        "toKey": "INT-008",
        "position": 3,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "d703d38d-ab5d-4eca-b67f-6d93ffc11fa0",
        "kind": "has_interaction",
        "fromKey": "STEP-003",
        "toKey": "INT-009",
        "position": 4,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "86b0da71-c771-4cd4-982a-880769f2b956",
        "kind": "next",
        "fromKey": "STEP-003",
        "toKey": "STEP-004",
        "position": 1,
        "label": "ห้องใหญ่ ต้องอนุมัติ",
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "86493ed7-4903-4952-a0bf-15e94f298982",
        "kind": "next",
        "fromKey": "STEP-003",
        "toKey": "STEP-005",
        "position": 2,
        "label": "ห้องเล็ก ไม่ต้องอนุมัติ",
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "2813e485-f61d-4813-a801-722b01a120df",
        "kind": "has_interaction",
        "fromKey": "STEP-004",
        "toKey": "INT-010",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "4e98d8ec-ac1c-4bd1-8ca1-de7a8d3f3266",
        "kind": "has_interaction",
        "fromKey": "STEP-004",
        "toKey": "INT-011",
        "position": 2,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "fba1bdf0-fe5b-49fc-8418-d7273facfd88",
        "kind": "has_interaction",
        "fromKey": "STEP-004",
        "toKey": "INT-012",
        "position": 3,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "2cd8acdf-ddc8-48d3-8a92-7ad735309bda",
        "kind": "next",
        "fromKey": "STEP-004",
        "toKey": "STEP-005",
        "position": 1,
        "label": "อนุมัติ",
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "19d0ee3c-4531-4b64-bdb5-7b293c287816",
        "kind": "next",
        "fromKey": "STEP-004",
        "toKey": "STEP-006",
        "position": 2,
        "label": "ปฏิเสธ",
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "4749d901-74f5-4463-8e0f-3c896f2d137c",
        "kind": "has_interaction",
        "fromKey": "STEP-005",
        "toKey": "INT-013",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "d4933386-af0e-4c4b-a323-ea7a8f31624a",
        "kind": "has_interaction",
        "fromKey": "STEP-006",
        "toKey": "INT-014",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "f53bf70d-420f-41bc-97ca-5808f372f6ff",
        "kind": "has_step",
        "fromKey": "WRK-001",
        "toKey": "STEP-001",
        "position": 1,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "c4da540e-d9d4-46ff-ab21-1372410bc916",
        "kind": "has_step",
        "fromKey": "WRK-001",
        "toKey": "STEP-002",
        "position": 2,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "4265d9e5-bed8-4ffe-840e-46a69836a7ae",
        "kind": "has_step",
        "fromKey": "WRK-001",
        "toKey": "STEP-003",
        "position": 3,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "9a8973db-2c5b-4a98-93d0-1e64ad03794c",
        "kind": "has_step",
        "fromKey": "WRK-001",
        "toKey": "STEP-004",
        "position": 4,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "5d217bd1-2925-4abb-939e-e15ca189e73e",
        "kind": "has_step",
        "fromKey": "WRK-001",
        "toKey": "STEP-005",
        "position": 5,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      },
      {
        "id": "ad236720-26e7-48c7-b190-b1576fadcf7b",
        "kind": "has_step",
        "fromKey": "WRK-001",
        "toKey": "STEP-006",
        "position": 6,
        "label": null,
        "origin": {
          "date": "2026-10-08",
          "stamp": "operator"
        }
      }
    ]
  },
  "flowchart": {
    "nodes": [
      {
        "key": "STEP-001",
        "title": "ค้นหาห้องว่าง",
        "position": 1,
        "ends": false,
        "isBranch": false
      },
      {
        "key": "STEP-002",
        "title": "เลือกห้องและเวลา",
        "position": 2,
        "ends": false,
        "isBranch": false
      },
      {
        "key": "STEP-003",
        "title": "ส่งคำขอจอง",
        "position": 3,
        "ends": false,
        "isBranch": true
      },
      {
        "key": "STEP-004",
        "title": "ผู้ดูแลพิจารณา",
        "position": 4,
        "ends": false,
        "isBranch": true
      },
      {
        "key": "STEP-005",
        "title": "ได้รับการยืนยัน",
        "position": 5,
        "ends": true,
        "isBranch": false
      },
      {
        "key": "STEP-006",
        "title": "แจ้งว่าถูกปฏิเสธ",
        "position": 6,
        "ends": true,
        "isBranch": false
      }
    ],
    "arrows": [
      {
        "from": "STEP-001",
        "to": "STEP-002",
        "label": null
      },
      {
        "from": "STEP-002",
        "to": "STEP-003",
        "label": null
      },
      {
        "from": "STEP-003",
        "to": "STEP-004",
        "label": "ห้องใหญ่ ต้องอนุมัติ"
      },
      {
        "from": "STEP-003",
        "to": "STEP-005",
        "label": "ห้องเล็ก ไม่ต้องอนุมัติ"
      },
      {
        "from": "STEP-004",
        "to": "STEP-005",
        "label": "อนุมัติ"
      },
      {
        "from": "STEP-004",
        "to": "STEP-006",
        "label": "ปฏิเสธ"
      }
    ]
  },
  "swimlane": {
    "lanes": [
      {
        "key": "ROLE-001",
        "kind": "role",
        "title": "พนักงาน"
      },
      {
        "key": "SCR-001",
        "kind": "screen",
        "title": "หน้าค้นหาห้อง"
      },
      {
        "key": "API-001",
        "kind": "api",
        "title": "ค้นหาห้องว่าง"
      },
      {
        "key": "SYS-001",
        "kind": "system",
        "title": "ระบบปฏิทิน"
      },
      {
        "key": "SCR-002",
        "kind": "screen",
        "title": "หน้ายืนยันการจอง"
      },
      {
        "key": "API-002",
        "kind": "api",
        "title": "สร้างการจอง"
      },
      {
        "key": "ROLE-002",
        "kind": "role",
        "title": "ผู้ดูแลห้อง"
      },
      {
        "key": "SCR-003",
        "kind": "screen",
        "title": "หน้าอนุมัติคำขอ"
      },
      {
        "key": "API-003",
        "kind": "api",
        "title": "อนุมัติการจอง"
      }
    ],
    "rows": [
      {
        "step": {
          "key": "STEP-001",
          "title": "ค้นหาห้องว่าง",
          "position": 1
        },
        "lanes": [
          "ROLE-001",
          "SCR-001",
          "API-001",
          "SYS-001"
        ]
      },
      {
        "step": {
          "key": "STEP-002",
          "title": "เลือกห้องและเวลา",
          "position": 2
        },
        "lanes": [
          "ROLE-001",
          "SCR-001",
          "SCR-002"
        ]
      },
      {
        "step": {
          "key": "STEP-003",
          "title": "ส่งคำขอจอง",
          "position": 3
        },
        "lanes": [
          "ROLE-001",
          "SCR-002",
          "API-002",
          "SYS-001"
        ]
      },
      {
        "step": {
          "key": "STEP-004",
          "title": "ผู้ดูแลพิจารณา",
          "position": 4
        },
        "lanes": [
          "ROLE-002",
          "SCR-003",
          "API-003",
          "SYS-001"
        ]
      },
      {
        "step": {
          "key": "STEP-005",
          "title": "ได้รับการยืนยัน",
          "position": 5
        },
        "lanes": [
          "SCR-002",
          "ROLE-001"
        ]
      },
      {
        "step": {
          "key": "STEP-006",
          "title": "แจ้งว่าถูกปฏิเสธ",
          "position": 6
        },
        "lanes": [
          "SCR-002",
          "ROLE-001"
        ]
      }
    ]
  },
  "sequence": {
    "participants": [
      {
        "key": "ROLE-001",
        "kind": "role",
        "title": "พนักงาน"
      },
      {
        "key": "SCR-002",
        "kind": "screen",
        "title": "หน้ายืนยันการจอง"
      },
      {
        "key": "API-002",
        "kind": "api",
        "title": "สร้างการจอง"
      },
      {
        "key": "SYS-001",
        "kind": "system",
        "title": "ระบบปฏิทิน"
      }
    ],
    "messages": [
      {
        "key": "INT-006",
        "from": "ROLE-001",
        "to": "SCR-002",
        "text": "กดยืนยันการจอง",
        "reply": null
      },
      {
        "key": "INT-007",
        "from": "SCR-002",
        "to": "API-002",
        "text": "ส่ง Booking",
        "reply": null
      },
      {
        "key": "INT-008",
        "from": "API-002",
        "to": "SYS-001",
        "text": "ตรวจเวลาว่างและบันทึก",
        "reply": null
      },
      {
        "key": "INT-009",
        "from": "API-002",
        "to": "SCR-002",
        "text": "201 · status pending | confirmed",
        "reply": null
      }
    ]
  },
  "stuck": {
    "items": [
      {
        "kind": "open_question",
        "key": "Q-001",
        "title": "ผู้ดูแลไม่ตอบใน 24 ชม. ทำอย่างไร"
      }
    ]
  }
};
