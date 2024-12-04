import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import { Prisma } from '@prisma/client';

const maxHave_Rosters = 50; //보유할수 있는 최대값
const maxHave_Squads = 3; //장착 할수 있는 최대값

const max_positon = 1; //
const can_postions = [0, 1, 2]; // 0: striker, 1: midfielder, 2: defender

const router = express.Router();

router.post('/testMaker', async (req, res, next) => {
  await prisma.$transaction(
    async (tx) => {
      // 보유 테이블에 생성 값은 지정한 장착한 테이블 값으로
      const user = await tx.userData.create({
        data: {
          userID: 'test12345213',
          userName: 'test이름입니다d.',
          userPassword: 'test1234',
          userScore: 0,
          userCash: 1000,
        },
      });
      console.log(user);
      // 0값으로 초기화
      await tx.playerSquadsData.create({
        data: {
          userPID: user.userPID,
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    },
  );
  return res.status(201).json({ message: '팀에 성공적으로 배치했습니다!' });
});
router.post('/getPlayer_test/:userPID', async (req, res, next) => {
  const { userPID } = req.params;
  await prisma.$transaction(async (tx) => {
    await tx.playerRostersData.create({
      data: {
        userPID: +userPID,
        playerPID: 1,
      },
    });
  });
  return res.status(201).json({ message: '팀에 성공적으로 배치했습니다!' });
});

router.patch(
  //인증으로 userPID받아오기 팀에 집어넣는 로직
  '/team/Set/:positionIndex/what/:playerRostersPID/:userPID',
  async (req, res, next) => {
    const { positionIndex, playerRostersPID, userPID } = req.params;
    try {
      let data_temp = await equipUnequip(
        +userPID,
        +playerRostersPID,
        +positionIndex,
        true,
        next,
      );
      if (!data_temp) {
        throw {
          statusCode: 404,
          message: '전달받은 데이터가 없습니다. 형식에 주의 해주세요.',
        };
      }
      return res
        .status(201)
        .json({ message: '팀에 성공적으로 배치했습니다!', data: data_temp });
    } catch (err) {
      next(err);
    }
  },
);
router.patch(
  //인증으로 userPID받아오기 팀에서 빼는 로직
  '/team/Get/:positionIndex/what/:playerRostersPID/:userPID',
  async (req, res, next) => {
    const { positionIndex, playerRostersPID, userPID } = req.params;
    try {
      await equipUnequip(
        +userPID,
        +playerRostersPID,
        +positionIndex,
        false,
        next,
      );
      return res
        .status(201)
        .json({ message: '팀에서 성공적으로 해제했습니다!' });
    } catch (err) {
      next(err);
    }
  },
);
//팀 선택창에서 해제 //인증으로 userPID받아오기

//팀 갱신
router.get('/team/Get/:userPID', async (req, res, next) => {
  const { userPID } = req.params;
  try {
    const checkHaveRouter = await prisma.playerRostersData.findMany({
      where: {
        userPID: +userPID,
      },
    });
    if (checkHaveRouter.length === 0) {
      throw {
        statusCode: 404,
        message: '보유중인 선수가 없습니다.',
      };
    }
    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: +userPID,
      },
    });
    const checkEquipRouter = await prisma.playerEquipRostersData.findMany({
      where: {
        playerSquadsPID: +checkSquads.playerSquadsPID,
      },
    });
    if (checkEquipRouter.length === 0) {
      throw {
        statusCode: 404,
        message: '스쿼드 데이터가 없습니다.',
      };
    }
    //기본 적인 스쿼드 데이터
    return res.status(201).json({
      message: ' 팀 스쿼드 배치 보유 선수 현황입니다.',
      data: { checkEquipRouter, checkHaveRouter },
    });
  } catch (err) {
    next(err);
  }
});
//전체 장착 용도 함수
const equipUnequip = async (
  userPID,
  playerRostersPID,
  postionData,
  isSet,
  next,
) => {
  try {
    if (postionData > can_postions.length) {
      throw {
        statusCode: 400,
        message: '포지션 형식에 주의 해주세요.',
      };
    }
    //보유 하고있는 로스터 데이터
    const checkHaveRouter = isSet
      ? await prisma.playerRostersData.findFirst({
          where: {
            userPID: userPID,
            playerRostersPID: playerRostersPID,
          },
          select: {
            playerPID: true,
            playerRostersPID: true,
          },
        })
      : await prisma.playerRostersData.findMany({
          where: {
            userPID: userPID,
          },
          select: {
            playerPID: true,
            playerRostersPID: true,
          },
        });
    // 현재 장착하고 있는 팀
    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: userPID,
      },
      select: {
        playerSquadsPID: true,
      },
    });
    // 장착하고있는 목록
    const checkEquipRouter = isSet
      ? await prisma.playerEquipRostersData.findMany({
          where: {
            playerSquadsPID: checkSquads.playerSquadsPID,
          },
        })
      : await prisma.playerEquipRostersData.findFirst({
          where: {
            playerRostersPID: playerRostersPID,
            playerSquadsPID: checkSquads.playerSquadsPID,
          },
        });
    //스쿼드 찾기 나중에 다중 스쿼드로 구성하면 many로 받기

    if (isSet) {
      //스쿼드에 집어넣음
      if (!checkHaveRouter || checkEquipRouter.length >= maxHave_Squads) {
        throw {
          statusCode: 404,
          message: '최대 장착중이거나 데이터가 없습니다.',
        };
      } else if (isUse(checkEquipRouter, playerRostersPID, 1)) {
        throw {
          statusCode: 404,
          message: '이미 장착중입니다..',
        };
      } else if (isUse(checkEquipRouter, postionData, 0)) {
        throw {
          statusCode: 400,
          message: '장착중인 포지션 입니다.',
        };
      }
      //이제 db에 저장하는 트렌직션
      const make_data = await prisma.$transaction(
        async (tx) => {
          //장착 테이블에 생성
          const make_data = await tx.playerEquipRostersData.create({
            data: {
              playerSquadsPID: checkSquads.playerSquadsPID,
              playerRostersPID: checkHaveRouter.playerRostersPID,
              position: postionData,
            },
          });
          return make_data;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
      return make_data;
    } else {
      if (!checkEquipRouter || checkHaveRouter.length >= maxHave_Rosters) {
        throw {
          statusCode: 404,
          message: '최대 보유중 이거나 데이터가 없습니다.',
        };
      }
      //이제 db에 저장하는 트렌직션
      await prisma.$transaction(
        async (tx) => {
          //장착 테이블에 생성
          await tx.playerEquipRostersData.delete({
            where: {
              playerSquadsPID: checkSquads.playerSquadsPID,
              playerRostersPID: checkHaveRouter.playerRostersPID,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
    }
  } catch (err) {
    next(err);
  }
};
//자동 장착 함수
const autoEquip = async (userPID, next) => {
  try {
    // 현재 장착하고 있는 팀
    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: userPID,
      },
      select: {
        playerSquadsPID: true,
      },
    });
    if (!checkSquads) {
      throw {
        statusCode: 404,
        message: '스쿼드 데이터가 없습니다.',
      };
    }
    // 장착하고있는 목록
    const checkEquipRouter = await prisma.playerEquipRostersData.findMany({
      where: {
        playerSquadsPID: checkSquads.playerSquadsPID,
      },
    });
    if (checkEquipRouter.length >= maxHave_Squads) {
      throw {
        statusCode: 400,
        message: '이미 모든 포지션에 팀원이 있습니다.',
      };
    }
    const checkHaveRouter = await prisma.playerRostersData.findMany({
      where: {
        userPID: userPID,
      },
      select: {
        playerPID: true,
        playerRostersPID: true,
      },
    });
    if (checkHaveRouter.length >= maxHave_Squads) {
      throw {
        statusCode: 400,
        message: '선수가 부족합니다..',
      };
    }
    for (let index = 0; index < maxHave_Squads; i++) {
      if (isUse()) {
      }
    }
  } catch (err) {
    next(err);
  }
};
// 장착중인 포지션 , 장착중 체크용도.
const isUse = (checkEquipRouter, indexData, statuse) => {
  // 0 position 1
  switch (statuse) {
    case 0:
      return checkEquipRouter.some((data) => data.position === indexData);
    case 1:
      return checkEquipRouter.some(
        (data) => data.playerRostersPID === indexData,
      );
    default:
      return false;
  }
};
export default router;
