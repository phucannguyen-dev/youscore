import { GoogleGenAI, Type } from "@google/genai";
import { ScoreEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseScoreFromText = async (
  text: string, 
  defaultMaxScore: number, 
  availableExamTypes: string[],
  customSubjects: string[] = []
): Promise<Omit<ScoreEntry, 'id' | 'timestamp' | 'originalText'> | null> => {
  try {
    // Ensure we have at least 'Other' if the list is somehow empty
    const examTypes = availableExamTypes.length > 0 ? availableExamTypes : ['Other'];

    // Build subject instruction
    let subjectInstruction = 'Tự động chuẩn hóa tên môn học';
    if (customSubjects.length > 0) {
      subjectInstruction = `Tên môn học phải khớp CHÍNH XÁC với một trong các môn sau: ${customSubjects.join(', ')}.
      Chuẩn hóa từ viết tắt hoặc tên không chính thức (ví dụ: "lý" -> "Vật lý", "anh" -> "Tiếng Anh", "văn" -> "Ngữ văn", "toán" -> "Toán").
      Nếu không chắc chắn, chọn môn gần nhất trong danh sách.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Trích xuất thông tin điểm học tập từ văn bản này: "${text}".
      Nếu không có thông tin điểm số, suy đoán ${defaultMaxScore} trừ khi ngữ cảnh rõ ràng chỉ ra khác.
      ${subjectInstruction}
      
      Phân loại loại bài kiểm tra vào đúng một trong các loại sau: ${examTypes.join(', ')}.
      Chọn loại phù hợp nhất với ngữ cảnh. Nếu không chắc chắn, sử dụng "Khác".
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: "Tên môn học",
            },
            examType: {
              type: Type.STRING,
              description: "Loại bài kiểm tra",
              enum: examTypes
            },
            score: {
              type: Type.NUMBER,
              description: "Điểm số đạt được",
            },
            maxScore: {
              type: Type.NUMBER,
              description: "Điểm số tối đa",
            },
          },
          required: ["subject", "examType", "score", "maxScore"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data as Omit<ScoreEntry, 'id' | 'timestamp' | 'originalText'>;
    }
    return null;
  } catch (error) {
    console.error("Error parsing score with Gemini:", error);
    throw new Error("Failed to interpret the score. Please try again with a clearer sentence.");
  }
};

// New function to parse multiple scores from a single input
export const parseBulkScoresFromText = async (
  text: string, 
  defaultMaxScore: number, 
  availableExamTypes: string[],
  customSubjects: string[] = []
): Promise<Omit<ScoreEntry, 'id' | 'timestamp' | 'originalText'>[]> => {
  try {
    // Ensure we have at least 'Other' if the list is somehow empty
    const examTypes = availableExamTypes.length > 0 ? availableExamTypes : ['Other'];

    // Build subject instruction
    let subjectInstruction = 'Tự động chuẩn hóa tên môn học';
    if (customSubjects.length > 0) {
      subjectInstruction = `Tên môn học phải khớp CHÍNH XÁC với một trong các môn sau: ${customSubjects.join(', ')}.
      Chuẩn hóa từ viết tắt hoặc tên không chính thức (ví dụ: "lý" -> "Vật lý", "anh" -> "Tiếng Anh", "văn" -> "Ngữ văn", "toán" -> "Toán").
      Nếu không chắc chắn, chọn môn gần nhất trong danh sách.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Trích xuất TẤT CẢ thông tin điểm học tập từ văn bản này: "${text}".
      Văn bản này có thể chứa NHIỀU môn học và điểm số khác nhau.
      
      Ví dụ: "Have physics 10 and math 8 in mid-semester" nên trích xuất thành:
      - Physics: điểm 10, loại bài kiểm tra "Giữa học kỳ"
      - Math: điểm 8, loại bài kiểm tra "Giữa học kỳ"
      
      Với mỗi môn học được đề cập:
      1. ${subjectInstruction}
      2. Nếu không có thông tin điểm số tối đa, suy đoán ${defaultMaxScore} trừ khi ngữ cảnh rõ ràng chỉ ra khác.
      3. Phân loại loại bài kiểm tra vào đúng một trong các loại sau: ${examTypes.join(', ')}. Chọn loại phù hợp nhất với ngữ cảnh. Nếu không chắc chắn, sử dụng "Khác".
      4. Nếu có nhiều môn học dùng chung một loại bài kiểm tra, áp dụng cùng loại cho tất cả.
      
      Trả về một MẢNG các điểm số, mỗi phần tử là một môn học riêng biệt.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: "Tên môn học",
              },
              examType: {
                type: Type.STRING,
                description: "Loại bài kiểm tra",
                enum: examTypes
              },
              score: {
                type: Type.NUMBER,
                description: "Điểm số đạt được",
              },
              maxScore: {
                type: Type.NUMBER,
                description: "Điểm số tối đa",
              },
            },
            required: ["subject", "examType", "score", "maxScore"],
          }
        },
      },
    });

    if (response.text) {
      try {
        const data = JSON.parse(response.text);
        return data as Omit<ScoreEntry, 'id' | 'timestamp' | 'originalText'>[];
      } catch (parseError) {
        console.error("Error parsing JSON response from Gemini:", parseError);
        console.error("Response text:", response.text);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error parsing bulk scores with Gemini:", error);
    throw new Error("Failed to interpret the scores. Please try again with a clearer sentence.");
  }
};

export const parseScoresFromImage = async (
  base64Data: string,
  mimeType: string,
  defaultMaxScore: number,
  availableExamTypes: string[],
  customSubjects: string[] = []
): Promise<Omit<ScoreEntry, 'id' | 'timestamp' | 'originalText'>[]> => {
  try {
    const examTypes = availableExamTypes.length > 0 ? availableExamTypes : ['Other'];

    // Build subject instruction
    let subjectInstruction = 'chuẩn hóa tên môn học (ví dụ, "lý" -> "Vật lý")';
    if (customSubjects.length > 0) {
      subjectInstruction = `tên môn học phải khớp CHÍNH XÁC với một trong: ${customSubjects.join(', ')}. Chuẩn hóa từ viết tắt (ví dụ: "lý" -> "Vật lý", "anh" -> "Tiếng Anh")`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Phân tích ảnh này chứa thông tin điểm số. Trích xuất tất cả các thông tin điểm số khác biệt.
            Đối với mỗi thông tin:
            1. Xác định tên môn học (${subjectInstruction}).
            2. Xác định điểm số và điểm số tối đa. Nếu điểm số tối đa không rõ ràng, suy đoán ${defaultMaxScore} hoặc dựa trên ngữ cảnh (ví dụ, 10/10, 100/100).
            3. Phân loại loại bài kiểm tra vào đúng một trong các loại sau: ${examTypes.join(', ')}. Sử dụng "Khác" nếu không chắc chắn.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              examType: { type: Type.STRING, enum: examTypes },
              score: { type: Type.NUMBER },
              maxScore: { type: Type.NUMBER }
            },
            required: ["subject", "examType", "score", "maxScore"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error parsing image scores:", error);
    throw new Error("Failed to analyze the image. Please ensure it contains legible academic scores.");
  }
};
