import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * ==========================================
 * 1️⃣ 核心型別定義 (Type Definitions)
 * ==========================================
 */
export type AgentRole = 'Orchestrator' | 'Critic' | 'Fetcher' | 'Security' | 'Coder' | 'Memory' | 'System';
export type ActionStatus = 'pending' | 'running' | 'approved' | 'rejected' | 'completed' | 'failed';

export interface AgentMessage {
  id: string;
  timestamp: string;
  sender: AgentRole;
  receiver: AgentRole;
  content: string;
  type: 'dialogue' | 'action_proposal' | 'audit_report' | 'system_log';
  actionMetadata?: {
    actionName: string;
    targetPayload: any;
    status: ActionStatus;
    criticFeedback?: string;
  };
}

interface AgentContextType {
  messages: AgentMessage[];
  activeWorkflow: { task: string; progress: number } | null;
  sendMessage: (msg: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
  updateActionStatus: (msgId: string, status: ActionStatus, feedback?: string) => void;
  startWorkflow: (task: string) => void;
  clearLogs: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

/**
 * ==========================================
 * 2️⃣ 五大智能體系統提示詞 (System Prompts)
 * ==========================================
 */
export const AGENT_PROMPTS = {
  Orchestrator: `你是 AegisOS 的中央大腦，負責接收使用者意圖並拆解任務流。你必須將操作轉化為 Action Schema 發送，且任何動作前必須提交給 Critic 進行安全審查。
優先級: 1 (最高)
職責:
- 解析使用者指令
- 拆解複雜任務為子任務
- 協調其他代理人執行
- 監控工作流進度`,

  Critic: `你是最高安全監控與紅隊審計官。你負責實時攔截並審查總管的 action_proposal，嚴格檢查越權、DOM 注入與幻覺風險。若有風險必須強行將狀態改為 rejected 並記錄證詞。
優先級: 2 (次高)
職責:
- 審查所有操作提案
- 識別安全風險
- 發出核准/駁回決策
- 記錄安全事件`,

  Fetcher: `你是外部世界感官與通訊官。負責監聽外部 API、新聞、RSS 與 GitHub 狀態。負責將數據清洗、結構化後提供給總管，並在發現重大更新時主動發起通知。
優先級: 3
職責:
- 監聽外部數據源
- API 數據拉取與清洗
- 事件通知
- 趨勢分析`,

  Security: `你是基礎設施安全看守人。監控系統日誌、異常流量與權限變更。提供實時威脅評估與隔離建議。
優先級: 3
職責:
- 日誌監控
- 異常檢測
- 威脅評估
- 隔離建議`,

  Coder: `你是底層執行與代碼編修員。在限定的虛擬沙盒目錄（如 app/src）內進行程式碼增修，配合進行安全審計。所有寫入動作前必須通過 Critic 審查。
優先級: 4
職責:
- 程式碼實現
- 沙盒執行
- 版本管理
- 測試驗證`,

  Memory: `你是長期記憶與操作習慣索引官。負責將多智能體對話摘要並轉化為向量索引。確保所有涉及使用者操作習慣、指紋與聲音憑證的日誌數據完全加密。
優先級: 5
職責:
- 對話摘要
- 向量索引化
- 數據加密
- 長期記憶`,

  System: `你是系統協調引擎，負責管理工作流生命週期、訊息路由與狀態同步。不直接執行業務邏輯，而是確保整個多代理人系統的平穩運作。
優先級: 0 (系統級)
職責:
- 工作流管理
- 訊息路由
- 狀態同步
- 系統診斷`
};

/**
 * ==========================================
 * 3️⃣ AgentProvider 組件實現
 * ==========================================
 */
export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<{ task: string; progress: number } | null>(null);

  /**
   * 發送訊息
   */
  const sendMessage = useCallback((msg: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  /**
   * 更新操作狀態
   */
  const updateActionStatus = useCallback((msgId: string, status: ActionStatus, feedback?: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId && msg.actionMetadata
          ? {
              ...msg,
              actionMetadata: {
                ...msg.actionMetadata,
                status,
                criticFeedback: feedback || msg.actionMetadata.criticFeedback,
              },
            }
          : msg
      )
    );
    
    // 根據狀態更新工作流進度
    if (status === 'rejected') {
      setActiveWorkflow((prev) => prev ? { ...prev, progress: Math.max(10, prev.progress - 20) } : null);
    } else if (status === 'completed') {
      setActiveWorkflow((prev) => prev ? { ...prev, progress: 100 } : null);
    } else if (status === 'approved') {
      setActiveWorkflow((prev) => prev ? { ...prev, progress: Math.min(90, prev.progress + 15) } : null);
    }
  }, []);

  /**
   * 啟動工作流
   */
  const startWorkflow = useCallback((task: string) => {
    setActiveWorkflow({ task, progress: 10 });
    sendMessage({
      sender: 'System',
      receiver: 'Orchestrator',
      content: `初始化工作流："${task}"`,
      type: 'system_log',
    });
  }, [sendMessage]);

  /**
   * 清除所有日誌
   */
  const clearLogs = () => {
    setMessages([]);
    setActiveWorkflow(null);
  };

  return (
    <AgentContext.Provider 
      value={{ 
        messages, 
        activeWorkflow, 
        sendMessage, 
        updateActionStatus, 
        startWorkflow, 
        clearLogs 
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

/**
 * ==========================================
 * 4️⃣ Hook: useAgentSystem
 * ==========================================
 */
export const useAgentSystem = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentSystem 必須在 AgentProvider 內使用');
  }
  return context;
};
