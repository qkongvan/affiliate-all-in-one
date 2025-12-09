
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ScriptParts, ScriptPartKey, PovScriptSegment } from "../types";

// --- API Key Management ---
let apiKeys: string[] = [];
let currentKeyIndex = 0;

export const setApiKeys = (keys: string[]) => {
  // Filter out empty lines
  apiKeys = keys.filter(k => k.trim() !== '');
  currentKeyIndex = 0;
};

// Helper to get a client instance with the next key in rotation
const getAiClient = (): GoogleGenAI => {
  if (apiKeys.length === 0) {
    throw new Error("API Keys have not been configured. Please enter your API keys.");
  }
  
  const key = apiKeys[currentKeyIndex];
  // Round-robin rotation
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  
  return new GoogleGenAI({ apiKey: key });
};

interface GenerativePart {
  mimeType: string;
  data: string;
}

// Helper to convert file to base64 with mimeType
export const fileToGenerativePart = async (file: File): Promise<GenerativePart> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Task 1: Generate TikTok Script
export const generateTikTokScript = async (
  imageParts: GenerativePart[], 
  productName: string,
  keyword: string,
  scriptTone: string,
  productSize: string,
  scriptNote: string,
  scriptLayout: string,
  moduleMode: 'koc' | 'review1k' | 'shopee8s' | 'coverlink' | 'carousel' | 'videopov' // Updated parameter
): Promise<ScriptParts> => {
  // If CoverLink, Carousel, or VideoPov return dummy script parts
  if (moduleMode === 'coverlink' || moduleMode === 'carousel' || moduleMode === 'videopov') {
    return { v1: '', v2: '', v3: '', v3_5: '', v4: '' };
  }

  const ai = getAiClient();
  const modelId = "gemini-2.5-flash";
  // Default tone updated to Female, Northern VN, Dramatic, FOMO
  const toneInstruction = scriptTone ? `giọng điệu "${scriptTone}"` : "giọng nữ, Chuẩn giọng Hà Nội (Miền Bắc Việt Nam), nhanh, hào hứng, kịch tính, tạo cảm giác FOMO";
  const sizeInfo = productSize ? `Kích thước/Đặc điểm ngoại quan: "${productSize}"` : "";
  const noteInstruction = scriptNote ? `LƯU Ý ĐẶC BIỆT (Bối cảnh/Negative Constraints): "${scriptNote}"` : "";

  // Visual analysis instruction - Excluded for shopee8s
  const visualAnalysisInstruction = moduleMode === 'shopee8s' ? "" : `
  2. PHÂN TÍCH HÌNH ẢNH (VISUAL ANALYSIS):
     - Hãy quan sát thật kỹ các hình ảnh đính kèm.
     - Sử dụng thông tin trên bao bì, họa tiết, màu sắc, hình dáng thực tế của sản phẩm trong ảnh để đưa vào lời thoại kịch bản.
     - Các thông tin mô tả sản phẩm trong kịch bản có thể sử dụng những thông tin với những gì nhìn thấy trong ảnh.
  `;

  // Logic for Review 1K Mode vs KOC Mode
  let structureInstruction = "";
  
  if (moduleMode === 'review1k') {
    structureInstruction = `
    CHẾ ĐỘ REVIEW 1K (REVIEW GIÁ RẺ/LỖI GIÁ):
    Hãy viết kịch bản theo cấu trúc 3 phần sau (Mapping vào output v2, v3, v4).
    Lưu ý: Để trống v1 và v3_5.

    - v2 (HOOK - NGHI NGỜ/SHOCK): Nói về việc sàn ngáo giá, các shop phá giá nhau, mắng sàn, thể hiện sự nghi ngờ tột độ.
    - v3 (GIỚI THIỆU & REVIEW SIÊU NGẮN): Khẳng định chất lượng, trải nghiệm, tính năng, lợi ích.
    - v4 (CTA - FOMO/URGENCY): Thúc giục người xem kiểm tra giỏ hàng.
    
    VĂN PHONG HÀ NỘI (MIỀN BẮC VIỆT NAM):
     - Sử dụng 100% từ ngữ, ngữ khí của người Hà Nội.
     - Tuyệt đối KHÔNG dùng từ địa phương miền Nam (Ví dụ: KHÔNG dùng "nhen", "nghen", "dữ thần", "cưng xỉu").
     - Cách nói chuyện gãy gọn, trực diện, có thể hơi đanh đá một chút nhưng vẫn duyên.
    `;
  } else if (moduleMode === 'shopee8s') {
    structureInstruction = `
    CHẾ ĐỘ SHOPEE VIDEO 8S (VIDEO NGẮN BẮT TREND):
    Hãy viết 4 KỊCH BẢN HOÀN CHỈNH KHÁC NHAU cho video 8 giây.
    
    YÊU CẦU CẤU TRÚC CHO MỖI KỊCH BẢN (Mỗi biến v1, v2, v3, v4 là một kịch bản trọn vẹn gồm 3 phần):
    1. Hook (Câu dẫn gây tò mò/sốc/vào đề ngay)
    2. Giải pháp / Giới thiệu sản phẩm / Đánh giá nhanh
    3. CTA (Kêu gọi hành động ngắn gọn)

    Hãy sáng tạo 4 hướng tiếp cận khác nhau:
    - v1: Kịch bản tập trung vào Nỗi đau -> Giải pháp -> CTA.
    - v2: Kịch bản tập trung vào Tính năng độc lạ -> Wow -> CTA.
    - v3: Kịch bản tập trung vào Giá/Ưu đãi (Sale) -> FOMO -> CTA.
    - v4: Kịch bản tập trung vào Trải nghiệm/Feedback thực tế -> CTA.
    **Lưu ý: không so sánh giá (Vd: rẻ bằng cốc cà phê, Giá chưa bằng cốc trà sữa...)
    Ánh xạ output:
    - v1 -> v1 (Trọn vẹn kịch bản 1)
    - v2 -> v2 (Trọn vẹn kịch bản 2)
    - v3 -> v3 (Trọn vẹn kịch bản 3)
    - v4 -> v4 (Trọn vẹn kịch bản 4)
    - v3_5: Để trống.
    
    YÊU CẦU: Ngắn gọn, súc tích, tổng độ dài mỗi kịch bản dưới 190 ký tự (40-45 chữ) để kịp đọc trong 8 giây.
    `;
  } else {
    // KOC Mode logic
    const glossary = `
    CHÚ THÍCH THUẬT NGỮ (GLOSSARY):
    – Nỗi đau = tình huống gây ức chế.
    – Đánh giá so sánh = kích thích người xem thay thế sản phẩm.
    – CTA = kêu gọi hành động.
    `;

    // Calculate number of parts based on '+' separator
    const selectedLayout = scriptLayout || "Câu chuyện chủ đề + giới thiệu sản phẩm + đánh giá so sánh + sử dụng sản phẩm trong nhiều trường hợp + Cta";
    const partsCount = selectedLayout.split('+').length;
    
    let mappingInstruction = "";
    if (partsCount >= 5) {
        mappingInstruction = `
        BỐ CỤC NÀY CÓ 5 PHẦN. Hãy ánh xạ (Map) vào 5 biến đầu ra:
        - Phần 1 trong bố cục -> v1
        - Phần 2 trong bố cục -> v2
        - Phần 3 trong bố cục -> v3
        - Phần 4 trong bố cục -> v3_5
        - Phần 5 trong bố cục -> v4 (CTA)
        `;
    } else if (partsCount === 3) {
        mappingInstruction = `
        BỐ CỤC NÀY CÓ 3 PHẦN. Hãy ánh xạ (Map) vào 3 biến đầu ra (Bỏ qua v3_5 và v4):
        - Phần 1 trong bố cục -> v1
        - Phần 2 trong bố cục -> v2
        - Phần 3 trong bố cục -> v3
        - v4: Để trống (Empty string)
        - v3_5: Để trống (Empty string)
        `;
    } else {
        // Default 4 parts
        mappingInstruction = `
        BỐ CỤC NÀY CÓ 4 PHẦN. Hãy ánh xạ (Map) vào 4 biến đầu ra (Bỏ qua v3_5):
        - Phần 1 trong bố cục -> v1
        - Phần 2 trong bố cục -> v2
        - Phần 3 trong bố cục -> v3
        - Phần 4 trong bố cục -> v4 (CTA)
        - v3_5: Để trống (Empty string)
        `;
    }

    structureInstruction = `
    BỐ CỤC KỊCH BẢN ĐƯỢC CHỌN: "${selectedLayout}"
    
    ${mappingInstruction}

    ${glossary}
    `;
  }

  const forbiddenWords = `
  TUYỆT ĐỐI KHÔNG SỬ DỤNG CÁC TỪ/CỤM TỪ SAU TRONG KỊCH BẢN (NGUYÊN TẮC CỘNG ĐỒNG):
  Facebook, Shopee, Lazada, Tiki, Zalo, QR, Chuyển khoản, Fanpage, Địa Chỉ, Số điện thoại, Nước Anh, Nước Pháp, Trung Quốc, Tên quốc gia, Dior, Gucci, Adidas, Nike, So sánh với các thương hiệu khác, Làm dày, Chống rụng, Kích thích mọc tóc, Làm hồng, Se Khít, Da đen, Đồ điên, Con thiểu năng, Sale sốc, Mua ngay đi, Cam kết khẳng định, So sánh nhất, Top 1, Hàng đầu, Chính hãng, Độc quyền, Duy nhất, 100%, Tuyệt đối, Chắc chắn, Giá rẻ nhất, Giá tốt nhất, Cam kết, Tốt nhất, Tức thì, Chất lượng nhất, Top 1 thế giới, Vĩnh viễn, Hoàn toàn, Cam kết hiệu quả, Bảo hành trọn đời, Xả hàng, Từ ngữ liên quan điều trị, Y tế, Trị + ..., Điều trị, Dứt điểm, Chữa khỏi, Đánh bay, Hiệu quả, Loại bỏ, Phục hồi, Xóa bỏ, Giảm mỡ, Kem tan mỡ, Giảm kích thước các vòng, Làm săn chắc, Ngăn ngừa, Làm chậm tốc độ, Dừng mọc lông, Bảo vệ da khỏi, Cam kết giao hàng, Khuyến mãi ảo, Công dụng quá đà, Gửi hàng 2 ngày nhận được, Nhận hàng không ưng trả lại, Bỏ qua sẽ hối hận cả đời, Tặng miễn phí sản phẩm, Chia sẻ để mua hàng giá 0đ, Quà tặng miễn phí cho tất cả mọi người, Nhanh tay mua ngay để được giá ưu đãi tốt nhất, Ấn vào Link để nhận thưởng miễn phí, Diệt mụn, Phòng chống nhiễm trùng, Ngăn chặn lão hóa, Làm đảo ngược tình trạng lão hóa, Giảm cân / Tăng cân, Tăng cường cảm xúc, Hấp dẫn giới tính, Ưu đãi huỷ diệt, Khuyến Mãi cực sốc, Giảm giá kịch sàn, Thanh lý toàn bộ, Nhanh tay đặt hàng, Có 1 không 2.
  `;

  const prompt = `
  Nhiệm vụ: Tạo kịch bản TikTok bán hàng viral cho sản phẩm: "${productName}".
  Thông tin bổ sung (Giá/Bối cảnh/Từ khóa): "${keyword}".
  ${sizeInfo}
  ${noteInstruction}
  
  YÊU CẦU QUAN TRỌNG VỀ VĂN PHONG (BẮT BUỘC):
  1. VĂN PHONG HÀ NỘI (MIỀN BẮC VIỆT NAM):
     - Sử dụng 100% từ ngữ, ngữ khí của người Hà Nội.
     - Tuyệt đối KHÔNG dùng từ địa phương miền Nam (Ví dụ: KHÔNG dùng "nhen", "nghen", "dữ thần", "cưng xỉu").
     - Cách nói chuyện gãy gọn, trực diện, hơi đanh đá một chút nhưng vẫn duyên.

  ${visualAnalysisInstruction}

  QUY TẮC XƯNG HÔ:
  - Xưng là: "em"
  - Gọi người xem là: "anh chị".

  ${structureInstruction}

  ${forbiddenWords}
  
  YÊU CẦU CHUNG:
  3. YẾU TỐ CẢM XÚC: Làm video phải tạo ra CẢM XÚC: Tò mò, đồng cảm, bức xúc, phẫn nộ…
  4. YẾU TỐ TRANH LUẬN: Cài cắm quan điểm gây tranh luận nhẹ.
  
  QUAN TRỌNG TUYỆT ĐỐI VỀ ĐỘ DÀI (HARD LIMIT): 
  - Mỗi phần (v1, v2, v3, v3_5, v4) BẮT BUỘC phải dưới 190 ký tự (40-45 chữ).
  
  Yêu cầu văn phong: Tiếng Việt, ${toneInstruction}, viết liền mạch, không icon, không chú thích cảnh.
  `;

  const contentsParts: any[] = [{ text: prompt }];
  // Add all image parts to provide full context (different angles) - Conditional for shopee8s
  if (moduleMode !== 'shopee8s') {
      imageParts.forEach(part => {
        contentsParts.push({ inlineData: { mimeType: part.mimeType, data: part.data } });
      });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: contentsParts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            v1: { type: Type.STRING },
            v2: { type: Type.STRING },
            v3: { type: Type.STRING },
            v3_5: { type: Type.STRING },
            v4: { type: Type.STRING },
          },
          required: ["v1", "v2", "v3", "v3_5", "v4"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ScriptParts;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Script generation error:", error);
    throw error;
  }
};

