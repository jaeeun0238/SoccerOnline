# ⚽ Futsal Online Project

<h3>Project - 풋살을 활용한 스포츠게임 개발</h3>

게임서버 트랙 팀 프로젝트에서 개발한 풋살 온라인은 넥슨의 (현재 FC온라인) 피파 온라인 4를 오마주하여 만들어진<br/>스포츠 게임입니다.
<br></br>
프로젝트를 통해 웹 서버 기반에서 사용자 인증 및 권한 관리, 결제 기본 개념, 실시간 데이터 처리, 데이터 기반 아웃게임 로직 구현에 대해 알 수 있습니다.

<br>

### 2FutsalOnline v1.0
> **아자아자화이팅하조❣😋**<br>
> **v1.0 :  2024.12.02 ~ 2024.12.09** <br/>

<br>

|          유재은         |          조상우         |          김지웅         |          박성욱         |          정찬식         |          이경민         |
| :--------------------------: | :--------------------------: | :--------------------------: | :--------------------------: | :--------------------------: | :--------------------------: |
|<image width="150px" src="https://github.com/user-attachments/assets/4c400d74-2802-4bfe-acf1-9ca16c2b3073">|<image width="150px" src="https://github.com/user-attachments/assets/3b1aab86-19e0-4543-a753-dea39b233ca6">|<image width="150px" src="https://github.com/user-attachments/assets/03a10004-f07b-46b0-b5f1-cddd0146d5c0"> |<image width="150px" src="https://user-images.githubusercontent.com/119159558/227076242-6e802ef4-4f4e-48f0-8a8a-aa5f4ebdb8b8.png"/> | <image width="150px" src="https://github.com/user-attachments/assets/46941cb0-d79a-4dae-88d8-0958dc6c0d63"> | <image width="150px" src="https://github.com/user-attachments/assets/da18ef02-1327-46a1-bc64-66690778bcdd">|
| [@Jaeeun0238](https://github.com/jaeeun0238) | [@bakfox](https://github.com/bakfox)| [@zera1004](https://github.com/zera1004)| [@WooK1184](https://github.com/WooK1184) | [chansikjeong](https://github.com/chansikjeong) | [@lgm-7](https://github.com/lgm-7) |






<br/>

# 📕 시작 가이드
###
<h3>Requirements</h3>
For building and running the application you nee은</summary>
 <br>
  <ul>
    <li>회원관련 생성 및 등록 API</li>
    <br>
    <li>회원가입
      <ul>
        <li>API 작성</li>
        <li>회원 DB 설계</li>
      </ul>
    </li>
    <br>
    <li>로그인
      <ul>
        <li>API 작성</li>
        <li>JWT 토큰 생성 함수 제작</li>
      </ul>
    </li>
  </ul>
</details>

<details>
  <summary>조상우</summary>
   <br>
  <ul>
    <li>팀, 매칭 API, DB 설계</li>
    <br>
    <li>팀 기능</li>
    <ul>
    <li>팀 테이블 관련 넣고 빼기</li>
    <li>팀 테이블 보유 선수 테이블 보여주기</li>
    </ul>
    <br>
    <li>모든 db 설계</li>
    <br>
    <li>매칭 기능</li>
   <ul>
    <li>유저 실력에 맞게 매칭</li>
  </ul>
</details>

<details>
  <summary>김지웅</summary>
   <br>
  <ul>
   <li>캐시 API</li>
   <br>
    <li>캐시 구매 기능
      <ul>
        <li>body로 받은 cash 값만큼 해당 유저의 cash를 증가시킨다</li>
      </ul>
    </li>
  </ul>
</details>

<details>
  <summary>박성욱</summary>
   <br>
  <ul>
    <li>선수 뽑기 및 강화 API</li>
    <br>
    <li>선수 뽑기 기능
      <ul>
        <li>캐시를 사용하면 데이터베이스 내의 여러 선수중 임의 한 명 추출</li>
        <li>뽑은 선수는 보유 선수 테이블에 저장</li>
      </ul>
    </li>
    <br>
    <li>선수 강화 기능
      <ul>
        <li>선수뽑기로 로스터에 등록된 선수를 이용</li>
        <li>고유 ID를 이용해 강화 후 능력치 상승</li>
       <li>강화 단계에 따른 강화 확률 및 능력치 상승폭 조정</li>
      </ul>
    </li>
  </ul>
</details>

<details>
  <summary>정찬식</summary>
     <br>
  <ul>
    <li>선수 등록 및 랭킹 API</li>
    <br>
    <li>선수 뽑기 기능
      <ul>
        <li>Request의 body를 통해 전달받은 Json데이터로 생성에 필요한 데이터로 추출</li>
        <li>추출한 데이터로 선수 등록 기능 구현</li>
      </ul>
    </li>
    <br>
    <li>유저 랭킹 확인 기능
      <ul>
        <li>userData테이블에서 userName과 userScore를 선택하여 스코어 기준 내림차순으로 10명을 추출</li>
        <li>추출한 데이터에 index값으로 순위를 표기하여 랭킹조회데이터 출력</li>
        <li>userData 테이블에서 name과 score를 선택하여 score를 내림차순으로 10명 받아오기</li>
        <li>받아온 정보에 인덱스 +1 해주어 랭킹과 함께 표시</li>
      </ul>
    </li>
  </ul>
</details>

<details>
  <summary>이경민</summary>
     <br>
  <ul>
    <li>게임 플레이 및 전적 API</li>
    <br>
    <li>게임 플레이 기능
      <ul>
        <li>스쿼드 포지션별 점수 정규화 후 합산</li>
        <li>상대 스쿼드와 내스쿼드 점수 합산 후 합산한 수중 랜덤난수 나온수가 내스쿼드 점수보다 낮으면 승리</li>
      </ul>
    </li>
    <br>
    <li>게임 전적
      <ul>
        <li>게임 결과 전적기록으로 남기기</li>
      </ul>
    </li>
  </ul>
</details>

---
<br>

## 🖥️ 와이어 프레임
| 기본 구조 |
| :--------------------------------------------: |
![image](https://github.com/user-attachments/assets/dffc7d9c-969c-4f2e-bd99-6df829cd39ba)
|회색 : 필수 기능&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;노랑 : 도전 기능&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;주황 : 스페셜 기능|

<br>
<br>

## 📘 API 명세서

https://teamsparta.notion.site/13f2dc3ef51481428498f6823ea158a2?v=13f2dc3ef5148180b522000c82ee4a58&pvs=4

<br>
<br>

## 아키텍쳐
### ERD DIAGRAM
![image](https://github.com/user-attachments/assets/65600abc-a3d7-472d-954d-344185525987)

### 디렉토리 구조
```
├── app.js
├── middlewares
│   ├── auth.middleware.js
│   └── error.middleware.js
├── package.json
├── prisma
│   └── schema.prisma
├── routers
│   ├── game_Router.js
│   ├── player_Router.js
│   ├── team_Router.js
│   └── user_Router.js
├── uts
│   └── prisma
│       └── index.js
└── yarn.lock

```

## API 요청 📺
   
| API 요청 화면 |
| :--------------------------------------------: |
|  |

---
<br>

### 강화 기능 구현 설명

<details>
  <summary>선수 강화</summary>
   <br>
  <ul>
    <li>선수 강화 기본 설정
      <ul>
        <li>Player 관련 API로 player_Router.js에 작성</li>
        <li>강화 최대 단계는 10</li>
        <li>인증을 위한 토큰을 Header에서 참조</li>
        <li>강화 또는 재료에 쓰일 선수는 보유한 선수만 사용 가능</li>
        <li>재료는 최소 1명, 최대 5명으로 1명당 20%의 확률을 가짐</li>
        <li>강화 단계에 따라 확률 감소, 플레이어 스탯 증가</li>
        <li>PUT 요청으로 보낼 예정</li>
      </ul>
      <br>
    </li>
       <li>작업 추가 설명
      <ul>
        <li>인증된 유저 정보 가져오고 바디에서 playerRostersPID와 materials 가져오게끔 작성</li>
        <li>유저 정보, 보유 선수, 선수 데이터, 재료 확인</li>
        <li>최대 5명이기에 재료는 배열로 설정, switch를 사용하여 강화 단계에 따른 확률, 스탯 증가량 조정</li>
        <li>트랜잭션을 이용하여 선수 데이터 업데이트와 재료 선수 삭제를 묶음 처리</li>
        <li>PUT 요청으로 보낼 예정</li>
      </ul>
    </li>
  </ul>
</details>




