import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import { Prisma } from '@prisma/client';
import errModel from '../uts/models/errModel.js';
import removeAtIndex from '../uts/models/removeIndex.js';

const router = express.Router();
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
//스트라이커 용도 함수
const striker = async (userPID, rostersIndex, isSet, next) => {
  //보유 하고있는 로스터 데이터
  const checkRosters = await prisma.player_rosters_Data.findFirst({
    whele: {
      userPID: userPID,
    },
    select: {
      maxHave_Rosters: true,
      have_Rosters: true,
    },
  });
  //기본 적인 스쿼드 데이터
  const checkSquads = await prisma.player_squads_Data.findFirst({
    whele: {
      userPID: userPID,
    },
    select: {
      strikerPosition: true,
      maxHave_Squads: true,
    },
  });
  if (!checkRosters || !checkSquads) {
    return next(errModel(400, '회원정보가 없습니다.'));
  }
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
    const rosters_temp = removeAtIndex(checkRosters.have_Rosters, rostersIndex);

    //이제 db에 저장하는 트렌직션
    const [striker_data] = await prisma.$transaction(
      async (tx) => {
        await tx.player_rosters_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            have_Rosters: rosters_temp,
          },
        });
        const striker_data = await tx.player_squads_Data.update({
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
        const rosters_data = await tx.player_rosters_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            have_Rosters: rosters_temp,
          },
        });
        await tx.player_squads_Data.update({
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
};
//미드필더 용도 함수
const midfielder = async (userPID, rostersIndex, isSet, next) => {
  const checkRosters = await prisma.player_rosters_Data.findFirst({
    whele: {
      userPID: userPID,
    },
    select: {
      maxHave_Rosters: true,
      have_Rosters: true,
    },
  });
  //기본 적인 스쿼드 데이터
  const checkSquads = await prisma.player_squads_Data.findFirst({
    whele: {
      userPID: userPID,
    },
    select: {
      midfielderPosition: true,
      maxHave_Squads: true,
    },
  });
  if (!checkRosters || !checkSquads) {
    return next(errModel(400, '회원정보가 없습니다.'));
  }
  if (isSet) {
    //스쿼드에 집어넣음
    if (
      checkRosters.have_Rosters[rostersIndex] === undefined ||
      checkSquads.midfielderPosition.length >= checkSquads.maxHave_Squads
    ) {
      return next(errModel(404, '남은 공간이 모자르거나 데이터가 없습니다.'));
    }
    //데이터 가공
    const Squads_temp = [
      ...checkSquads.midfielderPosition,
      checkRosters.have_Rosters[rostersIndex],
    ];
    const rosters_temp = removeAtIndex(checkRosters.have_Rosters, rostersIndex);

    //이제 db에 저장하는 트렌직션
    const [midfielder_data] = await prisma.$transaction(
      async (tx) => {
        await tx.player_rosters_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            have_Rosters: rosters_temp,
          },
        });
        const midfielder_data = await tx.player_squads_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            midfielderPosition: Squads_temp,
          },
        });
        return [midfielder_data];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
    return midfielder_data;
  } else {
    if (
      checkSquads.midfielderPosition[rostersIndex] === undefined ||
      checkRosters.have_Rosters.length >= checkRosters.maxHave_Rosters
    ) {
      return next(errModel(404, '남은 공간이 모자르거나 데이터가 없습니다.'));
    }
    //데이터 가공
    const rosters_temp = [
      ...checkRosters.have_Rosters,
      checkSquads.midfielderPosition[rostersIndex],
    ];
    const Squads_temp = removeAtIndex(
      checkSquads.midfielderPosition,
      rostersIndex,
    );

    //이제 db에 저장하는 트렌직션
    const [rosters_data] = await prisma.$transaction(
      async (tx) => {
        const rosters_data = await tx.player_rosters_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            have_Rosters: rosters_temp,
          },
        });
        await tx.player_squads_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            midfielderPosition: Squads_temp,
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
};
//디펜더 용도 함수
const defender = async (userPID, rostersIndex, isSet, next) => {
  const checkRosters = await prisma.player_rosters_Data.findFirst({
    whele: {
      userPID: userPID,
    },
    select: {
      maxHave_Rosters: true,
      have_Rosters: true,
    },
  });
  //기본 적인 스쿼드 데이터
  const checkSquads = await prisma.player_squads_Data.findFirst({
    whele: {
      userPID: userPID,
    },
    select: {
      defenderPosition: true,
      maxHave_Squads: true,
    },
  });
  if (!checkRosters || !checkSquads) {
    return next(errModel(400, '회원정보가 없습니다.'));
  }
  if (isSet) {
    //스쿼드에 집어넣음
    if (
      checkRosters.have_Rosters[rostersIndex] === undefined ||
      checkSquads.defenderPosition.length >= checkSquads.maxHave_Squads
    ) {
      return next(errModel(404, '남은 공간이 모자르거나 데이터가 없습니다.'));
    }
    //데이터 가공
    const Squads_temp = [
      ...checkSquads.defenderPosition,
      checkRosters.have_Rosters[rostersIndex],
    ];
    const rosters_temp = removeAtIndex(checkRosters.have_Rosters, rostersIndex);

    //이제 db에 저장하는 트렌직션
    const [defender_data] = await prisma.$transaction(
      async (tx) => {
        await tx.player_rosters_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            have_Rosters: rosters_temp,
          },
        });
        const defender_data = await tx.player_squads_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            defenderPosition: Squads_temp,
          },
        });
        return [defender_data];
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
    return defender_data;
  } else {
    if (
      checkSquads.defenderPosition[rostersIndex] === undefined ||
      checkRosters.have_Rosters.length >= checkRosters.maxHave_Rosters
    ) {
      return next(errModel(404, '남은 공간이 모자르거나 데이터가 없습니다.'));
    }
    //데이터 가공
    const rosters_temp = [
      ...checkRosters.have_Rosters,
      checkSquads.defenderPosition[rostersIndex],
    ];
    const Squads_temp = removeAtIndex(
      checkSquads.defenderPosition,
      rostersIndex,
    );

    //이제 db에 저장하는 트렌직션
    const [rosters_data] = await prisma.$transaction(
      async (tx) => {
        const rosters_data = await tx.player_rosters_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            have_Rosters: rosters_temp,
          },
        });
        await tx.player_squads_Data.update({
          where: {
            userPID: userPID,
          },
          data: {
            defenderPosition: Squads_temp,
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
};
export default router;
