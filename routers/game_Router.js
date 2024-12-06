/* 기본 게임 기능 */
import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

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
    const { gameSessionPID } = req.user.gameSessionPID;

    const user_data = await prisma.gameSession.findUnique({
      where: {
        gameSessionPID: gameSessionPID,
      },
      include: {
        userData: {
          include: {
            playerSquadsData: {
              include: {
                playerEquipRostersData: true,
              },
            },
          },
        },
      },
    });

    const userPID_1 = user_data.userData[0].userPID;
    const userPID_2 = user_data.userData[1].userPID;
    let user_1_player = [];
    /*???????????플레이어정보가져오는법?????????????*/
    // 유저 데이터[0] 첫번째 유저의 스쿼드데이터에 플레이어 로스터 데이터의 갯수만큼 반복
    for (
      let i = 0;
      i < user_data.userData[0].playerSquadsData.playerEquipRostersData.length;
      i++
    ) {
      // 유저 데이터[0] 첫번째 유저의 스쿼드데이터에 플레이어 로스터 데이터의[i]번째의 playerRostPID의 보유선수 데이터 잘하면 여기 스킵 가능
      const isPlayer_temp = await prisma.playerRostersData.findUnique({
        where: {
          playerRostersPID:
            user_data.userData[0].playerSquadsData.playerEquipRostersData[i]
              .playerRostersPID,
        },
      });
      // 그 받아온 선수의 데이터를 선수데이터 db를 불러와서 선수의 실질적인 데이터 받아오기.
      const player = await prisma.playerData.findUnique({
        where: { playerPID: isPlayer_temp.playerPID },
        include: {
          playerRostersData: {
            include: {
              playerEquipRostersData: true,
            },
          },
        },
      });
      //여기서 플레이어 선수 푸쉬 해주기
      user_1_player.push({
        player: player,
        playerPosition:
          user_data.userData[0].playerSquadsData.playerEquipRostersData[i]
            .position,
      });
    }

    const user2data = await prisma.userData.findUnique({
      where: { userID: userPID_2 },
      include: {
        playerRostersData: {
          include: {
            playerEquipRostersData: true,
          },
        },
      },
    });

    /*const
    user1Striker;
    user1Midfielder;
    user1Defender;
    user2Striker;
    user2Midfielder;
    user2Defender;
    */

    //스탯 정규화
    //유저1
    const user1STR =
      user1Striker.playerAbilityATCK * 1.1 +
      user1Striker.playerAbilityDEFEND * 0.8 +
      user1Striker.playerAbilityMOBILITY * 0.7;
    const user1MID =
      user1Midfielder.playerAbilityATCK +
      user1Midfielder.playerAbilityDEFEND * 0.8 +
      user1Midfielder.playerAbilityMOBILITY;
    const user1DEF =
      user1Defender.playerAbilityATCK * 0.8 +
      user1Defender.playerAbilityDEFEND * 1.2 +
      user1Defender.playerAbilityMOBILITY * 0.7;

    //유저2
    const user2STR =
      user2Striker.playerAbilityATCK * 1.1 +
      user2Striker.playerAbilityDEFEND * 0.8 +
      user2Striker.playerAbilityMOBILITY * 0.7;
    const user2MID =
      user2Midfielder.playerAbilityATCK +
      user2Midfielder.playerAbilityDEFEND * 0.8 +
      user2Midfielder.playerAbilityMOBILITY;
    const user2DEF =
      user2Defender.playerAbilityATCK * 0.8 +
      user2Defender.playerAbilityDEFEND * 1.2 +
      user2Defender.playerAbilityMOBILITY * 0.7;

    //돌파가능 수치정하기
    //유저1
    const user1DribbleSTR = user1STR + user2STR;
    const user1DribbleMID = user1STR + user2MID;
    const user1DribbleDEF = user1STR + user2DEF;
    const user1RS = Math.random() * user1DribbleSTR;
    const user1RM = Math.random() * user1DribbleMID;
    const user1RD = Math.random() * user1DribbleDEF;

    //유저2
    const user2DribbleSTR = user2STR + user1STR;
    const user2DribbleMID = user2STR + user1MID;
    const user2DribbleDEF = user2STR + user1DEF;
    const user2RS = Math.random() * user2DribbleSTR;
    const user2RM = Math.random() * user2DribbleMID;
    const user2RD = Math.random() * user2DribbleDEF;

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
      //유저1
      resultMessage += `유저1 공격수의 드리블`;
      // 공격수 돌파시도
      if (user1RS < user1STR) {
        resultMessage += `\n유저1의 ${user1Striker.playerName} 선수가 상대 ${user2Striker.playerName} 선수를 뚫고 지나갑니다. `;

        // 미드필더 돌파시도
        if (user1RM < user1STR) {
          resultMessage += `\n유저1의 ${user1Striker.playerName} 선수가 상대 ${user2Midfielder.playerName} 선수를 뚫고 지나갑니다. `;

          // 수비수 돌파시도
          if (user1RD < user1STR) {
            resultMessage += `\n유저1의 ${user1Striker.playerName} 선수가 상대 ${user2Defender.playerName} 선수를 뚫고 골을 넣었습니다!`;
            currentUser_1Score++;
            resultMessage += `\n현재스코어 ${currentUser_1Score} : ${currentUser_2Score}`;
          } else {
            resultMessage +=
              '\n상대 수비수에게 막혔습니다. 공이 유저2 공격수에게 패스됩니다.';
            currentTurn++;
          }
        } else {
          resultMessage +=
            '\n상대 미드필더에게 막혔습니다. 공이 유저2 공격수에게 패스됩니다.';
          currentTurn++;
        }
      } else {
        resultMessage +=
          '\n상대 공격수에게 막혔습니다. 유저2 공격수가 드리블합니다.';
        currentTurn++;
      }
    } else {
      //유저2
      resultMessage += `유저2 공격수의 드리블`;
      // 공격수 시도
      if (user2RS < user2STR) {
        resultMessage += `\n유저2의 ${enemyStriker.playerName} 선수가 상대 ${myStriker.playerName} 선수를 뚫고 지나갑니다. `;

        // 미드필더 시도
        if (user2RM < user2STR) {
          resultMessage += `\n유저2의 ${enemyMidfielder.playerName} 선수가 상대 ${myMidfielder.playerName} 선수를 뚫고 지나갑니다. `;

          // 수비수 시도
          if (user2RD < user2STR) {
            resultMessage += `\n유저2의 ${enemyDefender.playerName} 선수가 상대 ${myDefender.playerName} 선수를 뚫고 골을 넣었습니다!`;
            currentUser_2Score++;
            resultMessage += `\n현재스코어 ${currentUser_1Score} : ${currentUser_2Score}`;
          } else {
            resultMessage +=
              '\n상대 수비수가 막았습니다. 공을 유저1 공격수에게 패스합니다.';
            currentTurn++;
          }
        } else {
          resultMessage +=
            '\n상대 미드필더가 막았습니다. 공을 유저1 공격수에게 패스합니다.';
          currentTurn++;
        }
      } else {
        resultMessage +=
          '\n상대 공격수가 막았습니다. 유저1 공격수가 드리블합니다.';
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

//게임세션 제거
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

    /*승패 기록 필요*/
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

export default router;
