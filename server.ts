import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('✅ GoogleGenAI initialized successfully.');
  } catch (err) {
    console.warn('⚠️ GoogleGenAI initialization error:', err);
  }
} else {
  console.log('ℹ️ Running in demo pedagogical mode (No GEMINI_API_KEY provided).');
}

// Check AI status
app.get('/api/ai/status', (req: Request, res: Response) => {
  res.json({
    hasKey: Boolean(aiClient),
    model: 'gemini-3.8-flash',
    mode: aiClient ? 'live' : 'pedagogical_demo',
  });
});

function getAiClient(req: Request): GoogleGenAI | null {
  const clientKey = (req.body?.clientApiKey as string) || (req.headers['x-gemini-api-key'] as string);
  if (clientKey) {
    try {
      return new GoogleGenAI({
        apiKey: clientKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    } catch (e) {
      console.warn('Custom client key init error:', e);
    }
  }
  return aiClient;
}

/**
 * 1. AI Buddy Chat for Grade 3 Students (Bilingual English - Vietnamese)
 */
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { message, history, subject, className, teacherName, clientModel } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const client = getAiClient(req);
  if (!client) {
    // Graceful pedagogical fallback handled by frontend or direct response
    return res.status(503).json({ error: 'AI key not configured; using offline pedagogy fallback' });
  }

  try {
    const systemInstruction = `Bạn là "AI Buddy" - Trợ lý học tập thông minh, thân thiện của học sinh lớp ${className || '3C1'}, Trường Tiểu học Hoài Nhơn, đồng hành cùng cô giáo chủ nhiệm ${teacherName || 'Đỗ Thị Hoà'}.
Đối tượng trò chuyện: Học sinh tiểu học 8-9 tuổi (Lớp 3).
Nguyên tắc sư phạm:
1. Luôn dùng giọng điệu ấm áp, khen ngợi, khuyến khích (ví dụ: "Chào bạn nhỏ!", "Bạn làm tốt lắm!", "Hãy cùng mình suy nghĩ nhé!").
2. Giải thích kiến thức ngắn gọn, dễ hiểu, dùng ngôn ngữ trong sáng của học sinh tiểu học.
3. Hỗ trợ song ngữ Tiếng Anh và Tiếng Việt.
4. Với bài toán khó, chỉ đưa ra gợi ý từng bước (hint) giúp học sinh tự tìm ra đáp án, KHÔNG đưa ngay đáp án cuối cùng.
5. Tuyệt đối an toàn cho trẻ em: không hỏi thông tin riêng tư, không tự nhận là con người và tôn trọng vai trò của cô giáo Đỗ Thị Hoà.`;

    const contents = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: `[Môn học: ${subject || 'Chung'}] ${message}` }],
    });

    const response = await client.models.generateContent({
      model: clientModel || 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Bạn nhỏ ơi, hãy cùng suy nghĩ thêm một chút nhé!';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý AI' });
  }
});

/**
 * 2. Teacher AI Assistant for Cô Đỗ Thị Hoà
 */
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  const { taskType, parameters, teacherName, className, school, clientModel } = req.body;

  if (!taskType) {
    return res.status(400).json({ error: 'taskType is required' });
  }

  const client = getAiClient(req);
  if (!client) {
    return res.status(503).json({ error: 'AI key not configured' });
  }

  try {
    const systemInstruction = `Bạn là Trợ lý giáo dục AI chuyên sâu hỗ trợ cô giáo ${teacherName || 'Đỗ Thị Hoà'}, Giáo viên chủ nhiệm lớp ${className || '3C1'}, ${school || 'Trường Tiểu học Hoài Nhơn'}.
Chương trình giáo dục: Tiểu học Việt Nam (Bộ sách Kết nối tri thức với cuộc sống).
Yêu cầu:
- Soạn thảo chuyên nghiệp, đúng quy chuẩn sư phạm, bám sát đối tượng học sinh lớp 3.
- Ngôn từ chuẩn mực, tích cực, tôn vinh sự tiến bộ và tính cá nhân hóa trong giáo dục.`;

    let prompt = '';
    if (taskType === 'announcement') {
      prompt = `Hãy soạn một bức thư/thông báo song ngữ hoặc tiếng Việt gửi Quý phụ huynh học sinh lớp ${className || '3C1'} về chủ đề: ${parameters?.topic || 'Kế hoạch học tập tuần mới và rèn luyện kỹ năng số'}. Ký tên: Cô giáo chủ nhiệm ${teacherName || 'Đỗ Thị Hoà'}.`;
    } else if (taskType === 'lesson_plan') {
      prompt = `Hãy soạn gợi ý Kế hoạch bài dạy (giáo án) tích hợp AI và công nghệ số cho môn ${parameters?.subject || 'Tiếng Việt 3 (Kết nối tri thức)'}, bài: ${parameters?.lessonTitle || 'Luyện từ và câu'}. Gồm Mục tiêu (năng lực, phẩm chất), Chuẩn bị và Tiến trình 4 bước (Khởi động, Khám phá, Thực hành phân hóa, Vận dụng).`;
    } else if (taskType === 'positive_rules') {
      prompt = `Hãy sáng tác 5 câu nội quy lớp học hạnh phúc viết dưới dạng thơ hoặc vè 4 chữ/5 chữ dễ nhớ, vui tươi, tích cực dành cho học sinh lớp 3C1.`;
    } else if (taskType === 'differentiated_comment') {
      prompt = `Dựa trên dữ liệu học sinh: ${JSON.stringify(parameters?.studentData || {})}, hãy soạn 1 lời nhận xét mang tính động viên, chỉ ra điểm tiến bộ nổi bật và 1 mục tiêu nhỏ cần rèn luyện thêm trong tuần tới theo phong cách nhẹ nhàng, tích cực.`;
    } else {
      prompt = `Hỗ trợ giáo viên lớp 3C1: ${JSON.stringify(parameters)}`;
    }

    const response = await client.models.generateContent({
      model: clientModel || 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ content: response.text || '' });
  } catch (error: any) {
    console.error('Teacher assistant error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý trợ lý giáo viên' });
  }
});

