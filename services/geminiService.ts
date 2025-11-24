import { GoogleGenAI, Type } from "@google/genai";
import { ScoreEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for input validation
const MIN_INPUT_LENGTH = 3;
const NON_SCORE_PHRASES = [
  'hello', 'hi', 'hey', 'test', 
  'xin chào', 'chào', 'chao'
];

// Validate if input text looks like it might contain score information
const validateScoreInput = (text: string): { isValid: boolean; error?: string } => {
  const trimmedText = text.trim();
  
  // Check if input is too short
  if (trimmedText.length < MIN_INPUT_LENGTH) {
    return {
      isValid: false,
      error: "Văn bản quá ngắn. Vui lòng nhập thông tin điểm số đầy đủ hơn."
    };
  }
  
  // Check if input contains at least one number (potential score)
  const hasNumber = /\d/.test(trimmedText);
  if (!hasNumber) {
    return {
      isValid: false,
      error: "Không tìm thấy điểm số trong văn bản. Vui lòng nhập điểm số (ví dụ: 'Toán 9 điểm' hoặc 'Got 8.5 in Physics')."
    };
  }
  
  // Check if input is just a number or very simple text without context
  const isJustNumber = /^\d+(\.\d+)?$/.test(trimmedText);
  if (isJustNumber) {
    return {
      isValid: false,
      error: "Vui lòng nhập đầy đủ thông tin môn học và điểm số (ví dụ: 'Toán 9 điểm' thay vì chỉ '9')."
    };
  }
  
  // Check for common non-score phrases
  const lowerText = trimmedText.toLowerCase();
  const startsWithNonScorePhrase = NON_SCORE_PHRASES.some(phrase => 
    lowerText.startsWith(phrase)
  );
  if (startsWithNonScorePhrase) {
    return {
      isValid: false,
      error: "Vui lòng nhập thông tin điểm số. Ví dụ: 'Toán 9 điểm cuối học kỳ' hoặc 'Got Physics 8.5 in midterm'."
    };
  }
  
  return { isValid: true };
};

// Helper function to build subject instruction for AI
const buildSubjectInstruction = (customSubjects: string[]): string => {
  if (customSubjects.length === 0) {
    return 'Tự động chuẩn hóa tên môn học';
  }
  
  return `BẮT BUỘC: Tên môn học phải CHÍNH XÁC khớp với MỘT trong các môn sau (không được tạo môn mới): ${customSubjects.join(', ')}.
  
  Quy tắc chuẩn hóa:
  - "lý" hoặc "ly" -> "Vật lý"
  - "anh" hoặc "tieng anh" hoặc "ta" -> "Tiếng Anh"
  - "văn" hoặc "van" hoặc "ngu van" -> "Ngữ văn"
  - "toán" hoặc "toan" -> "Toán"
  - "hóa" hoặc "hoa" hoặc "hoa hoc" -> "Hóa học"
  - "sinh" hoặc "sinh hoc" -> "Sinh học"
  - "sử" hoặc "su" hoặc "lich su" -> "Lịch sử"
  - "địa" hoặc "dia" hoặc "dia ly" -> "Địa lý"
  - "gdcd" -> "Giáo dục công dân"
  - "tin" hoặc "tin hoc" -> "Tin học"
  - "cn" hoặc "cong nghe" -> "Công nghệ"
  
  Nếu không khớp chính xác với bất kỳ môn nào, chọn môn gần nghĩa nhất trong danh sách.`;
};

export const parseScoreFromText = async (
  text: string, 
  defaultMaxScore: number, 
  availableExamTypes: string[],
  customSubjects: string[] = []
): Promise<Omit<ScoreEntry, 'id' | 'timestamp' | 'originalText'> | null> => {
  try {
    // Validate input before calling AI
    const validation = validateScoreInput(text);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Ensure we have at least 'Other' if the list is somehow empty
    const examTypes = availableExamTypes.length > 0 ? availableExamTypes : ['Other'];

    // Build subject instruction using helper function
    const subjectInstruction = buildSubjectInstruction(customSubjects);

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
    // Validate input before calling AI
    const validation = validateScoreInput(text);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // Ensure we have at least 'Other' if the list is somehow empty
    const examTypes = availableExamTypes.length > 0 ? availableExamTypes : ['Other'];

    // Build subject instruction using helper function
    const subjectInstruction = buildSubjectInstruction(customSubjects);

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
    throw new Error("Không thể hiểu được các điểm số. Vui lòng thử lại với câu rõ ràng hơn.");
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

    // Build subject instruction using helper function
    const subjectInstruction = buildSubjectInstruction(customSubjects);

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
