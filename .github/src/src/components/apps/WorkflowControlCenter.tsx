import React, { useEffect, useRef } from 'react';
import { useAgentSystem, AgentRole, ActionStatus } from '../../context/AgentContext';

export const WorkflowControlCenter: React.FC = () => {
  const { messages, activeWorkflow, updateActionStatus, clearLogs, sendMessage } = useAgentSystem();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 身分標籤 Tailwind 樣式調色盤
  const getAgentBadgeStyle = (role: AgentRole) => {
    switch (role) {
      case 'Orchestrator': return 'bg-blue-600 text-white border-blue-400';
      case 'Critic': return 'bg-red-600 text-white border-red-400 animate-pulse font-bold';
      case 'Fetcher': return 'bg-purple-600 text-white border-purple-400';
      case 'Security': return 'bg-amber-600 text-white border-amber-400';
      case 'Coder': return 'bg-emerald-600 text-white border-emerald-400';
      case 'Memory': return 'bg-cyan-600 text-white border-cyan-400';
      default: return 'bg-slate-700 text-slate-200 border-slate-500';
    }
  };

  // 動作狀態標籤
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

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-slate-950 text-slate-100 font-sans border border-slate-800 rounded shadow-2xl overflow-hidden min-h-[500px]">
      
      {/* 頂部控制列 */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <h2 className="text-xs font-bold tracking-wider text-slate-300 uppercase">AegisOS 多代理人決策遙測中心</h2>
          </div>
          <button 
            onClick={clearLogs}
            className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition"
          >
            清除主日誌
          </button>
        </div>
        
        {/* 動態工作流進度條 */}
        {activeWorkflow ? (
          <div className="mt-1 bg-slate-950 p-2.5 rounded border border-slate-800">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400 font-mono">任務核心: {activeWorkflow.task}</span>
              <span className="text-blue-400 font-mono font-bold">{activeWorkflow.progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${activeWorkflow.progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic text-center py-2 bg-slate-950/40 rounded border border-dashed border-slate-800">
            核心環境處於靜態防禦監聽狀態。請在下方控制台輸入指令激發工作流。
          </div>
        )}
      </div>

      {/* 訊息與對話通訊流 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs max-h-[400px]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`p-3 rounded border transition-all ${
              msg.sender === 'Critic' 
                ? 'bg-red-950/20 border-red-900/40' 
                : msg.type === 'system_log' ? 'bg-slate-900/30 border-slate-900 text-slate-400' : 'bg-slate-900/60 border-slate-800'
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
                  <span className="text-blue-400 font-bold">申報意圖動作:</span> {msg.actionMetadata.actionName}
                </div>
                {msg.actionMetadata.criticFeedback && (
                  <div className="text-red-400 bg-red-950/40 p-2 rounded border border-red-900/40 mt-1.5 font-sans">
                    <span className="font-bold text-red-500">🛡️ 糾察隊否決證詞:</span> {msg.actionMetadata.criticFeedback}
                  </div>
                )}
                
                {/* 抽查互動：手動干預 */}
                {msg.actionMetadata.status === 'pending' && (
                  <div className="flex gap-2 mt-2 justify-end font-sans">
                    <button 
                      onClick={() => updateActionStatus(msg.id, 'approved')}
                      className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px]"
                    >
                      手動放行 (Override)
                    </button>
                    <button 
                      onClick={() => updateActionStatus(msg.id, 'rejected', '使用者抽查介入：此操作已被管理員手動終止。')}
                      className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[10px]"
                    >
                      安全攔截
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* 底部最高權限控制台 */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded flex items-center px-2 py-1">
          <span className="text-slate-600 text-xs mr-1.5">root@aegis:#</span>
          <input 
            type="text" 
            placeholder="請輸入系統任務指令（例如：建構新組件並進行安全稽核）..." 
            className="bg-transparent text-xs w-full focus:outline-none text-slate-200 placeholder-slate-700 font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                // 這裡未來直接與後端或本地 Llama 做連動，此處做靜態展示輸入
                sendMessage({
                  sender: 'System',
                  receiver: 'Orchestrator',
                  content: `使用者手動插入最高權限指令: "${e.currentTarget.value}"`,
                  type: 'system_log'
                });
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        <button 
          onClick={clearLogs}
          className="px-3 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 text-xs font-bold rounded transition"
        >
          HALT ALL
        </button>
      </div>

    </div>
  );
};