// Task 2: Generate Image
export const generateScenarioImage = async (
  referenceImageParts: GenerativePart[],
  faceImagePart: GenerativePart | null,
  productName: string,
  keyword: string,
  scriptPart: string,
  partKey: ScriptPartKey,
  productSize: string,
  characterDescription: string,
  userCustomPrompt?: string, // New argument for user overrides
  moduleMode: 'koc' | 'review1k' | 'shopee8s' | 'coverlink' | 'carousel' | 'videopov' = 'koc' // Updated parameter
): Promise<string> => {
  if (moduleMode === 'videopov') return ""; // Handled separately
  const ai = getAiClient();

  // Changed from gemini-3-pro-image-preview to gemini-2.5-flash-image to fix permission issues
  const modelId = "gemini-2.5-flash-image";

  let moodDescription = "";
  let productInstruction = "";
  const sizeContext = productSize ? `Note on product scale: The product is approximately ${productSize}. Ensure the size relation to the hand/body is accurate.` : "";

  // Logic for Mood based on Mode and Part
  if (moduleMode === 'shopee8s') {
      // Shopee 8s Mode logic...
      // Each v1-v4 is now a distinct video option, so give them distinct visual styles to choose from
      const baseOutfit = characterDescription || "Casual fashionable outfit";
      let outfitVariation = "";
      switch (partKey) {
          case 'v1':
              outfitVariation = `Outfit: ${baseOutfit}. Style: Standard/Default as described. Pose: Natural, holding product.`;
              break;
          case 'v2':
              outfitVariation = `Outfit: Same clothes as ${baseOutfit}, but change the COLOR or PATTERN slightly to create a variation. Style: Different styling (e.g., tucked in vs loose). Pose: Active interaction.`;
              break;
          case 'v3':
              outfitVariation = `Outfit: ${baseOutfit} but styled differently (e.g., add a jacket, or different accessories). Maintain the core look but refresh the vibe. Pose: Enthusiastic close-up.`;
              break;
          case 'v4':
              outfitVariation = `Outfit: ${baseOutfit} with a distinct color change or different wearing style (e.g. tied at waist). Pose: Enthusiastic close-up.`;
              break;
          default:
              outfitVariation = `Outfit: ${baseOutfit}`;
      }
      moodDescription = "High-energy, commercial fashion photography, confident, attractive, professional lighting.";
      productInstruction = `Subject is holding the ${productName} clearly. ${sizeContext}`;
      characterDescription = `${outfitVariation}. FACE MUST MATCH THE REFERENCE EXACTLY.`;

  } else if (moduleMode === 'review1k') {
      // Review 1k logic...
      switch (partKey) {
        case 'v2': // Hook
            moodDescription = "Shocked, disbelief, extremely suspicious facial expression. Holding the product and looking at it with wide eyes, questioning its reality. RAW, CANDID, REAL LIFE.";
            productInstruction = `Subject is holding the ${productName}, examining it closely with suspicion.`;
            break;
        case 'v3': // Review
            moodDescription = "Delighted, surprised by quality, happy, showing the product works great. RAW, CANDID, REAL LIFE.";
            productInstruction = `Subject is using the ${productName} effectively, looking impressed.`;
            break;
        case 'v4': // CTA
            moodDescription = "Urgent, pointing excitedly at the product or bottom left corner (cart), frantic energy, FOMO. RAW, CANDID, REAL LIFE.";
            productInstruction = `Subject is using the ${productName} effectively, looking impressed.`;
            break;
        default:
            moodDescription = "Neutral";
            productInstruction = `Subject with ${productName}.`;
      }
  } else {
      // KOC Mode logic...
      switch (partKey) {
        case 'v1': 
          moodDescription = "looking thoughtful, pensive, or slightly confused about a small daily task related to the context. Expressive emotion. NOT angry, NOT violent."; 
          productInstruction = "DO NOT SHOW THE PRODUCT. The image should focus ONLY on the character and the environment/context/problem.";
          break;
        case 'v2': 
          moodDescription = "holding the product up with a happy, expressive smile, showing a solution, eureka moment"; 
          productInstruction = `Subject is holding or interacting with the ${productName} shown in the reference images. ${sizeContext}`;
          break;
        case 'v3': 
          moodDescription = `relaxed, enjoying the benefits of the ${productName}, satisfied expression, lifestyle shot`; 
          productInstruction = `The ${productName} is clearly visible nearby, integrated naturally into the scene. ${sizeContext}`;
          break;
        case 'v3_5':
          moodDescription = `enthusiastic, showing off a specific detail or result of using the ${productName}, impressed expression`;
          productInstruction = `Close-up or clear view of the ${productName}. ${sizeContext}`;
          break;
        case 'v4': 
          moodDescription = "confident, trusting, pointing at the product or giving a thumbs up, inviting gesture"; 
          productInstruction = `Subject gestures towards the ${productName}. ${sizeContext}`;
          break;
      }
  }

  const charDetail = characterDescription ? `Extra Details: ${characterDescription}` : "";
  
  const subjectDescription = faceImagePart 
    ? `FACE REFERENCE PROVIDED: The first image provided is the CHARACTER REFERENCE FACE. You MUST generate the character based strictly on this person (Match the GENDER, Age, Ethnicity, and Features of the face provided). ${charDetail}`
    : `Subject: A young Vietnamese adult (Male or Female). ${charDetail}`;

  const userOverride = userCustomPrompt ? `
  IMPORTANT USER CUSTOMIZATION / EDIT REQUEST:
  The user wants to modify this specific image with the following instruction: "${userCustomPrompt}".
  PRIORITIZE this user instruction over the default "Action/Mood" description if they conflict.
  ` : "";

  const isKocV1 = moduleMode === 'koc' && partKey === 'v1';

  const prompt = `
  Generate a Photorealistic image, 9:16 aspect ratio.
  ${subjectDescription}
  Subject Description: Real Person, Vietnamese Adult (Male or Female), fashionable, high-quality photography, realistic skin texture, natural features.
  Setting: ${moduleMode === 'shopee8s' ? 'Clean, bright, commercial background or lifestyle setting suitable for fashion/tech review' : keyword} (Realistic environment, blurred background, depth of field, cinematic lighting).
  
  ${userOverride}
  
  Action/Mood (Default): ${moodDescription}. ${moduleMode !== 'shopee8s' ? `Matches the script context: "${scriptPart}".` : ''}
  Product Interaction: ${productInstruction}
  Style: Cinematic, Photorealistic, 8k, Shot on Sony Alpha / Canon, Highly Detailed, Realistic Lighting, Professional Photography.
  
  CRITICAL VISUAL RULES (STRICT NO-TEXT POLICY):
  1. ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO CHARACTERS.
  2. The background must be CLEAN and FREE of signage, posters, labels, or written words.
  3. Do NOT visualize the specific words "${keyword}" as text. Only visualize the physical environment.
  4. If the context implies a screen or sign, leave it BLANK or Abstract.
  5. NO UI elements, NO speech bubbles, NO watermarks, NO subtitles.
  6. The image must be purely visual storytelling.
  ${moduleMode === 'review1k' || moduleMode === 'shopee8s' ? `
  7. ABSOLUTELY NO ICONS, NO GRAPHICS, NO EMOJIS, NO VISUAL EFFECTS, NO OVERLAYS.
  8. Do NOT simulate TikTok UI or video editing effects. It must look like a RAW PHOTO.
  ` : ''}
  
  CRITICAL RESTRICTIONS & RULES: 
  1. NO CHILDREN, NO KIDS, NO BABIES. The subject must be an adult.
  2. NO CARTOON, NO 3D RENDER, NO ILLUSTRATION. Must look like a real photo.
  ${isKocV1 ? '3. ABSOLUTELY NO PRODUCT/DEVICE IN THIS IMAGE.' : `
  3. STRICT PRODUCT FIDELITY (MANDATORY - TUYỆT ĐỐI):
     - The product MUST MATCH the input reference image 1:1.
     - PRESERVE PATTERNS & TEXTURES: Any pattern (họa tiết), logo, or design on the product surface must be preserved.
     - PRESERVE DIMENSIONS: Do not resize or distort the product logic.
     - DO NOT ADD NEW DETAILS: Do not hallucinate or invent new buttons, lights, or features.
     - DO NOT change shape, proportions, or physical parts.
     - The product must not be transformed or animated; treat it as a solid, fixed object.
     - LOCK the product appearance exactly to the original photo provided.
     - Bắt buộc giữ nguyên sản phẩm. Vật thể phải khớp với ảnh gốc 1:1. Không thêm chi tiết lạ.
  `}
  `;

  const parts: any[] = [{ text: prompt }];

  if (faceImagePart) {
    parts.push({ inlineData: { mimeType: faceImagePart.mimeType, data: faceImagePart.data } });
  }
  
  if (!isKocV1 && referenceImageParts.length > 0) {
    const randomIndex = Math.floor(Math.random() * referenceImageParts.length);
    const selectedPart = referenceImageParts[randomIndex];
    parts.push({ inlineData: { mimeType: selectedPart.mimeType, data: selectedPart.data } });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("No image part found in response", response);
    throw new Error("No image generated. The prompt might have been blocked.");
  } catch (error) {
    console.error(`Image generation error for ${partKey}:`, error);
    throw error;
  }
};

