
import React, { useState, useCallback, useEffect } from 'react';
import Card from './shared/Card';
import { AgentConfig, ExecutionRecord } from '../types';
import { executeGeminiQuery } from '../services/geminiService';
import { DEFAULT_PDF_AGENTS, MODEL_OPTIONS } from '../constants';
import EditableAgentConfig from './EditableAgentConfig';

declare const pdfjsLib: any;
declare const Tesseract: any;

interface PdfProcessorProps {
  addExecutionRecord: (record: Omit<ExecutionRecord, 'id' | 'time'>) => void;
}

const AgentResult: React.FC<{ agent: AgentConfig; result: string; status: 'pending' | 'running' | 'completed' | 'error' }> = ({ agent, result, status }) => {
    const [isResultVisible, setIsResultVisible] = useState(false);

    // When a new process starts (status goes to pending/running), hide any previous results.
    useEffect(() => {
        if (status !== 'completed' && status !== 'error') {
            setIsResultVisible(false);
        }
    }, [status]);
    
    const getStatusColor = () => {
        switch (status) {
            case 'running': return 'border-blue-500';
            case 'completed': return 'border-green-500';
            case 'error': return 'border-red-500';
            default: return 'border-gray-300 dark:border-gray-600';
        }
    };

    const showResult = () => setIsResultVisible(true);

    return (
        <div className={`p-4 border rounded-lg ${getStatusColor()} bg-white/50 dark:bg-gray-800/50 transition-all`}>
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">{agent.name}</h4>
                
                {status === 'completed' || status === 'error' ? (
                    isResultVisible ? (
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                    ) : (
                        <button onClick={showResult} className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                            status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 focus:ring-green-500' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 focus:ring-red-500'
                        }`}>
                            {status === 'completed' ? '✅ Completed' : '❌ Error'} - View Result
                        </button>
                    )
                ) : (
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                )}
            </div>
            <div className="mt-4">
                {status === 'pending' && <p className="text-gray-500 dark:text-gray-400">Queued...</p>}
                {status === 'running' && <p className="animate-pulse text-gray-600 dark:text-gray-300">Running...</p>}
                {isResultVisible && (
                    <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                        {result}
                    </p>
                )}
            </div>
        </div>
    );
};

const PdfProcessor: React.FC<PdfProcessorProps> = ({ addExecutionRecord }) => {
    const [file, setFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [useOcr, setUseOcr] = useState(false);
    const [agentResults, setAgentResults] = useState<Record<string, { result: string; status: 'pending' | 'running' | 'completed' | 'error' }>>({});

    // New state for page selection and dynamic agents
    const [totalPages, setTotalPages] = useState(0);
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(1);
    const [agentsToRun, setAgentsToRun] = useState<AgentConfig[]>([]);
    const [selectedAgentTemplate, setSelectedAgentTemplate] = useState<string>(DEFAULT_PDF_AGENTS[0].name);

    const getPdfPageCount = async (fileBuffer: ArrayBuffer) => {
        try {
            const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
            setTotalPages(pdf.numPages);
            setEndPage(pdf.numPages);
        } catch (e) {
            console.error("Could not read PDF metadata", e);
            setTotalPages(0);
        }
    };
    
    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if(e.target?.result) {
                    getPdfPageCount(e.target.result as ArrayBuffer);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            setTotalPages(0);
        }
    }, [file]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setExtractedText('');
            setAgentResults({});
            setStartPage(1);
            setEndPage(1);
        }
    };

    const handleAddAgent = () => {
        const template = DEFAULT_PDF_AGENTS.find(a => a.name === selectedAgentTemplate);
        if(template) {
            // Give it a unique ID for state management
            const newAgent: AgentConfig = { ...template, id: crypto.randomUUID() };
            setAgentsToRun(prev => [...prev, newAgent]);
        }
    };

    const handleUpdateAgent = (index: number, updatedAgent: AgentConfig) => {
        setAgentsToRun(prev => {
            const newAgents = [...prev];
            newAgents[index] = updatedAgent;
            return newAgents;
        });
    };

    const handleRemoveAgent = (index: number) => {
        setAgentsToRun(prev => prev.filter((_, i) => i !== index));
    };

    const processPdf = useCallback(async () => {
        if (!file) { alert("Please select a file first."); return; }
        if (agentsToRun.length === 0) { alert("Please add at least one AI agent to run."); return; }
        if (startPage > endPage || startPage < 1 || endPage > totalPages) { alert("Invalid page range selected."); return; }

        setProcessing(true);
        setAgentResults({});
        setStatusMessage('Reading PDF file...');
        const fileBuffer = await file.arrayBuffer();

        try {
            let text = '';
            if (useOcr) {
                setStatusMessage('Performing OCR on PDF images... This may take a while.');
                // Note: Tesseract.js recognizes the entire file, not page ranges.
                // For page-specific OCR, a more complex library would be needed.
                if(startPage !== 1 || endPage !== totalPages) {
                    setStatusMessage("Warning: OCR processes the entire file, not specific page ranges. Continuing with full file OCR...");
                }
                const worker = await Tesseract.createWorker();
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text: ocrText } } = await worker.recognize(fileBuffer);
                text = ocrText;
                await worker.terminate();
            } else {
                setStatusMessage(`Extracting text from pages ${startPage} to ${endPage}...`);
                const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
                for (let i = startPage; i <= endPage; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map((s: any) => s.str).join(' ') + '\n';
                }
            }
            
            if (!text.trim()) {
              setStatusMessage('No text found in the selected pages. Try a different range or use OCR.');
              setExtractedText('');
              setProcessing(false);
              return;
            }

            setExtractedText(text);
            setStatusMessage('Text extracted. Processing with AI agents...');
            const initialAgentState = agentsToRun.reduce((acc, agent) => {
              acc[agent.id] = { result: '', status: 'pending' };
              return acc;
            }, {} as Record<string, { result: string; status: 'pending' | 'running' | 'completed' | 'error' }>);
            setAgentResults(initialAgentState);

            for (const agent of agentsToRun) {
                setAgentResults(prev => ({ ...prev, [agent.id]: { ...prev[agent.id], status: 'running' } }));
                const startTime = performance.now();
                try {
                    const prompt = agent.prompt.replace('{input_text}', text);
                    const result = await executeGeminiQuery(
                        prompt, agent.model,
                        agent.parameters.temperature ?? 0.7,
                        agent.parameters.topP ?? 1,
                        agent.parameters.maxOutputTokens ?? 2048
                    );
                    const duration = (performance.now() - startTime) / 1000;
                    addExecutionRecord({ agent: agent.name, provider: agent.api, model: agent.model, status: 'success', duration_s: duration });
                    setAgentResults(prev => ({ ...prev, [agent.id]: { result, status: 'completed' } }));
                } catch (e) {
                    const duration = (performance.now() - startTime) / 1000;
                    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                    addExecutionRecord({ agent: agent.name, provider: agent.api, model: agent.model, status: 'error', duration_s: duration });
                    setAgentResults(prev => ({ ...prev, [agent.id]: { result: errorMessage, status: 'error' } }));
                }
            }
            setStatusMessage('All agents have completed processing.');

        } catch (error) {
            console.error("Failed to process PDF:", error);
            setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setExtractedText('');
        } finally {
            setProcessing(false);
        }
    }, [file, useOcr, agentsToRun, addExecutionRecord, startPage, endPage, totalPages]);

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>📂 1. Upload & Configure PDF</h3>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 dark:file:bg-violet-900/50 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900"
                    />
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <input type="checkbox" id="ocr" checked={useOcr} onChange={(e) => setUseOcr(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="ocr" className="text-sm text-gray-600 dark:text-gray-300">Use OCR</label>
                    </div>
                </div>
                {file && (
                     <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 col-span-2">Selected: <span className="font-medium text-gray-800 dark:text-gray-200">{file.name}</span></p>
                        {totalPages > 0 ? (
                            <>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="startPage" className="text-sm">From</label>
                                    <input type="number" id="startPage" value={startPage} onChange={e => setStartPage(Math.max(1, parseInt(e.target.value)))} className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="endPage" className="text-sm">to</label>
                                    <input type="number" id="endPage" value={endPage} onChange={e => setEndPage(Math.min(totalPages, parseInt(e.target.value)))} className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    <span className="text-sm text-gray-500">/ {totalPages}</span>
                                </div>
                            </>
                        ) : <p className="text-sm text-gray-500 col-span-2">Reading page count...</p>}
                    </div>
                )}
            </Card>

            <Card>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>🤖 2. Build Your Agent Workflow</h3>
                <div className="flex items-center space-x-2 mb-4">
                    <select value={selectedAgentTemplate} onChange={e => setSelectedAgentTemplate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        {DEFAULT_PDF_AGENTS.map(agent => <option key={agent.name} value={agent.name}>{agent.name}</option>)}
                    </select>
                    <button onClick={handleAddAgent} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 whitespace-nowrap">
                        + Add Agent
                    </button>
                </div>
                <div className="space-y-4">
                    {agentsToRun.length > 0 ? (
                        agentsToRun.map((agent, index) => (
                            <EditableAgentConfig 
                                key={agent.id}
                                agent={agent}
                                onUpdate={(updated) => handleUpdateAgent(index, updated)}
                                onRemove={() => handleRemoveAgent(index)}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">Add an agent from the dropdown to get started.</p>
                    )}
                </div>
            </Card>

            <button
                onClick={processPdf}
                disabled={!file || processing || agentsToRun.length === 0}
                className="w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(90deg, var(--primary-color), var(--secondary-color))`, transform: processing ? 'scale(0.98)' : 'scale(1)' }}
            >
                {processing ? 'Processing...' : '🚀 Process PDF with AI'}
            </button>
            
            {statusMessage && (
                <Card>
                    <p className="text-center font-medium text-gray-700 dark:text-gray-300">{statusMessage}</p>
                    {processing && <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2"><div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div></div>}
                </Card>
            )}

            {Object.keys(agentResults).length > 0 && (
                <Card>
                    <h3 className="text-xl font-semibold mb-4">📊 AI Agent Results</h3>
                    <div className="space-y-4">
                        {agentsToRun.map(agent => (
                            <AgentResult
                                key={agent.id}
                                agent={agent}
                                result={agentResults[agent.id]?.result || ''}
                                status={agentResults[agent.id]?.status || 'pending'}
                            />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PdfProcessor;
