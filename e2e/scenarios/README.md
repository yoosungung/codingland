# Extension Host QA & dogfood UI scenarios

Factory QA runs `.factory/quality.yaml` `e2e.command` (`npm --prefix extension run test:vscode`), **not** Chromium against a `base_url`.

시나리오 파일은 **사용법 교육 + QA 추적**용이다. 자동화 가능한 항목은 Extension Host 테스트(`extension/host/src/test/*.test.ts`)에 `[scenario:<id>]`로 매핑된다.

## 빠른 시작 (dogfood 교육 경로)

| 순서 | 시나리오 | 무엇을 배우는가 |
|------|----------|----------------|
| 1 | [dogfood-install](dogfood-install.yaml) | VSIX 빌드·설치·리로드 |
| 2 | [dogfood-m4-workflow](dogfood-m4-workflow.yaml) | **M4 핵심** Scan → Canvas → Beside |
| 3 | [dogfood-m4-incremental](dogfood-m4-incremental.yaml) | 저장·생성·삭제 증분 ingest |
| 4 | [dogfood-gate-sidebar](dogfood-gate-sidebar.yaml) | Mirror Gate + Sidebar |

자동 스모크만: `npm --prefix extension run test:vscode`

## 시나리오 카탈로그

| id | mode | milestone | automation |
|----|------|-----------|------------|
| smoke-activate | automated | M0 | `extension.test.ts` |
| smoke-triggerGate | automated | M3 | `extension.test.ts` |
| smoke-scan-workspace | hybrid | M4 | `extension.test.ts` + `dogfood.test.ts` |
| smoke-open-canvas | hybrid | M0 | `dogfood.test.ts` |
| smoke-load-sample | hybrid | M1 | `dogfood.test.ts` |
| smoke-show-panel | hybrid | M0 | `dogfood.test.ts` |
| dogfood-install | manual | M4 | — |
| dogfood-m4-workflow | manual | M4 | — (#1294 성공 기준) |
| dogfood-m4-incremental | hybrid | M4 | `dogfood.test.ts` (rescan 회귀) |
| dogfood-gate-sidebar | manual | M3 | — |

## 시나리오 파일 형식

```yaml
id: <unique-id>           # evidence·테스트 타이틀과 동일
title: <한 줄 제목>
mode: automated | manual | hybrid
milestone: M0–M7
learn: <교육용 한 줄 설명>
prerequisites: [...]       # optional
automation:                # optional — automated/hybrid
  suite: <mocha suite name>
  test: "[scenario:<id>] ..."
steps:
  - step: 1
    ui: Command Palette | Canvas | Sidebar | ...
    action: "사용자 동작"
    expect: "눈으로 확인할 결과"
evidence: "qa: e2e pass scenario=<id> evidence=<log|screenshot|url>"
```

## Evidence

수동 dogfood 완료 시 Leantime·PR 코멘트 등에:

```text
qa: e2e pass scenario=dogfood-m4-workflow evidence=<panel log paste or screenshot path>
```

## UI 표면 참조

| UI | Command Palette / 위치 |
|----|----------------------|
| Sidebar | Activity Bar **Codingland** → Agent & Debt |
| Panel | Codingland: Show Panel Log |
| Canvas | Codingland: Open Canvas |
| Scan | Codingland: Scan Workspace (**수동** — 열기 시 자동 스캔 비활성) |
| Sample | Codingland: Load Payment Middleware Sample |
| Gate | Codingland: Trigger Mirror Gate |
| Beside | Canvas 노드 클릭 또는 Codingland: Reveal Beside |

상세 설치: [`deploy/README.md`](../../deploy/README.md). 명령·빌드: [`extension/DESIGN.md`](../../extension/DESIGN.md).
