# Codingland

AI 코딩 에이전트가 만든 코드의 **인식적 부채(Epistemic Debt)**를 줄이기 위한 Cursor/VS Code Extension — 대화형 디버그 마이크로월드.

## 문서

- 계약·인터페이스: [ARCHITECTURE.md](ARCHITECTURE.md)
- 수행 계획: [ROADMAP.md](ROADMAP.md)
- 에이전트 워크플로: [AGENTS.md](AGENTS.md)
- 로컬 설치·VSIX: [deploy/README.md](deploy/README.md)
- 지식 그래프 개념 참고: [Graphify](https://wiki.askwho.net/wiki/engineering/ai-native-engineering/graphify-codebase-knowledge-graph) (개념 차용; 외부 서비스 연동 아님 — [ARCHITECTURE](ARCHITECTURE.md) §1-14)

## Quickstart

```bash
cd extension
npm install
npm test           # core Jest (~1s) — vscode 런타임 불필요
npm run compile
npm run test:vscode  # Extension Host smoke (QA e2e.command) — Linux headless needs xvfb
```

상세 명령·내부 설계: [`extension/DESIGN.md`](extension/DESIGN.md) `## Commands`.  
Extension Host / VSIX 로컬 설치: [`deploy/README.md`](deploy/README.md).
