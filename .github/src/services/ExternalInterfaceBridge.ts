/**
 * ==========================================
 * AegisOS 外部介面橋接層
 * ==========================================
 * 負責管理所有對外部服務的連接
 * 包括: llama.cpp、Hugging Face、GitHub API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export const ExternalInterfaceBridge = {
  
  /**
   * 1️⃣ llama.cpp 本地端 RPC 介面
   * ─────────────────────────────────────
   * 呼叫在本地主機 (localhost:8080) 運行的 AI 模型
   * 用於: 所有智能體的本地推理
   * 
   * @param prompt - 使用者提示詞
   * @param systemPrompt - 系統角色提示詞
   * @returns 模型回應或錯誤訊息
   */
  async callLocalLlama(prompt: string, systemPrompt: string) {
    try {
      const response = await fetch('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'AegisOS-MultiAgent/1.0'
        },
        body: JSON.stringify({
          model: "local-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.2, // 低隨機性，確保安全審計與決策的嚴謹度
          max_tokens: 1024,
          top_p: 0.95
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      } as ApiResponse;
      
    } catch (error) {
      console.error("llama.cpp 連線異常:", error);
      return {
        success: false,
        error: "本地推理引擎（llama.cpp）未啟動，請確認 localhost:8080 運作狀態。",
        timestamp: new Date().toISOString()
      } as ApiResponse;
    }
  },

  /**
   * 2️⃣ Hugging Face API 介面
   * ─────────────────────────────────────
   * 由 Fetcher Agent 呼叫，取得熱門 AI 趨勢
   * 用於: 監控開源模型生態
   * 
   * @returns 熱門模型列表或錯誤訊息
   */
  async fetchHFTrends() {
    try {
      const response = await fetch(
        'https://huggingface.co/api/models?sort=downloads&direction=-1&limit=5',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AegisOS-MultiAgent/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HF API 回傳 HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      } as ApiResponse;
      
    } catch (error) {
      console.error("Hugging Face 連線異常:", error);
      return {
        success: false,
        error: "無法從 Hugging Face 獲取開源模型最新趨勢",
        timestamp: new Date().toISOString()
      } as ApiResponse;
    }
  },

  /**
   * 3️⃣ GitHub API 介面
   * ─────────────────────────────────────
   * 由 Coder Agent 呼叫，用來讀取專案代碼
   * 用於: 程式碼審查、版本控制
   * 
   * @param owner - 儲存庫所有者
   * @param repo - 儲存庫名稱
   * @param path - 檔案路徑
   * @param token - GitHub 個人存取令牌 (可選)
   * @returns 檔案內容或錯誤訊息
   */
  async getGitHubRepoContent(owner: string, repo: string, path: string, token?: string) {
    try {
      const headers: HeadersInit = { 
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AegisOS-MultiAgent/1.0'
      };
      
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`GitHub API 回傳 HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      } as ApiResponse;
      
    } catch (error) {
      console.error(`GitHub 連線異常 (${owner}/${repo}/${path}):`, error);
      return {
        success: false,
        error: `無法讀取 GitHub 儲存庫路徑: ${path}`,
        timestamp: new Date().toISOString()
      } as ApiResponse;
    }
  },

  /**
   * 4️⃣ GitHub API 輔助方法 - 獲取使用者資訊
   * ─────────────────────────────────────
   * 
   * @param username - GitHub 使用者名稱
   * @returns 使用者資訊或錯誤訊息
   */
  async getGitHubUser(username: string) {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AegisOS-MultiAgent/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      } as ApiResponse;
      
    } catch (error) {
      console.error(`無法獲取 GitHub 使用者 ${username}:`, error);
      return {
        success: false,
        error: `無法獲取使用者資訊: ${username}`,
        timestamp: new Date().toISOString()
      } as ApiResponse;
    }
  }
};

/**
 * ==========================================
 * 使用示例
 * ==========================================
 * 
 * // Orchestrator 呼叫本地 LLaMA
 * const response = await ExternalInterfaceBridge.callLocalLlama(
 *   "分析此程式碼安全性",
 *   AGENT_PROMPTS.Orchestrator
 * );
 * 
 * // Fetcher 監控模型趨勢
 * const trends = await ExternalInterfaceBridge.fetchHFTrends();
 * 
 * // Coder 讀取程式碼
 * const code = await ExternalInterfaceBridge.getGitHubRepoContent(
 *   "owner",
 *   "repo",
 *   "src/main.ts",
 *   process.env.GITHUB_TOKEN
 * );
 */
