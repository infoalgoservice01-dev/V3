import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, AlertTriangle, MessageSquare, Settings, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    className?: string;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '#dashboard' },
    { icon: Users, label: 'Drivers', href: '#drivers' },
    { icon: AlertTriangle, label: 'Violations', href: '#violations' },
    { icon: MessageSquare, label: 'Communications', href: '#messages' },
    { icon: Settings, label: 'Settings', href: '#settings' },
];

export function Sidebar({ className }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            <div className={cn("flex flex-col h-screen bg-card border-r border-border transition-all duration-300 z-50", isOpen ? "w-64" : "w-16", className)}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <motion.div
                        initial={false}
                        animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
                        className="font-bold text-xl truncate text-primary overflow-hidden"
                    >
                        Leader A1
                    </motion.div>
                    <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-accent rounded-md">
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-2 px-2">
                        {navItems.map((item) => (
                            <li key={item.label}>
                                <a
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
                                >
                                    <item.icon size={20} className="shrink-0" />
                                    <motion.span
                                        initial={false}
                                        animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                    {!isOpen && (
                                        <div className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                            A1
                        </div>
                        <motion.div
                            initial={false}
                            animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <p className="text-sm font-medium">Admin User</p>
                            <p className="text-xs text-muted-foreground">Fleet Manager</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
