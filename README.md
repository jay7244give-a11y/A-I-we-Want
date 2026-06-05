/**
 * ==========================================
 * AegisOS 多代理人系統 - 完整系統整合指南
 * ==========================================
 * 
 * 📋 文件初始化順序 (Initialization Order)
 * 
 * 執行優先級從高到低:
 * 
 * [1] 核心類型定義層
 *     └─ .github/src/context/AgentContext.tsx
 *        ├─ AgentRole (型別)
 *        ├─ ActionStatus (型別)
 *        ├─ AgentMessage (介面)
 *        ├─ AGENT_PROMPTS (常量)
 *        └─ AgentProvider + useAgentSystem (Hook)
 * 
 * [2] 外部介面橋接層
 *     └─ .github/src/services/ExternalInterfaceBridge.ts
 *        ├─ callLocalLlama()         - llama.cpp 本地推理
 *        ├─ fetchHFTrends()          - Hugging Face API
 *        ├─ getGitHubRepoContent()   - GitHub API 讀取
 *        └─ getGitHubUser()          - GitHub 使用者查詢
 * 
 * [3] UI 控制層
 *     └─ .github/src/src/components/apps/WorkflowControlCenter.tsx
 *        ├─ 消費: useAgentSystem Hook
 *        ├─ 消費: ExternalInterfaceBridge 服務
 *        └─ 提供: 完整的終端機界面
 * 
 * [4] 應用入口層
 *     └─ .github/src/src/components/apps/Provider.tsx (App.tsx)
 *        ├─ 包裝: AgentProvider
 *        └─ 掛載: WorkflowControlCenter
 * 
 * [5] CI/CD 部署流程
 *     └─ .github/workflows/jekyll-gh-pages.yml
 *        └─ 自動構建並部署到 GitHub Pages
 * 
 * 
 * ==========================================
 * 🔗 依賴關係圖
 * ==========================================
 * 
 * index.tsx (React 根入口)
 *   ↓
 * App.tsx (Provider.tsx)
 *   ├─ AgentProvider (Context)
 *   │   ├─ AGENT_PROMPTS (從 AgentContext 導入)
 *   │   ├─ useAgentSystem() Hook
 *   │   └─ 全局狀態管理
 *   │
 *   └─ WorkflowControlCenter (UI 組件)
 *       ├─ useAgentSystem() Hook (消費)
 *       ├─ ExternalInterfaceBridge (調用服務)
 *       │   ├─ callLocalLlama()
 *       │   ├─ fetchHFTrends()
 *       │   └─ getGitHubRepoContent()
 *       └─ 終端機 UI (接收使用者輸入)
 * 
 * 
 * ==========================================
 * 📦 環境變數配置 (.env.local)
 * ==========================================
 * 
 * # LLaMA 本地推理引擎
 * VITE_LLAMA_ENDPOINT=http://localhost:8080
 * 
 * # Hugging Face Token (可選，用於更高的 API 限額)
 * VITE_HF_TOKEN=your_hugging_face_token_here
 * 
 * # GitHub Token (建議用於 GitHub API 調用)
 * VITE_GITHUB_TOKEN=your_github_token_here
 * 
 * # 應用配置
 * VITE_APP_TITLE=AegisOS
 * VITE_APP_ENV=development
 * 
 * 
 * ==========================================
 * 🚀 快速啟動指南
 * ==========================================
 * 
 * 1️⃣ 安裝依賴
 *    $ npm install
 * 
 * 2️⃣ 啟動本地 LLaMA 服務 (可選但推薦)
 *    $ ollama run llama2  # 或其他模型
 *    # 或使用 llama.cpp:
 *    $ ./server -m model.gguf -ngl 32 -p 8080
 * 
 * 3️⃣ 配置環境變數
 *    $ cp .env.example .env.local
 *    $ # 編輯 .env.local 並填入必要的 token
 * 
 * 4️⃣ 開發模式運行
 *    $ npm run dev
 * 
 * 5️⃣ 訪問應用
 *    Open http://localhost:5173 in your browser
 * 
 * 
 * ==========================================
 * 🧠 多代理人工作流程示例
 * ==========================================
 * 
 * 用戶輸入: "檢查這個 repo 的安全性"
 *   ↓
 * [System] 初始化工作流
 *   ↓
 * [Orchestrator] 解析意圖 (callLocalLlama)
 *   ├─ 理解: 需要進行安全審查
 *   └─ 拆解: 獲取程式碼 → 分析 → 生成報告
 *   ↓
 * [Fetcher] 從 GitHub 獲取程式碼 (getGitHubRepoContent)
 *   └─ 返回: 檔案內容、大小、結構
 *   ↓
 * [Critic] 安全審查 (callLocalLlama with AGENT_PROMPTS.Critic)
 *   ├─ 檢查: 注入風險、權限問題、邏輯漏洞
 *   ├─ 決策: Approve / Reject
 *   └─ 反饋: 詳細安全報告
 *   ↓
 * [Coder] 生成修復建議 (基於 Critic 反饋)
 *   └─ 輸出: 修復代碼片段、最佳實踐
 *   ↓
 * [Memory] 儲存對話記錄
 *   └─ 索引: 向量化存儲供未來查詢
 *   ↓
 * [WorkflowControlCenter] 顯示結果
 *   └─ UI: 進度條、訊息流、手動干預按鈕
 * 
 * 
 * ==========================================
 * 🔒 安全架構說明
 * ==========================================
 * 
 * ✅ 多層審查機制
 *    ├─ Orchestrator: 意圖驗證
 *    ├─ Critic: 強制性安全檢查
 *    └─ User: 最終人工審批 (Override)
 * 
 * ✅ 隔離執行沙盒
 *    └─ Coder 在限定目錄執行 (如 app/src)
 * 
 * ✅ 加密日誌存儲
 *    └─ Memory 對敏感數據進行加密
 * 
 * ✅ 實時威脅監控
 *    └─ Security 代理持續監控異常
 * 
 * 
 * ==========================================
 * 📊 代理人優先級與職責
 * ==========================================
 * 
 * 優先級 0: System (系統協調引擎)
 *   └─ 工作流生命週期、訊息路由、狀態同步
 * 
 * 優先級 1: Orchestrator (中央大腦)
 *   └─ 解析意圖、拆解任務、協調其他代理
 * 
 * 優先級 2: Critic (安全監控官)
 *   └─ 實時審查、風險評估、強行阻止危險操作
 * 
 * 優先級 3: Fetcher + Security (感官官 + 看守)
 *   ├─ Fetcher: 監聽 API、新聞、RSS、GitHub 更新
 *   └─ Security: 日誌監控、異常檢測、威脅評估
 * 
 * 優先級 4: Coder (執行官)
 *   └─ 程式碼編修、沙盒執行、版本管理
 * 
 * 優先級 5: Memory (記憶官)
 *   └─ 對話摘要、向量索引、長期記憶
 * 
 * 
 * ==========================================
 * 🧪 本地測試
 * ==========================================
 * 
 * 1. 測試 Context 層
 *    └─ 驗證 AgentProvider 正確掛載
 *    └─ 驗證 useAgentSystem Hook 可用
 * 
 * 2. 測試服務層
 *    └─ 測試 ExternalInterfaceBridge.callLocalLlama()
 *    └─ 測試 ExternalInterfaceBridge.fetchHFTrends()
 *    └─ 測試 ExternalInterfaceBridge.getGitHubRepoContent()
 * 
 * 3. 測試 UI 層
 *    └─ 測試終端機輸入
 *    └─ 測試訊息流展示
 *    └─ 測試進度條更新
 *    └─ 測試手動干預按鈕
 * 
 * 
 * ==========================================
 * 🎯 後續開發路線圖
 * ==========================================
 * 
 * Phase 1 (Current): 基礎架構
 *   ✓ 多代理人上下文系統
 *   ✓ 外部服務集成
 *   ✓ 基礎 UI 組件
 * 
 * Phase 2: 增強功能
 *   ⏳ 持久化存儲 (IndexedDB/localStorage)
 *   ⏳ WebSocket 實時推送
 *   ⏳ 向量數據庫集成
 * 
 * Phase 3: 生產就緒
 *   ⏳ 完整的錯誤邊界
 *   ⏳ 性能最佳化
 *   ⏳ 完整的單元測試
 * 
 * Phase 4: 企業功能
 *   ⏳ RBAC 權限管理
 *   ⏳ 審計日誌
 *   ⏳ 多租戶支持
 */

export const SYSTEM_ARCHITECTURE = {
  layers: {
    "Layer 1": "AgentContext - 狀態管理與 Hook",
    "Layer 2": "ExternalInterfaceBridge - 外部服務集成",
    "Layer 3": "WorkflowControlCenter - UI 控制層",
    "Layer 4": "App (Provider) - 應用入口",
    "Layer 5": "Jekyll GitHub Pages - 部署"
  },
  
  fileStructure: {
    ".github/src/": {
      "context/": ["AgentContext.tsx"],
      "services/": ["ExternalInterfaceBridge.ts"],
      "src/components/apps/": ["WorkflowControlCenter.tsx", "Provider.tsx"],
    },
    ".github/workflows/": ["jekyll-gh-pages.yml"]
  },
  
  agents: {
    "Orchestrator": "中央大腦",
    "Critic": "安全監控官",
    "Fetcher": "感官官",
    "Security": "看守人",
    "Coder": "執行官",
    "Memory": "記憶官",
    "System": "協調引擎"
  }
};
贡献

欢迎提交 Issue 和 Pull Request。请先阅读 贡 献指南。

许可证

MIT © A-I-we-Want

联系

如有问题,请通过Issues 反馈。
