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
    const user_temp = await prisma.userData.findMany({
      where: {
        NOT: {
          userPID: +user_1,
        },
        gameSessionPID: null,
        userScore: {
          gte: min_score,
          lte: max_score,
        },
      },
      take: 10,
      include: {
        playerSquadsData: {
          include: {
            playerEquipRostersData: true,
          },
        },
      },
    });
    console.log(user_temp[0].playerSquadsData);

    let user_2;
    user_temp.forEach((user_data) => {
      if (user_data.playerSquadsData[0].playerEquipRostersData.length >= 3) {
        return (user_2 = user_data);
      }
    });
    //매칭 실패
    console.log(user_2);
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

router.post('/game-start', authMiddleware, async (req, res, next) => {
  try {
    const { gameSessionPID } = req.user;

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

    let user_1_player = [];

    // 유저 데이터[0] 첫번째 유저의 스쿼드데이터에 플레이어 로스터 데이터의 갯수만큼 반복
    for (
      let i = 0;
      i <
      user_data.userData[0].playerSquadsData[0].playerEquipRostersData.length;
      i++
    ) {
      // 유저 데이터[0] 첫번째 유저의 스쿼드데이터에 플레이어 로스터 데이터의[i]번째의 playerRostPID의 보유선수 데이터 잘하면 여기 스킵 가능
      const isPlayer_temp = await prisma.playerRostersData.findUnique({
        where: {
          playerRostersPID:
            user_data.userData[0].playerSquadsData[0].playerEquipRostersData[i]
              .playerRostersPID,
        },
      });
      // 그 받아온 선수의 데이터를 선수데이터 db를 불러와서 선수의 실질적인 데이터 받아오기.
      const player = await prisma.playerData.findFirst({
        where: { playerPID: isPlayer_temp.playerPID },
      });
      //여기서 플레이어 선수 푸쉬 해주기
      user_1_player.push({
        player: player,
        playerPosition:
          user_data.userData[0].playerSquadsData[0].playerEquipRostersData[i]
            .position,
      });
    }

    //유저2선수
    let user_2_player = [];
    for (
      let i = 0;
      i <
      user_data.userData[1].playerSquadsData[0].playerEquipRostersData.length;
      i++
    ) {
      const isPlayer_temp = await prisma.playerRostersData.findUnique({
        where: {
          playerRostersPID:
            user_data.userData[1].playerSquadsData[0].playerEquipRostersData[i]
              .playerRostersPID,
        },
      });
      const player = await prisma.playerData.findFirst({
        where: { playerPID: isPlayer_temp.playerPID },
      });
      user_2_player.push({
        player: player,
        playerPosition:
          user_data.userData[1].playerSquadsData[0].playerEquipRostersData[i]
            .position,
      });
    }

    let user1Striker = user_1_player[0];
    let user1Midfielder = user_1_player[1];
    let user1Defender = user_1_player[2];
    let user2Striker = user_2_player[0];
    let user2Midfielder = user_2_player[1];
    let user2Defender = user_2_player[2];

    //스탯 정규화
    //유저1

    let user1STR =
      user1Striker.player.playerAbilityATCK * 1.1 +
      user1Striker.player.playerAbilityDEFEND * 0.8 +
      user1Striker.player.playerAbilityMOBILITY * 0.7;
    let user1MID =
      user1Midfielder.player.playerAbilityATCK +
      user1Midfielder.player.playerAbilityDEFEND * 0.8 +
      user1Midfielder.player.playerAbilityMOBILITY;
    let user1DEF =
      user1Defender.player.playerAbilityATCK * 0.8 +
      user1Defender.player.playerAbilityDEFEND * 1.2 +
      user1Defender.player.playerAbilityMOBILITY * 0.7;
    //유저2
    let user2STR =
      user2Striker.player.playerAbilityATCK * 1.1 +
      user2Striker.player.playerAbilityDEFEND * 0.8 +
      user2Striker.player.playerAbilityMOBILITY * 0.7;
    let user2MID =
      user2Midfielder.player.playerAbilityATCK +
      user2Midfielder.player.playerAbilityDEFEND * 0.8 +
      user2Midfielder.player.playerAbilityMOBILITY;
    let user2DEF =
      user2Defender.player.playerAbilityATCK * 0.8 +
      user2Defender.player.playerAbilityDEFEND * 1.2 +
      user2Defender.player.playerAbilityMOBILITY * 0.7;

    //돌파가능 수치정하기
    //유저1
    let user1DribbleSTR = user1STR + user2STR;
    let user1DribbleMID = user1STR + user2MID;
    let user1DribbleDEF = user1STR + user2DEF;
    let user1RS = Math.random() * user1DribbleSTR;
    let user1RM = Math.random() * user1DribbleMID;
    let user1RD = Math.random() * user1DribbleDEF;

    //유저2
    let user2DribbleSTR = user2STR + user1STR;
    let user2DribbleMID = user2STR + user1MID;
    let user2DribbleDEF = user2STR + user1DEF;
    let user2RS = Math.random() * user2DribbleSTR;
    let user2RM = Math.random() * user2DribbleMID;
    let user2RD = Math.random() * user2DribbleDEF;

    let resultMessage = '';
    let gameSession = await prisma.gameSession.findFirst({
      where: { gameSessionPID },
    });

    let currentTurn = gameSession ? gameSession.sessionTurn : 0;
    let currentUser_1Score = gameSession ? gameSession.userScore_1 : 0;
    let currentUser_2Score = gameSession ? gameSession.userScore_2 : 0;

    if (currentTurn % 2 === 0) {
      //유저1
      resultMessage += `유저1 공격수의 드리블`;
      // 공격수 돌파시도
      if (user1RS < user1STR) {
        resultMessage += `\n유저1의 ${user1Striker.player.playerName} 선수가 상대 ${user2Striker.player.playerName} 선수를 뚫고 지나갑니다. `;

        // 미드필더 돌파시도
        if (user1RM < user1STR) {
          resultMessage += `\n유저1의 ${user1Striker.player.playerName} 선수가 상대 ${user2Midfielder.player.playerName} 선수를 뚫고 지나갑니다. `;

          // 수비수 돌파시도
          if (user1RD < user1STR) {
            resultMessage += `\n유저1의 ${user1Striker.player.playerName} 선수가 상대 ${user2Defender.player.playerName} 선수를 뚫고 골을 넣었습니다!`;
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
        resultMessage += `\n유저2의 ${user2Striker.player.playerName} 선수가 상대 ${user1Striker.player.playerName} 선수를 뚫고 지나갑니다. `;

        // 미드필더 시도
        if (user2RM < user2STR) {
          resultMessage += `\n유저2의 ${user2Striker.player.playerName} 선수가 상대 ${user1Midfielder.player.playerName} 선수를 뚫고 지나갑니다. `;

          // 수비수 시도
          if (user2RD < user2STR) {
            resultMessage += `\n유저2의 ${user2Striker.player.playerName} 선수가 상대 ${user1Defender.player.playerName} 선수를 뚫고 골을 넣었습니다!`;
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

//경기종료
router.delete('/game-end', authMiddleware, async (req, res, next) => {
  try {
    const { gameSessionPID } = req.user;
    //유저데이터
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
    //유저스코어
    if (user_data.userScore_1 > user_data.userScore_2) {
      await prisma.userData.update({
        where: {
          userPID: userPID_1,
        },
        data: {
          userScore: user_data.userData[0].userScore + 10,
        },
      });
      await prisma.userData.update({
        where: {
          userPID: userPID_2,
        },
        data: {
          userScore: user_data.userData[1].userScore - 10,
        },
      });
    }
    if (user_data.userScore_1 < user_data.userScore_2) {
      await prisma.userData.update({
        where: {
          userPID: userPID_2,
        },
        data: {
          userScore: user_data.userData[1].userScore + 10,
        },
      });
      await prisma.userData.update({
        where: {
          userPID: userPID_1,
        },
        data: {
          userScore: user_data.userData[0].userScore - 10,
        },
      });
    }
    if (user_data.userScore_1 === user_data.userScore_2) {
      await prisma.userData.update({
        where: {
          userPID: userPID_1,
        },
        data: {
          userScore: user_data.userData[0].userScore,
        },
      });
      await prisma.userData.update({
        where: {
          userPID: userPID_2,
        },
        data: {
          userScore: user_data.userData[1].userScore,
        },
      });
    }
    await prisma.gameSessionHistory.create({
      data: {
        userPID_1: userPID_1,
        userPID_2: userPID_2,
        userScore_1: user_data.userScore_1,
        userScore_2: user_data.userScore_2,
      },
    });
    await prisma.gameSession.delete({
      where: {
        gameSessionPID: gameSessionPID,
      },
    });
    res.status(200).json({
      경기종료: `${user_data.userScore_1} : ${user_data.userScore_2}`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
