import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ThemeToggle } from './components/ThemeToggle';
import { Bell } from 'lucide-react';

function App() {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10">
                    <h1 className="text-xl font-bold hidden md:block">Leader A1 <span className="text-muted-foreground font-normal text-base ml-2">Dashboard</span></h1>
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-accent rounded-full relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
                        </button>
                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-muted/30">
                    <Dashboard />
                </main>
            </div>
        </div>
    );
}

export default App;
