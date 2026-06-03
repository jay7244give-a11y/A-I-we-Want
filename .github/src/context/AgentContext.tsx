import React, { createContext, useContext, useState, useCallback } from 'react';

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

// ==========================================
// 五大智能體系統提示詞 (System Prompts) 定義
// ==========================================
export const AGENT_PROMPTS = {
  Orchestrator: `你是 AegisOS 的中央大腦，負責接收使用者意圖並拆解任務流。你必須將操作轉化為 Action Schema 發送，且任何動作前必須提交給 Critic 進行安全審計。若被 Critic 拒絕，必須重新擬定策略。`,
  
  Critic: `你是最高安全監控與紅隊審計官。你負責實時攔截並審查總管的 action_proposal，嚴格檢查越權、DOM 注入與幻覺風險。若有風險必須強行將狀態改為 rejected 並提供優化建議。嚴格保護使用者的聲音、指紋與習慣等隱私數據不流出。`,
  
  Fetcher: `你是外部世界感官與通訊官。負責監聽外部 API、新聞、RSS 與 GitHub 狀態。負責將數據清洗、結構化後提供給總管，並在發現重大更新時主動發出觸發訊號。`,
  
  Coder: `你是底層執行與代碼編修員。在限定的虛擬沙盒目錄（如 app/src）內進行程式碼增修，配合進行安全審計。所有寫入動作前必須通過 Critic 審查。`,
  
  Memory: `你是長期記憶與操作習慣索引官。負責將多智能體對話摘要並轉化為向量索引。確保所有涉及使用者操作習慣、指紋與聲音憑證的日誌數據完全儲存在本地（Local Storage），嚴禁上傳雲端。`
};

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<{ task: string; progress: number } | null>(null);

  const sendMessage = useCallback((msg: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

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
    
    // 如果被拒絕，自動更新工作流進度
    if (status === 'rejected') {
      setActiveWorkflow((prev) => prev ? { ...prev, progress: Math.max(10, prev.progress - 20) } : null);
    } else if (status === 'completed') {
      setActiveWorkflow((prev) => prev ? { ...prev, progress: 100 } : null);
    }
  }, []);

  const startWorkflow = useCallback((task: string) => {
    setActiveWorkflow({ task, progress: 10 });
    sendMessage({
      sender: 'System',
      receiver: 'Orchestrator',
      content: `初始化工作流："${task}"`,
      type: 'system_log',
    });
  }, [sendMessage]);

  const clearLogs = () => {
    setMessages([]);
    setActiveWorkflow(null);
  };

  return (
    <AgentContext.Provider value={{ messages, activeWorkflow, sendMessage, updateActionStatus, startWorkflow, clearLogs }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgentSystem = () => {
  const context = useContext(AgentContext);
  if (!context) throw new Error('useAgentSystem must be used within an AgentProvider');
  return context;
};
