import { GoogleGenAI, Type } from "@google/genai";
import { Category } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDossierStructure = async (): Promise<Category[]> => {
  try {
    const ai = getAiClient();
    
    // We want a standard structure for a General Clinic (Phòng khám đa khoa) in Vietnam
    const prompt = `
      Hãy đóng vai trò là một chuyên gia tư vấn pháp lý y tế tại Việt Nam.
      Tạo một cấu trúc hồ sơ thẩm định cấp giấy phép hoạt động cho Phòng khám đa khoa (Clinic).
      Kết quả trả về phải là một danh sách các Danh mục chính (Category) và các Mục con (Item) cần kiểm tra.
      
      Ví dụ các danh mục: 
      1. Hồ sơ pháp lý (Giấy ĐKKD, Chứng chỉ hành nghề...)
      2. Cơ sở vật chất (Sơ đồ phòng, xử lý rác thải...)
      3. Nhân sự (Danh sách nhân sự, Hợp đồng lao động...)
      4. Trang thiết bị y tế (Danh mục thiết bị, hợp đồng bảo trì...)
      
      Hãy tạo khoảng 4-5 danh mục chính, mỗi danh mục có 3-4 mục con cụ thể.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                   type: Type.OBJECT,
                   properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ["pending"] },
                      notes: { type: Type.STRING },
                   },
                   required: ["id", "title", "description", "status"]
                }
              }
            },
            required: ["id", "title", "items"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as Category[];
      // Post-process to ensure IDs are unique enough for our simple app if AI duplicates them
      return data.map((cat, idx) => ({
        ...cat,
        id: `cat-${Date.now()}-${idx}`,
        items: cat.items.map((item, iIdx) => ({
            ...item,
            id: `item-${Date.now()}-${idx}-${iIdx}`,
            status: 'pending',
            notes: item.notes || ''
        }))
      }));
    }
    return [];

  } catch (error) {
    console.error("Error generating dossier:", error);
    throw error;
  }
};

export const suggestItemImprovement = async (itemTitle: string, currentNotes: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
            Tôi đang chuẩn bị hồ sơ cho mục: "${itemTitle}" để thẩm định phòng khám đa khoa.
            Hiện tại ghi chú của tôi là: "${currentNotes}".
            Hãy gợi ý ngắn gọn những giấy tờ hoặc tiêu chuẩn cụ thể cần lưu ý cho mục này theo quy định của Bộ Y tế Việt Nam.
            Trả lời ngắn gọn dưới 100 từ.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        
        return response.text || "Không thể tạo gợi ý lúc này.";
    } catch (error) {
        console.error("Error suggesting improvement:", error);
        return "Lỗi khi kết nối với AI.";
    }
}
