
import React from 'react';
import { SheetConfig, SyncStatus } from '../types';
import { Database, Link, AlertCircle, CheckCircle2, Loader2, Play, ExternalLink, HelpCircle } from 'lucide-react';

interface SheetSyncControlProps {
  config: SheetConfig;
  status: SyncStatus;
  onUpdateConfig: (updates: Partial<SheetConfig>) => void;
  onSyncNow: () => void;
}

export const SheetSyncControl: React.FC<SheetSyncControlProps> = ({ config, status, onUpdateConfig, onSyncNow }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Sheet Sync</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time fleet source data</p>
          </div>
        </div>
        <a
          href="https://support.google.com/docs/answer/183965"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="How to publish to web"
        >
          <HelpCircle className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Spreadsheet ID or URL</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="h-3 w-3 text-slate-400 dark:text-slate-600" />
              </div>
              <input
                type="text"
                value={config.sheetId}
                onChange={(e) => onUpdateConfig({ sheetId: e.target.value })}
                placeholder="Paste your sheet URL here..."
                className={`block w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${status === 'error' ? 'border-red-300 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'
                  }`}
              />
            </div>
            <button
              onClick={onSyncNow}
              disabled={status === 'syncing' || !config.sheetId}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              {status === 'syncing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Sync
            </button>
          </div>
          {status === 'error' ? (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-100 dark:border-red-900/50 flex items-start gap-2">
              <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-red-700 dark:text-red-400 leading-tight">
                <b>Sync Failed:</b> Sheet is private or inaccessible. Connect your Google account or check URL.
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <ExternalLink className="w-2.5 h-2.5" />
              Pasting the full browser URL is supported.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isAutoSync}
                onChange={(e) => onUpdateConfig({ isAutoSync: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 transition-all"></div>
            </label>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Auto-sync (10s)</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isLiveMode}
                onChange={(e) => onUpdateConfig({ isLiveMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 transition-all"></div>
            </label>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Live Mode</span>
          </div>

          <div className="flex items-center gap-2">
            {status === 'success' && (
              <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-500 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Updated {config.lastSync ? new Date(config.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
