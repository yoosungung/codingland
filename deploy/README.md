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

## M0 스모크 체크

Development Host(또는 VSIX 설치 후 창)에서:

| 확인 | 방법 |
|------|------|
| Sidebar | Activity Bar **Codingland** → Agent & Debt |
| Panel | Command Palette → `Codingland: Show Panel Log` |
| Canvas | `Codingland: Open Canvas Stub` 또는 `*.codingland.json` 열기 |
| Beside | `Codingland: Reveal Beside` |

단위 테스트만이면 VS Code 불필요: `extension/`에서 `npm test`.

## Marketplace / CI

미정. publisher id는 `host/package.json`의 `yoosungung`.  
공개 배포·OIDC/`vsce publish` 런북이 필요해지면 이 디렉터리에 추가하고 [AGENTS.md](../AGENTS.md) §1 표를 갱신한다.
