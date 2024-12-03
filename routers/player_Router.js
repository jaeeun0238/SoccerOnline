import express from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../uts/prisma/index.js';

const router = express.Router();
// 플레이어생성 api
router.post('/player/make', async (req, res, next) => {
  try {
    //body로 전달 받은 객체 구조분해할당
    const {
      playerName,
      playerAbilityATCK,
      playerAbilityDEFEND,
      playerAbilityMOBILITY,
    } = req.body;
    const player = await prisma.playerData.create({
      data: {
        playerName,
        playerAbilityATCK,
        playerAbilityDEFEND,
        playerAbilityMOBILITY,
      },
    });

    // 성공시 전달 받은
    return res.status(201).json({
      message: `성공적으로 선수를 생성하였습니다. 
        선수 이름 : ${playerName}
        공격력 : ${playerAbilityATCK}
        수비력 : ${playerAbilityDEFEND}
        속력 : ${playerAbilityMOBILITY}
        `,
    });
  } catch (err) {
    next(err);
  }
});

// 플레이어 뽑기 api

const gachaCosT = 100;  // 1회 가챠 비용 (예시로 100 설정)

// 가챠 함수
const performGacha = async (userID) => {
  try {
    //트랜잭션 추가
    const result = await prisma.$transaction(async (prisma) => {

      // 유저 정보 조회
      const user = await prisma.userData.findUnique({
        where: { userID },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // 유저 캐시 확인
      if (user.userCash < gachaCosT) {
        throw new Error('Not enough cash for gacha');
      }

      // 캐시 차감
      const updatedUser = await prisma.userData.update({
        where: { userID },
        data: {
          userCash: user.userCash - gachaCosT,  // 가챠 비용 차감
        },
      });

      // playerData에서 랜덤한 선수 선택
      const players = await prisma.playerData.findMany();
      const randomPlayer = players[Math.floor(Math.random() * players.length)];

      // 해당 유저의 playerRostersData에 선택한 선수 추가
      const playerRoster = await prisma.playerRostersData.upsert({
        where: { userPID: user.userPID },
        update: {
          playerPID: randomPlayer.playerPID,
        },
        create: {
          userPID: user.userPID,
          playerPID: randomPlayer.playerPID,  // 선수 추가
        },
      });
      return {
        updatedUser,
        randomPlayer,
      };
    });

    return {
      message: `
      🌟✨🌟✨🌟✨🌟
      Congratulations! You got ${result.randomPlayer.playerName}!
      🌟✨🌟✨🌟✨🌟
      `,
      player: randomPlayer,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

// 선수 뽑기 API
router.post('/api/player/gacha', async (req, res) => {
  const { userID } = req.body;

  const result = await performGacha(userID);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.status(200).json({
    message: result.message,
    player: result.player,
  });
});

export default router;