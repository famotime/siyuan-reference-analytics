# 重构计划

## 1. 项目快照

- 生成日期：2026-03-14
- 范围：`D:\MyCodingProjects\siyuan-context-lens`
- 目标：在不改变现有产品语义的前提下，降低分析层与 UI 编排层的复杂度，收敛重复逻辑，建立更稳定的重构落点。
- 文档刷新目标：`docs/project-structure.md`、`README.md`
- 当前基线：
  - `npm test`：pass（23 个测试文件，99 个测试）
  - `npm run build`：pass
  - `docs/project-structure.md`：当前不存在，获批条目完成后需要新建并同步

## 2. 架构与模块分析

| 模块 | 关键文件 | 当前职责 | 主要痛点 | 测试覆盖情况 |
| --- | --- | --- | --- | --- |
| 入口与生命周期 | `src/index.ts`、`src/main.ts` | 插件加载、配置持久化、Dock/设置面板挂载 | 生命周期相对清晰，当前不是主要重构瓶颈 | 间接被 `src/App.test.ts` 和组合式测试覆盖，无独立入口测试 |
| UI 主界面 | `src/App.vue` | 筛选器、统计卡片、详情联动、路径查看、拖拽排序交互与大体样式 | 文件 1409 行，模板/状态映射/拖拽交互和样式高度集中；目前测试多为源码字符串断言，约束行为但不利于安全拆分 | `src/App.test.ts` 覆盖静态结构关键点，组件级行为覆盖有限 |
| UI 编排与状态 | `src/composables/use-analytics.ts` | 快照加载、筛选状态、分析结果派生、摘要详情联动、路径计算、主题建议写入、卡片排序与面板折叠 | 文件 773 行，混合了纯计算、配置持久化联动、插件 API 副作用和 UI 选择状态；公开返回面过大，修改时容易牵连多处 | `src/composables/use-analytics.test.ts` 覆盖核心公开行为，但内部职责未被模块化约束 |
| 图分析核心 | `src/analytics/analysis.ts` | 时间窗口过滤、图构建、社区/桥接/孤立/沉没/传播节点与趋势分析 | 文件 1106 行，算法集中但职责偏多；时间解析、标题/标签归一化等基础逻辑在别处重复实现 | `src/analytics/analysis.test.ts` 覆盖较好，是最稳的回归保护层之一 |
| 摘要卡片与详情构建 | `src/analytics/summary-details.ts` | 统计卡片定义、详情 section 组装、建议映射、活跃关系明细 | 文件 512 行；与 `analysis.ts` 在时间解析、标题解析、筛选后文档集合等方面存在重复和潜在漂移风险 | `src/analytics/summary-details.test.ts` 覆盖较好 |
| 数据采集 | `src/analytics/siyuan-data.ts`、`src/analytics/internal-links.ts` | SQL 读取、refs + markdown fallback 合并、引用去重 | 职责相对明确，但引用签名、标签解析与其他模块的归一化规则未统一 | `src/analytics/siyuan-data.test.ts`、`src/analytics/internal-links.test.ts` 覆盖关键场景 |
| 主题/已读/孤立修复辅助 | `src/analytics/theme-documents.ts`、`src/analytics/read-status.ts`、`src/analytics/orphan-theme-links.ts` | 主题文档识别、已读规则、孤立文档链接修复 | 单文件体量可控，但标题/标签解析规则与其他模块重复，后续适合归并到共享 helper | 各自已有针对性测试 |
| 设置页 | `src/components/SettingPanel.vue` | 主题文档、统计卡片、已读规则设置，运行时拉取笔记本与标签 | 文件 318 行，包含 UI 与数据准备逻辑；标签解析规则与别处重复 | `src/components/SettingPanel.test.ts` 仅覆盖关键结构，测试还有补强空间 |

## 3. 按优先级排序的重构待办

