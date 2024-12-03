import express from 'express';
import errorMiddleware from './middlewares/error.middleware.js';

import userRouter from './routers/user_Router.js';
import playersRouter from './routers/player_Router.js';
import gameRouter from './routers/game_Router.js';
import teamRouter from './routers/team_Router.js';

const app = express(); // exoress()함수를 호출해서 app라는 객체생성
const PORT = 3017; // 서버가 실행될 포트, 3017번 사용

app.use(express.json());
app.use(express.urlencoded({ extended: true })); //바디 파서
app.use('/api', [userRouter, playersRouter, gameRouter, teamRouter]);
app.use(errorMiddleware);
//에러 미들웨어 에러 사용법 에러모듈 생성후 return next(errModel(404, '캐릭터 데이터가 없습니다.')); 임포트로 옆에 불러온뒤 : import errModel from '../utils/model/errModel.js';

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
// test