// Task 3: Generate Video Prompt (VEO-3 Style)
export const generateVeoPrompt = async (
  referenceImageParts: GenerativePart[],
  productName: string,
  keyword: string,
  scriptText: string,
  partKey: ScriptPartKey,
  productSize: string,
  scriptTone: string,
  characterDescription: string, // New argument
  moduleMode: 'koc' | 'review1k' | 'shopee8s' | 'coverlink' | 'carousel' | 'videopov' = 'koc' // Updated parameter
): Promise<string> => {
  if (moduleMode === 'coverlink' || moduleMode === 'carousel' || moduleMode === 'videopov') return "";
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash";
  
  const isKocV1 = moduleMode === 'koc' && partKey === 'v1';
  const sizeContext = productSize ? `(Lưu ý kích thước sản phẩm: ${productSize})` : "";
  const toneContext = scriptTone ? scriptTone : "giọng nữ, Chuẩn giọng Hà Nội (Miền Bắc Việt Nam), nhanh, kịch tính, hào hứng, tạo cảm giác FOMO";

  let prompt = "";

  if (moduleMode === 'shopee8s') {
      // Shopee 8s Mode - Specific Structure
      // Prompt updated to reflect that scriptText is now a full script, not just a snippet
      prompt = `
      Phân tích hình ảnh được cung cấp (sản phẩm "${productName}").
      Viết lời nhắc tạo video cho một video ngắn 8 giây (Kiểu video Shopee).

      Cấu trúc:
      Đoạn 1: Nhân vật & bối cảnh. 
      Mô tả nhân vật chính (Người Việt Nam), trang phục, ngoại hình và không gian xung quanh. 
      (Lưu ý: Giới tính và ngoại hình phải khớp với ảnh).

      Đoạn 2: Hành động & tương tác với sản phẩm. 
      Nhân vật đứng im hoặc tiến nhẹ lên phía trước.
      Mô tả nhân vật cầm sản phẩm "${productName}".
      QUAN TRỌNG: Nhân vật chỉ tương tác giới thiệu với sản phẩm gốc ban đầu (tĩnh).
      TUYỆT ĐỐI KHÔNG: mở hộp, không sử dụng, không demo tính năng, không làm biến đổi sản phẩm.
      Mục đích: Giữ nhất quán 1:1 với hình ảnh sản phẩm ban đầu trong ảnh tham chiếu.
      Giữ nguyên và đồng nhất nhân vật như hình ảnh tham chiếu xuyên suốt video.

      Đoạn 3: Góc quay & chuyển động máy. 
      Camera di chuyển theo nhân vật. Có zoom in/out vào sản phẩm/nhân vật 1 cách phù hợp
      Đoạn 4: Hậu cảnh & đạo cụ. 
      Mô tả chi tiết không gian background.

      Đoạn 5: Lời thoại (QUAN TRỌNG NHẤT).
      Bạn phải sử dụng CHÍNH XÁC nội dung sau làm lời thoại cho nhân vật:
      ✨ "${scriptTone}": "${scriptText}

      Đoạn 6: Thông số kỹ thuật.
      Tỉ lệ 9:16, độ phân giải 4K, phong cách chân thực, ánh sáng điện ảnh.
      
      OUTPUT: Return ONLY the prompt text in Vietnamese.
      `;
  } else {
      // Logic for KOC & Review1K (Module 1 & 2)
      
      const isKocModule = moduleMode === 'koc';

      // --- KOC Specific Language Blocks (100% Vietnamese + Hanoi Tone) ---
      const kocVoiceSpec = `
      YÊU CẦU GIỌNG ĐỌC (Voice Specification) - BẮT BUỘC:
      "Giọng đọc: Nữ, giọng Hà Nội (Chuẩn miền Bắc Việt Nam). 
      Phong cách: Như Livestream bán hàng, kịch tính, dồn dập, tạo cảm giác FOMO (sợ bỏ lỡ).
      Tuyệt đối không đổi giọng, giữ cảm xúc xuyên suốt.
      LỜI THOẠI PHẢI LÀ TIẾNG VIỆT 100%."
      `;

      const kocConsistencyRule = `
      YÊU CẦU BẮT BUỘC VỀ SẢN PHẨM (MANDATORY):
      Hãy thêm đoạn văn bản sau vào cuối prompt được tạo ra:
      "Luôn giữ nguyên sản phẩm đúng như trong ảnh gốc. Không thay đổi hình dạng, kích thước, tỉ lệ, kết cấu, chất liệu, HỌA TIẾT (PATTERNS) hay bất kỳ chi tiết nào của sản phẩm. Không được thêm hoặc bớt bộ phận. Không tự phát sinh chi tiết mới. Sản phẩm phải giống y hệt ảnh gốc trong mọi khung hình. Không được méo, biến dạng hay thêm bớt chi tiết do AI tự bịa. Sản phẩm luôn cố định và không được phép chuyển động; chỉ camera và nhân vật được phép di chuyển. Tuyệt đối không thay đổi thiết kế vật lý của sản phẩm trong bất kỳ trường hợp nào."
      `;

      const kocV1Rule = "Lưu ý: Cảnh này (V1) không có sản phẩm. Tuyệt đối không hallucinate (tự bịa) sản phẩm vào cảnh. Chỉ tập trung vào nhân vật và bối cảnh.";

      const standardVoiceSpec = `
      YÊU CẦU GIỌNG ĐỌC:
      "Voice: Northern Vietnamese voice (Female). Tone/Style: Fast-paced, Dramatic, FOMO.
      Do not change pitch, speed, brightness, or emotional intensity between scenes.
      Do not switch to any other accent or vocal style.
      Maintain this exact voice consistently throughout the entire video with zero variation."
      `;
      
      const voiceSpec = isKocModule ? kocVoiceSpec : standardVoiceSpec;
      // Determine Consistency Rule
      let consistencyRule = "";
      if (isKocModule) {
          consistencyRule = isKocV1 ? kocV1Rule : kocConsistencyRule;
      }

      prompt = `
      Hãy đóng vai trò là chuyên gia viết Prompt cho mô hình tạo video Google VEO-3.
      Dựa trên hình ảnh sản phẩm "${productName}" và từ khóa "${keyword}".
      
      Nhiệm vụ: Viết một prompt chi tiết bằng TIẾNG VIỆT (100%) để tạo video.

      Cấu trúc bắt buộc (Tuân thủ chính xác từng đoạn):

      Đoạn 1: Nhân vật & bối cảnh. 
      Mô tả nhân vật chính (Người Việt Nam), trang phục, ngoại hình và không gian xung quanh. 
      (Lưu ý: Giới tính và ngoại hình phải khớp với ảnh đầu vào). ${characterDescription ? `Chi tiết thêm: "${characterDescription}"` : ''}

      ${!isKocV1 ? `
      Đoạn 2: Hành động & tương tác.
      Mô tả nhân vật tương tác với sản phẩm "${productName}" ${sizeContext}.
      Giữ nguyên và đồng nhất nhân vật như hình ảnh tham chiếu xuyên suốt video.
      Không sử dụng sản phẩm, không demo, không mở hộp. chỉ cầm, giở lên hoặc chỉ vào sản phẩm.
      Yêu cầu: Giữ nguyên thiết kế sản phẩm 1:1 so với hình ảnh tham chiếu (bao gồm cả họa tiết, kích thước). Không được biến dạng, không được thêm các chi tiết khác.
      ` : `(Đoạn 2: Bỏ qua vì không có sản phẩm trong cảnh này)`}

      Đoạn 3: Góc quay & chuyển động máy. Tự sáng tạo các chuyển động máy quay, góc quay, kiểu shot.
      Chuyển động phải tự nhiên, không thêm các hiệu ứng chuyển cảnh nhiễu loạn khác, chỉ zoom in hoặc out vào mặt hoặc sản phẩm, không lớp phủ, không icon, không effect.
      Luôn giữ nguyên sản phẩm đúng như trong ảnh sản phẩm mà nhân vật đang cầm 
      Không thay đổi hình dạng, kích thước, tỉ lệ, kết cấu, chất liệu hay bất kỳ chi tiết nào của sản phẩm. 
      Không được thêm hoặc bớt bộ phận. 
      Không tự phát sinh chi tiết mới. 
      Sản phẩm phải giống y hệt ảnh gốc trong mọi khung hình. 
      Không được méo, biến dạng hay thêm bớt chi tiết do AI tự bịa. 
      Sản phẩm luôn cố định và không được phép chuyển động; chỉ camera và nhân vật được phép di chuyển. 
      Tuyệt đối không thay đổi thiết kế vật lý của sản phẩm trong bất kỳ trường hợp nào.

      Đoạn 4: Hậu cảnh & đạo cụ. 
      Mô tả chi tiết không gian background. ${isKocV1 ? 'BẮT BUỘC hướng dẫn người xem bấm vào giỏ hàng góc trái màn hình.' : ''}

      Đoạn 5: Lời thoại (QUAN TRỌNG NHẤT).
      Bạn phải sử dụng CHÍNH XÁC nội dung sau làm lời thoại cho nhân vật:
      "${scriptText}"

      Hãy định dạng dòng lệnh lời thoại như sau:
      ✨ Model speaks in Vietnamese (): '${scriptText}'

      ${voiceSpec}

      Đoạn 6: Thông số kỹ thuật.
      "Tỉ lệ 9:16, độ phân giải 4K, phong cách chân thực, ánh sáng điện ảnh."

      ${consistencyRule}

      YÊU CẦU OUTPUT:
      - Trả về kết quả dưới dạng JSON.
      - Key duy nhất là "prompt".
      - Nội dung value là toàn bộ prompt chi tiết bằng tiếng Việt đã viết ở trên.
      `;
  }

  const parts: any[] = [{ text: prompt }];
  referenceImageParts.forEach(part => {
    parts.push({ inlineData: { mimeType: part.mimeType, data: part.data } });
  });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        responseMimeType: moduleMode === 'koc' ? "application/json" : "text/plain", // JSON for KOC mode
        responseSchema: moduleMode === 'koc' ? {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING }
            }
        } : undefined
      }
    });

    if (moduleMode === 'koc' && response.text) {
         try {
             const json = JSON.parse(response.text);
             return json.prompt; 
         } catch (e) {
             return response.text;
         }
    }

    return response.text || "Failed to generate prompt.";
  } catch (error) {
    console.error("Video prompt generation error:", error);
    return "Error generating video prompt.";
  }
};