/**
 * 3. Smart Game Generator: Auto-parse uploaded question files & answer keys
 */
app.post('/api/gemini/parse-game', async (req: Request, res: Response) => {
  const { content, answerKeyText, clientModel } = req.body;

  const client = getAiClient(req);
  if (!client) {
    return res.status(503).json({ error: 'AI key not configured' });
  }

  try {
    const prompt = `Bạn là hệ thống bóc tách học liệu trò chơi sư phạm tiểu học.
Nội dung file/văn bản tải lên:
"""
${content}
"""

Nội dung file đáp án (nếu có):
"""
${answerKeyText || 'Không có file đáp án riêng, hãy tự tìm đáp án chuẩn.'}
"""

Hãy bóc tách thành danh sách câu hỏi trắc nghiệm/ghép từ cho học sinh lớp 3. Trả về đúng định dạng JSON:
{
  "suggestedGameType": "magic-quiz" | "word-match" | "picture-detective" | "educational-bingo",
  "questions": [
    {
      "id": "gen-1",
      "prompt": "Nội dung câu hỏi",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "answer": "Đáp án đúng",
      "hint": "Gợi ý nhẹ nhàng"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Parse game error:', error);
    return res.status(500).json({ error: 'Không thể bóc tách trò chơi từ dữ liệu tải lên' });
  }
});

/**
 * 4. Online Classroom Database API (Persistent Cloud / Server DB Engine)
 */
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'classroom_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadServerDb(): any {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      classId: '3C1',
      className: 'Lớp 3C1 - Trường Tiểu học Hoài Nhơn',
      lastUpdated: new Date().toISOString(),
      students: [],
      assignments: [],
      notifications: [],
      feedbacks: [],
      materials: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi đọc database file:', err);
    return { students: [], assignments: [], notifications: [], feedbacks: [], materials: [] };
  }
}

function saveServerDb(data: any) {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

// Kết nối & Tải danh sách lớp từ Google Sheets
app.post('/api/db/google-sheets/fetch', async (req: Request, res: Response) => {
  try {
    const { sheetUrl, apiKey, range } = req.body;
    if (!sheetUrl) {
      return res.status(400).json({ success: false, error: 'Thiếu đường link Google Sheet' });
    }

    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = sheetUrl.match(/[#&?]gid=([0-9]+)/);
    const sheetId = sheetIdMatch ? sheetIdMatch[1] : null;
    const gid = gidMatch ? gidMatch[1] : '0';

    if (!sheetId) {
      return res.status(400).json({
        success: false,
        error: 'Đường dẫn Google Sheet không đúng định dạng. Hãy copy link đầy đủ dạng https://docs.google.com/spreadsheets/d/.../edit'
      });
    }

    // 1. Nếu có Google Sheets API key
    if (apiKey) {
      const targetRange = encodeURIComponent(range || 'Sheet1!A1:Z100');
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${targetRange}?key=${apiKey}`;
      const apiRes = await fetch(apiUrl);
      if (apiRes.ok) {
        const data = await apiRes.json();
        return res.json({ success: true, type: 'api', values: data.values || [] });
      }
    }

    // 2. Tải qua Google Visualization Export (Dành cho trang tính chia sẻ công khai)
    const csvUrls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}&gid=${gid}`
    ];

    let csvText = '';
    for (const url of csvUrls) {
      try {
        const csvRes = await fetch(url, { headers: { 'Accept': 'text/csv,text/plain,*/*' } });
        if (csvRes.ok) {
          const text = await csvRes.text();
          if (text && !text.includes('<!DOCTYPE html>') && !text.includes('accounts.google.com')) {
            csvText = text;
            break;
          }
        }
      } catch (err) {
        // thử link tiếp theo
      }
    }

    if (!csvText) {
      return res.status(400).json({
        success: false,
        error: 'Không thể đọc dữ liệu từ Google Sheet. Hãy đảm bảo bạn đã bật Chia sẻ: "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with the link can view).'
      });
    }

    return res.json({
      success: true,
      type: 'csv',
      sheetId,
      gid,
      csvText
    });
  } catch (error: any) {
    console.error('Lỗi tải Google Sheet:', error);
    return res.status(500).json({ success: false, error: error.message || 'Lỗi kết nối máy chủ Google Sheets' });
  }
});

// Kiểm tra trạng thái Database
app.get('/api/db/status', (req: Request, res: Response) => {
  try {
    const db = loadServerDb();
    res.json({
      online: true,
      status: 'connected',
      type: 'express-cloud-db',
      message: `Máy chủ CSDL Lớp học ${db.classId || '3A2'} đang hoạt động`,
      lastUpdated: db.lastUpdated || new Date().toISOString(),
      recordCounts: {
        students: db.students?.length || 0,
        assignments: db.assignments?.length || 0,
        notifications: db.notifications?.length || 0,
        feedbacks: db.feedbacks?.length || 0,
        materials: db.materials?.length || 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ online: false, status: 'error', message: err.message });
  }
});

// Lấy toàn bộ dữ liệu CSDL
app.get('/api/db/all', (req: Request, res: Response) => {
  try {
    const db = loadServerDb();
    res.json({
      success: true,
      payload: db
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Đồng bộ đẩy dữ liệu (Sync / Push)
app.post('/api/db/sync', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, error: 'Thiếu dữ liệu payload' });
    }
    const currentDb = loadServerDb();
    const updatedDb = {
      ...currentDb,
      ...payload,
      classId: payload.classId || '3C1',
      lastUpdated: new Date().toISOString()
    };
    saveServerDb(updatedDb);
    res.json({
      success: true,
      message: 'Đồng bộ cơ sở dữ liệu lên máy chủ thành công!',
      lastUpdated: updatedDb.lastUpdated,
      recordCounts: {
        students: updatedDb.students?.length || 0,
        assignments: updatedDb.assignments?.length || 0,
        notifications: updatedDb.notifications?.length || 0,
        feedbacks: updatedDb.feedbacks?.length || 0,
        materials: updatedDb.materials?.length || 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CRUD Students
app.get('/api/db/students', (req: Request, res: Response) => {
  const db = loadServerDb();
  res.json(db.students || []);
});

app.post('/api/db/students', (req: Request, res: Response) => {
  try {
    const db = loadServerDb();
    const newStudent = req.body;
    if (!newStudent || !newStudent.id) {
      return res.status(400).json({ error: 'Dữ liệu học sinh không hợp lệ' });
    }
    const existingIndex = (db.students || []).findIndex((s: any) => s.id === newStudent.id);
    if (existingIndex >= 0) {
      db.students[existingIndex] = { ...db.students[existingIndex], ...newStudent };
    } else {
      db.students = [...(db.students || []), newStudent];
    }
    saveServerDb(db);
    res.json({ success: true, student: newStudent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/db/students/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = loadServerDb();
    db.students = (db.students || []).filter((s: any) => s.id !== id);
    saveServerDb(db);
    res.json({ success: true, message: `Đã xóa học sinh ${id}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD Assignments
app.get('/api/db/assignments', (req: Request, res: Response) => {
  const db = loadServerDb();
  res.json(db.assignments || []);
});

app.post('/api/db/assignments', (req: Request, res: Response) => {
  try {
    const db = loadServerDb();
    const assignment = req.body;
    db.assignments = [assignment, ...(db.assignments || [])];
    saveServerDb(db);
    res.json({ success: true, assignment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD Notifications
app.get('/api/db/notifications', (req: Request, res: Response) => {
  const db = loadServerDb();
  res.json(db.notifications || []);
});

app.post('/api/db/notifications', (req: Request, res: Response) => {
  try {
    const db = loadServerDb();
    const notification = req.body;
    db.notifications = [notification, ...(db.notifications || [])];
    saveServerDb(db);
    res.json({ success: true, notification });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD Feedbacks
app.get('/api/db/feedbacks', (req: Request, res: Response) => {
  const db = loadServerDb();
  res.json(db.feedbacks || []);
});

app.post('/api/db/feedbacks', (req: Request, res: Response) => {
  try {
    const db = loadServerDb();
    const feedback = req.body;
    db.feedbacks = [feedback, ...(db.feedbacks || [])];
    saveServerDb(db);
    res.json({ success: true, feedback });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🚀 AI CLASS Server running on http://localhost:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      const fallbackPort = Number(port) + 1;
      console.warn(`⚠️ Cổng ${port} đang bận, tự động chuyển sang cổng ${fallbackPort}...`);
      app.listen(fallbackPort, '0.0.0.0', () => {
        console.log(`🚀 AI CLASS Server running on http://localhost:${fallbackPort}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
