/* 기본 게임 기능 */
import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

//게임 생성  //parameter에 userPID 입력
router.post('/game-start/:userPID', async (req, res, next) => {
  try {
    const { gameSessionPID } = req.body;
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
      throw {
        status: 404,
        message: '스쿼드가 존재하지 않습니다.',
      };
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

//게임 매칭 완성
router.post('/game/match', authMiddleware, async (req, res, next) => {
  const user_1 = req.user.userPID;
  const user_1_score = req.user.userScore;
  try {
    //스코어 계산
    const max_score = user_1_score + 500;
    const min_score = user_1_score - 500;
    //스코어에 어울리는 사람 찾기
    const user_2 = await prisma.userData.findFirst({
      where: {
        NOT: {
          userPID: user_1,
        },
        gameSessionPID: null,
        userScore: {
          gte: min_score,
          lte: max_score,
        },
      },
      select: {
        userPID: true,
      },
    });
    //매칭 실패
    if (!user_2) {
      throw { status: 404, message: ' 적합한 유저를 찾지 못했습니다. ' };
    }
    //성공시 트렌잭션으로 생성하고 플레이어 데이터에 pid 추가
    const [game] = await prisma.$transaction(async (tx) => {
      const game = await tx.gameSession.create({
        data: {
          userScore_1: 0,
          userScore_2: 0,
          sessionTurn: 0,
        },
      });
      await tx.userData.update({
        where: {
          userPID: user_1,
        },
        data: {
          gameSessionPID: game.gameSessionPID,
        },
      });
      await tx.userData.update({
        where: {
          userPID: user_2.userPID,
        },
        data: {
          gameSessionPID: game.gameSessionPID,
        },
      });
      return [game];
    });
    if (!game) {
      throw { status: 500, message: ' 매칭에 실패했습니다. ' };
    }
    res.status(200).json({ date: '적합한 상대와 매칭되었습니다.' });
  } catch (err) {
    next(err);
  }
});

router.post('/game-start', async (req, res, next) => {
  try {
    const { gameSessionPID } = req.body;

    const myStriker = {
      playerName: 'testA',
      playerAbilityATCK: 10,
    };
    const enemyStriker = {
      playerName: 'testB',
      playerAbilityATCK: 10,
    };

    const myMidfielder = { playerName: 'midA', playerAbilityATCK: 7 }; // 미드필더 예시
    const myDefender = { playerName: 'defA', playerAbilityATCK: 4 }; // 수비수 예시
    const enemyMidfielder = { playerName: 'midB', playerAbilityATCK: 6 }; // 적 미드필더 예시
    const enemyDefender = { playerName: 'defB', playerAbilityATCK: 5 }; // 적 수비수 예시
    // const myStriker = {
    //   playerName: 'testA',
    //   playerAbilityATCK: 10,
    // };
    // const enemyStriker = {
    //   playerName: 'testB',
    //   playerAbilityATCK: 10,
    // };

    // const myMidfielder = {
    //   playerName: 'midA',
    //   playerAbilityATCK: 7,
    // };
    // const myDefender = {
    //   playerName: 'defA',
    //   playerAbilityATCK: 4,
    // };
    // const enemyMidfielder = {
    //   playerName: 'midB',
    //   playerAbilityATCK: 6,
    // };
    // const enemyDefender = {
    //   playerName: 'defB',
    //   playerAbilityATCK: 5,
    // };

    const maxStrikerScore =
      myStriker.playerAbilityATCK + enemyStriker.playerAbilityATCK;
    const maxMidfielderScore =
      myStriker.playerAbilityATCK + enemyStriker.playerAbilityATCK;
    const maxDefenderScore =
      myStriker.playerAbilityATCK + enemyStriker.playerAbilityATCK;

    const strikerValue = Math.random() * maxStrikerScore;
    const midfielderValue = Math.random() * maxMidfielderScore;
    const defenderValue = Math.random() * maxDefenderScore;

    let resultMessage = '';
    const gameSession = await prisma.gameSession.findFirst({
      where: { gameSessionPID },
    });

    if (!gameSession) {
      await prisma.gameSession.create({
        data: {
          gameSessionPID,
          userScore_1: 0,
          userScore_2: 0,
          sessionTurn: 0,
        },
      });
    }

    await prisma.userData.update({
      where: {
        userPID: +userPID_1,
      },
      data: {
        gameSessionPID: gameSessionPID,
      },
    });
    await prisma.userData.update({
      where: {
        userPID: +userPID_2,
      },
      data: {
        gameSessionPID: gameSessionPID,
      },
    });

    let currentTurn = gameSession ? gameSession.sessionTurn : 0;
    let currentUser_1Score = gameSession ? gameSession.userScore_1 : 0;
    let currentUser_2Score = gameSession ? gameSession.userScore_2 : 0;

    if (currentTurn % 2 === 0) {
      //유저턴
      resultMessage += `유저 공격수의 드리블`;
      // 공격수 시도
      if (strikerValue < myStriker.playerAbilityATCK) {
        resultMessage += `\n유저의 ${myStriker.playerName} 선수가 상대 ${enemyStriker.playerName} 선수를 뚫고 지나갑니다. `;

        // 미드필더 시도
        if (midfielderValue < myStriker.playerAbilityATCK) {
          resultMessage += `\n유저의 ${myMidfielder.playerName} 선수가 상대 ${enemyStriker.playerName} 선수를 뚫고 지나갑니다. `;

          // 수비수 시도
          if (defenderValue < myStriker.playerAbilityATCK) {
            resultMessage += `\n유저의 ${myStriker.playerName} 선수가 상대 ${enemyStriker.playerName} 선수를 뚫고 골을 넣었습니다!`;
            currentUser_1Score++;
            resultMessage += `\n현재스코어 ${currentUser_1Score} : ${currentUser_2Score}`;
          } else {
            resultMessage +=
              '\n상대 수비수에게 막혔습니다. 공이 상대 공격수에게 패스됩니다.';
            currentTurn++;
          }
        } else {
          resultMessage +=
            '\n상대 미드필더에게 막혔습니다. 공이 상대 공격수에게 패스됩니다.';
          currentTurn++;
        }
      } else {
        resultMessage +=
          '\n상대 공격수에게 막혔습니다. 상대 공격수가 드리블합니다.';
        currentTurn++;
      }
    } else {
      //상대턴
      resultMessage += `상대 공격수의 드리블`;
      // 공격수 시도
      if (strikerValue < enemyStriker.playerAbilityATCK) {
        resultMessage += `\n상대의 ${enemyStriker.playerName} 선수가 유저의 ${myStriker.playerName} 선수를 뚫고 지나갑니다. `;

        // 미드필더 시도
        if (midfielderValue < enemyMidfielder.playerAbilityATCK) {
          resultMessage += `\n상대의 ${enemyMidfielder.playerName} 선수가 유저의 ${myMidfielder.playerName} 선수를 뚫고 지나갑니다. `;

          // 수비수 시도
          if (defenderValue < enemyDefender.playerAbilityATCK) {
            resultMessage += `\n상대의 ${enemyDefender.playerName} 선수가 유저의 ${myDefender.playerName} 선수를 뚫고 골을 넣었습니다!`;
            currentUser_2Score++;
            resultMessage += `\n현재스코어 ${currentUser_1Score} : ${currentUser_2Score}`;
          } else {
            resultMessage +=
              '\n유저 수비수가 막았습니다. 공을 유저 공격수에게 패스합니다.';
            currentTurn++;
          }
        } else {
          resultMessage +=
            '\n유저 미드필더가 막았습니다. 공을 유저 공격수에게 패스합니다.';
          currentTurn++;
        }
      } else {
        resultMessage +=
          '\n유저 공격수가 막았습니다. 유저 공격수가 드리블합니다.';
        currentTurn++;
      }
    }

    await prisma.gameSession.update({
      where: { gameSessionPID },
      data: {
        sessionTurn: currentTurn,
        userScore_1: currentUser_1Score,
        userScore_2: currentUser_2Score,
      },
    });

    res.status(200).json({ message: resultMessage });
  } catch (err) {
    next(err);
  }
});

router.delete('/game-end/:gameSessionPID', async (req, res, next) => {
  const gameSessionPID = req.params.gameSessionPID;
  try {
    const gameSession = await prisma.gameSession.findFirst({
      where: { gameSessionPID: +gameSessionPID },
      include: {
        userData: true,
      },
    });
    if (!sessionSearch) {
      throw {
        status: 404,
        message: '게임세션이 존재하지 않습니다.',
      };
    }
    await prisma.gameSessionHestory.create({
      data: {
        userPID_1: gameSession.userPID_1,
        userPID_2: gameSession.userPID_2,
        userScore_1: gameSession.userScore_1,
        userScore_2: gameSession.userScore_2,
      },
    });
    res.status(200).json({});
  } catch (err) {
    next(err);
  }
});

router.post('/user', async (req, res, next) => {
  const userData = req.body;
  const user = await prisma.userData.create({
    data: {
      userID: userData.userID,
      userName: userData.userName,
      userPassword: userData.userPassword,
      userScore: 1000,
      userCash: 1000,
    },
  });
  res.status(200).json({ data: user });
});

router.post('/squad', async (req, res, next) => {
  const userData = req.body;
  const squad = await prisma.playerSquadsData.create({
    data: {
      userPID: +userData.userPID,
    },
  });
  res.status(200).json({ data: squad });
});

export default router;
