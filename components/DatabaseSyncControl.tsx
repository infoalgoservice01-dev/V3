
import React from 'react';
import { Database, CheckCircle2, Loader2, Cloud, CloudOff } from 'lucide-react';

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
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                        <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cloud Database</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Firebase Firestore</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Cloud className="w-4 h-4 text-green-500" />
                    ) : (
                        <CloudOff className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isLiveMode}
                                onChange={(e) => onToggleLiveMode(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 transition-all"></div>
                        </label>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Live Mode (Real Emails)</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isSyncing && (
                            <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-500 font-bold">
                                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
                            </span>
                        )}
                        {isConnected && !isSyncing && lastSync && (
                            <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-500 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Updated {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-2">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            <p className="font-bold mb-1">✨ Auto-Sync Enabled</p>
                            <p>All changes are automatically saved to your personal cloud database. Data syncs in real-time across all your devices.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
