import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import { Prisma } from '@prisma/client';
import errModel from '../uts/models/errModel.js';
import removeAtIndex from '../uts/models/removeIndex.js';

const router = express.Router();

const maxHave_Rosters = 20; //보유할수 있는 최대값
const maxHave_Squads = 1; //장착 할수 있는 최대값
//인벤토리 선택한 인덱스 받아와서 어떤 포지션에 넣을지 정하기
router.patch(
  '/api/team/Set/:positionIndex/what/:rostersIndex',
  async (res, req, next) => {
    const { positionIndex } = req.params.positionIndex;
    const { rostersIndex } = req.params.rostersIndex;
    const { userPID } = req.user;
    let data_temp = {};
    switch (positionIndex) {
      case 'ST':
        data_temp = striker(userPID, rostersIndex, true, next);
        break;
      case 'MF':
        data_temp = midfielder(userPID, rostersIndex, true, next);
        break;
      case 'DF':
        data_temp = defender(userPID, rostersIndex, true, next);
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
router.patch(
  '/api/team/Get/:positionIndex/what/:rostersIndex',
  async (res, req, next) => {
    const { positionIndex } = req.params.positionIndex;
    const { rostersIndex } = req.params.rostersIndex;
    const { userPID } = req.user;
    let data_temp = {};
    switch (positionIndex) {
      case 'ST':
        data_temp = striker(userPID, rostersIndex, false, next);
        break;
      case 'MF':
        data_temp = midfielder(userPID, rostersIndex, false, next);
        break;
      case 'DF':
        data_temp = defender(userPID, rostersIndex, false, next);
        break;
      default:
        return next(
          errModel(400, '잘못된 형식의 포지션 입니다. 약자로 입력해주세요.'),
        );
    }
    return res
      .status(201)
      .json({ message: '팀에서 성공적으로 해제했습니다!', data: data_temp });
  },
);
router.get('/api/team/Get/:userPID', async (res, req, next) => {
  const { userPID } = req.params;
  const checkRosters = await prisma.playerRostersData.findMany({
    whele: {
      userPID: userPID,
    },
  });
  if (!checkRosters) {
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
    data: { checkSquads, checkRosters },
  });
});
//스트라이커 용도 함수
const striker = async (userPID, rostersIndex, isSet, next) => {
  try {
    //보유 하고있는 로스터 데이터
    const checkRosters = await prisma.playerRostersData.findMany({
      whele: {
        userPID: userPID,
      },
      select: {
        playerPID: true,
      },
    });
    //기본 적인 스쿼드 데이터
    const checkSquads = await prisma.playerSquadsData.findFirst({
      whele: {
        userPID: userPID,
      },
      select: {
        strikerPositionPlayerPID: true,
      },
    });
    if (isSet) {
      //스쿼드에 집어넣음
      if (
        checkRosters.have_Rosters[rostersIndex] === undefined ||
        checkSquads.strikerPosition.length >= checkSquads.maxHave_Squads
      ) {
        return next(errModel(404, '남은 공간이 모자르거나 데이터가 없습니다.'));
      }
      //데이터 가공
      const Squads_temp = [
        ...checkSquads.strikerPosition,
        checkRosters.have_Rosters[rostersIndex],
      ];
      const rosters_temp = removeAtIndex(
        checkRosters.have_Rosters,
        rostersIndex,
      );

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
        checkSquads.strikerPosition[rostersIndex] === undefined ||
        checkRosters.have_Rosters.length >= checkRosters.maxHave_Rosters
      ) {
        return next(errModel(404, '남은 공간이 모자르거나 데이터가 없습니다.'));
      }
      //데이터 가공
      const rosters_temp = [
        ...checkRosters.have_Rosters,
        checkSquads.strikerPosition[rostersIndex],
      ];
      const Squads_temp = removeAtIndex(
        checkSquads.strikerPosition,
        rostersIndex,
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
