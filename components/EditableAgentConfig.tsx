
import React from 'react';
import { AgentConfig, Provider } from '../types';
import { MODEL_OPTIONS, TrashIcon } from '../constants';

interface EditableAgentConfigProps {
    agent: AgentConfig;
    onUpdate: (updatedAgent: AgentConfig) => void;
    onRemove: () => void;
}

const EditableAgentConfig: React.FC<EditableAgentConfigProps> = ({ agent, onUpdate, onRemove }) => {
    
    const handleChange = (field: keyof AgentConfig | `parameters.${keyof AgentConfig['parameters']}`, value: any) => {
        if (field.startsWith('parameters.')) {
            const paramKey = field.split('.')[1] as keyof AgentConfig['parameters'];
            onUpdate({
                ...agent,
                parameters: {
                    ...agent.parameters,
                    [paramKey]: value
                }
            });
        } else {
            onUpdate({ ...agent, [field as keyof AgentConfig]: value });
        }
    };

    return (
        <details className="p-4 border rounded-lg bg-white/30 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600" open>
            <summary className="flex justify-between items-center cursor-pointer">
                <input 
                    type="text"
                    value={agent.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="font-semibold text-lg bg-transparent border-none p-0 focus:ring-0"
                    style={{ color: 'var(--text-color)' }}
                />
                <button onClick={onRemove} className="text-red-500 hover:text-red-700">
                    <TrashIcon />
                </button>
            </summary>
            
            <div className="mt-4 space-y-4">
                <div>
                    <label className="text-sm font-medium">Prompt Template</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Use {'{input_text}'} as a placeholder for the PDF content.</p>
                    <textarea
                        value={agent.prompt}
                        onChange={(e) => handleChange('prompt', e.target.value)}
                        className="w-full p-2 border rounded h-28 dark:bg-gray-700 dark:border-gray-600 text-sm"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={agent.model} onChange={(e) => handleChange('model', e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        {MODEL_OPTIONS[agent.api].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs">Temperature: {agent.parameters.temperature}</label>
                        <input type="range" min="0" max="2" step="0.1" value={agent.parameters.temperature} onChange={(e) => handleChange('parameters.temperature', parseFloat(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label className="text-xs">Top-P: {agent.parameters.topP}</label>
                        <input type="range" min="0" max="1" step="0.05" value={agent.parameters.topP} onChange={(e) => handleChange('parameters.topP', parseFloat(e.target.value))} className="w-full" />
                    </div>
                    <div>
                        <label className="text-xs">Max Tokens</label>
                        <input type="number" min="64" max="8192" step="32" value={agent.parameters.maxOutputTokens} onChange={(e) => handleChange('parameters.maxOutputTokens', parseInt(e.target.value, 10))} className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
            </div>
        </details>
    );
};

export default EditableAgentConfig;
