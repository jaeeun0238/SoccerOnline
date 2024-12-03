/* 기본 게임 기능 */
import express from 'express';
import { prisma } from '../uts/prisma/index.js';

const router = express.Router();

//게임 생성  //parameter에 userPID 입력
router.post('/game-start/:userPID', async (req, res, next) => {
  try {
    const mySquad = req.params;
    const enemySquad = req.body;

    //parameter에 입력한 유저PID를 가지고 있는 스쿼드정보
    const mySquadInfo = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: +mySquad,
      },
    });

    //body에서 입력한 스쿼드PID를 가진 스쿼드정보
    const enemySquadInfo = await prisma.playerSquadsData.findFirst({
      where: {
        playerSquadsPID: +enemySquad,
      },
    });

    //수정필요
    const mySquadScore = mySquadInfo.strikerPositionPlayerPID.playerAbilityATCK;
    const enemySquadScore =
      enemySquadInfo.strikerPositionPlayerPID.playerAbilityATCK;

    const maxScore = mySquadScore + enemySquadScore;

    const randomValue = Math.random() * maxScore;

    let myScore, enemyScore, result;

    if (randomValue < mySquadScore) {
      // 유저 승리 처리
      myScore = Math.floor(Math.random() * 4) + 2; // 2에서 5 사이
      enemyScore = Math.floor(Math.random() * Math.min(3, myScore)); // myScore보다 작은 값을 설정
      result = `승리: 유저 ${myScore} - ${enemyScore} 상대`;
    } else {
      // 상대 유저 승리 처리
      myScore = Math.floor(Math.random() * 4) + 2; // 2에서 5 사이
      enemyScore = Math.floor(Math.random() * Math.min(3, enemyScore)); // enemyScore보다 작은 값을 설정
      result = `패배: 상대 ${enemyScore} - ${myScore} 유저`;
    }

    //게임 전적
    await prisma.game_Records.create({
      data: {
        gameRecord: result,
      },
    });
    return res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
