import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import { Prisma } from '@prisma/client';
import removeAtIndex from '../uts/models/removeIndex.js';

const router = express.Router();

const maxHave_Rosters = 20; //보유할수 있는 최대값
const maxHave_Squads = 1; //장착 할수 있는 최대값
//인벤토리 선택한 인덱스 받아와서 어떤 포지션에 넣을지 정하기
router.patch(
  '/api/team/Set/:positionIndex/what/:playerRostersPID',
  async (res, req, next) => {
    const { positionIndex } = req.params.positionIndex;
    const { playerRostersPID } = req.params.playerRostersPID;
    const { userPID } = req.user;
    let data_temp = {};
    switch (positionIndex) {
      case 'ST':
        data_temp = striker(userPID, playerRostersPID, true, next);
        break;
      case 'MF':
        data_temp = midfielder(userPID, playerRostersPID, true, next);
        break;
      case 'DF':
        data_temp = defender(userPID, playerRostersPID, true, next);
        break;
      default:
        return next(
          errModel(400, '잘못된 형식의 포지션 입니다. 약자로 입력해주세요.'),
        );
    }
    return res
      .status(201)
      .json({ message: '팀에 성공적으로 배치했습니다!', data: data_temp });
  },
);
//팀 선택창에서 해제
//팀 갱신
router.get('/api/team/Get/:userPID', async (res, req, next) => {
  const { userPID } = req.params;
  const checkHaveRouter = await prisma.playerRostersData.findMany({
    whele: {
      userPID: userPID,
    },
  });
  if (!checkHaveRouter) {
    return next(
      errModel(404, '잘못된 형식의 포지션 입니다. 약자로 입력해주세요.'),
    );
  }
  //기본 적인 스쿼드 데이터
  const checkSquads = await prisma.playerSquadsData.findFirst({
    whele: {
      userPID: userPID,
    },
    select: {
      strikerPosition: true,
      midfielderPosition: true,
      defenderPosition: true,
    },
  });
  if (!checkSquads) {
    return next(
      errModel(404, '잘못된 형식의 포지션 입니다. 약자로 입력해주세요.'),
    );
  }
  return res.status(201).json({
    message: ' 팀 스쿼드 배치와 보유 선수 현황입니다.',
    data: { checkSquads, checkHaveRouter },
  });
});
//스트라이커 용도 함수
const striker = async (userPID, playerRostersPID, isSet, next) => {
  try {
    //보유 하고있는 로스터 데이터
    const checkHaveRouter = isSet
      ? await prisma.playerRostersData.findMany({
          whele: {
            userPID: userPID,
            playerRostersPID: playerRostersPID,
          },
          select: {
            playerPID: true,
            playerRostersPID: true,
          },
        })
      : await prisma.playerRostersData.findMany({
          whele: {
            userPID: userPID,
          },
          select: {
            playerPID: true,
            playerRostersPID: true,
          },
        });
    const checkEquipRouter = await prisma.playerRostersData.findMany({
      whele: {
        userPID: userPID,
        playerRostersPID: playerRostersPID,
      },
      select: {
        playerPID: true,
        playerRostersPID: true,
      },
    });
    if (isSet) {
      //스쿼드에 집어넣음
      if (
        checkHaveRouter.length === 0 ||
        checkSquads.strikerPositionPlayerPID === playerRostersPID
      ) {
        throw {
          statusCode: 404,
          message: '이미 장착중이거나 데이터가 없습니다.',
        };
      }
      //이제 db에 저장하는 트렌직션
      const [striker_data] = await prisma.$transaction(
        async (tx) => {
          await tx.playerRostersData.update({
            where: {
              userPID: userPID,
            },
            data: {
              have_Rosters: rosters_temp,
            },
          });
          const striker_data = await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              strikerPosition: Squads_temp,
            },
          });
          return [striker_data];
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
      return striker_data;
    } else {
      if (
        checkSquads.strikerPosition[playerRostersPID] === undefined ||
        checkHaveRouter.have_Rosters.length >= checkHaveRouter.maxHave_Rosters
      ) {
        return next(errModel(404, '남은 공간이 모자르거나 데이터가 없습니다.'));
      }
      //데이터 가공
      const rosters_temp = [
        ...checkHaveRouter.have_Rosters,
        checkSquads.strikerPosition[playerRostersPID],
      ];
      const Squads_temp = removeAtIndex(
        checkSquads.strikerPosition,
        playerRostersPID,
      );

      //이제 db에 저장하는 트렌직션
      const [rosters_data] = await prisma.$transaction(
        async (tx) => {
          const rosters_data = await tx.playerRostersData.update({
            where: {
              userPID: userPID,
            },
            data: {
              have_Rosters: rosters_temp,
            },
          });
          await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              strikerPosition: Squads_temp,
            },
          });
          return [rosters_data];
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
      return rosters_data;
    }
  } catch (err) {
    next(err);
  }
};
//미드필더 용도 함수
const midfielder = async (userPID, rostersIndex, isSet, next) => {};
//디펜더 용도 함수
const defender = async (userPID, rostersIndex, isSet, next) => {};
export default router;
