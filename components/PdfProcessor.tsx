
import React, { useState, useCallback } from 'react';
import Card from './shared/Card';
import { AgentConfig, ExecutionRecord, Provider } from '../types';
import { executeGeminiQuery } from '../services/geminiService';

declare const pdfjsLib: any;
declare const Tesseract: any;

interface PdfProcessorProps {
  addExecutionRecord: (record: Omit<ExecutionRecord, 'id' | 'time'>) => void;
  agents: AgentConfig[];
}

const AgentResult: React.FC<{ agent: AgentConfig; result: string; status: 'pending' | 'running' | 'completed' | 'error' }> = ({ agent, result, status }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'running': return 'border-blue-500';
            case 'completed': return 'border-green-500';
            case 'error': return 'border-red-500';
            default: return 'border-gray-300 dark:border-gray-600';
        }
    };

    return (
        <div className={`p-4 border rounded-lg ${getStatusColor()}`}>
            <details className="group">
                <summary className="flex justify-between items-center cursor-pointer">
                    <h4 className="font-semibold">{agent.name}</h4>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        status === 'running' ? 'bg-blue-100 text-blue-800' :
                        status === 'completed' ? 'bg-green-100 text-green-800' :
                        status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </summary>
                <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                    {status === 'running' && <div className="animate-pulse">Running...</div>}
                    {(status === 'completed' || status === 'error') && <p className="whitespace-pre-wrap">{result}</p>}
                </div>
            </details>
        </div>
    );
};


const PdfProcessor: React.FC<PdfProcessorProps> = ({ addExecutionRecord, agents }) => {
    const [file, setFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [useOcr, setUseOcr] = useState(false);
    const [agentResults, setAgentResults] = useState<Record<string, { result: string; status: 'pending' | 'running' | 'completed' | 'error' }>>({});

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setExtractedText('');
            setAgentResults({});
        }
    };

    const processPdf = useCallback(async () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        setProcessing(true);
        setAgentResults({});
        setStatusMessage('Reading PDF file...');

        const fileBuffer = await file.arrayBuffer();

        try {
            let text = '';
            if (useOcr) {
                setStatusMessage('Performing OCR on PDF images... This may take a while.');
                const worker = await Tesseract.createWorker();
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
                const { data: { text: ocrText } } = await worker.recognize(fileBuffer);
                text = ocrText;
                await worker.terminate();
            } else {
                setStatusMessage('Extracting text from PDF...');
                const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
                const numPages = pdf.numPages;
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map((s: any) => s.str).join(' ');
                }
            }
            
            if (!text.trim()) {
              setStatusMessage('No text found. Try with OCR enabled.');
              setExtractedText('');
              setProcessing(false);
              return;
            }

            setExtractedText(text);
            setStatusMessage('Text extracted. Processing with AI agents...');

            const initialAgentState = agents.reduce((acc, agent) => {
              acc[agent.name] = { result: '', status: 'pending' };
              return acc;
            }, {} as Record<string, { result: string; status: 'pending' | 'running' | 'completed' | 'error' }>);
            setAgentResults(initialAgentState);

            for (const agent of agents) {
                setAgentResults(prev => ({ ...prev, [agent.name]: { ...prev[agent.name], status: 'running' } }));
                const startTime = performance.now();
                try {
                    const prompt = agent.prompt.replace('{input_text}', text);
                    const result = await executeGeminiQuery(
                        prompt,
                        agent.model,
                        agent.parameters.temperature ?? 0.7,
                        agent.parameters.topP ?? 1,
                        agent.parameters.maxOutputTokens ?? 2048
                    );
                    const duration = (performance.now() - startTime) / 1000;
                    addExecutionRecord({ agent: agent.name, provider: agent.api, model: agent.model, status: 'success', duration_s: duration });
                    setAgentResults(prev => ({ ...prev, [agent.name]: { result, status: 'completed' } }));
                } catch (e) {
                    const duration = (performance.now() - startTime) / 1000;
                    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                    addExecutionRecord({ agent: agent.name, provider: agent.api, model: agent.model, status: 'error', duration_s: duration });
                    setAgentResults(prev => ({ ...prev, [agent.name]: { result: errorMessage, status: 'error' } }));
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
    }, [file, useOcr, agents, addExecutionRecord]);

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>📂 Upload Your PDF</h3>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="ocr" checked={useOcr} onChange={(e) => setUseOcr(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="ocr" className="text-sm text-gray-600 dark:text-gray-300">Use OCR</label>
                    </div>
                </div>
                {file && <p className="text-sm text-gray-500 mt-2">Selected: {file.name}</p>}
            </Card>

            <button
                onClick={processPdf}
                disabled={!file || processing}
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

            {extractedText && (
                <Card>
                    <h3 className="text-lg font-semibold mb-2">📄 Extracted Text Preview</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md max-h-48 overflow-y-auto">
                        {extractedText.substring(0, 1000)}...
                    </p>
                </Card>
            )}

            {Object.keys(agentResults).length > 0 && (
                <Card>
                    <h3 className="text-xl font-semibold mb-4">🤖 AI Agent Results</h3>
                    <div className="space-y-4">
                        {agents.map(agent => (
                            <AgentResult
                                key={agent.name}
                                agent={agent}
                                result={agentResults[agent.name]?.result || ''}
                                status={agentResults[agent.name]?.status || 'pending'}
                            />
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PdfProcessor;
