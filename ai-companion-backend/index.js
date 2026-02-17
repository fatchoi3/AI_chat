// index.js - AWS EC2에서 돌아가는 Node.js 백엔드 서버 예제

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const WebSocket = require('ws');

// PostgreSQL 클라이언트 설정 (환경변수 사용)
const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Express 앱 생성
const app = express();
app.use(cors());
app.use(express.json());

// 기본 라우트 - 서버 구동 확인용
app.get('/', (req, res) => {
  res.send('AI Companion Backend is running');
});

// REST API - 클라이언트가 메시지를 POST로 보내는 엔드포인트
app.post('/api/messages', (req, res) => {
  const { userId, text } = req.body;
  console.log('REST API로 받은 메시지:', text);

  const message = JSON.stringify({ userId, text, timestamp: Date.now() });

  // WebSocket 클라이언트에게 브로드캐스트 (ws 서버 쪽 코드 참고)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  res.status(200).json({ status: 'ok' });
});

// // 1. OpenAI API 연동 (Node.js 예제)
// const { Configuration, OpenAIApi } = require("openai");

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. 대화 이력 DB 저장 함수 (PostgreSQL)
const saveChatHistory = async (userMsg, botMsg) => {
  await client.query(
    'INSERT INTO chat_history (user_message, bot_reply) VALUES ($1, $2)',
    [userMsg, botMsg]
  );
};

// 3. 대화 요청 API 라우터 (Express)
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });
    const reply = response.choices[0].message.content;
    
    // 대화 이력 저장
    await saveChatHistory(message, reply);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'API 호출 실패' });
  }
});

// 4. 대화 이력 조회 API 라우터
app.get('/api/chat/history', async (req, res) => {
  try {
    console.log("api/chat/history")
    const result = await client.query('SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'DB 조회 실패' });
  }
});


// PostgreSQL 연결 함수 (실행 시 DB 연결 확인)
async function connectDB() {
  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공!');

    // 테스트 쿼리
    const res = await client.query('SELECT NOW()');
    console.log('현재 시간:', res.rows[0].now);

    // 연결 유지 (따로 종료하지 않음)
  } catch (err) {
    console.error('DB 연결 또는 쿼리 에러:', err);
  }
}
connectDB();

// WebSocket 서버 설정 (포트는 5101로 분리)
const wss = new WebSocket.Server({ port: 5101 });

wss.on('connection', (ws) => {
  console.log('WebSocket 클라이언트 연결됨');

  ws.on('message', (message) => {
    // 클라이언트가 보낸 메시지는 JSON 문자열 형태라고 가정
    const data = JSON.parse(message);
    console.log('받은 메시지:', data);

    // 보낸 클라이언트 제외하고 나머지 모두에게 메시지 전송
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => {
    console.log('클라이언트 연결 종료');
  });

  ws.on('error', (error) => {
    console.error('WebSocket 에러:', error);
  });
});

// HTTP 서버 포트 (보통 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`서버 실행 중 : 포트 ${PORT}`);
  console.log(`HTTP + WebSocket 서버 동작 중 (WebSocket 포트: 5101)`);
});