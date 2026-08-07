# Extension DESIGN

`extension/` *내부* 설계. 컴포넌트 *간* 계약·스키마는 [ARCHITECTURE.md](../ARCHITECTURE.md). 마일스톤은 [ROADMAP.md](../ROADMAP.md).

## 레이아웃

| 경로 | 역할 |
|------|------|
| `core/` | 순수 TS (`vscode` import 금지). Graph·AST/KG·Debt·layout·Sanitizer·IsolatedRunner·Living Spec |
| `host/` | VS Code 어댑터. Sidebar·Custom Editor·Panel·Beside·Time Bar·Hot Reboot·commands |

워크스페이스 루트는 `extension/package.json` (npm workspaces).

## M2 범위 (이 문서 기준)

- core: shallow Sanitizer(`maxDepth: 3`); in-process `IsolatedRunner`(Replay + Mock I/O + inject + Hot Reboot); Living Spec artifact + Jest `scenarioId` 1:1 링크
- host: Time Bar scrub → `timeline.onChangeEnd`; Hot Reboot → `runner.hotReboot` (러너 세션)
- Jest: sanitize / runner / livingSpec 단위 테스트

M3+(Mirror Gate·ChangeScore)·외부 Graphify CLI는 여기 구현하지 않는다.

## 확정

| 항목 | 선택 | 근거 |
|------|------|------|
| AST (M1) | **ts-morph** | TS/JS 심볼 해석; tree-sitter는 M4+ |
| Runner (M2) | **in-process** | soft TTD=입력 재실행(ARCHITECTURE §1.4); worker는 필요 시 M3+ |

## 미결정 (이후 마일스톤)

- 로컬 LLM 런타임: Ollama vs node-llama — M3
- Gate 훅: SCM vs husky — M3

## Host 표면

| 표면 | contributes / 구현 |
|------|-------------------|
| Sidebar | `codingland.sidebar` WebviewView |
| Canvas | Custom Editor `codingland.canvas` — 경계 그래프 + Semantic Zoom + Time Bar |
| Panel | OutputChannel `Codingland` |
| Beside | `codingland.revealBeside` → `ViewColumn.Beside` (+ selection range) |
| Time Bar / Hot Reboot | scrub → `timeline.onChangeEnd`; button → `runner.hotReboot` |
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
