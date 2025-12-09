import React from 'react';
import { CarouselItem } from '../types';

interface CarouselCardProps {
  item: CarouselItem;
  onTextChange: (id: number, text: string) => void;
  onGenerate: (id: number) => void;
  onRegenerate: (id: number) => void;
  onNoteChange: (id: number, text: string) => void;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ 
  item, 
  onTextChange, 
  onGenerate, 
  onRegenerate,
  onNoteChange 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
         <span className="font-bold text-sm text-slate-700">Trang số #{item.id}</span>
         {item.loading && <span className="text-xs text-pink-600 animate-pulse font-medium">Đang xử lý...</span>}
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
         {/* Text Content Input */}
         <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nội dung trên ảnh</label>
            <textarea
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none resize-none transition-all"
               rows={3}
               value={item.content}
               onChange={(e) => onTextChange(item.id, e.target.value)}
               placeholder="Nhập nội dung sẽ hiển thị trên ảnh..."
            />
         </div>

         {/* Image Area */}
         <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
            {item.imageUrl ? (
               <img src={item.imageUrl} alt={`Slide ${item.id}`} className="w-full h-full object-cover" />
            ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  {item.loading ? (
                     <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  ) : (
                     <>
                        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs">Chưa có ảnh</span>
                     </>
                  )}
               </div>
            )}
         </div>

         {/* Actions */}
         <div className="mt-auto">
            {!item.imageUrl ? (
               <button
                  onClick={() => onGenerate(item.id)}
                  disabled={item.loading || !item.content.trim()}
                  className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                     item.loading || !item.content.trim()
                     ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                     : 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-200'
                  }`}
               >
                  Tạo ảnh
               </button>
            ) : (
               <div className="space-y-2">
                  <input
                     type="text"
                     value={item.customNote}
                     onChange={(e) => onNoteChange(item.id, e.target.value)}
                     placeholder="Ghi chú sửa ảnh (ví dụ: đổi nền, chữ to hơn...)"
                     className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-pink-500 outline-none"
                  />
                  <button
                     onClick={() => onRegenerate(item.id)}
                     disabled={item.loading}
                     className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-all"
                  >
                     Tạo lại
                  </button>
               </div>
            )}
         </div>
         
         {item.error && <p className="text-xs text-red-500 font-medium text-center">{item.error}</p>}
      </div>
    </div>
  );
};

export default CarouselCard;