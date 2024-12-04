import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js'; // Express 앱 경로
import { prisma } from '../uts/prisma/index.js';

describe('플레이어 생성 API', () => {
    // 플레이어 생성 테스트
    describe('POST /api/player/make', () => {
        // 정상적으로 플레이어 생성 요청
        it('새로운 플레이어가 성공적으로 생성', async () => {
            const newPlayer = {
                playerName: 'TestPlayer',
                playerAbilityATCK: 5,
                playerAbilityDEFEND: 10,
                playerAbilityMOBILITY: 5,
            };

            const res = await request(app)
                .post('/api/player/make')
                .send(newPlayer);

            expect(res.status).to.equal(201); // Supertest의 응답 객체에서 직접 접근
            expect(res.body).to.have.property('message').include('성공적으로 선수를 생성하였습니다.');
            expect(res.body.message).to.include(newPlayer.playerName);
            expect(res.body.message).to.include(String(newPlayer.playerAbilityATCK)); // 숫자를 문자열로 변환
            expect(res.body.message).to.include(String(newPlayer.playerAbilityDEFEND));
            expect(res.body.message).to.include(String(newPlayer.playerAbilityMOBILITY));

            // 데이터베이스에 플레이어가 생성되었는지 확인
            const playerInDb = await prisma.playerData.findUnique({
                where: { playerName: newPlayer.playerName },
            });

            expect(playerInDb).to.not.be.null;
            expect(playerInDb.playerName).to.equal(newPlayer.playerName);
        });

        // 필수 데이터 누락 테스트
        it('필수 데이터가 누락되면 에러를 반환', async () => {
            const incompletePlayer = {
                playerName: 'TestPlayer',
                // playerAbilityATCK이 빠짐
                playerAbilityDEFEND: 5,
                playerAbilityMOBILITY: 7,
            };

            const res = await request(app)
                .post('/api/player/make')
                .send(incompletePlayer);

            expect(res.status).to.equal(400); // 상태 코드를 직접 비교
            expect(res.body).to.have.property('error').include('playerAbilityATCK');
        });

        // 잘못된 데이터 형식 요청
        it('잘못된 데이터 형식일 경우 에러 반환', async () => {
            const invalidPlayer = {
                playerName: 'TestPlayer',
                playerAbilityATCK: '공격력은 10', // 숫자가 아닌 문자열
                playerAbilityDEFEND: 6,
                playerAbilityMOBILITY: 7,
            };

            const res = await request(app)
                .post('/api/player/make')
                .send(invalidPlayer);

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('error').eql('"playerAbilityATCK" must be a number');
        });
    });
});
