# Extension Host QA scenarios

Factory QA runs `.factory/quality.yaml` `e2e.command` (`npm --prefix extension run test:vscode`), not Chromium against a URL.

| id | check |
|----|--------|
| smoke-activate | `yoosungung.codingland` activates in Extension Development Host |
| smoke-triggerGate | `codingland.triggerGate` is registered and returns a GateSmokeResult |

Evidence shape: `qa: e2e pass scenario=<id> evidence=<log/url>`.