export const translateText = async (text: string): Promise<string> => {
    return text;
};

export const generateCarouselScript = async (
  topic: string,
  imageCount: number,
  notes: string,
  productName: string, // Context helper
  category: string, // New: Tên gọi
  subCategory: string // New: Nội dung
): Promise<string[]> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash";

  const prompt = `
  Role: TikTok Carousel Content Strategist.
  Task: Create a ${imageCount}-slide narrative script for a TikTok Image Carousel (Ảnh cuộn).
  Context/Product: ${productName}
  
  CONTENT STRATEGY FRAMEWORK:
  Category (Tên gọi): "${category}"
  Specific Angle/Type (Nội dung): "${subCategory}"
  Core Topic/Idea: "${topic}"
  Additional Notes: "${notes}"

  CONTENT STRATEGY & EMOTIONAL GUIDELINES:
  1. EMOTION & SPIRIT: The content must evoke emotion (e.g., confidence, relief, joy of small wins).
  2. INSIGHT: Address specific customer fears, anxieties, or hidden pain points related to the Category "${category}".
  3. VULNERABILITY: Show weakness or genuine struggle to create empathy. "Reveal your flaws to attract those with similar energy."
  4. DAILY CONTENT STYLE: Casual, relatable, like a "daily journal" or "challenge".
  5. OPINIONATED: Establish a clear personal stance/brand voice.
  6. STORYTELLING: Use personal success, failure (for empathy), or lessons learned.
  7. AUTHENTICITY: Use Vietnamese language naturally.

  REQUIREMENTS (CRITICAL):
  1. LENGTH: Each slide's text MUST have a random length between 100 and 250 characters. Approximately 1-3 short sentences.
  2. STYLE: Engaging, viral, emotional. YOU MUST USE exclamation marks (!), questions (?), and relevant Emojis (👍, 🔥, 😭, etc.) to increase engagement.
  3. LANGUAGE: Natural Vietnamese (Tiếng Việt tự nhiên), trendy, catchy.
  4. CONSISTENCY: The story must flow logically from slide 1 to slide ${imageCount}.

  STRUCTURE:
  - Slide 1: Hook / Problem / Statement of vulnerability (Related to "${subCategory}").
  - Middle Slides: Story development / Insight / Solution (Product integration if relevant).
  - Last Slide: Conclusion / Call to Action / Strong emotional takeaway.

  OUTPUT FORMAT:
  Return strictly a JSON array of strings. Each string corresponds to the text overlay for one slide.
  Example: ["Text for slide 1...", "Text for slide 2...", ...]
  Total items must be exactly ${imageCount}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    throw new Error("No script generated");
  } catch (error) {
    console.error("Carousel script error:", error);
    throw error;
  }
};

const applyTextOverlay = async (
    imageUrl: string, 
    text: string, 
    position: 'top' | 'bottom' | 'split',
    font: string = 'Montserrat'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(imageUrl); return; }

            ctx.drawImage(img, 0, 0);

            const fontSize = Math.floor(img.width * 0.038); 
            // Map common names to font-family strings
            let fontFamily = 'Montserrat, sans-serif';
            if (font === 'Merriweather') fontFamily = 'Merriweather, serif';
            else if (font === 'Oswald') fontFamily = 'Oswald, sans-serif';
            else if (font === 'Anton') fontFamily = 'Anton, sans-serif';
            else if (font === 'Dancing Script') fontFamily = '"Dancing Script", cursive';
            else if (font === 'Patrick Hand') fontFamily = '"Patrick Hand", cursive';
            
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = img.width * 0.9;
            const lineHeight = fontSize * 1.4;
            const words = text.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const width = ctx.measureText(currentLine + " " + words[i]).width;
                if (width < maxWidth) {
                    currentLine += " " + words[i];
                } else {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
            }
            lines.push(currentLine);

            const padding = fontSize;
            
            const drawLines = (linesToDraw: string[], startY: number) => {
                 ctx.fillStyle = 'white';
                 ctx.shadowColor = "black";
                 ctx.shadowBlur = 4;
                 ctx.lineWidth = 3;
                 ctx.strokeStyle = 'black';
                 ctx.lineJoin = 'round';
                 
                 let y = startY;
                 const x = img.width / 2;
                 
                 linesToDraw.forEach(line => {
                    ctx.strokeText(line, x, y);
                    ctx.fillText(line, x, y);
                    y += lineHeight;
                 });
            };

            if (position === 'top') {
                 const textHeight = lines.length * lineHeight;
                 const bgHeight = textHeight + (padding * 2) + 50;
                 const gradient = ctx.createLinearGradient(0, 0, 0, bgHeight);
                 gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
                 gradient.addColorStop(0.6, 'rgba(0,0,0,0.5)');
                 gradient.addColorStop(1, 'rgba(0,0,0,0)');
                 ctx.fillStyle = gradient;
                 ctx.fillRect(0, 0, img.width, bgHeight);
                 
                 drawLines(lines, padding + (lineHeight/2));
            } else if (position === 'bottom') {
                 const textHeight = lines.length * lineHeight;
                 const startY = img.height - textHeight - (padding * 2);
                 const bgHeight = img.height - startY + 50;
                 
                 const gradient = ctx.createLinearGradient(0, img.height, 0, startY - 50);
                 gradient.addColorStop(0, 'rgba(0,0,0,0.9)');
                 gradient.addColorStop(0.6, 'rgba(0,0,0,0.5)');
                 gradient.addColorStop(1, 'rgba(0,0,0,0)');
                 ctx.fillStyle = gradient;
                 ctx.fillRect(0, startY - 50, img.width, bgHeight + 50);
                 
                 drawLines(lines, startY + padding + (lineHeight/2));
            } else { 
                 const mid = Math.ceil(lines.length / 2);
                 const topLines = lines.slice(0, mid);
                 const bottomLines = lines.slice(mid);
                 
                 if (topLines.length > 0) {
                     const h = topLines.length * lineHeight;
                     const bgH = h + (padding * 2) + 40;
                     const g = ctx.createLinearGradient(0, 0, 0, bgH);
                     g.addColorStop(0, 'rgba(0,0,0,0.85)');
                     g.addColorStop(1, 'rgba(0,0,0,0)');
                     ctx.fillStyle = g;
                     ctx.fillRect(0, 0, img.width, bgH);
                     drawLines(topLines, padding + (lineHeight/2));
                 }
                 
                 if (bottomLines.length > 0) {
                     const h = bottomLines.length * lineHeight;
                     const startY = img.height - h - (padding * 2);
                     const g = ctx.createLinearGradient(0, img.height, 0, startY - 40);
                     g.addColorStop(0, 'rgba(0,0,0,0.85)');
                     g.addColorStop(1, 'rgba(0,0,0,0)');
                     ctx.fillStyle = g;
                     ctx.fillRect(0, startY - 40, img.width, img.height - (startY - 40));
                     drawLines(bottomLines, startY + padding + (lineHeight/2));
                 }
            }

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (e) => {
            resolve(imageUrl); 
        };
        img.src = imageUrl;
    });
};

export const generateCarouselImage = async (
  productImages: GenerativePart[],
  faceImage: GenerativePart | null,
  textContent: string,
  notes: string,
  customNote: string,
  font: string,
  textPosition: 'top' | 'bottom' | 'split'
): Promise<string> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash-image";

  let compositionRule = "";
  if (textPosition === 'top') {
      compositionRule = "1. NEGATIVE SPACE: You MUST leave clear negative space at the TOP of the image (e.g. sky, ceiling, plain wall) for text overlay. Main subjects should be in the center or lower half.";
  } else if (textPosition === 'bottom') {
      compositionRule = "1. NEGATIVE SPACE: You MUST leave clear negative space at the BOTTOM of the image (e.g. floor, table surface, blurred foreground) for text overlay. Main subjects should be in the upper/center half.";
  } else {
      compositionRule = "1. NEGATIVE SPACE: You MUST leave clear negative space at BOTH the TOP AND BOTTOM of the image. The main subject should be centered vertically to allow text above and below.";
  }

  let prompt = `
  Generate a Photorealistic image (Aspect Ratio 3:4).
  
  CONTEXT:
  This is a slide for a TikTok Carousel storytelling post.
  Visual Context implied by this text: "${textContent}"
  Overall Vibe/Notes: "${notes}"
  
  SUBJECT:
  ${faceImage ? "Use the provided face reference for the main character. Match gender, age, features." : "A relatable Vietnamese content creator (Male or Female)."}
  Expression/Action: The character should exhibit an expression that matches the EMOTION of the context text.
  
  PRODUCT:
  ${productImages.length > 0 ? "The character is holding or interacting with the product naturally." : "Lifestyle shot relevant to the topic."}

  COMPOSITION & LAYOUT (CRITICAL):
  ${compositionRule}
  2. TEXT RULE: ABSOLUTELY NO TEXT. DO NOT generate any letters, numbers, watermarks, or text bubbles. The image must be clean.
  3. DO NOT overlap the product or the character's face with the designated negative space areas.
  
  ${customNote ? `USER CUSTOMIZATION REQUEST: "${customNote}". Prioritize this.` : ""}
  
  VISUAL STYLE:
  Photorealistic, 4k, social media aesthetic, bright, engaging.
  `;

  const parts: any[] = [{ text: prompt }];
  if (faceImage) parts.push({ inlineData: { mimeType: faceImage.mimeType, data: faceImage.data } });
  
  if (productImages.length > 0) {
    const randomProd = productImages[Math.floor(Math.random() * productImages.length)];
    parts.push({ inlineData: { mimeType: randomProd.mimeType, data: randomProd.data } });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: "3:4" }
      }
    });

    let rawImageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        rawImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!rawImageUrl) throw new Error("No image generated.");
    return await applyTextOverlay(rawImageUrl, textContent, textPosition, font);

  } catch (error) {
    console.error("Carousel image error:", error);
    throw error;
  }
};

// ================= MODULE 8: VIDEO POV FUNCTIONS =================

// 1. Analyze Video
export const analyzeVideoContent = async (videoFile: File): Promise<string> => {
    const ai = getAiClient();
    const modelId = "gemini-2.5-flash";
    const prompt = `
    Analyze this video in extreme detail.
    
    TASK: Provide a comprehensive breakdown of:
    1. Dialogue & Script: What is being said? What is the core message?
    2. Context/Setting: Where is it happening? What is the atmosphere?
    3. Characters: Who are they? Appearance, age, vibe, role.
    4. Key Events: Detailed sequence of what happens.

    Output Language: Vietnamese.
    `;
    
    try {
        const videoPart = await fileToGenerativePart(videoFile);
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: videoPart.mimeType, data: videoPart.data } }
                ]
            }
        });
        return response.text || "Failed to analyze video.";
    } catch (error) {
        console.error("Video analysis error:", error);
        throw error;
    }
};

// 2. Generate POV Script Segments
export const generatePovScriptSegments = async (analysis: string, style: string, segmentCount: number): Promise<PovScriptSegment[]> => {
    const ai = getAiClient();
    const modelId = "gemini-2.5-flash";
    const prompt = `
    Based on the following video analysis:
    "${analysis}"

    TASK:
    1. Rewrite the script in a NEW STYLE: "${style}" (Options: 'Tâm sự trải lòng', 'Vui vẻ hài hước', 'Kịch tính & cảm xúc').
    2. IMPORTANT: Use "Northern Vietnamese" (Hanoi) accent/vocabulary (e.g., use 'nhé', 'đấy', 'cơ', 'phết', 'thế này', avoid Southern dialects).
    3. Divide the new script into EXACTLY ${segmentCount} segments. Each segment MUST be between 150 and 190 characters.
    
    OUTPUT FORMAT:
    Return a JSON ARRAY of strings. Each string is one segment of the script.
    Example: ["Segment 1 text...", "Segment 2 text...", ...]
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        if (response.text) {
            const strings = JSON.parse(response.text) as string[];
            return strings.map((text, index) => ({
                id: index + 1,
                content: text,
                image: { url: '', loading: false, customPrompt: '' },
                videoPrompt: { text: '', loading: false, visible: false }
            }));
        }
        throw new Error("No script generated");
    } catch (error) {
        console.error("POV script gen error:", error);
        throw error;
    }
};

