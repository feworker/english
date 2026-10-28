# 北京小升初英语词汇与句式练习

完整保留 1,134 个词条（含 30 个词组）、27 个主题、12 课句式练习。首页提供全库搜索、主题筛选、字母排序和分页学习，不再展示原目录树。词义、音标、词性、词根/词形、助记、例句、关联内容及课程正文保持原样。

访问：https://feworker.github.io/english/

当前学习页面通过微软 TTS 动态生成发音，听写页也支持浏览器语音。`assets/config/tts-config.js` 配置语音后端 HTTPS 地址；Azure 密钥只能存储在后端。接口接收 POST JSON {text, voice}，返回 audio/mpeg 并允许 https://feworker.github.io 跨域请求。GitHub Pages 只负责托管静态网页。原音频 JSON 包统一保留在 `audio/`，当前页面不依赖这些旧音频包。运行时音频由服务或浏览器生成，不落盘。

## 目录结构

```text
english/
├── index.html                 # 词汇与句式入口
├── dictation.html             # 单词听写入口
├── audio/                     # 原音频 JSON 包
└── assets/
    ├── js/                    # 应用、听写与语音脚本
    ├── css/                   # 样式
    ├── data/                  # 词库相关数据、课程正文 JSON
    ├── config/                # 语音配置、内容清单及 UI 构建配置
    ├── src/                   # React/TypeScript 源码、shadcn 组件及主题变量
    ├── icons/                 # 页面图标
    ├── pages/                 # 12 个句式课程页面
    ├── tests/                 # Node.js 与浏览器回归测试
    └── docs/                  # README、说明、历史校验记录
        └── licenses/          # 数据来源许可
```

课程页面通过相对 `base` 指向项目根目录，支持站点根路径和 GitHub Pages 的 `/english/` 子路径。词库中的课程链接已更新到 `assets/pages/`，课程数据加载到 `assets/data/lessons.json`。请从项目根目录启动 HTTP 服务或发布 GitHub Pages。

## 单词听写

首页和句式课程的顶部提供「单词听写」入口，独立页面为 `dictation.html`。从首页进入时沿用当前主题，也可通过 `dictation.html?topic=08` 指定主题。直接复用 `assets/js/library.js` 的全部 27 个主题和 1,134 个词条（含词组）。目录整理只更新课程链接与已编译 React 文件中的课程数据路径，词条和课程正文保持原样。

- 看中文写英文，或只听英文写单词。中文提示可选择同时朗读。
- 每轮 10 / 20 / 50 个或所选范围全部；支持随机或原词库顺序。
- 自动播报支持 3–30 秒答题间隔、每词 1–3 遍和慢 / 正常 / 快语速。间隔从本词全部播报结束后开始计算。
- 重播和继续会重新播报当前提示并重置间隔；暂停、页面隐藏、离开页面会停止播报和计时。手动模式可按 Enter 或点击下一词。
- 结束后核对已出题的答案、重练错词，并导出 TXT 结果。大小写、首尾 / 连续空格及弯撇号不影响核对；拼写、词组空格和连字符仍需正确。设置保存在本机，答题内容只保存在当前页面内存中。

听写优先使用已配置的微软服务：英文 `en-US-JennyNeural`，中文 `zh-CN-XiaoxiaoNeural`。后端应支持这两个 `voice` 值。地址为空或微软服务失败时，听写页尝试浏览器 Web Speech API，声音及自动连续播放能力取决于浏览器和设备；失败会暂停，允许重播或改用中文提示并关闭朗读。原词库 / 课程页仍沿用原有微软语音逻辑。

仓库包含已构建的静态发布文件，直接使用或部署无需构建。听写页源代码位于 `assets/src/`，采用 React + TypeScript、官方 shadcn New York 组件、Radix、Tailwind、CVA 和 lucide。需要修改源代码时执行：

```sh
npm ci --prefix assets/config
npm --prefix assets/config run typecheck
npm --prefix assets/config run build
```

构建配置和锁文件集中在 `assets/config/`，输出仍位于 `assets/js/`、`assets/css/` 和 `assets/icons/`。组件源来自官方 `https://ui.shadcn.com/r/styles/new-york/` 注册表，按本项目绿色／米白主题、紧凑密度和小圆角调整；Select 保留边界、焦点和键盘行为，答案输入通过显式 `answer` 变体设为 44px，触屏点击区域至少 44px。样式值通过明暗主题变量统一管理。

可用 `python3 -m http.server 8765` 启动后访问 `http://localhost:8765/dictation.html`。不要直接以 `file://` 打开 ES 模块页面。纯逻辑和目录回归测试使用 Node.js 22+：`node --test assets/tests/*.test.mjs`。

浏览器回归：执行 `npm ci --prefix assets/config` 安装开发依赖，保持上述 HTTP 服务运行，从项目根目录执行 `node assets/tests/dictation.browser.mjs`（默认使用已安装的 Chrome）。覆盖入口、主题传递、全部课程加载、课程切换与返回、中文 / 音频两种模式、倒计时、重复播放、暂停 / 重播 / 页面隐藏、失败恢复、核对、错词重练、导出与手机布局。语音使用受控桩验证时序，不替代真实设备或已配置微软后端的音质测试。可通过 `DICTATION_TEST_URL` 指定项目子路径的测试地址。

UI 自检：安装上述开发依赖后，执行 `node assets/tests/ui.audit.mjs` 和 `node assets/tests/ui-states.audit.mjs`。输出目录默认是系统临时目录，可用 `DICTATION_AUDIT_OUTPUT` 指定。包含明暗主题／四种宽度、颜色对比度、焦点／浮层／禁用状态、触屏点击区、加载与错误、滚动和打印视图；自动截图仍需要人工逐图检查，不能替代浏览器标签栏和真实设备验证。

GitHub Pages：Settings → Pages → Deploy from a branch → master / (root)。

原有使用说明和校验记录保留在 `assets/docs/`，仅描述原文件的检查结果与旧版离线行为；其中历史路径以当时版本为准。

## 分支协作

以 `master` 为默认分支和 GitHub Pages 发布来源。功能分支合入前先 rebase 到最新 `master`，通过 Rebase merge 合并；仓库只启用 Rebase merge，并开启合并后自动删除源分支。本地分支在确认合入后也删除。使用命令行时采用 rebase 后的快进合并，不创建额外合并提交。
