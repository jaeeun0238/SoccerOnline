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
      playerPID,
      playerName,
      playerAbilityATCK,
      playerAbilityDEFEND,
      playerAbilityMOBILITY,
    } = req.body;
    await prisma.$transaction(async (tranPrisma) => {
      const player = await tranPrisma.playerData.create({
        data: {
          playerPID,
          playerName,
          playerAbilityATCK,
          playerAbilityDEFEND,
          playerAbilityMOBILITY,
        },
      });
    });
    // 성공시 전달 받은
    return res.status(201).json({
      message: `성공적으로 선수를 생성하였습니다. 선수ID : ${playerPID} 선수 이름 : ${playerName}  공격력 : ${playerAbilityATCK} 수비력 : ${playerAbilityDEFEND} 속력 : ${playerAbilityMOBILITY}
        `,
    });
  } catch (err) {
    next(err);
  }
});

// 플레이어 뽑기 api

const gachaCosT = 100; // 1회 가챠 비용 (예시로 100 설정)

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
          userCash: user.userCash - gachaCosT, // 가챠 비용 차감
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
  const { userID } = req.user;

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
  
  const maxUpgrade = 10; // 최대 강화 단계

  try {
    const { userPID } = req.user; // 인증된 유저 정보 가져오기
    const { playerRostersPID, materials } = req.body; // 요청 바디에서 playerRostersPID와 materials 가져오기

    // 유저 정보 조회
    const user = await prisma.userData.findUnique({
      where: { userPID },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // playerRostersPID를 통해 특정 선수 찾기
    const existingPlayer = await prisma.playerRostersData.findUnique({
      where: {
        playerRostersPID, // playerRostersPID로 확인
      },
    });

    if (!existingPlayer) {
      throw new Error('Player does not exist');
    }

    // playerPID를 통해 playerData 조회
    const playerStats = await prisma.playerData.findUnique({
      where: {
        playerPID: existingPlayer.playerPID, // existingPlayer에서 playerPID를 사용하여 조회
      },
    });

    if (!playerStats) {
      throw new Error('Player data not found');
    }

    // 강화 재료 확인
    if (!materials || !Array.isArray(materials) || materials.length < 1 || materials.length > 5) {
      return res.status(400).json({ message: '강화에 최소 1명의 선수, 최대 5명이 필요합니다.' });
    }

    const materialCheck = await prisma.playerRostersData.findMany({
      where: {
        userPID,
        playerRostersPID: { in: materials },
      },
    });

    // // 중복된 playerPID 중 하나만 선택
    // const uniqueMaterialCheck = [];
    // const seen = new Set();

    // materialCheck.forEach((item) => {
    //   if (!seen.has(item.playerRostersPID)) {
    //     uniqueMaterialCheck.push(item);
    //     seen.add(item.playerRostersPID);
    //   }
    // });  >> PlayerID로 강화할 경우 필요

    // 강화 재료가 유저 보유 선수인지 확인
    if (materialCheck.length !== materials.length) {
      return res.status(400).json({ message: '강화 재료로 사용할 선수는 보유 선수가 아닙니다.' });
    }

    // 현재 강화 단계 확인
    const currentUpgradeLevel = existingPlayer.playerEnchant || 0; // 현재 강화 단계
    if (currentUpgradeLevel >= maxUpgrade) {
      return res.status(400).json({ message: '선수는 이미 최대 강화 단계에 도달했습니다.' });
    }

    //강화 확률 설정
    let maxSuccessRate = Math.min(materials.length * 20, 100); //materials가 100을 넘길 수 있으므로 최대 100으로 설정
    switch (existingPlayer.playerEnchant) {
      case 0:
        maxSuccessRate -= 0;
        break;
      case 1:
        maxSuccessRate -= 0;
        break;
      case 2:
        maxSuccessRate -= 19;
        break;
      case 3:
        maxSuccessRate -= 36;
        break;
      case 4:
        maxSuccessRate -= 50;
        break;
      case 5:
        maxSuccessRate -= 74;
        break;
      case 6:
        maxSuccessRate -= 85;
        break;
      case 7:
        maxSuccessRate -= 93;
        break;
      case 8:
        maxSuccessRate -= 95;
        break;
      case 9:
        maxSuccessRate -= 96;
        break;
      //추후 업그레이드 시 단계 추가
      default:
        break;
    }

    //강화 성공 시 선수 어빌리티 증가량 설정
    let upgradeAbility = 0
    switch (existingPlayer.playerEnchant) {
      case 0:
        upgradeAbility += 1;
        break;
      case 1:
        upgradeAbility += 1;
        break;
      case 2:
        upgradeAbility += 1;
        break;
      case 3:
        upgradeAbility += 2;
        break;
      case 4:
        upgradeAbility += 2;
        break;
      case 5:
        upgradeAbility += 3;
        break;
      case 6:
        upgradeAbility += 3;
        break;
      case 7:
        upgradeAbility += 4;
        break;
      case 8:
        upgradeAbility += 5;
        break;
      case 9:
        upgradeAbility += 5;
        break;
      default:
        break;
    }

    const isSuccess = Math.random() * 100 <= maxSuccessRate

    // 강화 실패 처리
    if (!isSuccess) {
      return res.status(200).json({ message: '강화에 실패하였습니다.' });
    }

    // playerRostersData에서 해당 playerRostersPID만 업데이트
    const updatedRosterPlayer = await prisma.playerRostersData.update({
      where: {
        playerRostersPID, // playerRostersPID로 해당 선수만 업데이트
      },
      data: {
        playerEnchant: existingPlayer.playerEnchant + 1, // 강화 단계 증가
      },
    });

    // 선수 강화
    // const updatedPlayer = await prisma.playerData.update({
    //   where: { playerPID: existingPlayer.playerPID }, // 기존 playerPID를 사용하여 업데이트
    //   data: {
    //     playerAbilityATCK: playerStats.playerAbilityATCK + upgradeAbility, // 능력치 강화
    //     playerAbilityDEFEND: playerStats.playerAbilityDEFEND + upgradeAbility,
    //     playerAbilityMOBILITY: playerStats.playerAbilityMOBILITY + upgradeAbility,
    //     playerEnchant: existingPlayer.playerEnchant + 1, // 강화 단계 증가
    //   },
    // }); >> 추후 RosterData에 능력치가 적용가능할 시 주석 해제

    // 강화 재료 선수들 삭제
    await prisma.playerRostersData.deleteMany({
      where: {
        userPID,
        playerRostersPID: { in: materials },
      },
    });

    return res.status(200).json({
      message: `선수 강화가 완료되었습니다!`,
      //updatedPlayer,
      updatedRosterPlayer, // 변경된 playerRostersData 추가
    });
  } catch (err) {
    next(err);
  }
};

// 선수 강화 API 라우터 설정
router.put('/player/upgrade', authenticateJWT, upgradePlayer);

export default router;