// 3. Generate POV Image (Strict No Text)
export const generatePovImage = async (
    scriptSegment: string,
    faceImagePart: GenerativePart | null,
    customPrompt?: string
): Promise<string> => {
    const ai = getAiClient();
    // Use gemini-2.5-flash-image to avoid permission denied errors
    const modelId = "gemini-2.5-flash-image";
    
    const subjectInstruction = faceImagePart 
        ? "Use the provided FACE REFERENCE. The character MUST look exactly like the person in the reference photo." 
        : "A Vietnamese character fitting the context.";

    const prompt = `
    Generate a Photorealistic Image (Aspect Ratio 9:16).
    
    CONTEXT (Script): "${scriptSegment}"
    
    SUBJECT:
    ${subjectInstruction}
    Expression: Matches the script's emotion naturally.
    
    STYLE:
    - POV (Point of View) or Cinematic shot suitable for TikTok.
    - Realism: High quality, photorealistic, 4K.
    
    CRITICAL RESTRICTIONS (STRICT):
    1. ABSOLUTELY NO TEXT. No subtitles, no signs, no letters, no watermarks.
    2. NO OVERLAYS or UI elements.
    3. NO SPECIAL EFFECTS (glitches, sparkles, etc.).
    
    ${customPrompt ? `USER CUSTOMIZATION: ${customPrompt}` : ''}
    `;

    const parts: any[] = [{ text: prompt }];
    if (faceImagePart) {
        parts.push({ inlineData: { mimeType: faceImagePart.mimeType, data: faceImagePart.data } });
    }

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts },
            config: {
                 imageConfig: { aspectRatio: "9:16" },
                 safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                ]
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated.");
    } catch (error) {
        console.error("POV image gen error:", error);
        throw error;
    }
};

