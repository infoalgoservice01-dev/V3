import React, { useState, useMemo, useEffect } from 'react';
import { Driver, ELDStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Play, Square, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface DashboardProps {
    drivers: Driver[];
}

export const Dashboard: React.FC<DashboardProps> = ({ drivers }) => {
    const [boardFilter, setBoardFilter] = useState<string | 'ALL'>('ALL');
    const [backendStatus, setBackendStatus] = useState<{ status: string; cronActive: boolean; lastSyncTime: string | null; isSyncing: boolean } | null>(null);

    const boards = Array.from(new Set(drivers.map(d => d.board).filter(Boolean)));

    const filteredDrivers = useMemo(() => {
        if (boardFilter === 'ALL') return drivers;
        return drivers.filter(d => d.board === boardFilter);
    }, [drivers, boardFilter]);

    const totalDrivers = filteredDrivers.length;
    const activeDrivers = filteredDrivers.filter(d => d.eldStatus === ELDStatus.CONNECTED).length;
    const inactiveDrivers = filteredDrivers.filter(d => d.eldStatus === ELDStatus.DISCONNECTED).length;

    const connectionStats = useMemo(() => {
        return [
            { name: 'Connected', value: activeDrivers },
            { name: 'Disconnected', value: inactiveDrivers }
        ].filter(stat => stat.value > 0);
    }, [activeDrivers, inactiveDrivers]);

    const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

    const dutyStats = useMemo(() => {
        const counts = filteredDrivers.reduce((acc, driver) => {
            const status = driver.dutyStatus || 'Not Set';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, Total]) => ({ name, Total }));
    }, [filteredDrivers]);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/status');
                setBackendStatus(res.data);
            } catch (e) {
                setBackendStatus({ status: 'offline', cronActive: false, lastSyncTime: null, isSyncing: false });
            }
        };
        checkBackend();
        const interval = setInterval(checkBackend, 10000);
        return () => clearInterval(interval);
    }, []);

    const toggleCron = async () => {
        if (!backendStatus || backendStatus.status === 'offline') return alert('Backend is offline.');
        try {
            const endpoint = backendStatus.cronActive ? '/api/sync/stop' : '/api/sync/start';
            await axios.post(`http://localhost:5000${endpoint}`);
            setBackendStatus(prev => prev ? { ...prev, cronActive: !prev.cronActive } : prev);
        } catch (e) {
            alert('Failed to toggle automation');
        }
    };

    const forceSync = async () => {
        if (!backendStatus || backendStatus.status === 'offline') return alert('Backend is offline.');
        try {
            setBackendStatus(prev => prev ? { ...prev, isSyncing: true } : prev);
            await axios.post('http://localhost:5000/api/sync/trigger');
        } catch (e) {
            alert('Manual sync failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Filter */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Connection Dashboard</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Overview of fleet status and active connections.</p>
                </div>
                <div>
                    <select
                        value={boardFilter}
                        onChange={(e) => setBoardFilter(e.target.value)}
                        className="text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 dark:text-slate-300 px-4 py-2 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                        <option value="ALL">All Boards</option>
                        {boards.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Pie Chart */}
                <div className="md:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">Connection Status Overview</h3>
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={connectionStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {connectionStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Connected' ? '#34d399' : '#f87171'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#1e293b', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {connectionStats.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">No data available</div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-[90px]">
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                                <span className="text-2xl font-black text-slate-800 dark:text-white">{totalDrivers}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Bar Chart */}
                <div className="md:col-span-2 space-y-6 flex flex-col">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Inactive Driver's</h3>
                            <div className="text-5xl font-black text-slate-800 dark:text-white mb-2">{inactiveDrivers}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Active Driver's</h3>
                            <div className="text-5xl font-black text-slate-800 dark:text-white mb-2">{activeDrivers}</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 min-h-[250px] flex flex-col">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">Duty Status Distribution</h3>
                        <div className="flex-1 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dutyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff' }} />
                                    <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {dutyStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Automation Backend Panel */}
            <div className="mt-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Node.js ELD Automation Engine</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-2xl">
                    The standalone Node.js worker automatically syncs with the ELD API every hour, updates records in the background, and dispatches cycle emails to drivers missing profile form deadlines.
                </p>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Worker Status</p>
                            <div className="flex items-center gap-2">
                                <span className={`relative flex h-3 w-3`}>
                                    {backendStatus?.status === 'online' ? (
                                        <>
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </>
                                    ) : (
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400"></span>
                                    )}
                                </span>
                                <span className={`font-bold ${backendStatus?.status === 'online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                    {backendStatus?.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Automation Cron</p>
                            <div className={`font-bold ${backendStatus?.cronActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                                {backendStatus?.cronActive ? 'ACTIVE' : 'PAUSED'}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Worker Sync</p>
                            <div className="font-bold text-slate-700 dark:text-slate-300">
                                {backendStatus?.lastSyncTime ? new Date(backendStatus.lastSyncTime).toLocaleTimeString() : 'Never'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={forceSync}
                            disabled={!backendStatus || backendStatus.status === 'offline' || backendStatus.isSyncing}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${backendStatus?.isSyncing ? 'animate-spin' : ''}`} />
                            {backendStatus?.isSyncing ? 'Syncing...' : 'Force Sync'}
                        </button>
                        <button
                            onClick={toggleCron}
                            disabled={!backendStatus || backendStatus.status === 'offline'}
                            className={`px-4 py-2 font-bold text-sm rounded-xl text-white transition-all flex items-center gap-2 disabled:opacity-50 ${backendStatus?.cronActive ? 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {backendStatus?.cronActive ? <><Square className="w-4 h-4" fill="currentColor" /> Pause Worker</> : <><Play className="w-4 h-4" fill="currentColor" /> Start Worker</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
