import React from 'react';

interface ScriptSectionProps {
  title: string;
  content: string;
  color: string;
  onChange: (newText: string) => void;
}

const ScriptSection: React.FC<ScriptSectionProps> = ({ title, content, color, onChange }) => {
  const charCount = content ? content.length : 0;
  const isOverLimit = charCount > 190;

  return (
    <div className={`p-4 rounded-xl border-l-4 ${color} bg-white shadow-sm mb-4 group`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
           <span className="text-[10px] text-slate-400">Nhấn để sửa</span>
        </div>
      </div>
      <textarea
        className="w-full text-slate-800 text-sm leading-relaxed font-medium resize-none focus:outline-none focus:bg-slate-50 focus:ring-1 focus:ring-blue-200 rounded p-2 -ml-2 bg-transparent border border-transparent hover:border-slate-200 transition-all"
        rows={6}
        value={content || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Đang chờ kịch bản..."
      />
      <div className="mt-2 text-right">
        <span className={`text-[10px] px-2 py-1 rounded-full ${isOverLimit ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-100 text-slate-500'}`}>
          {charCount} / 190 ký tự
        </span>
      </div>
    </div>
  );
};

export default ScriptSection;