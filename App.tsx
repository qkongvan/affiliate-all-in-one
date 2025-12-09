
import React, { useState, useRef, useEffect } from 'react';
import { AppState, ScriptPartKey, ScriptParts, VideoPromptState, GeneratedImage, CarouselItem, VideoPovState } from './types';
import { fileToGenerativePart, generateTikTokScript, generateScenarioImage, generateVeoPrompt, translateText, generateCarouselScript, generateCarouselImage, analyzeVideoContent, generatePovScriptSegments, generatePovImage, generatePovVeoPrompt, setApiKeys } from './services/geminiService';
import ScriptSection from './components/ScriptSection';
import ImageCard from './components/ImageCard';
import CarouselCard from './components/CarouselCard';

// --- Constants & Types for Module System ---

const LAYOUT_OPTIONS = [
  "Câu chuyện chủ đề + giới thiệu sản phẩm + đánh giá so sánh + sử dụng sản phẩm trong nhiều trường hợp + CTA",
  "Hình thức phỏng vấn + chỉa sẻ trải nghiệm người dùng + giới thiệu sản phẩm + CTA",
  "Chủ đề đời sống + đánh giá só sánh + điểm nổi bật + sử dụng sản phẩm trong nhiều trường hợp + CTA",
  "Nổi đau + nguyên nhân + giới thiệu sản phẩm + uy tín thương hiệu + CTA",
  "Hình ảnh cá nhân + nỗi đau/trải nghiệm thực tế + đánh giá so sánh + bằng chứng + giá trị cộng thêm + CTA",
  "Chia sẻ chân thực + kiến thức nghành + giới thiệu chức năng + đặc điểm nổi bật + ưu đãi + CTA",
  "Thu hút đối tượng mục tiêu + câu hỏi từ góc độ người dùng + giải đáp + giới thiệu sản phẩm + CTA",
  "Nỗi đau trong cuộc sống + các trường hợp sử dụng sản phẩm + so sánh độc lập + CTA",
  "Kết quả và đánh giá trước + nỗi đau/giải pháp + giới thiệu sản phẩm + ưu đãi + CTA",
  "Hình ảnh cá nhân + nỗi đau trong cuộc sống + trải nghiệm thực tế + giới thiệu sản phẩm/chức năng + trường hợp sử dụng + CTA",
  "Câu hỏi + giải pháp cho câu hỏi + giới thiệu đặc điểm nổi bật giải pháp + đảm bảo từ nhiều góc độ/ trường hợp + CTA",
  "Nỗi đau theo khu vực/mùa + giới thiệu sản phẩm + hoàn cảnh sử dụng + cảm nhận khi trải nghiệm + đảm bảo & CTA",
  "Sở thích + giới thiệu sản phẩm + so sánh + giải thích về giá trị + đảm bảo + CTA",
  "Xác định đối tượng mục tiêu + giới thiệu sản phẩm + hướng dẫn sử dụng + thử nghiệm + đánh giá + CTA",
  "Nguyên nhân nỗi đau + giới thiệu chức năng sản phẩm + trường hợp sử dụng thực tế + ưu đãi",
  "Phản hồi và trải nghiệm của người dùng + kiến thức chuyên môn + nỗi đau + giới thiệu sản phẩm + CTA",
  "Vấn đề + Giải pháp/Đánh giá/trải nghiệm + CTA",
  "Nỗi đau của khách hàng + giải pháp của sản phẩm + kết quả thực tế + CTA",
  "Câu chuyện thất bại + bài học rút ra + sản phẩm là giải pháp + CTA",
  "Nỗi đau + giải pháp/đánh giá + CTA",
  "Câu hỏi + giới thiệu sản phẩm + CTA"
];

const CAROUSEL_CATEGORIES: Record<string, string[]> = {
  "Kể chuyện cá nhân": [
    "Thành công nhiều người ngưỡng mộ",
    "Thất bại để tạo sự đồng cảm/ngưỡng mộ/nể phục cho đám đông",
    "Khoảnh khắc đời thường với góc nhìn độc đáo",
    "Bài học từ trải nghiệm nào đó",
    "Kể chuyện trải nghiệm"
  ],
  "Tổng hợp": [
    "Lần đầu làm 1 việc gì đấy",
    "Những điều hay nhất/tệ nhất",
    "Cảnh báo về 1 vấn đề nào đấy",
    "Xu hướng",
    "Hướng dẫn",
    "Tài liệu để giải quyết 1 vấn đề gì đấy",
    "Công cụ hữu ích"
  ],
  "So sánh": [
    "Sản phẩm cùng loại",
    "Thế hệ",
    "Vùng miền",
    "Các thương hiệu/các hãng/các công ty",
    "Hiệu quả/Công dụng/Lợi ích/Tính Năng",
    "Phát biểu của người nổi tiếng/người bất kỳ"
  ],
  "Check var (Kiểm chứng)": [
    "Một hiện tượng lạ",
    "Các vấn đề, chủ đề có nhiều luồng ý kiến"
  ],
  "Hướng dẫn chi tiết": [
    "Những thứ cần thiết để phát triển trong 1 lĩnh vực/ngành nghề/công việc",
    "Những thứ giúp người khác tăng thu nhập",
    "Bảo vệ mọi người, giúp người khác an toàn",
    "Rút ngắn thời gian hoàn thành 1 thứ gì đó",
    "Công cụ, công nghệ hiện đại",
    "Quá trình ra đời của 1 sản phẩm",
    "Một sản phẩm thất bại và bài học từ đó"
  ],
  "Kể chuyện sản phẩm/dịch vụ": [
    "Câu chuyện về những khách hàng đầu tiên/ấn tượng nhất/đặc biệt nhất",
    "1 sản phẩm độc đáo và các tình huống khác nhau xoay quanh nó",
    "Tình huống oái oăm, dở khóc, dở cười khi bán sản phẩm",
    "Chuyện về nhà sáng lập/hội đồng sáng lập"
  ]
};

const FONT_OPTIONS = [
  { value: 'Montserrat', label: 'Montserrat (AaBbCc)', family: 'Montserrat, sans-serif' },
  { value: 'Merriweather', label: 'Merriweather (Có chân) (AaBbCc)', family: 'Merriweather, serif' },
  { value: 'Oswald', label: 'Oswald (Cao) (AaBbCc)', family: 'Oswald, sans-serif' },
  { value: 'Anton', label: 'Anton (Đậm) (AaBbCc)', family: 'Anton, sans-serif' },
  { value: 'Dancing Script', label: 'Dancing Script (Viết tay) (AaBbCc)', family: '"Dancing Script", cursive' },
  { value: 'Patrick Hand', label: 'Patrick Hand (Vui vẻ) (AaBbCc)', family: '"Patrick Hand", cursive' },
];

const initialImageState = { url: '', loading: false, customPrompt: '' };
const initialVideoPromptState = { text: '', loading: false, visible: false };

const initialState: AppState = {
  faceFile: null,
  facePreviewUrl: null,
  characterDescription: '',
  selectedFiles: [],
  previewUrls: [],
  productName: '',
  keyword: '',
  scriptTone: '',
  productSize: '', 
  scriptNote: '',
  scriptLayout: '', 
  isGeneratingScript: false,
  script: null,
  scriptError: null,
  
  // Existing Images (Fixed slots)
  images: { 
    v1: { ...initialImageState }, 
    v2: { ...initialImageState }, 
    v3: { ...initialImageState }, 
    v3_5: { ...initialImageState }, 
    v4: { ...initialImageState } 
  },
  videoPrompts: { 
    v1: { ...initialVideoPromptState }, 
    v2: { ...initialVideoPromptState }, 
    v3: { ...initialVideoPromptState }, 
    v3_5: { ...initialVideoPromptState }, 
    v4: { ...initialVideoPromptState } 
  },
  
  // Module 4: Cover Link Shopee State
  coverLinkInput: '',
  coverLinkNames: '',
  coverLinkUrls: '',
  coverLinkOutput: '',

  // Module 6 Init
  carouselCategory: 'Kể chuyện cá nhân',
  carouselSubCategory: '', // Will default to first item of category in UI logic if empty
  carouselTopic: '',
  carouselImageCount: 4,
  carouselNote: '',
  carouselItems: [],
  isGeneratingCarouselScript: false,
  carouselFont: 'Montserrat',
  carouselTextPosition: 'bottom',

  // Module 8 New: Video POV
  videoPov: {
    videoFile: null,
    videoPreviewUrl: null,
    analysis: '',
    isAnalyzing: false,
    style: 'tâm sự trải lòng',
    segmentCount: 4, // Default 4 segments
    faceFile: null,
    facePreviewUrl: null,
    isGeneratingScript: false,
    segments: []
  }
};

// --- API Key Input Component ---
interface ApiKeyEntryProps {
    onKeysSubmit: (keys: string[]) => void;
}

