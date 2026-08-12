# Deploy / Local install

Extension을 **로컬에서 로드·설치**하는 방법. Marketplace/CI 자동 배포는 아직 없음(빈 CI stub 금지 — [ROADMAP](../ROADMAP.md)).  
빌드·단위 테스트 명령은 [`extension/DESIGN.md`](../extension/DESIGN.md) `## Commands`.

확장 매니페스트 루트는 **`extension/host/`** (`package.json`의 `main`·`contributes`).

## 사전 준비

```bash
cd extension
npm install
npm test
npm run compile
```

`host/out/extension.js`가 있어야 로드된다.

## A. Extension Development Host (권장 · 개발 스모크)

Marketplace 설치가 아니라, 별도 창에 소스 경로를 임시 로드한다.

```bash
# VS Code
code --extensionDevelopmentPath=/ABS/PATH/TO/codingland/extension/host

# Cursor
cursor --extensionDevelopmentPath=/ABS/PATH/TO/codingland/extension/host
```

경로는 **절대 경로**. 새 창 제목에 Extension Development Host가 보이면 성공.

선택: 저장소에 `.vscode/launch.json`을 두고 F5로 같은 효과를 낼 수 있다. `extensionDevelopmentPath`는 `extension/host`를 가리켜야 한다(현재 미포함).

코드 수정 후: `npm run compile`(또는 host `watch`) → Development Host에서 **Developer: Reload Window**.

## B. VSIX로 일반 설치 (영구에 가깝게)

개발 Host가 아니라 본인 프로필에 확장으로 남기고 싶을 때.

```bash
cd extension
npm run compile
cd host
npx @vscode/vsce package
```

생성물 예: `codingland-0.0.1.vsix`.

설치:

```bash
code --install-extension ./codingland-0.0.1.vsix
# Cursor: cursor --install-extension ./codingland-0.0.1.vsix
```

또는 Extensions 뷰 → `...` → **Install from VSIX...**.

`vsce`가 README/라이선스 경고를 내면 `--allow-missing-repository` 등 옵션으로 패키징하거나, host에 최소 README를 두면 된다. 배포용이 아니면 경고만 확인하면 충분하다.

### VSIX monorepo 제약 (M4 해소 예정)

현재 `host`가 workspace `@codingland/core`를 쓰면 `vsce package`가 `extension/../…` 상대 경로를 끌어 **실패**할 수 있다. **M4**에서 `.vscodeignore` + core 번들(또는 필요 산출만 포함)로 고친다. 그 전까지 로컬 검증은 **A. Extension Development Host**를 쓴다. 1차 제품 Done(M7)은 내부 VSIX dogfood — [ROADMAP](../ROADMAP.md).

## M0 스모크 체크

Development Host(또는 VSIX 설치 후 창)에서:

| 확인 | 방법 |
|------|------|
| Sidebar | Activity Bar **Codingland** → Agent & Debt |
| Panel | Command Palette → `Codingland: Show Panel Log` |
| Canvas | `Codingland: Open Canvas` 또는 `*.codingland.json` 열기 |
| Beside | `Codingland: Reveal Beside` |

단위 테스트만이면 VS Code 불필요: `extension/`에서 `npm test`.

## M7 dogfood 체크리스트 (계획)

구현·VSIX 패키징이 M4–M7에 갖춰지면 아래로 검증한다(현재는 Development Host + 샘플로 대체).

| 확인 | 방법 |
|------|------|
| 설치 | `cursor --install-extension ./codingland-*.vsix` 후 창 리로드 |
| 스캔 | 임의 TS/JS 워크스페이스 → `Codingland: Scan Workspace`(또는 열기 시 자동) → Panel 진행 로그 |
| Canvas | `Open Canvas` → 샘플 없이 경계 그래프·Beside |
| Gate | 편집 후 `Trigger Mirror Gate` / SCM 훅 → 합의 없이 Pass 없음 |
| Spec | Sidebar에서 Living Spec/`.codingland.md` 기록 |
| 제거 | `cursor --uninstall-extension yoosungung.codingland` |

## Marketplace / CI

**1차 Done(M7) Non-goal.** publisher id는 `host/package.json`의 `yoosungung`.  
공개 배포·OIDC/`vsce publish` 런북이 필요해지면 이 디렉터리에 추가하고 [AGENTS.md](../AGENTS.md) §1 표를 갱신한다. 빈 CI stub 금지.
