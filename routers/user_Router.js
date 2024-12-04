import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import errModel from '../middlewares/error.middleware.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
// 회원가입api
/** 사용자 회원가입 API **/
router.post('/sign-up', async (req, res) => {
  const { userID, userName, userPassword } = req.body;

  try {
    // 동일한 회원정보 확인하기
    const sameUser = await prisma.userData.findUnique({
      where: {
        userID,
      },
    });

    // 사용자 정보가 이미 존재하는 경우
    if (sameUser) {
      return res.status(409).json({ message: '이미 존재하는 유저입니다.' });
    }

    // 비밀번호 해시화 (변경된 부분)
    const bcryptPassword = await bcrypt.hash(userPassword, 10); // salt rounds 추가

    // userData 테이블에 사용자를 추가
    const user = await prisma.userData.create({
      data: {
        userID,
        userName,
        userPassword: bcryptPassword,
        userScore: 0,
        userCash: 5000,
      },
    });

    return res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    // 오류 처리 시작 (변경된 부분)
    console.error(error); // 오류 로그 출력 (변경된 부분)
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' }); // 오류 응답 반환 (변경된 부분)
  }
});

// 로그인api

/** 로그인 API **/
router.post('/sign-in', async (req, res, next) => {
  const { userID, userPassword } = req.body;
  const user = await prisma.userData.findUnique({ where: { userID } });

  if (!user)
    return res.status(401).json({ message: '존재하지 않는 유저입니다.' });
  // 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
  else if (!(await bcrypt.compare(userPassword, user.userPassword)))
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });

  // 로그인에 성공하면, 사용자의 userId를 바탕으로 토큰을 생성합니다.
  console.log(process.env.JWT_KEY);

  const token = jwt.sign(
    {
      userPID: user.userPID,
    },
    process.env.JWT_KEY, // 비밀 키를 환경 변수에서 가져옴
    { expiresIn: '1h' }, // 토큰의 만료 시간을 설정 (1시간)
  );

  // 헤더로 주고받게 바꾸기
  res.setHeader('authorization', `Bearer ${token}`);
  return res.status(200).json({
    message: '로그인 성공',
    user: {
      userID: user.userID,
    },
  });
});

// 캐시 구매
router.patch('/buyCash/:userPID', async (req, res, next) => {
  try {
    const { userPID } = req.params;
    const { cash } = req.body;
    // 예시로 body에 '"cash": 5000'으로 되어있는걸 가져옴
    // const authorization = req.headers['authorization']; // header에 'authorization' 값 가져옴
    // const [tokenType, token] = authorization.split(' '); // bearer과 token값 객체구조분해 할당

    // 토큰형식 확인, middleware로 따로 빼도 됨
    // if (tokenType !== 'Bearer') {
    //   return next(errModel(401, '토큰 형식이 잘못되었습니다.'));
    // }

    // const decodedToken = jwt.verify(token, process.env.JWT_KEY); // 토큰 원상태로, 키 부분 이름은 추후 수정
    // const userPID = decodedToken.userPID; //토큰의 userPID부분 가져옴
    console.log(userPID);

    // 현재 보유량 + 추가 캐시 하기위해 현재 user정보 가져옴
    const user = await prisma.userData.findUnique({
      where: { userPID: +userPID },
    });

    // userPID가 존재하지 않으면 에러 반환, middleware로 따로 빼도 됨
    // if (!user) {
    //   return next(errModel(404, '일치하는 사용자가 존재하지 않습니다.'));
    // }

    // cash가 존재하지 않으면 에러, middleware로 따로 빼도 됨
    // if (!cash) {
    //   return next(errModel(400, '캐시를 입력해 주세요.'));
    // }

    // cash가 유효한 값인지 검사, middleware로 따로 빼도 됨
    // if (typeof cash !== 'number' || cash < 0) {
    //   return next(errModel(400, '유효한 캐시 값을 입력해 주세요.'));
    // }

    // 캐시 추가해서 업데이트
    const updateCash = await prisma.userData.update({
      where: { userPID: +userPID },
      data: { userCash: user.userCash + cash },
    });

    return res.status(200).json({ currentCash: updateCash.userCash });
  } catch (err) {
    next(err);
  }
});

export default router;
