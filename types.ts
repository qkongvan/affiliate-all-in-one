
export interface ScriptParts {
  v1: string;
  v2: string;
  v3: string;
  v3_5: string; // New part for extended features
  v4: string;
}

export interface GeneratedImage {
  url: string;
  loading: boolean;
  error?: string;
  customPrompt?: string; // User input for modifying the image
}

export interface VideoPromptState {
  text: string;
  loading: boolean;
  visible: boolean;
  translatedText?: string;
  translating?: boolean;
}

export interface CarouselItem {
  id: number;
  content: string;
  imageUrl: string;
  loading: boolean;
  error?: string;
  customNote: string;
}

// Module 8: Video POV Types
export interface PovScriptSegment {
  id: number;
  content: string; // The script text segment
  image: GeneratedImage;
  videoPrompt: VideoPromptState;
}

export interface VideoPovState {
  videoFile: File | null;
  videoPreviewUrl: string | null;
  analysis: string;
  isAnalyzing: boolean;
  
  style: string; // 'tâm sự', 'hài hước', 'kịch tính'
  segmentCount: number; // Number of segments (frames), default 4
  faceFile: File | null;
  facePreviewUrl: string | null;
  
  isGeneratingScript: boolean;
  segments: PovScriptSegment[];
}

export interface AppState {
  faceFile: File | null;
  facePreviewUrl: string | null;
  characterDescription: string;
  selectedFiles: File[];
  previewUrls: string[];
  productName: string;
  keyword: string;
  scriptTone: string;
  productSize: string;
  scriptNote: string;
  scriptLayout: string;
  isGeneratingScript: boolean;
  script: ScriptParts | null;
  scriptError: string | null;
  
  // Existing Images (Fixed slots)
  images: {
    v1: GeneratedImage;
    v2: GeneratedImage;
    v3: GeneratedImage;
    v3_5: GeneratedImage; // New
    v4: GeneratedImage;
  };
  
  // Existing Video Prompts
  videoPrompts: {
    v1: VideoPromptState;
    v2: VideoPromptState;
    v3: VideoPromptState;
    v3_5: VideoPromptState; // New
    v4: VideoPromptState;
  };

  // Module 4: Cover Link Shopee State
  coverLinkInput: string;
  coverLinkNames: string;
  coverLinkUrls: string;
  coverLinkOutput: string;

  // Module 6: Carousel Content State
  carouselCategory: string; // New: Tên gọi
  carouselSubCategory: string; // New: Nội dung
  carouselTopic: string;
  carouselImageCount: number;
  carouselNote: string;
  carouselItems: CarouselItem[];
  isGeneratingCarouselScript: boolean;
  carouselFont: string; // New: Font selection
  carouselTextPosition: 'top' | 'bottom' | 'split'; // New: Text position selection

  // Module 8 New: Video POV
  videoPov: VideoPovState;
}

export type ScriptPartKey = keyof ScriptParts;