# AGENTS.md

This file provides guidance to AI coding assistants (Claude Code, Codex, Gemini, ...) when working with code in this repository. `CLAUDE.md`와 `GEMINI.md`는 이 파일로의 심볼릭 링크다 — 정본은 `AGENTS.md` 하나.

에이전트·기여자가 **무엇을 어디서 읽고 어떻게 실행하는지**만 담는다. 불변 규칙은 [ARCHITECTURE.md](ARCHITECTURE.md), 일정은 [ROADMAP.md](ROADMAP.md).

## 1. Documentation layout (문서 용도)

각 문서는 하나의 명확한 용도만 가진다. 같은 내용을 여러 문서에 중복하지 않는다. 한쪽을 고칠 때 다른 쪽이 같이 바뀌어야 한다면 잘못 나눈 것이므로 합치거나 한쪽이 다른 쪽을 참조하게 만든다.

| 파일 | 용도 | 위치 |
|------|------|------|
| `AGENTS.md` (이 파일, 정본) ← `CLAUDE.md`, `GEMINI.md` 심볼릭 | 수행 방법 + 문서 레이아웃 + 현황 | 루트 |
| `ARCHITECTURE.md` | **계약사항(불변 규칙)** + 컴포넌트 *간* 인터페이스 형태(스키마·레이아웃·이벤트) | 루트 |
| `README.md` | 저장소 방문자용 소개 + 로컬 quickstart | 루트 |
| `ROADMAP.md` | 수행 계획(마일스톤·확정 결정·미결정) | 루트 |
| `extension/DESIGN.md` | Extension *내부* 설계 + `## Commands` | `extension/` (코드 착수 시) |

규칙:

- **ARCHITECTURE.md §1 (계약) vs §2 이후 (형태).** §1은 "지켜야 하는 규칙(왜)" — 짧고 단정적. §2 이후는 "그 규칙을 구현하는 모양(어떻게)" — 스키마·필드·이벤트 목록. 규칙이 바뀌면 §1을 먼저 고치고 §2 이후를 따라 고친다.
- **ARCHITECTURE.md vs `extension/DESIGN.md`.** ARCHITECTURE는 컴포넌트 *간*, DESIGN은 Extension *내부*. 같은 내용을 두 쪽에 적지 않는다.
- **README.md vs ARCHITECTURE.md / DESIGN.md.** README는 **인간 독자**용. 계약·내부 설계는 링크로만.
- `docs/**`는 gitignore(원본 PDF·검토 초안 로컬). 일정 정본은 루트 `ROADMAP.md`.
- 파일이 새로 생기거나 용도가 바뀌면 위 표를 즉시 갱신한다.
- 배포 런북·CI·k8s는 필요할 때 추가한다. **빈 stub을 만들지 않는다.**

## 2. 수행 방법 (How we work in this repo)

- 계획·설계·구현 변경은 해당 문서를 먼저(또는 함께) 고친다: 계획 변경 → [ROADMAP.md](ROADMAP.md), 설계·규칙 변경 → [ARCHITECTURE.md](ARCHITECTURE.md)(또는 `extension/DESIGN.md`), 워크플로 변경 → 이 파일.
- 코드가 처음 들어오는 컴포넌트는 그 폴더의 `DESIGN.md`를 함께 만들고, 필요 시 이 파일의 §1 표 또는 `ARCHITECTURE.md` §1을 갱신한다.
- 컴포넌트에 첫 코드가 들어오면 `DESIGN.md`에 **`## Commands`**를 추가한다. 그 전까지는 존재하지 않는 명령을 적지 않는다.
- 개발은 TDD: 스켈레톤 → 테스트 → 구현.
- 한국어/영어 혼용 허용. 한 문서 내 일관성만 유지(한국어 본문 + 영어 식별자).

## 3. Status

`extension/` M1 착수(마이크로월드·ts-morph AST/KG). 계약·일정: [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md). 내부: [`extension/DESIGN.md`](extension/DESIGN.md).
