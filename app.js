import express from 'express';

const app = express(); // exoress()함수를 호출해서 app라는 객체생성
const PORT = 3000; // 서버기 실행될 포트, 3000번 사용

app.use(express.json());

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