const ApiKeyEntry: React.FC<ApiKeyEntryProps> = ({ onKeysSubmit }) => {
    const [inputText, setInputText] = useState('');
    
    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_keys');
        if (stored) {
            try {
                const keys = JSON.parse(stored);
                if (Array.isArray(keys)) {
                    setInputText(keys.join('\n'));
                }
            } catch (e) {
                console.error("Failed to parse stored keys");
            }
        }
    }, []);

    const handleSubmit = () => {
        const keys = inputText.split('\n').map(k => k.trim()).filter(k => k.length > 0);
        if (keys.length === 0) {
            alert("Vui lòng nhập ít nhất 1 API Key.");
            return;
        }
        onKeysSubmit(keys);
    };

    return (
        <div className="fixed inset-0 bg-slate-100 flex items-start justify-center z-50 p-4 pt-[50px]">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-slate-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                         <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Cấu hình API Key</h2>
                    <p className="text-slate-500 text-sm mt-2">Liên hệ 0923.200.820 để lấy KEY API test</p>
                </div>

                <div className="mb-6">
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Nhập API KEY để TEST tính năng hoặc nhập 1 ký tự bất kỳ để vào xem các ứng dụng...`}
                        className="w-full h-40 p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none"
                    />
                </div>

                <button 
                    onClick={handleSubmit}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <span>Vào ứng dụng</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
                
            </div>
        </div>
    );
};

// --- Module Container Component ---

interface ModuleContainerProps {
  storageKey: string;
  moduleName: string;
  mode: 'koc' | 'review1k' | 'shopee8s' | 'coverlink' | 'carousel' | 'videopov';
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({ storageKey, moduleName, mode }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const povVideoInputRef = useRef<HTMLInputElement>(null);
  const povFaceInputRef = useRef<HTMLInputElement>(null);

  // Load state
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedState = JSON.parse(savedData);
        setState({
          ...initialState,
          ...parsedState,
          faceFile: null,
          facePreviewUrl: null,
          selectedFiles: [],
          previewUrls: [],
          isGeneratingScript: false,
          scriptError: null,
          // Reset URL states as blobs/large data aren't saved
          images: {
             v1: { ...initialImageState, ...parsedState.images?.v1, loading: false, url: '' },
             v2: { ...initialImageState, ...parsedState.images?.v2, loading: false, url: '' },
             v3: { ...initialImageState, ...parsedState.images?.v3, loading: false, url: '' },
             v3_5: { ...initialImageState, ...parsedState.images?.v3_5, loading: false, url: '' },
             v4: { ...initialImageState, ...parsedState.images?.v4, loading: false, url: '' },
          },
          videoPrompts: {
             // Merge with initialVideoPromptState to ensure all fields (text, visible) exist even if missing in old saves
             v1: { ...initialVideoPromptState, ...parsedState.videoPrompts?.v1, loading: false },
             v2: { ...initialVideoPromptState, ...parsedState.videoPrompts?.v2, loading: false },
             v3: { ...initialVideoPromptState, ...parsedState.videoPrompts?.v3, loading: false },
             v3_5: { ...initialVideoPromptState, ...parsedState.videoPrompts?.v3_5, loading: false },
             v4: { ...initialVideoPromptState, ...parsedState.videoPrompts?.v4, loading: false },
          },
          coverLinkInput: parsedState.coverLinkInput || '',
          coverLinkNames: parsedState.coverLinkNames || '',
          coverLinkUrls: parsedState.coverLinkUrls || '',
          coverLinkOutput: parsedState.coverLinkOutput || '',
          
          // Module 6 Restore
          carouselCategory: parsedState.carouselCategory || 'Kể chuyện cá nhân',
          carouselSubCategory: parsedState.carouselSubCategory || '',
          carouselTopic: parsedState.carouselTopic || '',
          carouselImageCount: parsedState.carouselImageCount || 4,
          carouselNote: parsedState.carouselNote || '',
          carouselItems: parsedState.carouselItems ? parsedState.carouselItems.map((item: any) => ({ ...item, imageUrl: '', loading: false })) : [],
          isGeneratingCarouselScript: false,
          carouselFont: parsedState.carouselFont || 'Montserrat',
          carouselTextPosition: parsedState.carouselTextPosition || 'bottom',

          // Module 8 (Video POV) Restore
          videoPov: {
             ...initialState.videoPov,
             ...parsedState.videoPov,
             videoFile: null,
             videoPreviewUrl: null,
             faceFile: null,
             facePreviewUrl: null,
             segmentCount: parsedState.videoPov?.segmentCount || 4,
             isAnalyzing: false,
             isGeneratingScript: false,
             segments: parsedState.videoPov?.segments ? parsedState.videoPov.segments.map((s: any) => ({
                 ...s,
                 image: { ...s.image, url: '', loading: false },
                 videoPrompt: { ...s.videoPrompt, loading: false }
             })) : []
          }
        });
      }
    } catch (e) {
      console.error(`Failed to load saved state for ${storageKey}`, e);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Save state
  useEffect(() => {
    if (!isLoaded) return;
    const saveTimeout = setTimeout(() => {
      try {
        const stateToSave = {
          ...state,
          faceFile: null,
          facePreviewUrl: null,
          selectedFiles: [],
          previewUrls: [],
          isGeneratingScript: false,
          images: {
             v1: { ...state.images.v1, url: '', loading: false },
             v2: { ...state.images.v2, url: '', loading: false },
             v3: { ...state.images.v3, url: '', loading: false },
             v3_5: { ...state.images.v3_5, url: '', loading: false },
             v4: { ...state.images.v4, url: '', loading: false },
          },
          carouselItems: state.carouselItems.map(item => ({ ...item, imageUrl: '', loading: false })),
          videoPov: {
              ...state.videoPov,
              videoFile: null,
              videoPreviewUrl: null,
              faceFile: null,
              facePreviewUrl: null,
              segments: state.videoPov.segments.map(s => ({
                  ...s,
                  image: { ...s.image, url: '', loading: false },
                  videoPrompt: { ...s.videoPrompt, loading: false }
              }))
          }
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        console.error(`Failed to save state for ${storageKey}`, e);
      }
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [state, isLoaded, storageKey]);

  const handleResetProject = () => {
    if (window.confirm("Bạn có chắc muốn tạo dự án mới? Dữ liệu hiện tại sẽ bị xóa.")) {
      localStorage.removeItem(storageKey);
      setState(initialState);
      window.scrollTo(0, 0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      let files: File[] = Array.from(e.target.files);
      // Enforce single file for koc, review1k, and shopee8s
      if (['shopee8s', 'koc', 'review1k'].includes(mode)) {
          files = [files[0]];
      }
      const urls = files.map(file => URL.createObjectURL(file));
      setState(prev => ({ ...prev, selectedFiles: files, previewUrls: urls }));
    }
  };
  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setState(prev => ({ ...prev, faceFile: file, facePreviewUrl: url }));
    }
  };
  const handleScriptChange = (key: ScriptPartKey, newText: string) => {
    if (!state.script) return;
    setState(prev => ({ ...prev, script: { ...prev.script!, [key]: newText } }));
  };
  const handleImageCustomPromptChange = (key: ScriptPartKey, newText: string) => {
    setState(prev => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], customPrompt: newText } } }));
  };

  // --- Helper: Determine active layout keys for KOC mode ---
  const getKocActiveKeys = (layoutString: string): ScriptPartKey[] => {
      // Default fallback
      if (!layoutString) return ['v1', 'v2', 'v3', 'v3_5', 'v4'];
      
      const partsCount = layoutString.split('+').length;
      if (partsCount >= 5) {
          return ['v1', 'v2', 'v3', 'v3_5', 'v4'];
      } else if (partsCount === 3) {
          return ['v1', 'v2', 'v3'];
      } else {
          return ['v1', 'v2', 'v3', 'v4'];
      }
  };

  // --- Module 4: Cover Link Shopee Functions ---
  
  const handleSplitShopeeLinks = () => {
    const rawText = state.coverLinkInput;
    if (!rawText.trim()) return;

    const lines = rawText.split(/\r?\n/);
    let names = "";
    let urls = "";

    lines.forEach(line => {
      const httpIndex = line.lastIndexOf("http");
      if (httpIndex !== -1) {
          let namePart = line.substring(0, httpIndex).trim();
          const urlPart = line.substring(httpIndex).trim();
          if (namePart.endsWith(':')) {
              namePart = namePart.substring(0, namePart.length - 1).trim();
          }
          names += namePart + "\n";
          urls += urlPart + "\n";
      } else {
          names += line.trim() + "\n";
          urls += "\n";
      }
    });

    setState(prev => ({
        ...prev,
        coverLinkNames: names.trimEnd(),
        coverLinkUrls: urls.trimEnd()
    }));
  };

  const handleMergeShopeeLinks = () => {
      const namesArr = state.coverLinkNames.split(/\r?\n/);
      const urlsArr = state.coverLinkUrls.split(/\r?\n/);
      const maxLen = Math.max(namesArr.length, urlsArr.length);
      let output = "";
      for (let i = 0; i < maxLen; i++) {
          const n = namesArr[i] ? namesArr[i].trim() : "";
          const u = urlsArr[i] ? urlsArr[i].trim() : "";
          if (n && u) output += `${n}: ${u}\n`;
          else if (n) output += `${n}\n`;
          else if (u) output += `${u}\n`;
      }
      setState(prev => ({ ...prev, coverLinkOutput: output.trimEnd() }));
  };

  // --- Module 6: Carousel Functions ---

  const handleCarouselScriptGenerate = async () => {
     if (!state.carouselTopic) {
        alert("Vui lòng nhập ý tưởng/chủ đề.");
        return;
     }
     
     let activeSubCategory = state.carouselSubCategory;
     if (!activeSubCategory && state.carouselCategory && CAROUSEL_CATEGORIES[state.carouselCategory]) {
         activeSubCategory = CAROUSEL_CATEGORIES[state.carouselCategory][0];
     }

     setState(prev => ({ ...prev, isGeneratingCarouselScript: true, carouselItems: [] }));
     try {
        const scriptParts = await generateCarouselScript(
            state.carouselTopic, 
            state.carouselImageCount, 
            state.carouselNote, 
            state.productName || "General Product",
            state.carouselCategory,
            activeSubCategory
        );
        
        const newItems: CarouselItem[] = scriptParts.map((text, idx) => ({
           id: idx + 1,
           content: text,
           imageUrl: '',
           loading: false,
           customNote: ''
        }));
        
        setState(prev => ({ ...prev, isGeneratingCarouselScript: false, carouselItems: newItems }));
     } catch (e) {
        console.error(e);
        alert("Lỗi khi tạo kịch bản.");
        setState(prev => ({ ...prev, isGeneratingCarouselScript: false }));
     }
  };

  const handleCarouselImageGenerate = async (id: number, isRegen = false) => {
     // Removed validation for empty selectedFiles to allow optional product upload
     
     setState(prev => ({
        ...prev,
        carouselItems: prev.carouselItems.map(item => item.id === id ? { ...item, loading: true, error: undefined } : item)
     }));

     try {
        const productParts = await Promise.all(state.selectedFiles.map(file => fileToGenerativePart(file)));
        let facePart = null;
        if (state.faceFile) facePart = await fileToGenerativePart(state.faceFile);

        const item = state.carouselItems.find(i => i.id === id);
        if (!item) return;

        const imageUrl = await generateCarouselImage(
           productParts,
           facePart,
           item.content,
           state.carouselNote,
           item.customNote,
           state.carouselFont,
           state.carouselTextPosition
        );

        setState(prev => ({
           ...prev,
           carouselItems: prev.carouselItems.map(i => i.id === id ? { ...i, loading: false, imageUrl } : i)
        }));

     } catch (e) {
        console.error(e);
        setState(prev => ({
           ...prev,
           carouselItems: prev.carouselItems.map(i => i.id === id ? { ...i, loading: false, error: "Không thể tạo ảnh." } : i)
        }));
     }
  };

  const handleCarouselTextChange = (id: number, text: string) => {
     setState(prev => ({
        ...prev,
        carouselItems: prev.carouselItems.map(item => item.id === id ? { ...item, content: text } : item)
     }));
  };

  const handleCarouselNoteChange = (id: number, text: string) => {
     setState(prev => ({
        ...prev,
        carouselItems: prev.carouselItems.map(item => item.id === id ? { ...item, customNote: text } : item)
     }));
  };

  // --- Module 8 (Video POV) Functions ---
  
  const handlePovVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, videoFile: file, videoPreviewUrl: url } }));
      }
  };

  const handleAnalyzeVideo = async () => {
      if (!state.videoPov.videoFile) { alert("Vui lòng tải video trước."); return; }
      setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, isAnalyzing: true } }));
      try {
          const analysis = await analyzeVideoContent(state.videoPov.videoFile);
          setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, analysis, isAnalyzing: false } }));
      } catch (e) {
          console.error(e);
          alert("Lỗi khi phân tích video.");
          setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, isAnalyzing: false } }));
      }
  };

  const handlePovFaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, faceFile: file, facePreviewUrl: url } }));
      }
  };

  const handlePovScriptGenerate = async () => {
      if (!state.videoPov.analysis) { alert("Vui lòng phân tích video trước."); return; }
      setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, isGeneratingScript: true } }));
      try {
          // Pass segmentCount from state
          const segments = await generatePovScriptSegments(state.videoPov.analysis, state.videoPov.style, state.videoPov.segmentCount);
          setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, isGeneratingScript: false, segments } }));
      } catch (e) {
          console.error(e);
          alert("Lỗi khi tạo kịch bản.");
          setState(prev => ({ ...prev, videoPov: { ...prev.videoPov, isGeneratingScript: false } }));
      }
  };

  const handlePovImageGenerate = async (segmentId: number, isRegen: boolean = false) => {
      const segment = state.videoPov.segments.find(s => s.id === segmentId);
      if (!segment) return;
      
      setState(prev => ({
          ...prev,
          videoPov: {
              ...prev.videoPov,
              segments: prev.videoPov.segments.map(s => s.id === segmentId ? { ...s, image: { ...s.image, loading: true, error: undefined } } : s)
          }
      }));

      try {
          let facePart = null;
          if (state.videoPov.faceFile) {
              facePart = await fileToGenerativePart(state.videoPov.faceFile);
          }

          const url = await generatePovImage(segment.content, facePart, segment.image.customPrompt);

          setState(prev => ({
              ...prev,
              videoPov: {
                  ...prev.videoPov,
                  segments: prev.videoPov.segments.map(s => s.id === segmentId ? { ...s, image: { ...s.image, url, loading: false } } : s)
              }
          }));

      } catch (e) {
          console.error(e);
          setState(prev => ({
              ...prev,
              videoPov: {
                  ...prev.videoPov,
                  segments: prev.videoPov.segments.map(s => s.id === segmentId ? { ...s, image: { ...s.image, loading: false, error: "Không thể tạo ảnh." } } : s)
              }
          }));
      }
  };

  const handlePovVeoPrompt = async (segmentId: number) => {
      const segment = state.videoPov.segments.find(s => s.id === segmentId);
      if (!segment || !segment.image.url) return;

      setState(prev => ({
          ...prev,
          videoPov: {
              ...prev.videoPov,
              segments: prev.videoPov.segments.map(s => s.id === segmentId ? { ...s, videoPrompt: { ...s.videoPrompt, loading: true, visible: true } } : s)
          }
      }));

      try {
          const prompt = await generatePovVeoPrompt(segment.image.url, segment.content);
          setState(prev => ({
              ...prev,
              videoPov: {
                  ...prev.videoPov,
                  segments: prev.videoPov.segments.map(s => s.id === segmentId ? { ...s, videoPrompt: { ...s.videoPrompt, text: prompt, loading: false } } : s)
              }
          }));
      } catch (e) {
          console.error(e);
          setState(prev => ({
              ...prev,
              videoPov: {
                  ...prev.videoPov,
                  segments: prev.videoPov.segments.map(s => s.id === segmentId ? { ...s, videoPrompt: { ...s.videoPrompt, text: "Lỗi khi tạo prompt", loading: false } } : s)
              }
          }));
      }
  };

  const handlePovGenerateAllPrompts = async () => {
      const validSegments = state.videoPov.segments.filter(s => s.image.url);
      if (validSegments.length === 0) {
          alert("Vui lòng tạo hình ảnh trước khi tạo Prompt.");
          return;
      }

      // Set loading
      setState(prev => ({
          ...prev,
          videoPov: {
              ...prev.videoPov,
              segments: prev.videoPov.segments.map(s => 
                  s.image.url ? { ...s, videoPrompt: { ...s.videoPrompt, loading: true, visible: true } } : s
              )
          }
      }));

      // Generate concurrently
      const results = await Promise.all(validSegments.map(async (seg) => {
          try {
              const text = await generatePovVeoPrompt(seg.image.url, seg.content);
              return { id: seg.id, text };
          } catch (e) {
              return { id: seg.id, text: "Lỗi khi tạo prompt." };
          }
      }));

      // Update
      setState(prev => ({
          ...prev,
          videoPov: {
              ...prev.videoPov,
              segments: prev.videoPov.segments.map(s => {
                  const res = results.find(r => r.id === s.id);
                  if (res) {
                      return { ...s, videoPrompt: { ...s.videoPrompt, text: res.text, loading: false } };
                  }
                  return s.image.url ? { ...s, videoPrompt: { ...s.videoPrompt, loading: false } } : s;
              })
          }
      }));
  };

  const handlePovDownloadImages = async () => {
      const imagesToDownload = state.videoPov.segments
          .filter(s => s.image.url)
          .map(s => ({ name: `0${s.id}.png`, url: s.image.url }));
      
      if (imagesToDownload.length === 0) { alert("Không có ảnh để tải xuống."); return; }
      fallbackDownloadImages(imagesToDownload);
  };

  const handlePovDownloadPrompts = () => {
      const lines = state.videoPov.segments
          .map(s => s.videoPrompt.text.replace(/[\r\n]+/g, ' ').trim())
          .filter(t => t.length > 0);
      
      if (lines.length === 0) { alert("Không có prompt để tải xuống."); return; }
      
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "VideoPov_Prompts.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };


  // --- Main Generate Functions ---

  const handleShopeeGenerate = async () => {
      if (state.selectedFiles.length === 0 || !state.productName) return;
      
      // Initialize state for generation
      setState(prev => ({ 
          ...prev, 
          isGeneratingScript: true, 
          scriptError: null, 
          script: null, // Clear old script to show loading state if needed
          images: { v1: { ...initialImageState }, v2: { ...initialImageState }, v3: { ...initialImageState }, v3_5: { ...initialImageState }, v4: { ...initialImageState } }, 
          videoPrompts: { v1: { ...initialVideoPromptState }, v2: { ...initialVideoPromptState }, v3: { ...initialVideoPromptState }, v3_5: { ...initialVideoPromptState }, v4: { ...initialVideoPromptState } } 
      }));

      try {
        const imageParts = await Promise.all(state.selectedFiles.map(file => fileToGenerativePart(file)));
        let facePart = null;
        if (state.faceFile) facePart = await fileToGenerativePart(state.faceFile);

        // Step 1: Generate Script First
        const script = await generateTikTokScript(imageParts, state.productName, state.keyword, state.scriptTone, state.productSize, state.scriptNote, "", 'shopee8s');
        
        setState(prev => ({ ...prev, script })); // Update script in UI

        // Step 2: Generate Images using the generated script
        await generateImagesSequential(imageParts, facePart, state.productName, state.keyword, state.productSize, script, state.characterDescription);
        
        setState(prev => ({ ...prev, isGeneratingScript: false }));

      } catch (error) { 
          setState(prev => ({ ...prev, isGeneratingScript: false, scriptError: "Lỗi tạo nội dung." })); 
      }
  };

  const handleMainGenerate = async () => {
    if (mode === 'shopee8s') { await handleShopeeGenerate(); return; }
    if (state.selectedFiles.length === 0 || !state.keyword || !state.productName) return;
    setState(prev => ({ ...prev, isGeneratingScript: true, scriptError: null, script: null, images: { v1: { ...initialImageState }, v2: { ...initialImageState }, v3: { ...initialImageState }, v3_5: { ...initialImageState }, v4: { ...initialImageState } }, videoPrompts: { v1: { ...initialVideoPromptState }, v2: { ...initialVideoPromptState }, v3: { ...initialVideoPromptState }, v3_5: { ...initialVideoPromptState }, v4: { ...initialVideoPromptState } } }));
    try {
      const imageParts = await Promise.all(state.selectedFiles.map(file => fileToGenerativePart(file)));
      let facePart = null;
      if (state.faceFile) facePart = await fileToGenerativePart(state.faceFile);
      
      let layoutToUse = state.scriptLayout;
      if (mode === 'koc' && !layoutToUse) { 
          const randomIndex = Math.floor(Math.random() * LAYOUT_OPTIONS.length); 
          layoutToUse = LAYOUT_OPTIONS[randomIndex]; 
          // Update state so the UI reflects the random choice and logic uses it
          setState(prev => ({...prev, scriptLayout: layoutToUse}));
      }
      
      const script = await generateTikTokScript(imageParts, state.productName, state.keyword, state.scriptTone, state.productSize, state.scriptNote, layoutToUse, mode);
      setState(prev => ({ ...prev, script, isGeneratingScript: false }));
      
      // Determine active keys for image generation based on the layout used
      let keysToGenerate: ScriptPartKey[] = ['v1', 'v2', 'v3', 'v3_5', 'v4'];
      if (mode === 'koc') {
          keysToGenerate = getKocActiveKeys(layoutToUse);
      }
      
      await generateImagesSequential(imageParts, facePart, state.productName, state.keyword, state.productSize, script, state.characterDescription, keysToGenerate);
    } catch (error) { setState(prev => ({ ...prev, isGeneratingScript: false, scriptError: "Lỗi tạo kịch bản." })); }
  };

  const generateImagesSequential = async (imageParts: any[], facePart: any, productName: string, keyword: string, productSize: string, script: ScriptParts, characterDescription: string, explicitKeys?: ScriptPartKey[]) => {
    let keys: ScriptPartKey[];
    
    if (explicitKeys) {
        keys = explicitKeys;
    } else {
        if (mode === 'review1k') keys = ['v2', 'v3', 'v4'];
        else if (mode === 'shopee8s') keys = ['v1', 'v2', 'v3', 'v4'];
        else keys = ['v1', 'v2', 'v3', 'v3_5', 'v4'];
    }
    
    setState(prev => ({ ...prev, images: { v1: { ...prev.images.v1, loading: keys.includes('v1') }, v2: { ...prev.images.v2, loading: keys.includes('v2') }, v3: { ...prev.images.v3, loading: keys.includes('v3') }, v3_5: { ...prev.images.v3_5, loading: keys.includes('v3_5') }, v4: { ...prev.images.v4, loading: keys.includes('v4') } } }));
    for (const key of keys) {
      let attempt = 1; const maxAttempts = 3; let success = false;
      while (attempt <= maxAttempts && !success) {
        try {
          const isFirst = keys[0] === key;
          if (!isFirst && attempt === 1) await new Promise(resolve => setTimeout(resolve, 6000));
          if (attempt > 1) await new Promise(resolve => setTimeout(resolve, (attempt - 1) * 10000));
          const url = await generateScenarioImage(imageParts, facePart, productName, keyword, script[key], key, productSize, characterDescription, undefined, mode);
          setState(prev => ({ ...prev, images: { ...prev.images, [key]: { url, loading: false, error: undefined } } }));
          success = true;
        } catch (err: any) {
          const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
          if (attempt === maxAttempts || !isRateLimit) { setState(prev => ({ ...prev, images: { ...prev.images, [key]: { url: '', loading: false, error: isRateLimit ? 'Hết quota.' : 'Lỗi tạo ảnh.' } } })); }
          attempt++;
        }
      }
    }
  };

  const handleRegenerateImage = async (key: ScriptPartKey) => {
    if (state.selectedFiles.length === 0 || !state.script) { if (state.selectedFiles.length === 0) alert("Vui lòng tải ảnh sản phẩm trước."); return; }
    setState(prev => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], loading: true, error: undefined } } }));
    try {
      const imageParts = await Promise.all(state.selectedFiles.map(file => fileToGenerativePart(file)));
      let facePart = null; if (state.faceFile) facePart = await fileToGenerativePart(state.faceFile);
      const url = await generateScenarioImage(imageParts, facePart, state.productName, state.keyword, state.script[key], key, state.productSize, state.characterDescription, state.images[key].customPrompt, mode);
      setState(prev => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], url, loading: false, error: undefined } } }));
    } catch (error: any) { setState(prev => ({ ...prev, images: { ...prev.images, [key]: { ...prev.images[key], url: '', loading: false, error: 'Lỗi' } } })); }
  };

  const handleCreateVideoPrompt = async (key: ScriptPartKey) => {
    if (state.selectedFiles.length === 0 || !state.script) return;
    setState(prev => ({ ...prev, videoPrompts: { ...prev.videoPrompts, [key]: { ...prev.videoPrompts[key], loading: true, visible: true } } }));
    try {
      const imageParts = await Promise.all(state.selectedFiles.map(file => fileToGenerativePart(file)));
      const prompt = await generateVeoPrompt(imageParts, state.productName, state.keyword, state.script[key], key, state.productSize, state.scriptTone, state.characterDescription, mode);
      setState(prev => ({ ...prev, videoPrompts: { ...prev.videoPrompts, [key]: { text: prompt, loading: false, visible: true } } }));
    } catch (error) { setState(prev => ({ ...prev, videoPrompts: { ...prev.videoPrompts, [key]: { text: "Lỗi", loading: false, visible: true } } })); }
  };
  
  const handleTranslatePrompt = async (key: ScriptPartKey) => {}; 

  const handleDownloadAllImages = async () => {
      let imagesToDownload = [];
      if (mode === 'review1k') {
          imagesToDownload = [{name:'01_Hook.png',url:state.images.v2.url},{name:'02_Review.png',url:state.images.v3.url},{name:'03_CTA.png',url:state.images.v4.url}].filter(i=>i.url);
      } else if (mode === 'shopee8s') {
          imagesToDownload = [{name:'01.png',url:state.images.v1.url},{name:'02.png',url:state.images.v2.url},{name:'03.png',url:state.images.v3.url},{name:'04.png',url:state.images.v4.url}].filter(i=>i.url);
      } else if (mode === 'carousel') {
         imagesToDownload = state.carouselItems
            .filter(item => item.imageUrl)
            .map(item => ({ name: `Trang_${item.id}.png`, url: item.imageUrl }));
      } else {
          // KOC Mode - Dynamic based on active keys (using scriptLayout state)
          const activeKeys = getKocActiveKeys(state.scriptLayout);
          const allPotential = [
              {key: 'v1', name:'01.png', url: state.images.v1.url},
              {key: 'v2', name:'02.png', url: state.images.v2.url},
              {key: 'v3', name:'03.png', url: state.images.v3.url},
              {key: 'v3_5', name:'04.png', url: state.images.v3_5.url},
              {key: 'v4', name:'05.png', url: state.images.v4.url}
          ];
          
          // Filter to include only active keys, then re-index names to be sequential (01, 02, 03...)
          imagesToDownload = allPotential
            .filter(item => activeKeys.includes(item.key as ScriptPartKey) && item.url)
            .map((item, index) => ({
                ...item,
                name: `0${index + 1}.png`
            }));
      }
      
      if (imagesToDownload.length===0){alert("Không có ảnh để tải.");return;}
      if ('showDirectoryPicker' in window) {
         try {
             // @ts-ignore
             const dirHandle = await window.showDirectoryPicker();
             for(const img of imagesToDownload){
                 const r = await fetch(img.url); const b = await r.blob();
                 // @ts-ignore
                 const fh = await dirHandle.getFileHandle(img.name,{create:true});
                 // @ts-ignore
                 const w = await fh.createWritable(); await w.write(b); await w.close();
             }
             alert("Hoàn thành.");
         } catch(e) { fallbackDownloadImages(imagesToDownload); }
      } else { fallbackDownloadImages(imagesToDownload); }
  };

  const fallbackDownloadImages = (images: any[]) => { images.forEach((img, i) => setTimeout(() => { const a = document.createElement('a'); a.href=img.url; a.download=img.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }, i*500)); };
  
  const handleDownloadAllPrompts = () => {
    let keys: ScriptPartKey[] = [];
    if (mode === 'review1k') keys = ['v2', 'v3', 'v4'];
    else if (mode === 'shopee8s') keys = ['v1', 'v2', 'v3', 'v4'];
    else {
        // Dynamic keys for KOC based on layout
        keys = getKocActiveKeys(state.scriptLayout);
    }

    const validPromptsRaw = keys
      .map(key => state.videoPrompts?.[key]?.text)
      .filter((text): text is string => typeof text === 'string' && text.trim().length > 0);

    if (validPromptsRaw.length === 0) {
      alert("Chưa có prompt nào được tạo. Vui lòng ấn 'Tạo Prompt Video' trên từng ảnh để tạo prompt trước.");
      return;
    }

    const formattedPrompts = validPromptsRaw.map((text, idx) => {
        const singleLine = text.replace(/[\r\n]+/g, ' ').trim();
        return `Phân cảnh ${idx + 1}: ${singleLine}`;
    });

    const blob = new Blob([formattedPrompts.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${moduleName.replace(/\s+/g, '_')}_Prompts.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Render Logic ---
  
  if (mode === 'videopov') {
      return (
        <div className="bg-slate-50 min-h-[calc(100vh-140px)]">
           <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center relative sticky top-0 z-40 shadow-sm">
             <div className="text-sm font-semibold text-slate-600">{moduleName} (Kông Văn 0923.200.820)</div>
             <div className="absolute right-4 flex items-center gap-3">
               <button onClick={handleResetProject} className="text-xs font-medium text-slate-500 hover:text-red-600">Làm mới</button>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             {/* Unified Control Panel - Styled like KOC Module */}
             <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                     
                     {/* Left Column: Uploads (Span 5) */}
                     <div className="md:col-span-5 flex flex-col gap-6">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2">1. Video gốc (Nguồn phân tích):</label>
                             <div 
                                 onClick={() => povVideoInputRef.current?.click()}
                                 className="relative w-full min-h-[220px] rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
                             >
                                 {state.videoPov.videoPreviewUrl ? (
                                     <video src={state.videoPov.videoPreviewUrl} controls className="h-full w-full object-contain max-h-[280px]" />
                                 ) : (
                                     <div className="text-center text-slate-400 p-6">
                                         <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                         <span className="text-sm font-medium">Nhấn để tải Video</span>
                                     </div>
                                 )}
                                 <input type="file" ref={povVideoInputRef} onChange={handlePovVideoChange} accept="video/*" className="hidden" />
                             </div>
                         </div>
                         
                         <div className="border border-slate-100 bg-slate-50 p-4 rounded-xl">
                             <label className="block text-sm font-medium text-slate-700 mb-2">2. Ảnh khuôn mặt mẫu (Tùy chọn):</label>
                             <div 
                                 onClick={() => povFaceInputRef.current?.click()}
                                 className={`relative w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${state.videoPov.facePreviewUrl ? 'border-purple-300 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}`}
                             >
                                 {state.videoPov.facePreviewUrl ? (
                                     <div className="flex items-center gap-4 px-4 w-full">
                                         <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                            <img src={state.videoPov.facePreviewUrl} className="w-full h-full object-cover" alt="face" />
                                         </div>
                                         <span className="text-xs text-purple-700 font-medium truncate flex-1">{state.videoPov.faceFile?.name}</span>
                                     </div>
                                 ) : (
                                     <div className="flex items-center gap-2 text-slate-400">
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                         <span className="text-xs font-medium">Tải ảnh mặt</span>
                                     </div>
                                 )}
                                 <input type="file" ref={povFaceInputRef} onChange={handlePovFaceChange} accept="image/*" className="hidden" />
                             </div>
                         </div>
                     </div>

                     {/* Right Column: Inputs & Actions (Span 7) */}
                     <div className="md:col-span-7 flex flex-col gap-6">
                         
                         {/* Analysis Section */}
                         <div className="flex flex-col gap-3">
                             <div className="flex justify-between items-end">
                                 <label className="block text-sm font-medium text-slate-700">3. Nội dung Video (AI Phân tích)</label>
                                 <button
                                     onClick={handleAnalyzeVideo}
                                     disabled={state.videoPov.isAnalyzing || !state.videoPov.videoFile}
                                     className="text-xs px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
                                 >
                                     {state.videoPov.isAnalyzing ? "Đang phân tích..." : "Bắt đầu phân tích"}
                                 </button>
                             </div>
                             <textarea
                                 readOnly
                                 value={state.videoPov.analysis}
                                 className="w-full h-40 p-4 border border-slate-300 rounded-xl bg-slate-50 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                                 placeholder="Kết quả phân tích nội dung video sẽ hiển thị ở đây sau khi bạn nhấn nút Phân tích..."
                             />
                         </div>

                         {/* Config Row */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-2">4. Phong cách mới:</label>
                                 <select
                                      value={state.videoPov.style}
                                      onChange={(e) => setState(prev => ({...prev, videoPov: {...prev.videoPov, style: e.target.value}}))}
                                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm"
                                  >
                                      <option value="tâm sự trải lòng">Tâm sự trải lòng (Deep/Emotional)</option>
                                      <option value="vui vẻ hài hước">Vui vẻ hài hước (Funny/Humorous)</option>
                                      <option value="kịch tính & cảm xúc">Kịch tính & cảm xúc (Dramatic)</option>
                                      <option value="chuyên gia phân tích">Chuyên gia phân tích (Analytical)</option>
                                      <option value="review chân thực - khen chê rõ ràng">Review chân thực - Khen chê rõ ràng</option>
                                      <option value="kể chuyện drama">Kể chuyện Drama (Storytelling)</option>
                                      <option value="vlog đời thường - gần gũi">Vlog đời thường - Gần gũi (Daily Vlog)</option>
                                      <option value="hào hứng - bắt trend">Hào hứng - Bắt trend (Excited/Trendy)</option>
                                      <option value="thư giãn - healing">Thư giãn - Healing (Chill)</option>
                                      <option value="châm biếm - sarky">Châm biếm - Sarky (Sarcastic)</option>
                                  </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">5. Thời lượng (Số cảnh):</label>
                                <select 
                                    value={state.videoPov.segmentCount}
                                    onChange={(e) => setState(prev => ({...prev, videoPov: {...prev.videoPov, segmentCount: parseInt(e.target.value)}}))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm"
                                >
                                    {Array.from({length: 17}, (_, i) => i + 4).map(num => (
                                        <option key={num} value={num}>{num} Khung hình ({num * 8}s)</option>
                                    ))}
                                </select>
                             </div>
                         </div>
                         
                         {/* Generate Action */}
                         <div className="mt-auto pt-4">
                             <button
                                 onClick={handlePovScriptGenerate}
                                 disabled={state.videoPov.isGeneratingScript || !state.videoPov.analysis}
                                 className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 text-base transition-all transform active:scale-[0.99] flex justify-center items-center gap-2"
                             >
                                 {state.videoPov.isGeneratingScript ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Đang viết kịch bản...
                                    </>
                                 ) : (
                                     <>
                                        <span>Tạo Kịch Bản POV</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                     </>
                                 )}
                             </button>
                         </div>
                     </div>
                 </div>
             </section>

             {/* 3. Segments Grid - Matches KOC Grid Layout */}
             {state.videoPov.segments.length > 0 && (
                 <>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {state.videoPov.segments.map((segment) => (
                         <div key={segment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                             {/* Header */}
                             <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                 <span className="font-bold text-sm text-slate-700">Khung hình #{segment.id}</span>
                                 <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{segment.content.length} ký tự</span>
                             </div>

                             {/* Content Area */}
                             <div className="p-4 flex flex-col gap-4 flex-1">
                                 {/* Script Input */}
                                 <div className="relative group">
                                     <textarea
                                         value={segment.content}
                                         onChange={(e) => {
                                             const val = e.target.value;
                                             setState(prev => ({
                                                 ...prev,
                                                 videoPov: {
                                                     ...prev.videoPov,
                                                     segments: prev.videoPov.segments.map(s => s.id === segment.id ? {...s, content: val} : s)
                                                 }
                                             }));
                                         }}
                                         className="w-full h-24 p-3 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:ring-1 focus:ring-purple-500 outline-none resize-none transition-colors group-hover:bg-white group-hover:border-slate-300"
                                         placeholder="Nội dung kịch bản..."
                                     />
                                 </div>

                                 {/* Image Preview Area */}
                                 <div className="relative aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group shadow-inner">
                                     {segment.image.url ? (
                                         <img src={segment.image.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="gen" />
                                     ) : (
                                         <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-400">
                                             {segment.image.loading ? (
                                                 <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                             ) : (
                                                 <span className="text-xs">Chưa có ảnh</span>
                                             )}
                                         </div>
                                     )}
                                     
                                     {/* Overlay Create Button (if no image) */}
                                     {!segment.image.url && !segment.image.loading && (
                                         <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button
                                                  onClick={() => handlePovImageGenerate(segment.id)}
                                                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded shadow-lg transform scale-95 hover:scale-100 transition-transform"
                                              >
                                                  Tạo Ảnh Ngay
                                              </button>
                                         </div>
                                     )}
                                 </div>

                                 {/* Controls */}
                                 <div className="mt-auto space-y-3">
                                     {segment.image.url ? (
                                         <div className="flex gap-2">
                                             <input 
                                                  placeholder="Sửa prompt ảnh..."
                                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-indigo-400"
                                                  value={segment.image.customPrompt || ''}
                                                  onChange={(e) => {
                                                      const val = e.target.value;
                                                      setState(prev => ({
                                                          ...prev,
                                                          videoPov: {
                                                              ...prev.videoPov,
                                                              segments: prev.videoPov.segments.map(s => s.id === segment.id ? {...s, image: {...s.image, customPrompt: val}} : s)
                                                          }
                                                      }));
                                                  }}
                                              />
                                              <button
                                                  onClick={() => handlePovImageGenerate(segment.id, true)}
                                                  className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-[10px]"
                                              >
                                                  Tạo lại
                                              </button>
                                         </div>
                                     ) : (
                                         <button
                                             onClick={() => handlePovImageGenerate(segment.id)}
                                             disabled={segment.image.loading}
                                             className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                         >
                                             {segment.image.loading ? "Đang tạo..." : "Tạo Ảnh Minh Họa"}
                                         </button>
                                     )}

                                     {segment.image.url && (
                                         <>
                                             <button
                                                 onClick={() => handlePovVeoPrompt(segment.id)}
                                                 disabled={segment.videoPrompt.loading}
                                                 className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors shadow-sm ${segment.videoPrompt.loading ? 'bg-purple-100 text-purple-700' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                                             >
                                                 {segment.videoPrompt.loading ? "Đang viết..." : "Tạo Veo-3 Prompt"}
                                             </button>
                                             
                                             {segment.videoPrompt.visible && (
                                                 <textarea
                                                     readOnly
                                                     value={segment.videoPrompt.text}
                                                     className="w-full h-24 bg-slate-900 text-slate-300 text-[10px] p-2 rounded-lg border border-slate-700 resize-none font-mono"
                                                 />
                                             )}
                                         </>
                                     )}
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 {/* Batch Action Section */}
                 <div className="mt-12 py-8 border-t border-slate-200 flex flex-col items-center justify-center gap-6">
                    <button
                        onClick={handlePovGenerateAllPrompts}
                        disabled={state.videoPov.segments.some(s => s.videoPrompt.loading)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center gap-3 text-lg disabled:opacity-50 disabled:cursor-wait hover:-translate-y-1"
                    >
                        {state.videoPov.segments.some(s => s.videoPrompt.loading) ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Đang tạo hàng loạt...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                Tự động tạo tất cả Prompt
                            </>
                        )}
                    </button>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={handlePovDownloadImages}
                            className="px-6 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-xl border border-green-200 text-sm flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Tải Ảnh
                        </button>
                        <button
                            onClick={handlePovDownloadPrompts}
                            className="px-6 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 text-sm flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Tải Prompt
                        </button>
                    </div>
                 </div>
                 </>
             )}
         </div>
       </div>
      );
  }

  if (mode === 'carousel') {
     return (
        <div className="bg-slate-50 min-h-[calc(100vh-140px)]">
           <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center relative sticky top-0 z-40 shadow-sm">
             <div className="text-sm font-semibold text-slate-600">{moduleName} (Kông Văn 0923.200.820)</div>
             <div className="absolute right-4 flex items-center gap-3">
               <button onClick={handleResetProject} className="text-xs font-medium text-slate-500 hover:text-red-600">Làm mới</button>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 py-8">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     
                     {/* Category Selection */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">1. Tên gọi (Category):</label>
                           <select 
                              value={state.carouselCategory}
                              onChange={(e) => {
                                  const newCat = e.target.value;
                                  setState(prev => ({
                                      ...prev, 
                                      carouselCategory: newCat,
                                      carouselSubCategory: CAROUSEL_CATEGORIES[newCat] ? CAROUSEL_CATEGORIES[newCat][0] : ''
                                  }));
                              }}
                              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                           >
                              {Object.keys(CAROUSEL_CATEGORIES).map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">2. Nội dung (Details):</label>
                           <select 
                              value={state.carouselSubCategory}
                              onChange={(e) => setState(prev => ({...prev, carouselSubCategory: e.target.value}))}
                              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                           >
                              {state.carouselCategory && CAROUSEL_CATEGORIES[state.carouselCategory]?.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     {/* Topic */}
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">3. Ý tưởng câu chuyện / Chủ đề:</label>
                        <textarea
                           className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none resize-none text-sm"
                           placeholder="Ví dụ: 100 lần thử thách bán wifi nhưng thất bại..."
                           value={state.carouselTopic}
                           onChange={(e) => setState(prev => ({...prev, carouselTopic: e.target.value}))}
                        />
                     </div>
                     {/* Count */}
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">4. Số lượng ảnh (Slides):</label>
                        <select 
                           value={state.carouselImageCount}
                           onChange={(e) => setState(prev => ({...prev, carouselImageCount: parseInt(e.target.value)}))}
                           className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                        >
                           <option value={3}>3 Slides</option>
                           <option value={4}>4 Slides</option>
                           <option value={5}>5 Slides</option>
                           <option value={6}>6 Slides</option>
                           <option value={8}>8 Slides</option>
                        </select>
                     </div>
                     {/* Notes */}
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">5. Ghi chú thêm (Phong cách/Tông màu):</label>
                        <input
                           type="text"
                           className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                           placeholder="Ví dụ: Bối cảnh, phong cách, màu sắc..."
                           value={state.carouselNote}
                           onChange={(e) => setState(prev => ({...prev, carouselNote: e.target.value}))}
                        />
                     </div>
                  </div>

                  <div className="space-y-6">
                     {/* Upload Product */}
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">6. Ảnh sản phẩm (Tùy chọn - Max 5):</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${state.previewUrls.length > 0 ? 'border-pink-300 bg-pink-50' : 'border-slate-300 hover:border-pink-400 hover:bg-slate-50'}`}
                        >
                           {state.previewUrls.length > 0 ? (
                              <div className="flex gap-2 overflow-x-auto p-2 w-full">
                                 {state.previewUrls.map((url, idx) => (
                                    <img key={idx} src={url} className="h-full rounded shadow-sm" alt="prod" />
                                 ))}
                              </div>
                           ) : (
                              <span className="text-slate-400 text-sm">Tải Ảnh Sản Phẩm</span>
                           )}
                           <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                        </div>
                     </div>
                     {/* Upload Character */}
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">7. Ảnh nhân vật (Character):</label>
                        <div 
                          onClick={() => faceInputRef.current?.click()}
                          className={`relative w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${state.facePreviewUrl ? 'border-purple-300 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}`}
                        >
                           {state.facePreviewUrl ? (
                              <img src={state.facePreviewUrl} className="h-full object-contain" alt="face" />
                           ) : (
                              <span className="text-slate-400 text-sm">Tải Ảnh Khuôn Mặt</span>
                           )}
                           <input type="file" ref={faceInputRef} onChange={handleFaceFileChange} accept="image/*" className="hidden" />
                        </div>
                     </div>
                     
                     {/* New Settings: Font & Position */}
                     <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">8. Font chữ (Demo):</label>
                            {/* Custom Font Dropdown with Previews */}
                            <div className="relative">
                                <div 
                                    onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                                    className="w-full p-3 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-pink-500 bg-white cursor-pointer flex justify-between items-center"
                                >
                                    <span style={{ fontFamily: FONT_OPTIONS.find(f => f.value === state.carouselFont)?.family || 'inherit', fontSize: '16px' }}>
                                        {FONT_OPTIONS.find(f => f.value === state.carouselFont)?.label || state.carouselFont}
                                    </span>
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                                
                                {isFontDropdownOpen && (
                                    <>
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                                        {FONT_OPTIONS.map(font => (
                                            <div 
                                                key={font.value}
                                                onClick={() => {
                                                    setState(prev => ({...prev, carouselFont: font.value}));
                                                    setIsFontDropdownOpen(false);
                                                }}
                                                className={`p-4 cursor-pointer flex items-center justify-between hover:bg-pink-50 transition-colors ${state.carouselFont === font.value ? 'bg-pink-50 text-pink-700' : 'text-slate-700'}`}
                                            >
                                                <span style={{ fontFamily: font.family, fontSize: '18px' }}>{font.label}</span>
                                                {state.carouselFont === font.value && (
                                                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsFontDropdownOpen(false)}></div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">9. Vị trí chữ (Position):</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer border border-slate-300 p-3 rounded-xl flex-1 justify-center bg-white hover:bg-slate-50 peer-checked:border-pink-500">
                                    <input 
                                        type="radio" 
                                        name="textPosition" 
                                        value="top" 
                                        checked={state.carouselTextPosition === 'top'}
                                        onChange={() => setState(prev => ({...prev, carouselTextPosition: 'top'}))}
                                        className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm">Top (Trên cùng)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer border border-slate-300 p-3 rounded-xl flex-1 justify-center bg-white hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="textPosition" 
                                        value="bottom"
                                        checked={state.carouselTextPosition === 'bottom'}
                                        onChange={() => setState(prev => ({...prev, carouselTextPosition: 'bottom'}))}
                                        className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm font-semibold text-pink-600">Bottom (Dưới cùng)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer border border-slate-300 p-3 rounded-xl flex-1 justify-center bg-white hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="textPosition" 
                                        value="split"
                                        checked={state.carouselTextPosition === 'split'}
                                        onChange={() => setState(prev => ({...prev, carouselTextPosition: 'split'}))}
                                        className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm">Split (Trên & Dưới)</span>
                                </label>
                            </div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="mt-8">
                  <button
                     onClick={handleCarouselScriptGenerate}
                     disabled={state.isGeneratingCarouselScript}
                     className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-wait"
                  >
                     {state.isGeneratingCarouselScript ? "Đang viết kịch bản..." : "Tạo Kịch Bản Nội Dung"}
                  </button>
               </div>
            </section>

            {/* Carousel Items Grid */}
            {state.carouselItems.length > 0 && (
               <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                     {state.carouselItems.map(item => (
                        <CarouselCard
                           key={item.id}
                           item={item}
                           onTextChange={handleCarouselTextChange}
                           onGenerate={() => handleCarouselImageGenerate(item.id)}
                           onRegenerate={() => handleCarouselImageGenerate(item.id, true)}
                           onNoteChange={handleCarouselNoteChange}
                        />
                     ))}
                  </div>
                  
                  <div className="flex justify-center mb-12">
                     <button
                        onClick={handleDownloadAllImages}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                     >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Tải xuống tất cả ảnh
                     </button>
                  </div>
               </>
            )}
         </div>
        </div>
     );
  }

  // Determine if V3.5 should be visible in Grid for KOC mode
  const showV3_5 = mode === 'koc' && getKocActiveKeys(state.scriptLayout).includes('v3_5');

  if (mode === 'coverlink') {
    // ... (Keep existing CoverLink render) ...
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-140px)]">
         <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center relative sticky top-0 z-40 shadow-sm">
             <div className="text-sm font-semibold text-slate-600">{moduleName} (Kông Văn 0923.200.820)</div>
             <div className="absolute right-4 flex items-center gap-3">
               <button onClick={handleResetProject} className="text-xs font-medium text-slate-500 hover:text-red-600">Làm mới</button>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 py-8">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">1. Nhập văn bản gốc (Dạng: Tên sản phẩm - Link):</label>
                    <textarea
                        className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none resize-none text-sm font-mono leading-relaxed"
                        placeholder="Ví dụ:&#10;Áo thun: http://shopee.vn/...&#10;Quần jean http://shopee.vn/..."
                        value={state.coverLinkInput}
                        onChange={(e) => setState(prev => ({...prev, coverLinkInput: e.target.value}))}
                    />
                </div>
                <button
                    onClick={handleSplitShopeeLinks}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-md transition-all mb-8"
                >
                    Tách tên sản phẩm và liên kết
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cột 1: Tên Sản Phẩm (Chỉnh sửa tại đây)</label>
                        <textarea
                            className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-mono leading-relaxed"
                            value={state.coverLinkNames}
                            onChange={(e) => setState(prev => ({...prev, coverLinkNames: e.target.value}))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cột 2: Đường Link (Chỉnh sửa tại đây)</label>
                        <textarea
                            className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-mono leading-relaxed whitespace-pre"
                            value={state.coverLinkUrls}
                            onChange={(e) => setState(prev => ({...prev, coverLinkUrls: e.target.value}))}
                        />
                    </div>
                </div>

                <div className="mb-2 text-sm text-slate-600">
                   Tải xuống File mẫu <a href="https://drive.google.com/drive/folders/1e-X-fvGzHXbJvzw_Z_y45aG5mWFIcMWJ?usp=sharing" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">tại đây</a>
                </div>

                <button
                    onClick={handleMergeShopeeLinks}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all mb-8"
                >
                    Ghép lại (Nhiệm vụ 2)
                </button>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700">Kết quả ghép (Copy tại đây):</label>
                        <button 
                             onClick={() => {
                                 navigator.clipboard.writeText(state.coverLinkOutput);
                                 alert("Đã copy!");
                             }}
                             className="text-xs text-blue-600 font-bold hover:underline"
                        >
                            Copy kết quả
                        </button>
                    </div>
                    <textarea
                        readOnly
                        className="w-full h-64 p-4 border border-slate-300 rounded-xl bg-slate-50 text-sm font-mono leading-relaxed outline-none"
                        value={state.coverLinkOutput}
                    />
                </div>
            </section>
         </div>
      </div>
    );
  }

  // --- Standard Render (KOC / Review1K / Shopee8s) ---
  const showScript = true; // Always show script section for these modules

  // Dynamic Grid Class based on items
  let gridClass = 'md:grid-cols-2 lg:grid-cols-4'; // Default for 4 parts
  if (mode === 'review1k') gridClass = 'md:grid-cols-3';
  else if (mode === 'shopee8s') gridClass = 'md:grid-cols-4';
  else if (mode === 'koc') {
       const keys = getKocActiveKeys(state.scriptLayout);
       if (keys.length === 3) gridClass = 'md:grid-cols-3';
       else if (keys.length === 5) gridClass = 'md:grid-cols-2 lg:grid-cols-5';
       else gridClass = 'md:grid-cols-2 lg:grid-cols-4';
  }

  // Determine which parts to show in the UI for KOC mode
  const activeKeys = mode === 'koc' ? getKocActiveKeys(state.scriptLayout) : ['v1', 'v2', 'v3', 'v4'];
  const isSingleProductImage = ['koc', 'review1k', 'shopee8s'].includes(mode);

  return (
     <div className="bg-slate-50 min-h-[calc(100vh-140px)]">
         {/* ... (Keep existing Header/Inputs) ... */}
         <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center relative sticky top-0 z-40 shadow-sm">
             <div className="text-sm font-semibold text-slate-600">{moduleName} (Kông Văn 0923.200.820)</div>
             <div className="absolute right-4 flex items-center gap-3">
               <span className="text-[10px] px-2 py-1 bg-green-50 text-green-600 rounded-full border border-green-200 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                 Lưu tự động BẬT
               </span>
               <button onClick={handleResetProject} className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors">Làm mới (New Project)</button>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Input Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
               {/* ... (Existing input fields - file, product name, etc - exact same code as before) ... */}
               {isLoaded && !state.selectedFiles.length && state.productName && (
                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   <span>Dự án đã được khôi phục. Vui lòng <strong>tải lại hình ảnh sản phẩm (và khuôn mặt mẫu)</strong> nếu bạn muốn tạo lại nội dung.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Image Upload Section */}
                <div className="md:col-span-5 flex flex-col gap-6">
                   {/* Product Images */}
                  <div className={`flex flex-col ${mode === 'shopee8s' ? 'h-full' : ''}`}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {isSingleProductImage ? '1. Hình ảnh sản phẩm (1 ảnh duy nhất)' : '1. Hình ảnh sản phẩm (3-4 góc)'}
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${isSingleProductImage ? 'min-h-[200px]' : 'min-h-[200px]'} ${mode === 'shopee8s' ? 'flex-grow' : ''} ${state.previewUrls.length > 0 ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                    >
                      {state.previewUrls.length > 0 ? (
                        <div className={`p-2 w-full h-full ${isSingleProductImage ? 'flex items-center justify-center' : 'grid grid-cols-2 gap-2'}`}>
                          {state.previewUrls.slice(0, isSingleProductImage ? 1 : 4).map((url, idx) => (
                            <div key={idx} className={`relative rounded-lg overflow-hidden bg-white border border-slate-200 ${isSingleProductImage ? 'w-full h-full max-h-[280px]' : 'aspect-square'}`}>
                              <img src={url} alt={`Preview ${idx}`} className={`w-full h-full ${isSingleProductImage ? 'object-contain' : 'object-cover'}`} />
                              {!isSingleProductImage && idx === 3 && state.previewUrls.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                                  +{state.previewUrls.length - 4}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center p-6 text-center">
                          <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs text-slate-500 font-medium">{isSingleProductImage ? 'Nhấn để tải 1 ảnh sản phẩm' : 'Nhấn để tải ảnh sản phẩm'}</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        multiple={!isSingleProductImage}
                        className="hidden" 
                      />
                    </div>
                  </div>

                  {/* Face Reference Image (Standard Mode) */}
                  {mode !== 'shopee8s' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">0. Ảnh khuôn mặt mẫu (Tùy chọn)</label>
                        <div 
                        onClick={() => faceInputRef.current?.click()}
                        className={`relative w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${state.facePreviewUrl ? 'border-purple-300 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}`}
                        >
                            {state.facePreviewUrl ? (
                            <div className="flex items-center gap-4 px-4 w-full">
                                <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                    <img src={state.facePreviewUrl} alt="Face Reference" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs text-purple-700 font-medium">Khuôn mặt này sẽ được dùng cho nhân vật.</span>
                            </div>
                            ) : (
                            <div className="flex items-center gap-2 text-slate-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-xs font-medium">Tải ảnh mặt nhân vật chính</span>
                            </div>
                            )}
                            <input 
                            type="file" 
                            ref={faceInputRef} 
                            onChange={handleFaceFileChange} 
                            accept="image/*" 
                            className="hidden" 
                            />
                        </div>
                        
                        <div className="mt-3">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Mô tả thêm về nhân vật (Trang phục, dáng người...)</label>
                            <textarea 
                            value={state.characterDescription}
                            onChange={(e) => setState(prev => ({ ...prev, characterDescription: e.target.value }))}
                            placeholder="Ví dụ: Áo 2 dây đỏ. không so sánh sản phẩm..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                            rows={2}
                            />
                        </div>
                    </div>
                  )}
                </div>

                {/* Inputs & Action */}
                <div className="md:col-span-7 flex flex-col gap-6">
                  <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">2. Tên sản phẩm</label>
                       <input
                        type="text"
                        value={state.productName}
                        onChange={(e) => setState(prev => ({ ...prev, productName: e.target.value }))}
                        placeholder="Ví dụ: ABC dành cho XYZ..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    {/* Face Reference Image (Shopee 8s Mode) */}
                    {mode === 'shopee8s' && (
                        <div className="border border-slate-100 bg-slate-50 p-4 rounded-xl">
                            <label className="block text-sm font-medium text-slate-700 mb-2">0. Ảnh khuôn mặt mẫu (Tùy chọn)</label>
                            <div 
                                onClick={() => faceInputRef.current?.click()}
                                className={`relative w-full h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${state.facePreviewUrl ? 'border-purple-300 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'}`}
                            >
                                {state.facePreviewUrl ? (
                                    <div className="flex items-center gap-4 px-4 w-full">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                            <img src={state.facePreviewUrl} alt="Face Reference" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs text-purple-700 font-medium">Khuôn mặt này sẽ được dùng cho nhân vật.</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-xs font-medium">Tải ảnh mặt nhân vật chính</span>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={faceInputRef} 
                                    onChange={handleFaceFileChange} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                            </div>
                            
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Lưu ý thêm về cả sản phẩm và nhân vật</label>
                                <textarea 
                                value={state.characterDescription}
                                onChange={(e) => setState(prev => ({ ...prev, characterDescription: e.target.value }))}
                                placeholder="Ví dụ: Áo phông trắng, dáng người thư sinh, tóc ngắn..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-white"
                                rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {mode !== 'shopee8s' && (
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {mode === 'review1k' ? '3. Giá sản phẩm' : '3. Đặc điểm nổi bật / Từ khóa'}
                        </label>
                        <input
                            type="text"
                            value={state.keyword}
                            onChange={(e) => setState(prev => ({ ...prev, keyword: e.target.value }))}
                            placeholder={mode === 'review1k' ? "Ví dụ: 1k, chưa tới 200k, giá đang tốt..." : "Ví dụ: đặc điểm 1, đặc điểm 2, đặc điểm 3..."}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                        </div>
                    )}

                    {mode === 'koc' && (
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">4. Cấu trúc kịch bản (Video Layout)</label>
                        <select
                            value={state.scriptLayout}
                            onChange={(e) => setState(prev => ({ ...prev, scriptLayout: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                        >
                            <option value="">-- Tự động chọn ngẫu nhiên (Random) --</option>
                            {LAYOUT_OPTIONS.map((layout, idx) => (
                            <option key={idx} value={layout}>
                                {layout}
                            </option>
                            ))}
                        </select>
                        </div>
                    )}

                    {mode !== 'shopee8s' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">
                                {mode === 'review1k' ? '4. Giọng điệu kịch bản' : '5. Giọng điệu kịch bản'}
                           </label>
                            <input
                            type="text"
                            value={state.scriptTone}
                            onChange={(e) => setState(prev => ({ ...prev, scriptTone: e.target.value }))}
                            placeholder="Ví dụ: Kịch tính, hào hứng, vui vẻ..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {mode === 'review1k' ? '5. Kích thước sản phẩm' : '6. Kích thước sản phẩm'}
                            </label>
                            <input
                            type="text"
                            value={state.productSize}
                            onChange={(e) => setState(prev => ({ ...prev, productSize: e.target.value }))}
                            placeholder="Ví dụ: Nhỏ gọn lòng bàn tay, 10x8cm..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        </div>
                    )}

                    {mode !== 'shopee8s' && (
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {mode === 'review1k' ? '6. Lưu ý thêm (Bối cảnh/Điều cấm kỵ)' : '7. Lưu ý thêm (Bối cảnh/Điều cấm kỵ)'}
                        </label>
                        <input
                            type="text"
                            value={state.scriptNote}
                            onChange={(e) => setState(prev => ({ ...prev, scriptNote: e.target.value }))}
                            placeholder="Ví dụ: Giá chỉ 399k có thể thay đổi khi hết sale, bối cảnh quán cafe..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                        </div>
                    )}
                  </div>

                  {/* Generate Button (Standard - Right Column Bottom) */}
                  {mode !== 'shopee8s' && (
                    <div className="mt-auto pt-4">
                        <button
                        onClick={handleMainGenerate}
                        disabled={state.selectedFiles.length === 0 || !state.productName || state.isGeneratingScript}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2
                            ${state.selectedFiles.length === 0 || !state.productName
                            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                            : state.isGeneratingScript
                                ? 'bg-blue-400 cursor-wait'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
                            }`}
                        >
                        {state.isGeneratingScript ? (
                            <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Đang tạo...
                            </>
                        ) : (
                            <>
                            <span>Tạo Chiến Dịch</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </>
                        )}
                        </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button (Shopee 8s - Full Width Bottom) */}
              {mode === 'shopee8s' && (
                 <div className="mt-8 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleMainGenerate}
                      disabled={state.selectedFiles.length === 0 || !state.productName || state.isGeneratingScript}
                      className={`w-full py-5 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-3
                        ${state.selectedFiles.length === 0 || !state.productName
                          ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                          : state.isGeneratingScript
                            ? 'bg-blue-400 cursor-wait'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
                        }`}
                    >
                      {state.isGeneratingScript ? (
                        <>
                          <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Đang tạo 4 Biến thể...
                        </>
                      ) : (
                        <>
                          <span>Tạo 4 Biến Thể 8 Giây</span>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </>
                      )}
                    </button>
                 </div>
              )}
            </section>

            {state.scriptError && (
              <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {state.scriptError}
              </div>
            )}

            {/* Results Grid */}
            {state.script && (
              <>
                <div className={`grid grid-cols-1 ${gridClass} gap-6`}>
                  
                  {/* V1 Column */}
                  {(mode !== 'review1k' && (mode !== 'koc' || activeKeys.includes('v1'))) && (
                    <div className="space-y-4">
                        {showScript && (
                            <ScriptSection 
                            title={mode === 'shopee8s' ? "Kịch bản Video 1 (Full)" : "Phần 1"} 
                            content={state.script.v1} 
                            color="border-red-500" 
                            onChange={(text) => handleScriptChange('v1', text)}
                            />
                        )}
                        <ImageCard 
                        label={mode === 'shopee8s' ? "Phương án Video 1" : "Hình ảnh 01"} 
                        imageData={state.images.v1} 
                        videoPrompt={state.videoPrompts.v1}
                        onGeneratePrompt={() => handleCreateVideoPrompt('v1')}
                        onRegenerate={() => handleRegenerateImage('v1')}
                        onTranslate={() => handleTranslatePrompt('v1')}
                        customPrompt={state.images.v1.customPrompt || ''}
                        onCustomPromptChange={(text) => handleImageCustomPromptChange('v1', text)}
                        />
                    </div>
                  )}

                  {/* V2 Column */}
                  {(mode !== 'koc' || activeKeys.includes('v2')) && (
                  <div className="space-y-4">
                    {showScript && (
                        <ScriptSection 
                        title={mode === 'review1k' ? "Phần 1: Hook (Nghi ngờ)" : mode === 'shopee8s' ? "Kịch bản Video 2 (Full)" : "Phần 2"}
                        content={state.script.v2} 
                        color="border-blue-500" 
                        onChange={(text) => handleScriptChange('v2', text)}
                        />
                    )}
                    <ImageCard 
                      label={mode === 'review1k' ? "Hook Visual" : mode === 'shopee8s' ? "Phương án Video 2" : "Hình ảnh 02"}
                      imageData={state.images.v2} 
                      videoPrompt={state.videoPrompts.v2}
                      onGeneratePrompt={() => handleCreateVideoPrompt('v2')}
                      onRegenerate={() => handleRegenerateImage('v2')}
                      onTranslate={() => handleTranslatePrompt('v2')}
                      customPrompt={state.images.v2.customPrompt || ''}
                      onCustomPromptChange={(text) => handleImageCustomPromptChange('v2', text)}
                    />
                  </div>
                  )}

                  {/* V3 Column */}
                  {(mode !== 'koc' || activeKeys.includes('v3')) && (
                  <div className="space-y-4">
                    {showScript && (
                        <ScriptSection 
                        title={mode === 'review1k' ? "Phần 2: Review (Siêu ngắn)" : mode === 'shopee8s' ? "Kịch bản Video 3 (Full)" : "Phần 3"}
                        content={state.script.v3} 
                        color="border-green-500" 
                        onChange={(text) => handleScriptChange('v3', text)}
                        />
                    )}
                    <ImageCard 
                      label={mode === 'review1k' ? "Review Visual" : mode === 'shopee8s' ? "Phương án Video 3" : "Hình ảnh 03"}
                      imageData={state.images.v3} 
                      videoPrompt={state.videoPrompts.v3}
                      onGeneratePrompt={() => handleCreateVideoPrompt('v3')}
                      onRegenerate={() => handleRegenerateImage('v3')}
                      onTranslate={() => handleTranslatePrompt('v3')}
                      customPrompt={state.images.v3.customPrompt || ''}
                      onCustomPromptChange={(text) => handleImageCustomPromptChange('v3', text)}
                    />
                  </div>
                  )}

                  {/* V3.5 Column - Only in KOC mode AND if 5 parts are active */}
                  {showV3_5 && (
                    <div className="space-y-4">
                        <ScriptSection 
                        title="Phần 3.5 (Features+)" 
                        content={state.script.v3_5} 
                        color="border-teal-500" 
                        onChange={(text) => handleScriptChange('v3_5', text)}
                        />
                        <ImageCard 
                        label="Hình ảnh 04 (V3.5)" 
                        imageData={state.images.v3_5} 
                        videoPrompt={state.videoPrompts.v3_5}
                        onGeneratePrompt={() => handleCreateVideoPrompt('v3_5')}
                        onRegenerate={() => handleRegenerateImage('v3_5')}
                        onTranslate={() => handleTranslatePrompt('v3_5')}
                        customPrompt={state.images.v3_5.customPrompt || ''}
                        onCustomPromptChange={(text) => handleImageCustomPromptChange('v3_5', text)}
                        />
                    </div>
                  )}

                  {/* V4 Column */}
                  {(mode !== 'koc' || activeKeys.includes('v4')) && (
                  <div className="space-y-4">
                    {showScript && (
                        <ScriptSection 
                        title={mode === 'review1k' ? "Phần 3: CTA (FOMO)" : mode === 'shopee8s' ? "Kịch bản Video 4 (Full)" : "Phần 4"}
                        content={state.script.v4} 
                        color="border-purple-500" 
                        onChange={(text) => handleScriptChange('v4', text)}
                        />
                    )}
                    <ImageCard 
                      label={mode === 'review1k' ? "CTA Visual" : mode === 'shopee8s' ? "Phương án Video 4" : "Hình ảnh 04"}
                      imageData={state.images.v4} 
                      videoPrompt={state.videoPrompts.v4}
                      onGeneratePrompt={() => handleCreateVideoPrompt('v4')}
                      onRegenerate={() => handleRegenerateImage('v4')}
                      onTranslate={() => handleTranslatePrompt('v4')}
                      customPrompt={state.images.v4.customPrompt || ''}
                      onCustomPromptChange={(text) => handleImageCustomPromptChange('v4', text)}
                    />
                  </div>
                  )}
                </div>

                <div className="mt-12 flex justify-center gap-4">
                   <button
                    onClick={handleDownloadAllImages}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md shadow-green-200 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Tải Tất Cả Ảnh Đã Tạo
                  </button>

                  <button
                    onClick={handleDownloadAllPrompts}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Tải Tất Cả Prompt (.txt)
                  </button>
                </div>
              </>
            )}
         </div>
     </div>
  );
};

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'koc' | 'review1k' | 'shopee8s' | 'coverlink' | 'carousel' | 'videopov'>('koc');
  const [hasApiKeys, setHasApiKeys] = useState(false);

  // Check for existing keys on load
  useEffect(() => {
      const stored = localStorage.getItem('gemini_api_keys');
      if (stored) {
          try {
              const keys = JSON.parse(stored);
              if (Array.isArray(keys) && keys.length > 0) {
                  setApiKeys(keys);
                  setHasApiKeys(true);
              }
          } catch (e) {
              console.error("Error loading keys", e);
          }
      }
  }, []);

  const handleApiKeysSubmit = (keys: string[]) => {
      setApiKeys(keys);
      localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
      setHasApiKeys(true);
  };

  const handleChangeApiKeys = () => {
      if(window.confirm("Bạn muốn đổi API Key?")) {
          setHasApiKeys(false);
      }
  };

  if (!hasApiKeys) {
      return <ApiKeyEntry onKeysSubmit={handleApiKeysSubmit} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'koc':
        return <ModuleContainer storageKey="koc_project" moduleName="TRỢ LÝ LÀM VIDEO REVIEW" mode="koc" />;
      case 'review1k':
        return <ModuleContainer storageKey="review1k_project" moduleName="TRỢ LÝ LÀM VIDEO HÀNG GIÁ RẺ SỐC" mode="review1k" />;
      case 'shopee8s':
        return <ModuleContainer storageKey="shopee8s_project" moduleName="TRỢ LÝ LÀM VIDEO SHOPEE 8S" mode="shopee8s" />;
      case 'coverlink':
        return <ModuleContainer storageKey="coverlink_project" moduleName="TRỢ LÝ COVER LINK SHOPEE" mode="coverlink" />;
      case 'carousel':
        return <ModuleContainer storageKey="carousel_project" moduleName="TRỢ LÝ LÀM ẢNH CUỘN" mode="carousel" />;
      case 'videopov':
        return <ModuleContainer storageKey="videopov_project" moduleName="TRỢ LÝ LÀM VIDEO DẠNG POV" mode="videopov" />;
      default:
        return <ModuleContainer storageKey="koc_project" moduleName="TRỢ LÝ LÀM VIDEO REVIEW" mode="koc" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center relative">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm">
                      <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                  </div>
                  <div className="w-10 h-10 bg-[#EE4D2D] rounded-full flex items-center justify-center -ml-3 z-20 border-2 border-white shadow-sm">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2H8c0-1.1.9-2 2-2zm6 14H6V8h14v10z"/>
                          <path d="M12 10v3.5c0 .83-.67 1.5-1.5 1.5S9 14.33 9 13.5 9.67 12 10.5 12c.36 0 .69.13.95.35V10h2.5v1.5H12z"/>
                      </svg>
                  </div>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                AFFILIATE ALL-IN-ONE
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center space-x-1">
                {[
                    { id: 'koc', label: 'KOC Review' },
                    { id: 'review1k', label: 'Review Sốc' },
                    { id: 'shopee8s', label: 'Shopee 8s' },
                    { id: 'videopov', label: 'Video POV' },
                    { id: 'carousel', label: 'Ảnh Cuộn' },
                    { id: 'coverlink', label: 'Cover Link' },
                ].map((tab) => (
                    <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    >
                    {tab.label}
                    </button>
                ))}
                </div>
                <button 
                    onClick={handleChangeApiKeys}
                    className="ml-2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Đổi API Key"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Horizontal Scroll Nav */}
        <div className="md:hidden overflow-x-auto border-t border-slate-100 scrollbar-hide">
             <div className="flex p-2 gap-2 min-w-max">
              {[
                { id: 'koc', label: 'KOC Review' },
                { id: 'review1k', label: 'Review Deal Sốc' },
                { id: 'shopee8s', label: 'Shopee 8 Giây' },
                { id: 'videopov', label: 'Video POV' },
                { id: 'carousel', label: 'Ảnh Cuộn' },
                { id: 'coverlink', label: 'Công cụ Link' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                    currentTab === tab.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
             </div>
        </div>
      </nav>

      <main className="pb-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
