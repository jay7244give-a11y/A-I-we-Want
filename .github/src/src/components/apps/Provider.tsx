import React from 'react';
import { AgentProvider } from '../../context/AgentContext';
import { WorkflowControlCenter } from './WorkflowControlCenter';

/**
 * ==========================================
 * App 主應用程式入口
 * ==========================================
 * 負責初始化整個多代理人系統
 * 
 * 架構:
 * App
 *  └─ AgentProvider (全局狀態管理)
 *      └─ WorkflowControlCenter (主 UI)
 */

export const App: React.FC = () => {
  return (
    <AgentProvider>
      <div className="w-screen h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <WorkflowControlCenter />
      </div>
    </AgentProvider>
  );
};

export default App;
