import React from 'react';
import { GeneratedImage, VideoPromptState } from '../types';

interface ImageCardProps {
  label: string;
  imageData: GeneratedImage;
  videoPrompt: VideoPromptState;
  onGeneratePrompt: () => void;
  onRegenerate: () => void;
  onTranslate: () => void;
  customPrompt: string;
  onCustomPromptChange: (text: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  label, 
  imageData, 
  videoPrompt, 
  onGeneratePrompt, 
  onRegenerate, 
  onTranslate,
  customPrompt,
  onCustomPromptChange
}) => {
  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <span className="font-semibold text-sm text-slate-700">{label}</span>
        {imageData.loading && <span className="text-xs text-blue-600 animate-pulse">Đang tạo...</span>}
      </div>

      {/* Image Display */}
      <div className="aspect-[9/16] relative bg-slate-100 w-full group">
        {imageData.url ? (
          <img 
            src={imageData.url} 
            alt={`${label} generated`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {imageData.loading ? (
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            ) : imageData.error ? (
              <span className="text-red-500 text-xs">{imageData.error}</span>
            ) : (
              <span className="text-slate-400 text-xs">Ảnh minh họa sẽ hiện ở đây sau khi có kịch bản</span>
            )}
          </div>
        )}
      </div>

      {/* Custom Prompt Input */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
        <textarea
          value={customPrompt || ''}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="Sửa yêu cầu ảnh (ví dụ: Đổi nền sang màu xanh, nhân vật cười tươi hơn...)"
          className="w-full text-xs p-2 rounded border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none resize-none bg-white placeholder-slate-400"
          rows={2}
        />
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
        <button
          onClick={onRegenerate}
          disabled={imageData.loading}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all border border-slate-200 text-slate-600 hover:bg-slate-50 ${
            imageData.loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Tạo lại
        </button>
        
        <button
          onClick={onGeneratePrompt}
          disabled={!imageData.url || videoPrompt.loading || imageData.loading}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
            !imageData.url || imageData.loading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : videoPrompt.loading
                ? 'bg-purple-100 text-purple-700 cursor-wait'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200'
          }`}
        >
          {videoPrompt.loading ? 'Đang viết...' : 'Tạo Prompt Video'}
        </button>
      </div>

      {/* Video Prompt Result */}
      {videoPrompt.visible && (
        <div className="p-3 bg-slate-800 border-t border-slate-700">
           {/* English Prompt */}
           <div className="flex justify-between items-center mb-2">
             <h4 className="text-slate-300 text-[10px] uppercase font-bold tracking-wider">VEO-3 Prompt (Gốc)</h4>
             <div className="flex gap-2">
               <button 
                 onClick={onTranslate}
                 disabled={videoPrompt.translating}
                 className="text-[10px] text-yellow-300 hover:text-yellow-200 disabled:opacity-50"
               >
                 {videoPrompt.translating ? 'Đang dịch...' : 'Dịch TV'}
               </button>
               <button 
                 onClick={() => navigator.clipboard.writeText(videoPrompt.text)}
                 className="text-[10px] text-blue-300 hover:text-white"
               >
                 Sao chép
               </button>
             </div>
           </div>
           <textarea 
             readOnly 
             className="w-full h-[500px] bg-slate-900 text-slate-300 text-xs p-2 rounded border border-slate-700 focus:outline-none resize-none mb-2"
             value={videoPrompt.text}
           />

           {/* Translated Prompt */}
           {videoPrompt.translatedText && (
             <div className="mt-2 pt-2 border-t border-slate-700">
               <div className="flex justify-between items-center mb-2">
                 <h4 className="text-slate-300 text-[10px] uppercase font-bold tracking-wider">Prompt (Tiếng Việt)</h4>
                 <button 
                   onClick={() => navigator.clipboard.writeText(videoPrompt.translatedText || '')}
                   className="text-[10px] text-blue-300 hover:text-white"
                 >
                   Sao chép
                 </button>
               </div>
               <textarea 
                 readOnly 
                 className="w-full h-[600px] bg-slate-900 text-slate-300 text-xs p-2 rounded border border-slate-700 focus:outline-none resize-none"
                 value={videoPrompt.translatedText}
               />
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default ImageCard;