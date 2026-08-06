# Extension DESIGN

`extension/` *내부* 설계. 컴포넌트 *간* 계약·스키마는 [ARCHITECTURE.md](../ARCHITECTURE.md). 마일스톤은 [ROADMAP.md](../ROADMAP.md).

## 레이아웃

| 경로 | 역할 |
|------|------|
| `core/` | 순수 TS (`vscode` import 금지). GraphDelta·fingerprint·protocol·(이후) AST/KG |
| `host/` | VS Code 어댑터. Sidebar·Custom Editor·Panel·Beside·commands |

워크스페이스 루트는 `extension/package.json` (npm workspaces).

## M0 범위 (이 문서 기준)

- core: `GraphDelta` 적용, AST fingerprint 스텁, Host↔Webview protocol 상수/파서
- host: Native 표면 등록(빈/placeholder UI), Time Bar·Hot Reboot 자리, Beside reveal 커맨드
- Jest로 core 단위 테스트( VS Code 런타임 없음)

M1+ (마이크로월드·Replay·Mirror Gate)·외부 Graphify CLI는 여기 구현하지 않는다.

## 미결정 (M0에서 확정하지 않음)

- AST: ts-morph vs tree-sitter — M1에서 선택
- 로컬 LLM 런타임: Ollama vs node-llama — M3
- Gate 훅: SCM vs husky — M3

## Host 표면 (stub)

| 표면 | contributes / 구현 |
|------|-------------------|
| Sidebar | `codingland.sidebar` WebviewView |
| Canvas | Custom Editor `codingland.canvas` |
| Panel | OutputChannel `Codingland` + 커맨드로 표시 |
| Beside | `codingland.revealBeside` → `ViewColumn.Beside` |
| Time Bar / Hot Reboot | Canvas webview HTML placeholder (동작 no-op) |

## Commands

워크스페이스 루트(`extension/`)에서:

```bash
npm install          # workspaces: core + host
npm test             # core Jest (GraphDelta·fingerprint·protocol)
npm run compile -w codingland   # host tsc → out/
```

core만:

```bash
npm test -w @codingland/core
```
