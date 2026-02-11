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
  console.log(`Server listening on port ${PORT}`);
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
