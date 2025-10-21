import React from 'react';
import { ThemeName } from '../types';
import { THEMES } from '../constants';

interface SidebarProps {
  selectedTheme: ThemeName;
  onThemeChange: (themeName: ThemeName) => void;
}

const ApiStatusIndicator: React.FC<{ name: string; isConnected: boolean }> = ({ name, isConnected }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-700 dark:text-gray-300">{name}:</span>
        <span className={`font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? 'Connected' : 'No Key'}
        </span>
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ selectedTheme, onThemeChange }) => {
    // FIX: Reverted to process.env.API_KEY to fix runtime error in the execution environment.
    const isGeminiConnected = !!process.env.API_KEY;

    return (
        <aside className="w-full md:w-64 lg:w-72 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 flex flex-col space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-color)' }}>🎨 Theme</h3>
                <select
                    value={selectedTheme}
                    onChange={(e) => onThemeChange(e.target.value as ThemeName)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                    {Object.keys(THEMES).map((themeName) => (
                        <option key={themeName} value={themeName}>{themeName}</option>
                    ))}
                </select>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            <div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-color)' }}>🔐 API Status</h3>
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                   <ApiStatusIndicator name="Gemini" isConnected={isGeminiConnected} />
                   <ApiStatusIndicator name="OpenAI" isConnected={false} />
                   <ApiStatusIndicator name="Grok" isConnected={false} />
                </div>
                 {/* FIX: Updated message to be more generic and suitable for both live and deployed environments. */}
                 {!isGeminiConnected && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Gemini API key not found. Ensure it's configured in environment secrets.</p>}
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">OpenAI and Grok are not implemented in this version.</p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            <div className="flex-grow">
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-color)' }}>📊 About</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Process PDFs with multi-agent AI, orchestrate agents with chained execution, and visualize runs in a live dashboard.
                </p>
            </div>
            
            <footer className="text-center text-xs text-gray-500 dark:text-gray-400">
                Built with React & Gemini
            </footer>
        </aside>
    );
};

export default Sidebar;