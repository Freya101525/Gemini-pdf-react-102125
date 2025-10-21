
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

    const [chainStatus, setChainStatus] = useState<'idle' | 'running' | 'paused' | 'finished' | 'error'>('idle');
    const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
    const [executionResults, setExecutionResults] = useState<({ status: 'success' | 'error'; content: string })[]>([]);
    const [nextInput, setNextInput] = useState('');
    const [isEditingInput, setIsEditingInput] = useState(false);

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
        resetChain();
    };

    const updateAgent = (index: number, updatedAgent: OrchestratorAgentConfig) => {
        const newAgents = [...agents];
        newAgents[index] = updatedAgent;
        setAgents(newAgents);
        resetChain();
    };

    const executeAgent = async (index: number, input: string) => {
        if (index >= agents.length) {
            setChainStatus('finished');
            return;
        }

        setChainStatus('running');
        setIsEditingInput(false);
        const agent = agents[index];
        const startTime = performance.now();

        try {
            if (agent.provider !== 'Gemini') throw new Error(`${agent.provider} is not implemented in this demo.`);
            
            const fullPrompt = `${agent.system_prompt}\n\nUser Input:\n${input}`;
            const output = await executeGeminiQuery(fullPrompt, agent.model, agent.temperature, agent.top_p, agent.max_tokens);

            const duration = (performance.now() - startTime) / 1000;
            addExecutionRecord({ agent: `Orchestrator Agent ${index + 1}`, provider: agent.provider, model: agent.model, status: 'success', duration_s: duration });

            setExecutionResults(prev => {
                const newResults = [...prev];
                newResults[index] = { status: 'success', content: output };
                return newResults;
            });
            
            if (enableChaining && index < agents.length - 1) {
                setNextInput(output);
                setCurrentAgentIndex(index + 1);
                setChainStatus('paused');
            } else {
                setChainStatus('finished');
            }
        } catch (error) {
            const duration = (performance.now() - startTime) / 1000;
            const message = error instanceof Error ? error.message : 'Unknown error';
            addExecutionRecord({ agent: `Orchestrator Agent ${index + 1}`, provider: agent.provider, model: agent.model, status: 'error', duration_s: duration });
            
            setExecutionResults(prev => {
                const newResults = [...prev];
                newResults[index] = { status: 'error', content: message };
                return newResults;
            });
            setChainStatus('error');
        }
    };

    const handleExecuteOrContinue = async () => {
        if (chainStatus === 'idle' || chainStatus === 'finished' || chainStatus === 'error') {
            if (!initialInput.trim()) {
                alert('Please provide an initial input.');
                return;
            }
            setCurrentAgentIndex(0);
            setExecutionResults([]);
            setNextInput(initialInput);
            setIsEditingInput(false);
            await executeAgent(0, initialInput);
        } else if (chainStatus === 'paused') {
            await executeAgent(currentAgentIndex, nextInput);
        }
    };
    
    const resetChain = () => {
        setChainStatus('idle');
        setCurrentAgentIndex(0);
        setExecutionResults([]);
        setNextInput('');
        setIsEditingInput(false);
    };

    const getButtonText = () => {
        switch(chainStatus) {
            case 'idle': return '▶️ Execute Agent Chain';
            case 'running': return 'Executing...';
            case 'paused': return `▶️ Continue to Agent ${currentAgentIndex + 1}`;
            case 'finished': return '🎉 Run Again';
            case 'error': return '🔁 Retry Chain';
        }
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

            <div className="flex items-center space-x-4">
                <button
                    onClick={handleExecuteOrContinue}
                    disabled={chainStatus === 'running'}
                    className="flex-grow py-3 px-4 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: `linear-gradient(90deg, var(--primary-color), var(--secondary-color))`, transform: chainStatus === 'running' ? 'scale(0.98)' : 'scale(1)' }}
                >
                    {getButtonText()}
                </button>
                {chainStatus !== 'idle' && (
                    <button onClick={resetChain} className="py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-500">
                        Stop & Reset
                    </button>
                )}
            </div>

            {executionResults.length > 0 && (
                <Card>
                    <h3 className="text-xl font-semibold mb-4">📊 Execution Results</h3>
                    <div className="space-y-4">
                        {executionResults.map((result, i) => result && (
                            <div key={i} className={`p-4 border rounded-lg ${result.status === 'success' ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20' : 'border-red-500 bg-red-50/50 dark:bg-red-900/20'}`}>
                                <h4 className="font-semibold">Agent {i + 1} Output</h4>
                                <p className="mt-2 text-sm whitespace-pre-wrap">{result.content}</p>
                            </div>
                        ))}
                        {chainStatus === 'paused' && enableChaining && (
                            <Card className="!border-l-blue-500">
                                <h3 className="text-lg font-semibold mb-2">
                                    📥 Input for Agent {currentAgentIndex + 1}
                                </h3>
                                <div className="flex items-center mb-2">
                                    <input 
                                        type="checkbox" 
                                        id={`edit-checkbox-${currentAgentIndex}`} 
                                        checked={isEditingInput} 
                                        onChange={e => setIsEditingInput(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                                    />
                                    <label htmlFor={`edit-checkbox-${currentAgentIndex}`} className="text-sm font-medium">Edit Input</label>
                                </div>
                                
                                {isEditingInput ? (
                                    <textarea 
                                        value={nextInput} 
                                        onChange={(e) => setNextInput(e.target.value)} 
                                        className="w-full p-2 border rounded h-32 dark:bg-gray-700 dark:border-gray-600" 
                                    />
                                ) : (
                                     <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md max-h-48 overflow-y-auto">
                                        {nextInput}
                                    </p>
                                )}
                            </Card>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Orchestrator;