| ID | 优先级 | 模块/场景 | 涉及文件 | 重构目标 | 风险等级 | 重构前测试清单 | 文档影响 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RF-001 | P0 | 统一分析层的时间/标题/标签归一化基础能力 | `src/analytics/analysis.ts`、`src/analytics/summary-details.ts`、`src/analytics/read-status.ts`、`src/analytics/theme-documents.ts`、`src/composables/use-analytics.ts`、`src/components/SettingPanel.vue`，以及新增共享 helper 文件 | 抽出共享基础函数，消除重复的 `parseTimestamp`、标题解析、标签解析与日期格式化逻辑，确保分析结果、详情展示、设置选项和已读规则采用同一口径 | 高 | - [x] 新增共享 helper 测试，覆盖本地时间窗口、标题回退顺序、标签拆分规则；- [x] 保留 `src/analytics/analysis.test.ts` 作为语义回归保护；- [x] 更新 `src/analytics/summary-details.test.ts`，确认详情时间窗口口径与分析层一致；- [x] 定向运行 `npm test -- src/analytics/document-utils.test.ts src/analytics/analysis.test.ts src/analytics/summary-details.test.ts src/analytics/read-status.test.ts src/analytics/theme-documents.test.ts src/analytics/siyuan-data.test.ts src/components/SettingPanel.test.ts` | `docs/project-structure.md`：已补共享 helper 模块说明；`README.md`：已补共享口径与测试说明 | done |
| RF-002 | P0 | 拆分 `useAnalyticsState` 的纯派生逻辑与副作用逻辑 | `src/composables/use-analytics.ts`，以及新增 `src/composables/use-analytics-derived.ts`、`src/composables/use-analytics-interactions.ts` | 将快照派生、摘要详情选择、路径候选、卡片顺序/面板折叠状态、主题建议写入等职责分层，保留现有公开 API 不变，降低后续功能迭代的修改面 | 高 | - [x] 新增 `src/composables/use-analytics-derived.test.ts`，覆盖标签选项、路径候选、孤立建议映射和详情计数；- [x] 保留 `src/composables/use-analytics.test.ts` 作为公开 API 回归保护；- [x] 定向运行 `npm test -- src/composables/use-analytics-derived.test.ts src/composables/use-analytics.test.ts src/analytics/link-associations.test.ts` | `docs/project-structure.md`：已补状态编排拆分后的职责映射；`README.md`：已更新内部结构与测试说明 | done |
| RF-003 | P1 | 拆分 `App.vue` 中的详情区域与卡片拖拽映射逻辑 | `src/App.vue`、`src/components/SummaryCardsGrid.vue`、`src/components/SummaryDetailSection.vue` | 把大块详情模板和卡片交互映射拆成更小的表现层组件，减少 `App.vue` 模板密度，并把当前以源码字符串为主的测试升级为更接近渲染行为的断言 | 中 | - [x] 新增 `src/components/SummaryCardsGrid.test.ts` 与 `src/components/SummaryDetailSection.test.ts`；- [x] 更新 `src/App.test.ts`，将关注点收敛到组合关系和页面级布局；- [x] 定向运行 `npm test -- src/App.test.ts src/components/SummaryCardsGrid.test.ts src/components/SummaryDetailSection.test.ts src/components/RankingPanel.test.ts src/components/OrphanDetailPanel.test.ts src/components/DormantDetailPanel.test.ts` | `docs/project-structure.md`：已更新主界面组件树；`README.md`：已同步子组件拆分说明 | done |
| RF-004 | P2 | 设置页数据准备逻辑下沉 | `src/components/SettingPanel.vue`、`src/components/setting-panel-data.ts` | 抽出笔记本与标签选项加载、默认值修正和标签收集逻辑，让设置页更接近纯展示层；此项建立在 RF-001 的共享解析函数上 | 低 | - [x] 新增 `src/components/setting-panel-data.test.ts`，覆盖默认值初始化、标签选项构建和加载回退；- [x] 保留 `src/components/SettingPanel.test.ts` 与 `src/analytics/read-status.test.ts` 作为回归保护；- [x] 定向运行 `npm test -- src/components/setting-panel-data.test.ts src/components/SettingPanel.test.ts src/analytics/read-status.test.ts` | `docs/project-structure.md`：已补设置页 helper；`README.md`：已同步设置页数据 helper 说明 | done |

优先级说明：
- `P0`：价值和风险都最高，优先执行
- `P1`：价值或风险中等，放在 `P0` 之后
- `P2`：低风险清理项，最后执行

状态说明：
- `pending`
- `in_progress`
- `done`
- `blocked`

## 4. 执行日志

| ID | 开始日期 | 结束日期 | 验证命令 | 结果 | 已刷新文档 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| BASELINE | 2026-03-14 | 2026-03-14 | `npm test`；`npm run build` | pass | 未开始 | 当前仓库基线可重构 |
| RF-001 | 2026-03-14 | 2026-03-14 | `npm test -- src/analytics/document-utils.test.ts src/analytics/analysis.test.ts src/analytics/summary-details.test.ts src/analytics/read-status.test.ts src/analytics/theme-documents.test.ts src/analytics/siyuan-data.test.ts src/components/SettingPanel.test.ts`；`npm test`；`npm run build` | pass | `docs/project-structure.md`、`README.md` | 新增共享 helper，并修正详情层与分析层的本地时间窗口口径漂移 |
| RF-002 | 2026-03-14 | 2026-03-14 | `npm test -- src/composables/use-analytics-derived.test.ts src/composables/use-analytics.test.ts src/analytics/link-associations.test.ts`；`npm test`；`npm run build` | pass | `docs/project-structure.md`、`README.md` | 新增纯派生选择器与交互副作用控制器，`useAnalyticsState` 保持原有公开 API |
| RF-003 | 2026-03-14 | 2026-03-14 | `npm test -- src/App.test.ts src/components/SummaryCardsGrid.test.ts src/components/SummaryDetailSection.test.ts src/components/RankingPanel.test.ts src/components/OrphanDetailPanel.test.ts src/components/DormantDetailPanel.test.ts`；`npm test`；`npm run build` | pass | `docs/project-structure.md`、`README.md` | 新增顶部统计卡片区和详情区组件，`App.vue` 改为页面级组合 |
| RF-004 | 2026-03-14 | 2026-03-14 | `npm test -- src/components/setting-panel-data.test.ts src/components/SettingPanel.test.ts src/analytics/read-status.test.ts`；`npm test`；`npm run build` | pass | `docs/project-structure.md`、`README.md` | 设置页默认值修正、标签收集和初始化加载已下沉到 helper |

## 5. 决策与确认

- 用户批准的条目：`RF-001`、`RF-002`、`RF-003`、`RF-004`
- 延后的条目：
- 阻塞条目及原因：
- 当前建议执行顺序：`RF-001` -> `RF-002` -> `RF-003` -> `RF-004`

## 6. 文档刷新

- `docs/project-structure.md`：已新建并刷新，写入入口、分析层、组合式状态层、UI 层、设置页 helper、类型与测试分布
- `README.md`：已刷新，补充共享 helper、composable 拆分、UI 子组件拆分与新增测试覆盖说明
- 最终同步检查：已完成，文档内容与当前获批范围内代码结构一致

## 7. 下一步

1. 当前计划内条目已全部完成，可进入评审、提交或后续功能开发阶段。
2. 如果继续做结构优化，下一轮更适合聚焦 `src/analytics/analysis.ts` 的算法分层，而不是再拆表现层。
3. 如果继续做 UI 演进，可为 `SummaryDetailSection.vue` 里的趋势区再拆出独立组件，但这不再是当前计划的必要项。
