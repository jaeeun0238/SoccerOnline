import express from 'express';
import { PrismaClient } from '@prisma/client';
import authenticateJWT from '../middlewares/auth.middleware.js';
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
      const playerRoster = await prisma.playerRostersData.create({
        data: {
          userPID: user.userPID,
          playerPID: randomPlayer.playerPID, // 각 선수마다 고유 ID
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
      player: result.randomPlayer,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

// 선수 뽑기 API
router.post('/player/gacha', authenticateJWT, async (req, res) => {
  const { userID } = req.user.userPID;

  const result = await performGacha(userID);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.status(200).json({
    message: result.message,
    player: result.player,
  });
});


//선수 강화 API
const upgradePlayer = async (req, res, next) => {
  
  const maxUpgrade = 10 //최대 강화 단계

  try {
    const { userPID } = req.user //인증된 유저 정보 가져오기
    const { playerID, materials } = req.body

    const user = await prisma.userData.findUnique({
      where: { userPID }, //유저 정보 조회
    });

    if (!user) {
      throw new Error('User not found');
    }

    //보유 선수 확인
    const existingPlayer = await prisma.playerRostersData.findFirst({
      where: {
        userPID,
        playerPID: playerID
      },
    });

    if (!existingPlayer) {
      throw new Error('Player is not exist')
    }

    //강화 재료 확인
    if (!materials || !Array.isArray(materials) || materials.length < 1) {
      return res
        .status(400)
        .json({ message: '강화에 최소 1명의 선수가 필요합니다.' });
    }

    const materialCheck = await prisma.playerRostersData.findMany({
      where: {
        userPID,
        playerPID: { in: materials },
      },
    });

    //강화 재료가 유저 보유 선수인지 확인
    if (materialCheck.length !== materials.length) {
      return res
        .status(400)
        .json({ message: '강화 재료로 사용할 선수는 보유 선수가 아닙니다.' });
    }

    // const avgAbility = await prisma.playerRostersData.findMany({
    //   where: {
    //     playerID
    //   },
    // }); 선수 오버롤 작업

    const currentUpgradeLevel = existingPlayer.playerEnchant || 0; // 현재 강화 단계
    if (currentUpgradeLevel >= maxUpgrade) {
      return res
        .status(400)
        .json({ message: '선수는 이미 최대 강화 단계에 도달했습니다.' });
    }

    // const upgradePercent = 재료 선수 5명의 오버롤 기준 강화 확률 계산

    //선수 강화
    const updateEnchant = await prisma.playerData.update({
      where: { playerPID: playerID },
      data: {
        playerAbilityATCK: existingPlayer.playerAbilityATCK + 5,
        playerAbilityDEFEND: existingPlayer.playerAbilityDEFEND + 5,
        playerAbilityMOBILITY: existingPlayer.playerAbilityMOBILITY + 5,
        playerEnchant: existingPlayer.playerEnchant + 1,
      },
    });

    // 강화 재료 삭제
    await prisma.playerRostersData.deleteMany({
      where: {
        userPID,
        playerPID: { in: materials },
      },
    });

    return res.status(200).json({
      message: `선수 강화가 완료되었습니다!)`,
      updateEnchant,
    });
  } catch (err) {
    next(err);
    }
}

//선수 강화 API
router.put('/player/upgrade', authenticateJWT, upgradePlayer);

export default router;