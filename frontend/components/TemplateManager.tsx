
import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Plus, Trash2, Check, X, ChevronRight, Info, Database, Layers, Edit3, Save, Clock, RotateCcw, FileText } from 'lucide-react';
import { PromptTemplate, TemplateVersion } from '../types';

interface TemplateManagerProps {
  templates: PromptTemplate[];
  onSave: (name: string, content: string, description: string) => void;
  onUpdate: (template: PromptTemplate) => void;
  onDelete: (id: string) => void;
  onSelect: (content: string) => void;
  currentInput: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  templates, onSave, onUpdate, onDelete, onSelect, currentInput 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const currentVersion = useMemo(() => {
    if (!selectedTemplate) return null;
    return selectedTemplate.versions[selectedTemplate.versions.length - 1];
  }, [selectedTemplate]);

  const variables = useMemo(() => {
    if (!currentVersion) return [];
    const matches = currentVersion.content.matchAll(/\{\{([^}]+)\}\}/g);
    return Array.from(new Set(Array.from(matches).map(m => m[1].trim())));
  }, [currentVersion]);

  useEffect(() => {
    if (selectedTemplate && currentVersion) {
      const initial: Record<string, string> = {};
      variables.forEach(v => initial[v] = '');
      setPlaceholderValues(initial);
      setEditedDescription(currentVersion.description || '');
      setEditedContent(currentVersion.content || '');
      setIsEditingDescription(false);
      setIsEditingContent(false);
    }
  }, [selectedTemplate, currentVersion, variables]);

  const handleSaveAsNewTemplate = () => {
    if (newName && currentInput) {
      onSave(newName, currentInput, newDescription);
      setNewName('');
      setNewDescription('');
      setIsAdding(false);
    }
  };

  const createNewVersion = (content: string, description: string) => {
    if (!selectedTemplate) return;
    const nextVersionNum = selectedTemplate.versions.length + 1;
    const newVer: TemplateVersion = {
      id: crypto.randomUUID(),
      content,
      description,
      timestamp: Date.now(),
      versionNumber: nextVersionNum
    };
    const updated = {
      ...selectedTemplate,
      versions: [...selectedTemplate.versions, newVer]
    };
    onUpdate(updated);
    setSelectedTemplate(updated);
  };

  const handleCommitVersion = () => {
    createNewVersion(editedContent, editedDescription);
    setIsEditingDescription(false);
    setIsEditingContent(false);
  };

  const handleRestoreVersion = (ver: TemplateVersion) => {
    createNewVersion(ver.content, ver.description);
  };

  const getPopulatedTemplate = () => {
    if (!currentVersion) return '';
    let content = isEditingContent ? editedContent : currentVersion.content;
    Object.entries(placeholderValues).forEach(([key, val]) => {
      content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val || `{{${key}}}`);
    });
    return content;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Database size={14} className="text-cyan-400" /> Neural_Memory_Bank
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`text-[9px] font-black tracking-widest px-3 py-1 border transition-all flex items-center gap-1.5 ${
            isAdding ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10'
          }`}
        >
          {isAdding ? <X size={10} /> : <Plus size={10} />}
          {isAdding ? 'CANCEL' : 'SAVE_AS_TPL'}
        </button>
      </div>

      {isAdding && (
        <div className="space-y-3 bg-cyan-500/5 border border-cyan-500/20 p-4 rounded animate-in slide-in-from-top-4">
          <input 
            type="text" 
            placeholder="Template_Identifier_UID..." 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-[#020617] border border-cyan-500/20 rounded p-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500 mono"
          />
          <textarea 
            placeholder="Template_Description_Text..." 
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full bg-[#020617] border border-cyan-500/20 rounded p-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500 mono h-16 resize-none"
          />
          <button 
            onClick={handleSaveAsNewTemplate}
            disabled={!newName || !currentInput}
            className="w-full bg-cyan-500 text-black py-2 text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-30 disabled:grayscale transition-all"
          >
            COMMIT_TO_BANK
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {templates.map(tpl => {
          const latest = tpl.versions[tpl.versions.length - 1];
          return (
            <div 
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl)}
              className={`p-3 border border-white/5 hover:bg-white/5 transition-all cursor-pointer group flex justify-between items-center ${
                selectedTemplate?.id === tpl.id ? 'border-cyan-500/50 bg-cyan-500/5' : ''
              }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-bold text-slate-200 truncate group-hover:text-cyan-400 transition-colors uppercase">{tpl.name}</h4>
                  <span className="text-[8px] px-1 bg-cyan-500/10 text-cyan-500/70 border border-cyan-500/20 rounded mono">V{latest.versionNumber}</span>
                </div>
                <p className="text-[9px] text-slate-500 truncate mt-0.5 italic">{latest.description || 'No description provided'}</p>
                <p className="text-[9px] text-slate-600 truncate mono mt-1">{latest.content}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(tpl.id); if (selectedTemplate?.id === tpl.id) setSelectedTemplate(null); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {selectedTemplate && currentVersion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="hud-panel p-8 max-w-5xl w-full cyber-border relative max-h-[90vh] overflow-y-auto">
             <button onClick={() => setSelectedTemplate(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white p-2">
               <X size={24} />
             </button>
             
             <div className="grid grid-cols-12 gap-8">
               {/* Left side: Current and Edit */}
               <div className="col-span-12 lg:col-span-7 space-y-6">
                 <div>
                   <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2 flex items-center gap-3">
                     <Layers className="text-cyan-400" /> {selectedTemplate.name}
                   </h4>
                   <div className="flex items-start gap-4 mt-2">
                     <div className="flex-1">
                       <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                         Context Description
                         <button 
                            onClick={() => setIsEditingDescription(!isEditingDescription)}
                            className="text-cyan-500 hover:text-cyan-400"
                          >
                            <Edit3 size={10} />
                          </button>
                       </div>
                       {isEditingDescription ? (
                         <div className="mt-2 flex gap-2">
                           <input 
                             type="text"
                             value={editedDescription}
                             onChange={(e) => setEditedDescription(e.target.value)}
                             className="flex-1 bg-[#0f172a] border border-cyan-500/20 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                           />
                         </div>
                       ) : (
                         <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">
                           {currentVersion.description || 'No specialized description mapped to this memory shard.'}
                         </p>
                       )}
                     </div>
                   </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Template Source
                        <button 
                          onClick={() => setIsEditingContent(!isEditingContent)}
                          className="text-cyan-500 hover:text-cyan-400"
                        >
                          <Edit3 size={10} />
                        </button>
                      </label>
                      {(isEditingContent || isEditingDescription) && (
                        <button 
                           onClick={handleCommitVersion}
                           className="text-[9px] bg-cyan-500 text-black px-3 py-1 font-bold uppercase tracking-widest flex items-center gap-1.5"
                         >
                           <Save size={10} /> Commit Version {selectedTemplate.versions.length + 1}
                         </button>
                      )}
                    </div>
                    
                    {isEditingContent ? (
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full bg-[#0f172a] border border-cyan-500/20 rounded p-4 text-xs text-white mono h-40 focus:outline-none focus:border-cyan-500"
                      />
                    ) : (
                      <div className="bg-[#0f172a] p-4 rounded border border-white/5 text-xs text-slate-400 mono italic whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {currentVersion.content}
                      </div>
                    )}

                    <div className="border-t border-cyan-500/10 pt-6">
                      <h5 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4">Injection Parameters</h5>
                      {variables.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {variables.map(variable => (
                            <div key={variable} className="space-y-2">
                              <label className="text-[10px] font-black text-cyan-400/60 uppercase tracking-widest mono">{variable}</label>
                              <input 
                                type="text"
                                placeholder={`Value for ${variable}...`}
                                value={placeholderValues[variable] || ''}
                                onChange={(e) => setPlaceholderValues(prev => ({ ...prev, [variable]: e.target.value }))}
                                className="w-full bg-[#0f172a] border border-cyan-500/20 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-500">Static template detected. No variable injection required.</p>
                      )}
                    </div>

                    <div className="space-y-2 mt-8">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hydrated Buffer Preview</label>
                      <div className="bg-[#0f172a] p-4 rounded border border-white/5 text-xs text-slate-400 mono italic whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {getPopulatedTemplate()}
                      </div>
                    </div>

                    <button 
                      onClick={() => { onSelect(getPopulatedTemplate()); setSelectedTemplate(null); }}
                      className="w-full mt-6 bg-cyan-500 hover:bg-white text-black py-4 font-black tracking-[0.5em] uppercase transition-all shadow-xl shadow-cyan-500/20 active:scale-95"
                    >
                      LOAD_INTO_CORE
                    </button>
                 </div>
               </div>

               {/* Right side: Timeline */}
               <div className="col-span-12 lg:col-span-5 border-l border-cyan-500/10 pl-8">
                 <div className="flex items-center justify-between mb-6">
                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                     <Clock size={14} className="text-cyan-500" /> Neural Timeline
                   </h5>
                   <span className="text-[9px] font-bold text-slate-600">{selectedTemplate.versions.length} STAGES MAPED</span>
                 </div>
                 
                 <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-cyan-500/20">
                   {[...selectedTemplate.versions].reverse().map((ver, idx) => (
                     <div key={ver.id} className="relative pl-8 group">
                       <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border border-cyan-500/50 flex items-center justify-center bg-[#020617] transition-all ${idx === 0 ? 'bg-cyan-500 scale-110 shadow-[0_0_10px_#00f3ff]' : 'group-hover:border-cyan-400'}`}>
                         <span className={`text-[8px] font-black ${idx === 0 ? 'text-black' : 'text-cyan-500'}`}>V{ver.versionNumber}</span>
                       </div>
                       <div className={`p-4 rounded border transition-all ${idx === 0 ? 'bg-cyan-500/5 border-cyan-500/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                         <div className="flex justify-between items-start mb-2">
                           <span className="text-[9px] text-slate-500 mono uppercase">{new Date(ver.timestamp).toLocaleString()}</span>
                           {idx !== 0 && (
                             <button 
                               onClick={() => handleRestoreVersion(ver)}
                               className="text-[8px] font-black text-cyan-500 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest"
                             >
                               <RotateCcw size={10} /> Restore
                             </button>
                           )}
                         </div>
                         <div className="text-[10px] font-bold text-slate-300 italic mb-2 truncate">{ver.description || 'N/A'}</div>
                         <div className="text-[9px] text-slate-600 mono line-clamp-2 bg-black/30 p-2 rounded">{ver.content}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
