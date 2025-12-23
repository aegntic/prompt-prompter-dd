
import React from 'react';
import { PromptExample } from '../types';

interface ExampleTableProps {
  onSelect: (ex: PromptExample) => void;
}

const EXAMPLES: PromptExample[] = [
  {
    prompt: "Analyze Q4 customer churn data and identify top 3 factors driving loss with percentage impact.",
    expected: "Structured analysis with bullet points showing key churn drivers and actionable recommendations",
    autoOptimize: true
  },
  {
    prompt: "Generate a CI/CD pipeline config for a Node.js microservice with automated testing, Docker builds, and Kubernetes deployment.",
    expected: "",
    autoOptimize: true
  },
  {
    prompt: "Draft escalation response for enterprise customer reporting 99.2% SLA breach on critical infrastructure.",
    expected: "Professional, empathetic response acknowledging issue, outlining root cause, and providing remediation timeline",
    autoOptimize: false
  },
  {
    prompt: "Summarize GDPR compliance requirements for user data retention in cloud-based CRM systems.",
    expected: "",
    autoOptimize: true
  },
  {
    prompt: "Create SQL query to aggregate monthly revenue by product category with year-over-year comparison.",
    expected: "Optimized SQL with CTEs, proper indexing hints, and clear column aliases",
    autoOptimize: false
  }
];

const ExampleTable: React.FC<ExampleTableProps> = ({ onSelect }) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-tech mb-4 text-slate-800 dark:text-blue-300">Example Prompts</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-blue-400 uppercase text-xs font-tech">
            <tr>
              <th className="px-6 py-4">Your Prompt</th>
              <th className="px-6 py-4">Expected Response (Optional)</th>
              <th className="px-6 py-4">Auto optimize if score below 60%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-blue-900/20">
            {EXAMPLES.map((ex, idx) => (
              <tr
                key={idx}
                className="hover:bg-blue-500/5 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                onClick={() => onSelect(ex)}
              >
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{ex.prompt}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{ex.expected || '-'}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{ex.autoOptimize ? 'true' : 'false'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExampleTable;
