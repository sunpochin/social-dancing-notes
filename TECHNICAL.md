<!--
檔案用途：專案技術決策與 AI 協作索引。
所在層：repository root。
主要關聯：AGENTS.md、TECHNICAL.md。
-->

# social-dancing-notes 技術索引

## AI harness 與工作流程

- [憲法](AGENTS.md)、[Agent Map](docs/AGENT_MAP.md)、[移植決策與排除方案](docs/agents/harness-port.md)。
- [Git／多 repo／submodule](docs/agents/git-workflow.md)、[Review](docs/agents/review-governance.md)、[本機指令與 hook](docs/agents/local-tools.md)。
- [Issue 交接](docs/agents/issue-driven-workflow.md)、[模型風險](docs/ai/model-routing.md)、[Skill 安全](docs/agents/skill-security.md)、[指定 Goal](docs/agents/codex-autopilot.md)。

保留各 repo 獨立可用的規則正本；不引用相鄰 checkout 作執行期依賴。選擇 Node 標準函式庫共用防線，不搬來源專屬平台與自動發布。詳見移植決策。
