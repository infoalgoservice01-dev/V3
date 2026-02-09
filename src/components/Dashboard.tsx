import { useState, useMemo } from 'react';
import { Activity, AlertOctagon, CheckCircle2, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ComplianceLedger } from './ComplianceLedger';
import { mockDrivers, Driver, Filters } from '../types';

const stats = [
    { label: 'Active Drivers', value: '142', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Compliance Rate', value: '98.5%', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pending Alerts', value: '3', icon: AlertOctagon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'System Status', value: 'Online', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

export function Dashboard() {
    const [filters, setFilters] = useState<Filters>({
        search: '',
        company: 'all',
        board: 'all',
        status: 'all',
        dutyStatus: 'all',
    });

    const companies = useMemo(() => Array.from(new Set(mockDrivers.map(d => d.company))).sort(), []);
    const boards = useMemo(() => Array.from(new Set(mockDrivers.map(d => d.board))).sort(), []);

    const filteredDrivers = useMemo(() => {
        return mockDrivers.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                d.truckId.toLowerCase().includes(filters.search.toLowerCase());
            const matchesCompany = filters.company === 'all' || d.company === filters.company;
            const matchesBoard = filters.board === 'all' || d.board === filters.board;
            const matchesStatus = filters.status === 'all' || d.status === filters.status;
            const matchesDutyStatus = filters.dutyStatus === 'all' || d.dutyStatus === filters.dutyStatus;

            return matchesSearch && matchesCompany && matchesBoard && matchesStatus && matchesDutyStatus;
        });
    }, [filters]);

    // Update stats based on filtered data (Optional: You might want global stats or filtered stats)
    // For now, let's keep stats static or we can update them dynamically if requested.
    // The user request strictly said "Fleet Control Center dashboard summary cards... must show filteredDrivers.length"
    // So let's update the "Active Drivers" stat dynamically.

    const dynamicStats = [
        { ...stats[0], value: filteredDrivers.length.toString(), label: 'Viewing Drivers' },
        ...stats.slice(1)
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dynamicStats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <ComplianceLedger
                        drivers={filteredDrivers}
                        filters={filters}
                        setFilters={setFilters}
                        companies={companies}
                        boards={boards}
                    />
                </div>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                                <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                                <div>
                                    <p className="font-medium">Driver #{1000 + i} disconnected</p>
                                    <p className="text-muted-foreground text-xs">2 mins ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
