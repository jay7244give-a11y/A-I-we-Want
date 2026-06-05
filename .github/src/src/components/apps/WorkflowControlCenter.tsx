import React, { useEffect, useRef, useState } from 'react';
import { useAgentSystem, AgentRole, ActionStatus, AGENT_PROMPTS } from '../../context/AgentContext';
import { ExternalInterfaceBridge } from '../../services/ExternalInterfaceBridge';

/**
 * WorkflowControlCenter 組件
 * 
 * 多代理人系統的主控制中心 UI
 * 負責:
 * 1. 顯示所有代理人通訊流
 * 2. 管理工作流狀態
 * 3. 提供手動干預介面 (Override)
 * 4. 展示進度與錯誤信息
 */
export const WorkflowControlCenter: React.FC = () => {
  const { messages, activeWorkflow, updateActionStatus, clearLogs, sendMessage, startWorkflow } = useAgentSystem();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 自動滾動到最新訊息
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 代理人身分標籤樣式
   */
  const getAgentBadgeStyle = (role: AgentRole) => {
    switch (role) {
      case 'Orchestrator': return 'bg-blue-600 text-white border-blue-400';
      case 'Critic': return 'bg-red-600 text-white border-red-400 animate-pulse font-bold';
      case 'Fetcher': return 'bg-purple-600 text-white border-purple-400';
      case 'Security': return 'bg-amber-600 text-white border-amber-400';
      case 'Coder': return 'bg-emerald-600 text-white border-emerald-400';
      case 'Memory': return 'bg-cyan-600 text-white border-cyan-400';
      case 'System': return 'bg-slate-600 text-slate-100 border-slate-400';
      default: return 'bg-slate-700 text-slate-200 border-slate-500';
    }
  };

  /**
   * 動作狀態標籤樣式
   */
  const getStatusBadge = (status: ActionStatus) => {
    const base = "px-2 py-0.5 rounded text-[10px] font-mono border ";
    switch (status) {
      case 'pending': return base + "bg-yellow-950 text-yellow-400 border-yellow-600 animate-pulse";
      case 'running': return base + "bg-blue-950 text-blue-400 border-blue-600 animate-pulse";
      case 'approved': return base + "bg-emerald-950 text-emerald-400 border-emerald-600";
      case 'rejected': return base + "bg-red-950 text-red-400 border-red-600 font-bold";
      case 'completed': return base + "bg-green-600 text-white border-green-400";
      default: return base + "bg-slate-800 text-slate-400 border-slate-600";
    }
  };

  /**
   * 處理終端機輸入
   */
  const handleTerminalInput = async (input: string) => {
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      // 1. 系統日誌：使用者指令
      sendMessage({
        sender: 'System',
        receiver: 'Orchestrator',
        content: `使用者命令輸入: "${input}"`,
        type: 'system_log'
      });

      // 2. 啟動工作流
      startWorkflow(input);

      // 3. 嘗試呼叫本地 LLaMA 進行分析
      try {
        const llmaResponse = await ExternalInterfaceBridge.callLocalLlama(
          input,
          AGENT_PROMPTS.Orchestrator
        );

        if (llmaResponse.success && llmaResponse.data) {
          sendMessage({
            sender: 'Orchestrator',
            receiver: 'Critic',
            content: llmaResponse.data.choices?.[0]?.message?.content || '無法解析模型回應',
            type: 'action_proposal',
            actionMetadata: {
              actionName: '使用者指令解析',
              targetPayload: input,
              status: 'pending'
            }
          });
        } else {
          sendMessage({
            sender: 'System',
            receiver: 'Orchestrator',
            content: `⚠️ LLaMA 回應異常: ${llmaResponse.error || '未知錯誤'}`,
            type: 'system_log'
          });
        }
      } catch (error) {
        console.error('LLaMA 調用失敗:', error);
        sendMessage({
          sender: 'System',
          receiver: 'Orchestrator',
          content: `⚠️ 本地推理引擎異常，使用靜態回應模式`,
          type: 'system_log'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto bg-slate-950 text-slate-100 font-sans border border-slate-800 rounded shadow-2xl overflow-hidden min-h-[600px]">
      
      {/* ==================== 頂部控制列 ==================== */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <h2 className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              ⚙️ AegisOS 多代理人決策遙測中心
            </h2>
            <span className="text-[10px] text-slate-500 ml-2">
              {messages.length} 訊息 | {activeWorkflow ? '🟢 活動中' : '⚫ 待命'}
            </span>
          </div>
          <button 
            onClick={clearLogs}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition"
          >
            清除日誌
          </button>
        </div>
        
        {/* 動態工作流進度條 */}
        {activeWorkflow ? (
          <div className="mt-1 bg-slate-950 p-2.5 rounded border border-slate-800">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400 font-mono">📋 任務: {activeWorkflow.task}</span>
              <span className="text-blue-400 font-mono font-bold">{activeWorkflow.progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-500" 
                style={{ width: `${activeWorkflow.progress}%` }} 
              />
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic text-center py-2 bg-slate-950/40 rounded border border-dashed border-slate-800">
            🔒 核心環境處於靜態防禦監聽狀態。請在下方控制台輸入指令激發工作流。
          </div>
        )}
      </div>

      {/* ==================== 訊息與對話通訊流 ==================== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {messages.length === 0 ? (
          <div className="text-center text-slate-600 py-8">
            <p className="text-[12px]">🎯 待命中...</p>
            <p className="text-[10px] mt-1">在底部終端機輸入指令開始</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-3 rounded border transition-all ${
                msg.sender === 'Critic' 
                  ? 'bg-red-950/20 border-red-900/40' 
                  : msg.sender === 'System'
                  ? 'bg-slate-900/30 border-slate-900 text-slate-400' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {/* Meta 資訊欄 */}
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="text-slate-600">{msg.timestamp}</span>
                  <span className={`px-1.5 py-0.2 rounded border font-bold ${getAgentBadgeStyle(msg.sender)}`}>
                    {msg.sender}
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className={`px-1.5 py-0.2 rounded border ${getAgentBadgeStyle(msg.receiver)}`}>
                    {msg.receiver}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-500 italic">{msg.type}</span>
                </div>
                {msg.actionMetadata && getStatusBadge(msg.actionMetadata.status)}
              </div>

              {/* 本文 */}
              <p className="text-slate-200 leading-relaxed font-sans pl-1 text-[12px]">
                {msg.content}
              </p>

              {/* 糾察意見與手動覆寫 (Override) 按鈕區 */}
              {msg.actionMetadata && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 bg-slate-950/70 p-2 rounded text-[11px]">
                  <div className="text-slate-400">
                    <span className="text-blue-400 font-bold">💡 動作:</span> {msg.actionMetadata.actionName}
                  </div>
                  
                  {msg.actionMetadata.criticFeedback && (
                    <div className="text-red-400 bg-red-950/40 p-2 rounded border border-red-900/40 mt-1.5 font-sans text-[10px]">
                      <span className="font-bold text-red-500">🛡️ 安全審查:</span> {msg.actionMetadata.criticFeedback}
                    </div>
                  )}
                  
                  {/* 手動干預按鈕 */}
                  {msg.actionMetadata.status === 'pending' && (
                    <div className="flex gap-2 mt-2 justify-end font-sans">
                      <button 
                        onClick={() => updateActionStatus(msg.id, 'approved')}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] transition"
                      >
                        ✓ 放行
                      </button>
                      <button 
                        onClick={() => updateActionStatus(msg.id, 'rejected', '管理員介入：操作被終止。')}
                        className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] transition"
                      >
                        ✗ 攔截
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* ==================== 底部終端機控制台 ==================== */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded flex items-center px-2 py-1">
          <span className="text-slate-600 text-xs mr-1.5 font-bold">root@aegis:/</span>
          <input 
            type="text" 
            placeholder="輸入任務指令... (例: 檢查程式碼安全性、建構新組件)"
            disabled={isProcessing}
            className="bg-transparent text-xs w-full focus:outline-none text-slate-200 placeholder-slate-700 font-mono disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim() && !isProcessing) {
                handleTerminalInput(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        
        {/* 控制按鈕 */}
        <button 
          onClick={clearLogs}
          disabled={isProcessing}
          className="px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 text-xs font-bold rounded transition disabled:opacity-50"
        >
          🛑 HALT
        </button>
        
        {isProcessing && (
          <span className="text-[10px] text-blue-400 font-mono animate-pulse">
            ⟳ 處理中...
          </span>
        )}
      </div>

    </div>
  );
};
