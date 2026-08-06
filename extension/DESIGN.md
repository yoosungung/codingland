# Extension DESIGN

`extension/` *내부* 설계. 컴포넌트 *간* 계약·스키마는 [ARCHITECTURE.md](../ARCHITECTURE.md). 마일스톤은 [ROADMAP.md](../ROADMAP.md).

## 레이아웃

| 경로 | 역할 |
|------|------|
| `core/` | 순수 TS (`vscode` import 금지). GraphDelta·fingerprint·protocol·AST/KG·Debt·layout |
| `host/` | VS Code 어댑터. Sidebar·Custom Editor·Panel·Beside·commands |

워크스페이스 루트는 `extension/package.json` (npm workspaces).

## M1 범위 (이 문서 기준)

- core: `ts-morph`로 TS 샘플(결제 미들웨어) → Module/Class 경계 그래프; `EdgeConfidence` 기본 `extracted`; Debt stub(`extracted`만 집계); Mental-Map Preserving 앵커(줌 시 좌표 유지); `graph.delta` + fingerprint
- host: Canvas에 경계 그래프 렌더·줌; 노드 선택 → `editor.revealBeside`(`uri`+`range`)
- Jest: debt / edgeConfidence / layout / AST extract 단위 테스트

M2+(Replay·Living Spec BDD·Mirror)·외부 Graphify CLI는 여기 구현하지 않는다.

## 확정 (M1)

| 항목 | 선택 | 근거 |
|------|------|------|
| AST | **ts-morph** | 대상이 TS/JS(ROADMAP); `extracted` 호출·의존은 심볼 해석이 유리. tree-sitter는 멀티언어(M4+)용으로 보류 |

## 미결정 (이후 마일스톤)

- 로컬 LLM 런타임: Ollama vs node-llama — M3
- Gate 훅: SCM vs husky — M3

## Host 표면

| 표면 | contributes / 구현 |
|------|-------------------|
| Sidebar | `codingland.sidebar` WebviewView |
| Canvas | Custom Editor `codingland.canvas` — 경계 그래프 + Semantic Zoom |
| Panel | OutputChannel `Codingland` |
| Beside | `codingland.revealBeside` → `ViewColumn.Beside` (+ selection range) |
| Time Bar / Hot Reboot | Canvas placeholder (M2까지 no-op) |
| Sample | `codingland.loadPaymentSample` — fixture 그래프 → `graph.delta` |

## Commands

워크스페이스 루트(`extension/`)에서:

```bash
npm install          # workspaces: core + host
npm test             # core Jest
npm run compile -w codingland   # host tsc → out/
```

core만:

```bash
npm test -w @codingland/core
```

VS Code/Cursor에 로컬 로드·VSIX 설치: [`../deploy/README.md`](../deploy/README.md).