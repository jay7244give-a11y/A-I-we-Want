export const ExternalInterfaceBridge = {
  
  /**
   * 1. llama.cpp 本地端 RPC 介面
   * 呼叫你在本地主機 (localhost:8080) 運行的 AI 模型
   */
  async callLocalLlama(prompt: string, systemPrompt: string) {
    try {
      const response = await fetch('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "local-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.2, // 低隨機性，確保安全審計與決策的嚴謹度
          max_tokens: 1024
        })
      });
      return await response.json();
    } catch (error) {
      console.error("llama.cpp 連線異常:", error);
      return { error: "本地推理引擎（llama.cpp）未啟動，請確認 localhost:8080 運作狀態。" };
    }
  },

  /**
   * 2. Hugging Face API 介面 (由 Fetcher Agent 呼叫，取得熱門 AI 趨勢)
   */
  async fetchHFTrends() {
    try {
      const response = await fetch('https://huggingface.co/api/models?sort=downloads&direction=-1&limit=5');
      if (!response.ok) throw new Error("HF API 回傳錯誤");
      return await response.json();
    } catch (error) {
      return { error: "無法從 Hugging Face 獲取開源模型最新趨勢" };
    }
  },

  /**
   * 3. GitHub API 介面 (由 Coder Agent 呼叫，用來讀取專案代碼)
   */
  async getGitHubRepoContent(owner: string, repo: string, path: string, token?: string) {
    try {
      const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
      if (token) headers['Authorization'] = `token ${token}`;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
      if (!response.ok) throw new Error("GitHub API 拒絕存取");
      return await response.json();
    } catch (error) {
      return { error: `無法讀取 GitHub 儲存庫路徑: ${path}` };
    }
  }
};
