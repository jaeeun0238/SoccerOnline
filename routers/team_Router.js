import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import { Prisma } from '@prisma/client';
import authMiddleware from '../middlewares/auth.middleware.js';

const maxHave_Rosters = 50; //보유할수 있는 최대값
const maxHave_Squads = 3; //장착 할수 있는 최대값

const max_positon = 1; //
const can_postions = [0, 1, 2]; // 0: striker, 1: midfielder, 2: defender

const router = express.Router();

router.patch(
  //인증으로 userPID받아오기 팀에 집어넣는 로직
  '/team/Set/:positionIndex/what/:playerRostersPID',
  authMiddleware,
  async (req, res, next) => {
    const { positionIndex, playerRostersPID } = req.params;
    const { userPID } = req.user;
    try {
      let data_temp = await equip(
        +userPID,
        +playerRostersPID,
        +positionIndex,
        next,
      );
      if (!data_temp) {
        throw {
          status: 404,
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
router.delete(
  //인증으로 userPID받아오기 팀에서 빼는 거
  '/team/Get/what/:playerRostersPID',
  authMiddleware,
  async (req, res, next) => {
    const { playerRostersPID } = req.params;
    const { userPID } = req.user;
    try {
      let data_temp = await Unequip(+userPID, +playerRostersPID, next);
      return res
        .status(201)
        .json({ message: '팀에서 성공적으로 해제했습니다!', data: data_temp });
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

    const squads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: +userPID,
      },
      include: {
        playerEquipRostersData: {
          include: {
            playerRostersData: true,
          },
        },
      },
    });
    //기본 적인 스쿼드 데이터
    return res.status(201).json({
      message: ' 팀 스쿼드 배치 보유 선수 현황입니다.',
      data: { squads, checkHaveRouter },
    });
  } catch (err) {
    next(err);
  }
});
//전체 장착 용도 함수
const equip = async (userPID, playerRostersPID, postionData, next) => {
  try {
    if (postionData > can_postions.length) {
      throw {
        status: 400,
        message: '포지션 형식에 주의 해주세요.',
      };
    }
    //보유 하고있는 로스터 데이터
    const checkHaveRouter = await prisma.playerRostersData.findFirst({
      where: {
        userPID: userPID,
        playerRostersPID: playerRostersPID,
      },
      select: {
        playerPID: true,
        playerRostersPID: true,
      },
    });
    // 현재 장착하고 있는 팀

    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: +userPID,
      },
      include: {
        playerEquipRostersData: {},
      },
    });
    //스쿼드 찾기 나중에 다중 스쿼드로 구성하면 many로 받기
    //스쿼드에 집어넣음
    if (
      !checkHaveRouter ||
      !checkSquads ||
      checkSquads.playerEquipRostersData.length >= maxHave_Squads
    ) {
      throw {
        status: 404,
        message: '최대 장착중이거나 데이터가 없습니다.',
      };
    } else if (isUse(checkSquads.playerEquipRostersData, playerRostersPID, 1)) {
      throw {
        status: 404,
        message: '이미 장착중입니다..',
      };
    } else if (isUse(checkSquads.playerEquipRostersData, postionData, 0)) {
      throw {
        status: 400,
        message: '장착중인 포지션 입니다.',
      };
    }
    //이제 db에 저장하는 트렌직션
    //장착 테이블에 생성
    const make_data = await prisma.playerEquipRostersData.create({
      data: {
        playerSquadsPID: checkSquads.playerSquadsPID,
        playerRostersPID: checkHaveRouter.playerRostersPID,
        position: postionData,
      },
    });
    return make_data;
  } catch (err) {
    next(err);
  }
};
const Unequip = async (userPID, playerRostersPID, next) => {
  try {
    //보유 하고있는 로스터 데이터
    const checkHaveRouter = await prisma.playerRostersData.findMany({
      where: {
        userPID: userPID,
      },
      select: {
        playerPID: true,
        playerRostersPID: true,
      },
    });
    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: +userPID,
      },
      include: {
        playerEquipRostersData: {},
      },
    });
    if (
      !checkSquads.playerEquipRostersData.some(
        (data) => data.playerEquipRostersPID === playerRostersPID,
      )
    ) {
      throw {
        status: 404,
        message: '지목하신 데이터가 없습니다.',
      };
    }
    console.log(checkSquads);
    //스쿼드 데이터 인클루드로 받아서 체크
    if (!checkSquads || checkHaveRouter.length >= maxHave_Rosters) {
      throw {
        status: 404,
        message: '최대 보유중 이거나 데이터가 없습니다.',
      };
    }
    //삭제
    await prisma.playerEquipRostersData.delete({
      where: {
        playerEquipRostersPID: playerRostersPID,
      },
    });
  } catch (err) {
    next(err);
  }
};
// 장착중인 포지션 , 장착중 체크용도.
const isUse = (checkEquipRouter, indexData, statuse) => {
  // 0 position 1 선수로스터아이디
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
