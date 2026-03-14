import React from 'react';
import { Database, Cloud, CloudOff, Loader2 } from 'lucide-react';

interface DatabaseSyncControlProps {
    isConnected: boolean;
    isSyncing: boolean;
    lastSync?: string;
    isLiveMode: boolean;
    onToggleLiveMode: (enabled: boolean) => void;
}

export const DatabaseSyncControl: React.FC<DatabaseSyncControlProps> = ({
    isConnected,
    isSyncing,
    lastSync,
    isLiveMode,
    onToggleLiveMode
}) => {
    return (
        <button
            onClick={() => onToggleLiveMode(!isLiveMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all shadow-sm ${
                isLiveMode 
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isLiveMode ? "Live Mode: ON (Click to disable)" : "Live Mode: OFF (Click to enable)"}
        >
            <Database className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline-block">Cloud DB</span>
            <div className="h-4 w-px bg-current opacity-20 mx-1"></div>
            {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : isConnected ? (
                <Cloud className={`w-4 h-4 ${isLiveMode ? 'text-emerald-500' : 'text-slate-400'}`} />
            ) : (
                <CloudOff className="w-4 h-4 text-red-400" />
            )}
        </button>
    );
};
