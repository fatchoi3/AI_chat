require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI Companion Backend is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`서버 실행 중 : 포트 ${PORT}`);
  console.log(`Server listening on port ${PORT}`);
});

// POST 요청 받는 라우트 추가
app.post('/api/messages', (req, res) => {
  const { text } = req.body;  // 클라이언트가 보낸 메시지 텍스트 받음
  console.log('받은 메시지:', text);

  // 메시지를 저장하거나, AI 처리 후 응답 생성 가능
  // 여기서는 예시로 메시지 그대로 다시 보내줄게
  res.json({
    id: Date.now().toString(),
    text: `서버에서 받은 메시지: ${text}`
  });
});

async function connectDB() {
    try {
      await client.connect();
      console.log('PostgreSQL 연결 성공!');
  
      // 예시 쿼리 실행
      const res = await client.query('SELECT NOW()');
      console.log('현재 시간:', res.rows[0].now);
  
      await client.end();
    } catch (err) {
      console.error('DB 연결 또는 쿼리 에러:', err);
    }
  }
  
connectDB();
