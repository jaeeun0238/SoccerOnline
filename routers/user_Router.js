import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import errModel from '../middlewares/error.middleware.js';

const router = express.Router();

// 회원가입api

// 로그인api

// 캐시 구매
router.patch('/buyCash', async (req, res, next) => {
  try {
    const { cash } = req.body; // 예시로 body에 '"cash": 5000'으로 되어있는걸 가져옴
    const authorization = req.headers['authorization']; // header에 'authorization' 값 가져옴
    const [tokenType, token] = authorization.split(' '); // bearer과 token값 객체구조분해 할당

    // 토큰형식 확인, middleware로 따로 빼도 됨
    if (tokenType !== 'Bearer') {
      return next(errModel(401, '토큰 형식이 잘못되었습니다.'));
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY); // 토큰 원상태로, 키 부분 이름은 추후 수정
    const userPID = decodedToken.userPID; //토큰의 userPID부분 가져옴

    // 현재 보유량 + 추가 캐시 하기위해 현재 user정보 가져옴
    const user = await prisma.user_Data.findUnique({
      where: { userPID },
    });

    // userPID가 존재하지 않으면 에러 반환, middleware로 따로 빼도 됨
    if (!user) {
      return next(errModel(404, '일치하는 사용자가 존재하지 않습니다.'));
    }

    // cash가 존재하지 않으면 에러, middleware로 따로 빼도 됨
    if (!cash) {
      return next(errModel(400, '캐시를 입력해 주세요.'));
    }

    // cash가 유효한 값인지 검사, middleware로 따로 빼도 됨
    if (typeof cash !== 'number' || cash < 0) {
      return next(errModel(400, '유효한 캐시 값을 입력해 주세요.'));
    }

    // 캐시 추가해서 업데이트
    const updateCash = await prisma.user_Data.update({
      where: { userPID },
      data: { userCash: user.userCash + cash },
    });

    return res.status(200).json({ currentCash: updateCash.userCash });
  } catch (err) {
    next(err);
  }
});
