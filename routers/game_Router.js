/* 기본 게임 기능 */
import express from 'express';
import { prisma } from '../uts/prisma/index.js';

const router = express.Router();
/*
//게임 생성  //parameter에 userPID 입력
router.post('/game-start/:userPID', async (req, res, next) => {
  try {
    const mySquad = req.params.userPID;
    const enemySquad = req.body.playerSquadsPID;

    //parameter에 입력한 유저PID를 가지고 있는 스쿼드정보
    const myRosterInfo = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: +mySquad,
      },
    });

    //body에서 입력한 스쿼드PID를 가진 스쿼드정보
    const enemyRosterInfo = await prisma.playerSquadsData.findFirst({
      where: {
        playerSquadsPID: +enemySquad,
      },
    });
    if (!enemyRosterInfo) {
      return res.status(404).json({ error: '스쿼드를 찾을수 없습니다' });
    }

    //유저의 스트라이커장착 로스터
    const myEquipStrikerRoster = await prisma.playerEquipRostersData.findFirst({
      where: {
        playerRostersPID: myRosterInfo.playerRostersPID,
        position: 0,
      },
    });

    //상대의 스트라이커장착 로스터
    const enemyEquipStrikerRoster =
      await prisma.playerEquipRostersData.findFirst({
        where: {
          playerRostersPID: enemyRosterInfo.playerRostersPID,
          position: 0,
        },
      });

    const myStrikerPlayerData = await prisma.playerData.findFirst({
      where: {
        playerPID: myEquipStrikerRoster.playerPID,
      },
    });

    const enemyStrikerPlayerData = await prisma.playerData.findFirst({
      where: {
        playerPID: enemyEquipStrikerRoster.playerPID,
      },
    });

    //유저의 미드필더장착 로스터
    const myEquipMidfielderRoster =
      await prisma.playerEquipRostersData.findFirst({
        where: {
          playerRostersPID: myRosterInfo.playerRostersPID,
          position: 1,
        },
      });

    //상대의 미드필더장착 로스터
    const enemyEquipMidfielderRoster =
      await prisma.playerEquipRostersData.findFirst({
        where: {
          playerRostersPID: enemyRosterInfo.playerRostersPID,
          position: 1,
        },
      });

    const myMidfielderPlayerData = await prisma.playerData.findFirst({
      where: {
        playerPID: myEquipMidfielderRoster.playerPID,
      },
    });

    const enemyMidfielderPlayerData = await prisma.playerData.findFirst({
      where: {
        playerPID: enemyEquipMidfielderRoster.playerPID,
      },
    });

    //유저의 디펜더장착 로스터
    const myEquipDefenderRoster = await prisma.playerEquipRostersData.findFirst(
      {
        where: {
          playerRostersPID: myRosterInfo.playerRostersPID,
          position: 2,
        },
      },
    );

    //상대의 디펜더장착 로스터
    const enemyEquipDefenderRoster =
      await prisma.playerEquipRostersData.findFirst({
        where: {
          playerRostersPID: enemyRosterInfo.playerRostersPID,
          position: 2,
        },
      });

    const myDefenderPlayerData = await prisma.playerData.findFirst({
      where: {
        playerPID: myEquipDefenderRoster.playerPID,
      },
    });

    const enemyDefenderPlayerData = await prisma.playerData.findFirst({
      where: {
        playerPID: enemyEquipDefenderRoster.playerPID,
      },
    });

    //수정필요
    const mySquadScore = myStrikerPlayerData.playerAbilityATCK;
    const enemySquadScore = enemyStrikerPlayerData.playerAbilityATCK;

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
      enemyScore = Math.floor(Math.random() * 4) + 2; // 2에서 5 사이
      myScore = Math.floor(Math.random() * Math.min(3, enemyScore)); // enemyScore보다 작은 값을 설정
      result = `패배: 상대 ${enemyScore} - ${myScore} 유저`;
    }

    //게임 전적
    // await prisma.game_Records.create({
    //   data: {
    //     gameRecord: result,
    //   },
    // });
    return res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});
*/
//test

router.post('/game-start/:userPlayerPID', async (req, res, next) => {
  try {
    const myTeam = req.params.userPlayerPID;
    const enemyTeam = req.body.playerPID;
    // const myStriker = await prisma.playerData.findFirst({
    //   where: {
    //     playerPID: +myTeam,
    //   },
    // });
    // const enemyStriker = await prisma.playerData.findFirst({
    //   where: {
    //     playerPID: +enemyTeam,
    //   },
    // });
    const myStriker = {
      playerName: 'testA',
      playerAbilityATCK: 5,
    };
    const enemyStriker = {
      playerName: 'testB',
      playerAbilityATCK: 10,
    };

    const myStrikerScore = myStriker.playerAbilityATCK;
    const enemyStrikerScore = enemyStriker.playerAbilityATCK;

    const maxStrikerScore = myStrikerScore + enemyStrikerScore;

    const strikerValues = [
      Math.random() * maxStrikerScore,
      Math.random() * maxStrikerScore,
      Math.random() * maxStrikerScore,
    ];

    let progress = 0;

    const attemptStrikerPass = (value) => {
      if (value < myStrikerScore) {
        progress += 1;
        return `유저의 ${myStriker.playerName} 선수가 상대 ${enemyStriker.playerName} 선수를 뚫고 지나갑니다.`;
      } else {
        progress -= 1;
        return '상대 선수를 뚫는데 실패';
      }
    };

    for (const value of strikerValues) {
      const message = attemptStrikerPass(value);
      res.status(200).json({ message });
      if (progress >= 3) break; // 모든 시도가 성공했을 경우 종료
    }
    const result = await prisma.gameSession.create({});
    return res.status(200).json({ 게임결과: result });
  } catch (err) {
    next(err);
  }
});

export default router;
