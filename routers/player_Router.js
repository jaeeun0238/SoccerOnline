import express from 'express';
import { prisma } from '../uts/prisma/index.js';

const router = express.Router();
// 플레이어생성 api
router.post('/player/make', async (req, res, next) => {
  try {
    //body로 전달 받은 객체 구조분해할당
    const {
      playerName,
      playerAbility_ATCK,
      playerAbility_DEFEND,
      playerAbility_Mobility,
    } = req.body;
    const player = await prisma.player_Data.create({
      data: {
        playerName,
        playerAbility_ATCK,
        playerAbility_DEFEND,
        playerAbility_Mobility,
      },
    });

    // 성공시 전달 받은
    return res.status(201).json({
      message: `성공적으로 선수를 생성하였습니다. 
        선수 이름 : ${playerName}
        공격력 : ${playerAbility_ATCK}
        수비력 : ${playerAbility_DEFEND}
        속력 : ${playerAbility_Mobility}
        `,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
