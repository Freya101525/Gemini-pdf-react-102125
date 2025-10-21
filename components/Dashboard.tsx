
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExecutionRecord, Provider } from '../types';
import Card from './shared/Card';
import Metric from './shared/Metric';
import { DownloadIcon, TrashIcon } from '../constants';

interface DashboardProps {
  history: ExecutionRecord[];
  onClearHistory: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ history, onClearHistory }) => {
    const [filterProvider, setFilterProvider] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);
    const [filterModel, setFilterModel] = useState<string[]>([]);

    const allProviders = useMemo(() => Array.from(new Set(history.map(r => r.provider))), [history]);
    const allStatuses = useMemo(() => Array.from(new Set(history.map(r => r.status))), [history]);
    const allModels = useMemo(() => Array.from(new Set(history.map(r => r.model))), [history]);

    const filteredHistory = useMemo(() => {
        return history.filter(r =>
            (filterProvider.length === 0 || filterProvider.includes(r.provider)) &&
            (filterStatus.length === 0 || filterStatus.includes(r.status)) &&
            (filterModel.length === 0 || filterModel.includes(r.model))
        );
    }, [history, filterProvider, filterStatus, filterModel]);

    const kpis = useMemo(() => {
        const total = filteredHistory.length;
        const successes = filteredHistory.filter(r => r.status === 'success').length;
        const errors = filteredHistory.filter(r => r.status === 'error').length;
        const avgDuration = total > 0 ? filteredHistory.reduce((acc, r) => acc + r.duration_s, 0) / total : 0;
        return { total, successes, errors, avgDuration };
    }, [filteredHistory]);

    const providerData = useMemo(() => {
        const counts: { [key in Provider]?: { total: number, success: number } } = {};
        for (const r of filteredHistory) {
            if (!counts[r.provider]) counts[r.provider] = { total: 0, success: 0 };
            counts[r.provider]!.total++;
            if (r.status === 'success') counts[r.provider]!.success++;
        }
        return Object.entries(counts).map(([name, data]) => ({
            name,
            Executions: data.total,
            'Success Rate (%)': data.total > 0 ? (data.success / data.total) * 100 : 0,
        }));
    }, [filteredHistory]);
    
    const downloadJSON = () => {
        const dataStr = JSON.stringify(filteredHistory, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'execution_history.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (history.length === 0) {
        return <Card><p>No execution history yet. Run some agents to see data here.</p></Card>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--text-color)'}}>📈 Execution Analytics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Metric label="Total Runs" value={kpis.total} />
                    <Metric label="Successes" value={kpis.successes} delta={kpis.total > 0 ? `${((kpis.successes / kpis.total) * 100).toFixed(1)}%` : '0%'} />
                    <Metric label="Errors" value={kpis.errors} delta={kpis.total > 0 ? `${((kpis.errors / kpis.total) * 100).toFixed(1)}%` : '0%'} />
                    <Metric label="Avg Duration" value={`${kpis.avgDuration.toFixed(2)}s`} />
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--text-color)'}}>📋 Execution History</h3>
                {/* Filters could be implemented with custom multiselect components */}
                <p className="text-sm text-gray-500 mb-4">Filtering controls would be here.</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Time</th>
                                <th scope="col" className="px-6 py-3">Agent</th>
                                <th scope="col" className="px-6 py-3">Provider</th>
                                <th scope="col" className="px-6 py-3">Model</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Duration (s)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.slice(0, 10).map(r => ( // Paginate for large lists
                                <tr key={r.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                    <td className="px-6 py-4">{r.time}</td>
                                    <td className="px-6 py-4">{r.agent}</td>
                                    <td className="px-6 py-4">{r.provider}</td>
                                    <td className="px-6 py-4">{r.model}</td>
                                    <td className="px-6 py-4">{r.status}</td>
                                    <td className="px-6 py-4">{r.duration_s.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredHistory.length > 10 && <p className="text-xs text-center mt-2">Showing first 10 of {filteredHistory.length} records.</p>}
                </div>
            </Card>
            
            <Card>
                 <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--text-color)'}}>📊 Usage Analytics</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
                    <div>
                        <h4 className="font-semibold text-center mb-2">Executions by Provider</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={providerData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Executions" fill="var(--primary-color)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <div>
                        <h4 className="font-semibold text-center mb-2">Success Rate by Provider</h4>
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={providerData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`}/>
                                <Legend />
                                <Bar dataKey="Success Rate (%)" fill="var(--accent-color)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </Card>

            <Card>
                 <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--text-color)'}}>💾 Export & Manage</h3>
                 <div className="flex items-center space-x-4">
                     <button onClick={downloadJSON} className="flex items-center justify-center py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
                         <DownloadIcon />
                         Download JSON
                     </button>
                      <button onClick={onClearHistory} className="flex items-center justify-center py-2 px-4 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75">
                         <TrashIcon />
                         Clear History
                     </button>
                 </div>
            </Card>
        </div>
    );
};

export default Dashboard;
