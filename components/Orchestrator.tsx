
import React, { useState } from 'react';
import Card from './shared/Card';
import { OrchestratorAgentConfig, ExecutionRecord, Provider } from '../types';
import { MODEL_OPTIONS } from '../constants';
import { executeGeminiQuery } from '../services/geminiService';

interface OrchestratorProps {
    addExecutionRecord: (record: Omit<ExecutionRecord, 'id' | 'time'>) => void;
}

const AgentConfiguration: React.FC<{
    agent: OrchestratorAgentConfig,
    index: number,
    onUpdate: (index: number, updatedAgent: OrchestratorAgentConfig) => void,
    isChained: boolean,
}> = ({ agent, index, onUpdate, isChained }) => {
    
    const handleChange = (field: keyof OrchestratorAgentConfig, value: any) => {
        onUpdate(index, { ...agent, [field]: value });
    };

    return (
        <Card className="mb-4">
            <h4 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-color)' }}>
                Agent {index + 1} Configuration
            </h4>
            {isChained && index > 0 && (
                <div className="p-2 mb-4 rounded-md text-sm" style={{ background: 'linear-gradient(90deg, var(--primary-color)20, var(--accent-color)20)' }}>
                    🔗 <strong>Chained Input:</strong> This agent will receive output from Agent {index}.
                </div>
            )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={agent.provider} onChange={(e) => handleChange('provider', e.target.value as Provider)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                    {Object.keys(MODEL_OPTIONS).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={agent.model} onChange={(e) => handleChange('model', e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                    {MODEL_OPTIONS[agent.provider].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="mt-4">
                 <textarea
                    placeholder="System Prompt / Instructions"
                    value={agent.system_prompt}
                    onChange={(e) => handleChange('system_prompt', e.target.value)}
                    className="w-full p-2 border rounded h-24 dark:bg-gray-700 dark:border-gray-600"
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="text-xs">Temperature</label>
                    <input type="range" min="0" max="2" step="0.1" value={agent.temperature} onChange={(e) => handleChange('temperature', parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                    <label className="text-xs">Top-P</label>
                    <input type="range" min="0" max="1" step="0.05" value={agent.top_p} onChange={(e) => handleChange('top_p', parseFloat(e.target.value))} className="w-full" />
                </div>
                <div>
                    <label className="text-xs">Max Tokens</label>
                    <input type="number" min="64" max="8192" step="32" value={agent.max_tokens} onChange={(e) => handleChange('max_tokens', parseInt(e.target.value, 10))} className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
        </Card>
    );
};

const Orchestrator: React.FC<OrchestratorProps> = ({ addExecutionRecord }) => {
    const [numAgents, setNumAgents] = useState(1);
    const [agents, setAgents] = useState<OrchestratorAgentConfig[]>([createDefaultAgent()]);
    const [enableChaining, setEnableChaining] = useState(true);
    const [initialInput, setInitialInput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<( { status: 'success' | 'error'; content: string } | null)[]>([]);

    function createDefaultAgent(): OrchestratorAgentConfig {
        return {
            id: crypto.randomUUID(),
            use_prompt_id: false, prompt_id: '', version: '1', provider: 'Gemini',
            model: 'gemini-2.5-flash', system_prompt: 'You are a helpful AI assistant.', user_prompt: '',
            temperature: 0.7, max_tokens: 2048, top_p: 1.0
        };
    }

    const handleNumAgentsChange = (num: number) => {
        setNumAgents(num);
        const newAgents = [...agents];
        while (newAgents.length < num) newAgents.push(createDefaultAgent());
        while (newAgents.length > num) newAgents.pop();
        setAgents(newAgents);
    };

    const updateAgent = (index: number, updatedAgent: OrchestratorAgentConfig) => {
        const newAgents = [...agents];
        newAgents[index] = updatedAgent;
        setAgents(newAgents);
    };

    const executeChain = async () => {
        if (!initialInput.trim()) {
            alert('Please provide an initial input.');
            return;
        }
        setIsRunning(true);
        setResults(new Array(agents.length).fill(null));

        let currentInput = initialInput;

        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];
            const startTime = performance.now();
            
            try {
                 if (agent.provider !== 'Gemini') {
                    throw new Error(`${agent.provider} is not implemented in this demo.`);
                }
                const fullPrompt = `${agent.system_prompt}\n\nUser Input:\n${currentInput}`;
                const output = await executeGeminiQuery(
                    fullPrompt, agent.model, agent.temperature, agent.top_p, agent.max_tokens
                );

                const duration = (performance.now() - startTime) / 1000;
                addExecutionRecord({ agent: `Orchestrator Agent ${i + 1}`, provider: agent.provider, model: agent.model, status: 'success', duration_s: duration });
                setResults(prev => { const next = [...prev]; next[i] = { status: 'success', content: output }; return next; });
                
                if (enableChaining) {
                    currentInput = output;
                }
            } catch (error) {
                const duration = (performance.now() - startTime) / 1000;
                const message = error instanceof Error ? error.message : 'Unknown error';
                addExecutionRecord({ agent: `Orchestrator Agent ${i + 1}`, provider: agent.provider, model: agent.model, status: 'error', duration_s: duration });
                setResults(prev => { const next = [...prev]; next[i] = { status: 'error', content: message }; return next; });
                if (enableChaining) break;
            }
        }
        setIsRunning(false);
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-semibold mb-4">🧩 Configure Agent Chain</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label>Number of agents to chain</label>
                        <input type="number" value={numAgents} onChange={(e) => handleNumAgentsChange(parseInt(e.target.value, 10))} min="1" max="5" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" checked={enableChaining} onChange={(e) => setEnableChaining(e.target.checked)} className="h-5 w-5 rounded" />
                            <span>Enable chain execution (output → input)</span>
                        </label>
                    </div>
                </div>
            </Card>

            <div>{agents.map((agent, i) => <AgentConfiguration key={agent.id} agent={agent} index={i} onUpdate={updateAgent} isChained={enableChaining} />)}</div>

            <Card>
                <h3 className="text-xl font-semibold mb-2">📝 Initial Input (for first agent)</h3>
                <textarea value={initialInput} onChange={(e) => setInitialInput(e.target.value)} className="w-full p-2 border rounded h-32 dark:bg-gray-700 dark:border-gray-600" placeholder="Enter the starting input for the agent chain..." />
            </Card>

            <button
                onClick={executeChain}
                disabled={isRunning}
                className="w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(90deg, var(--primary-color), var(--secondary-color))`, transform: isRunning ? 'scale(0.98)' : 'scale(1)' }}
            >
                {isRunning ? 'Executing Chain...' : '▶️ Execute Agent Chain'}
            </button>

            {results.some(r => r) && (
                <Card>
                    <h3 className="text-xl font-semibold mb-4">📊 Execution Results</h3>
                    <div className="space-y-4">
                        {results.map((result, i) => result && (
                            <div key={i} className={`p-4 border rounded-lg ${result.status === 'success' ? 'border-green-500' : 'border-red-500'}`}>
                                <h4 className="font-semibold">Agent {i + 1} Output</h4>
                                <p className="mt-2 text-sm whitespace-pre-wrap">{result.content}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Orchestrator;
