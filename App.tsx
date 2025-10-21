import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import PdfProcessor from './components/PdfProcessor';
import Orchestrator from './components/Orchestrator';
import Dashboard from './components/Dashboard';
import { ThemeName, ExecutionRecord } from './types';
import { THEMES } from './constants';

type Tab = "PDF Processor" | "Orchestrator" | "Dashboard";

const App: React.FC = () => {
    const [theme, setTheme] = useState<ThemeName>("Blue sky");
    const [activeTab, setActiveTab] = useState<Tab>("PDF Processor");
    const [runHistory, setRunHistory] = useState<ExecutionRecord[]>([]);

    useEffect(() => {
        const root = document.documentElement;
        const selectedTheme = THEMES[theme];
        root.style.setProperty('--primary-color', selectedTheme.primary);
        root.style.setProperty('--secondary-color', selectedTheme.secondary);
        root.style.setProperty('--background-color', selectedTheme.background);
        root.style.setProperty('--text-color', selectedTheme.text);
        root.style.setProperty('--accent-color', selectedTheme.accent);

        if (["Dark Knight", "Sparkling galaxy"].includes(theme)) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [theme]);
    
    const addExecutionRecord = useCallback((record: Omit<ExecutionRecord, 'id' | 'time'>) => {
        setRunHistory(prev => [
            ...prev,
            {
                ...record,
                id: crypto.randomUUID(),
                time: new Date().toLocaleString()
            }
        ]);
    }, []);

    const clearHistory = () => {
        if (window.confirm("Are you sure you want to clear all execution history? This cannot be undone.")) {
            setRunHistory([]);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "PDF Processor":
                // FIX: Removed unused 'agents' prop. The PdfProcessor component imports the default agents directly.
                return <PdfProcessor addExecutionRecord={addExecutionRecord} />;
            case "Orchestrator":
                return <Orchestrator addExecutionRecord={addExecutionRecord} />;
            case "Dashboard":
                return <Dashboard history={runHistory} onClearHistory={clearHistory} />;
            default:
                return null;
        }
    };
    
    const tabs: Tab[] = ["PDF Processor", "Orchestrator", "Dashboard"];

    return (
        <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-500" style={{ background: 'var(--background-color)', color: 'var(--text-color)' }}>
            <Sidebar selectedTheme={theme} onThemeChange={setTheme} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>🤖 Agentic PDF & Prompt Orchestrator</h1>
                    <div className="border-b-2 border-gray-200 dark:border-gray-700 mt-4">
                        <nav className="-mb-0.5 flex space-x-6">
                            {tabs.map(tabName => (
                                <button
                                    key={tabName}
                                    onClick={() => setActiveTab(tabName)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === tabName
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {tabName}
                                </button>
                            ))}
                        </nav>
                    </div>
                </header>
                {renderTabContent()}
            </main>
        </div>
    );
}

export default App;