// 4. Generate POV VEO Prompt (Strict Structure)
export const generatePovVeoPrompt = async (
    imageBase64: string,
    scriptSegment: string
): Promise<string> => {
    const ai = getAiClient();
    const modelId = "gemini-2.5-flash";
    
    const prompt = `
    Analyze this image and the provided script segment.
    Script: "${scriptSegment}"

    TASK: Write a VEO-3 Video Generation Prompt in Vietnamese following EXACTLY this structure:

    Đoạn 1: Nhân vật & bối cảnh. 
    Mô tả nhân vật chính (Người Việt Nam), trang phục, ngoại hình và không gian xung quanh. 
    (Lưu ý: Giới tính và ngoại hình phải khớp với ảnh).

    Đoạn 2: Hành động & tương tác.
    Mô tả nhân vật và bối cảnh (không xuất hiện hoặc tự ý thêm vào các sản phẩm).
    Giữ nguyên và đồng nhất nhân vật như hình ảnh tham chiếu xuyên suốt video.

    Đoạn 3: Góc quay & chuyển động máy. 
    Tự sáng tạo các chuyển động máy theo dạng POV (Point of View).

    Đoạn 4: Hậu cảnh & đạo cụ. 
    Mô tả chi tiết không gian background.

    Đoạn 5: Lời thoại (QUAN TRỌNG NHẤT).
    Bạn phải sử dụng CHÍNH XÁC nội dung sau làm lời thoại cho nhân vật:
    ✨ Model speaks in Northern Vietnamese voice (Female): "${scriptSegment}"

    Đoạn 6: Thông số kỹ thuật.
    Tỉ lệ 9:16, độ phân giải 4K, phong cách chân thực, ánh sáng điện ảnh.
    
    OUTPUT: Return ONLY the prompt text in Vietnamese.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/png', data: imageBase64.split(',')[1] } }
                ]
            }
        });
        return response.text || "Failed to generate video prompt.";
    } catch (error) {
        console.error("POV Veo prompt error:", error);
        return "Error generating prompt.";
    }
};