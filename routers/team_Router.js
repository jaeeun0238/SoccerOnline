import express from 'express';
import { prisma } from '../uts/prisma/index.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

const maxHave_Rosters = 20; //보유할수 있는 최대값
const maxHave_Squads = 1; //장착 할수 있는 최대값

router.patch(
  '/team/Set/:positionIndex/what/:playerRostersPID/:userPID',
  async (res, req, next) => {
    const { positionIndex } = req.params.positionIndex;
    const { playerRostersPID } = req.params.playerRostersPID;
    const { userPID } = req.params;
    let data_temp = {};
    try {
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
          throw {
            statusCode: 400,
            message: '잘못된 형식의 포지션 입니다. 약자로 입력해주세요.',
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
//팀 선택창에서 해제
router.patch(
  '/team/Get/:positionIndex/what/:playerRostersPID/:userPID',
  async (res, req, next) => {
    const { positionIndex } = req.params.positionIndex;
    const { playerRostersPID } = req.params.playerRostersPID;
    const { userPID } = req.params;
    let data_temp = {};
    try {
      switch (positionIndex) {
        case 'ST':
          data_temp = striker(userPID, playerRostersPID, false, next);
          break;
        case 'MF':
          data_temp = midfielder(userPID, playerRostersPID, false, next);
          break;
        case 'DF':
          data_temp = defender(userPID, playerRostersPID, false, next);
          break;
        default:
          throw {
            statusCode: 400,
            message: '잘못된 형식의 포지션 입니다. 약자로 입력해주세요.',
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
//팀 갱신
router.get('/team/Get/:userPID', async (res, req, next) => {
  const { userPID } = req.params;
  try {
    const checkHaveRouter = await prisma.playerRostersData.findMany({
      whele: {
        userPID: userPID,
      },
    });
    if (!checkHaveRouter) {
      throw {
        statusCode: 404,
        message: '보유 중인 선수가 없습니다.',
      };
    }
    const checkEquipRouter = await prisma.playerEquipRostersData.findMany({
      whele: {
        userPID: userPID,
      },
    });
    if (!checkHaveRouter) {
      throw {
        statusCode: 404,
        message: '장착 중인 선수가 없습니다.',
      };
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
      return next(errModel(404, '스쿼드 데이터가 없습니다.'));
    }
    return res.status(201).json({
      message: ' 팀 스쿼드 배치 보유 선수 현황입니다.',
      data: { checkSquads, checkEquipRouter, checkHaveRouter },
    });
  } catch (err) {
    next(err);
  }
});
//스트라이커 용도 함수
const striker = async (userPID, playerRostersPID, isSet, next) => {
  try {
    //보유 하고있는 로스터 데이터
    const checkHaveRouter = isSet
      ? await prisma.playerRostersData.findFirst({
          whele: {
            userPID: userPID,
            playerRostersPID: playerRostersPID,
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
    //스쿼드 찾기 나중에 다중 스쿼드로 구성하면 many로 받기
    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: userPID,
      },
      select: {
        strikerPlayerRostersPID: true,
      },
    });
    if (isSet) {
      //스쿼드에 집어넣음
      if (!checkHaveRouter || checkSquads.strikerPlayerRostersPID != 0) {
        throw {
          statusCode: 404,
          message: '이미 장착중이거나 데이터가 없습니다.',
        };
      }
      //이제 db에 저장하는 트렌직션
      const striker_data = await prisma.$transaction(
        async (tx) => {
          //장착 테이블에 생성
          const striker_data = await tx.playerEquipRostersData.create({
            data: {
              userPID: checkHaveRouter.userPID,
              playerPID: checkHaveRouter.playerPID,
              playerEnchant: checkHaveRouter.playerEnchant,
            },
          });
          //생성한값 playerSquadsData 저장
          await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              strikerPlayerRostersPID: striker_data.playerRostersPID,
            },
          });
          //  playerRostersData 있던 값 삭제
          await tx.playerRostersData.delete({
            where: {
              playerRostersPID: playerRostersPID,
            },
          });
          return striker_data;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
      return striker_data;
    } else {
      // 해제용도 로직.
      //장착 체크용
      const checkEquipRouter = await prisma.playerEquipRostersData.findFirst({
        whele: {
          userPID: userPID,
          playerRostersPID: playerRostersPID,
        },
      });
      if (
        //장착칸에 지정한 데이터가 없거나 공격수 칸에 지정한 번호랑 다른 사람이 있으면 오류
        !checkEquipRouter ||
        checkSquads.strikerPlayerRostersPID != playerRostersPID
      ) {
        throw {
          statusCode: 404,
          message: '이미 장착중이거나 데이터가 없습니다.',
        };
      }
      if (checkHaveRouter.length > maxHave_Rosters) {
        throw {
          statusCode: 400,
          message: '남은 공간이 없습니다.',
        };
      }

      //이제 db에 저장하는 트렌직션
      const [rosters_data] = await prisma.$transaction(
        async (tx) => {
          // 보유 테이블에 생성 값은 지정한 장착한 테이블 값으로
          const rosters_data = await tx.playerRostersData.create({
            data: {
              userPID: checkEquipRouter.userPID,
              playerPID: checkEquipRouter.playerPID,
              playerEnchant: checkEquipRouter.playerEnchant,
            },
          });
          // 0값으로 초기화
          await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              strikerPlayerRostersPID: 0,
            },
          });
          // 지정한 키의 값을 가진 장착 테이블 값 삭제
          await prisma.playerEquipRostersData.delete({
            whele: {
              userPID: userPID,
              playerRostersPID: playerRostersPID,
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
const midfielder = async (userPID, playerRostersPID, isSet, next) => {
  try {
    //보유 하고있는 로스터 데이터
    const checkHaveRouter = isSet
      ? await prisma.playerRostersData.findFirst({
          whele: {
            userPID: userPID,
            playerRostersPID: playerRostersPID,
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
    //스쿼드 찾기
    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: userPID,
      },
      select: {
        midfielderPlayerRostersPID: true,
      },
    });
    if (isSet) {
      //스쿼드에 집어넣음
      if (!checkHaveRouter || checkSquads.midfielderPlayerRostersPID != 0) {
        throw {
          statusCode: 404,
          message: '이미 장착중이거나 데이터가 없습니다.',
        };
      }
      //이제 db에 저장하는 트렌직션
      const striker_data = await prisma.$transaction(
        async (tx) => {
          //장착 테이블에 생성
          const striker_data = await tx.playerEquipRostersData.create({
            data: {
              userPID: checkHaveRouter.userPID,
              playerPID: checkHaveRouter.playerPID,
              playerEnchant: checkHaveRouter.playerEnchant,
            },
          });
          //생성한값 playerSquadsData 저장
          await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              midfielderPlayerRostersPID: striker_data.playerRostersPID,
            },
          });
          //  playerRostersData 있던 값 삭제
          await tx.playerRostersData.delete({
            where: {
              playerRostersPID: playerRostersPID,
            },
          });
          return striker_data;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
      return striker_data;
    } else {
      // 해제용도 로직.
      //장착 체크용
      const checkEquipRouter = await prisma.playerEquipRostersData.findFirst({
        whele: {
          userPID: userPID,
          playerRostersPID: playerRostersPID,
        },
      });
      if (
        //장착칸에 지정한 데이터가 없거나 공격수 칸에 지정한 번호랑 다른 사람이 있으면 오류
        !checkEquipRouter ||
        checkSquads.midfielderPlayerRostersPID != playerRostersPID
      ) {
        throw {
          statusCode: 404,
          message: '이미 장착중이거나 데이터가 없습니다.',
        };
      }
      if (checkHaveRouter.length > maxHave_Rosters) {
        throw {
          statusCode: 400,
          message: '남은 공간이 없습니다.',
        };
      }

      //이제 db에 저장하는 트렌직션
      const [rosters_data] = await prisma.$transaction(
        async (tx) => {
          // 보유 테이블에 생성 값은 지정한 장착한 테이블 값으로
          const rosters_data = await tx.playerRostersData.create({
            data: {
              userPID: checkEquipRouter.userPID,
              playerPID: checkEquipRouter.playerPID,
              playerEnchant: checkEquipRouter.playerEnchant,
            },
          });
          // 0값으로 초기화
          await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              midfielderPlayerRostersPID: 0,
            },
          });
          // 지정한 키의 값을 가진 장착 테이블 값 삭제
          await prisma.playerEquipRostersData.delete({
            whele: {
              userPID: userPID,
              playerRostersPID: playerRostersPID,
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
//디펜더 용도 함수
const defender = async (userPID, playerRostersPID, isSet, next) => {
  try {
    //보유 하고있는 로스터 데이터
    const checkHaveRouter = isSet
      ? await prisma.playerRostersData.findFirst({
          whele: {
            userPID: userPID,
            playerRostersPID: playerRostersPID,
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
    //스쿼드 찾기
    const checkSquads = await prisma.playerSquadsData.findFirst({
      where: {
        userPID: userPID,
      },
      select: {
        defenderPlayerRostersPID: true,
      },
    });
    if (isSet) {
      //스쿼드에 집어넣음
      if (!checkHaveRouter || checkSquads.defenderPlayerRostersPID != 0) {
        throw {
          statusCode: 404,
          message: '이미 장착중이거나 데이터가 없습니다.',
        };
      }
      //이제 db에 저장하는 트렌직션
      const striker_data = await prisma.$transaction(
        async (tx) => {
          //장착 테이블에 생성
          const striker_data = await tx.playerEquipRostersData.create({
            data: {
              userPID: checkHaveRouter.userPID,
              playerPID: checkHaveRouter.playerPID,
              playerEnchant: checkHaveRouter.playerEnchant,
            },
          });
          //생성한값 playerSquadsData 저장
          await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              defenderPlayerRostersPID: striker_data.playerRostersPID,
            },
          });
          //  playerRostersData 있던 값 삭제
          await tx.playerRostersData.delete({
            where: {
              playerRostersPID: playerRostersPID,
            },
          });
          return striker_data;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );
      return striker_data;
    } else {
      // 해제용도 로직.
      //장착 체크용
      const checkEquipRouter = await prisma.playerEquipRostersData.findFirst({
        whele: {
          userPID: userPID,
          playerRostersPID: playerRostersPID,
        },
      });
      if (
        //장착칸에 지정한 데이터가 없거나 공격수 칸에 지정한 번호랑 다른 사람이 있으면 오류
        !checkEquipRouter ||
        checkSquads.defenderPlayerRostersPID != playerRostersPID
      ) {
        throw {
          statusCode: 404,
          message: '이미 장착중이거나 데이터가 없습니다.',
        };
      }
      if (checkHaveRouter.length > maxHave_Rosters) {
        throw {
          statusCode: 400,
          message: '남은 공간이 없습니다.',
        };
      }

      //이제 db에 저장하는 트렌직션
      const [rosters_data] = await prisma.$transaction(
        async (tx) => {
          // 보유 테이블에 생성 값은 지정한 장착한 테이블 값으로
          const rosters_data = await tx.playerRostersData.create({
            data: {
              userPID: checkEquipRouter.userPID,
              playerPID: checkEquipRouter.playerPID,
              playerEnchant: checkEquipRouter.playerEnchant,
            },
          });
          // 0값으로 초기화
          await tx.playerSquadsData.update({
            where: {
              userPID: userPID,
            },
            data: {
              defenderPlayerRostersPID: 0,
            },
          });
          // 지정한 키의 값을 가진 장착 테이블 값 삭제
          await prisma.playerEquipRostersData.delete({
            whele: {
              userPID: userPID,
              playerRostersPID: playerRostersPID,
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
export default router;
