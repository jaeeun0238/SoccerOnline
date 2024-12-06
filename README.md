# 📖 Futsal Online Project

<h3>Project - 풋살을 활용한 스포츠게임 개발</h3>

--- 설명 --

<br>

### 2FutsalOnline v1.0
> **1.0v :  2024.12.02 ~ 2024.12.09** <br/>

<br>

|          유재은         |          조상우         |          김지웅         |          박성욱         |          정찬식         |          이경민         |
| :--------------------------: | :--------------------------: | :--------------------------: | :--------------------------: | :--------------------------: | :--------------------------: |
|<image width="150px" src="https://github.com/user-attachments/assets/4c400d74-2802-4bfe-acf1-9ca16c2b3073">|<image width="150px" src="https://github.com/user-attachments/assets/3b1aab86-19e0-4543-a753-dea39b233ca6">|<image width="150px" src="https://github.com/user-attachments/assets/03a10004-f07b-46b0-b5f1-cddd0146d5c0"> |<image width="150px" src="https://user-images.githubusercontent.com/119159558/227076242-6e802ef4-4f4e-48f0-8a8a-aa5f4ebdb8b8.png"/> | <image width="150px" src="https://github.com/user-attachments/assets/46941cb0-d79a-4dae-88d8-0958dc6c0d63"> | <image width="150px" src="https://github.com/user-attachments/assets/da18ef02-1327-46a1-bc64-66690778bcdd">|
| [@Jaeeun0238](https://github.com/jaeeun0238) | [@bakfox](https://github.com/bakfox)| [@zera1004](https://github.com/zera1004)| [@WooK1184](https://github.com/WooK1184) | [chansikjeong](https://github.com/chansikjeong) | [@lgm-7](https://github.com/lgm-7) |






<br/>

# 💡 시작 가이드
###
<h3>Requirements</h3>
For building and running the application you need:
 
 - Node.js 18.x
 - Npm 9.2.0
 
<h3>Installation</h3>

```
$ git clone https://github.com/jaeeun0238/SoccerOnline.git
$ cd SoccerOnline
```
#### Run Method
```
$ npm install yarn
$ yarn
$ node app.js
```
---
### Environment
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?style=for-the-badge&logo=Visual%20Studio%20Code&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=Git&logoColor=white)
![Github](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=GitHub&logoColor=white)
![insomnia](https://img.shields.io/badge/Insomnia-4000BF?style=for-the-badge&logo=Insomnia&logoColor=white)

### Config
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)        

### Development
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=Javascript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=MySQL&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=Prisma&logoColor=white)
![AmazonRDS](https://img.shields.io/badge/AmazonRDS-527FFF?style=for-the-badge&logo=AmazonRDS&logoColor=white)


<br>

   <h3> 📌 개발 파트 </h3>
   <br>
   
<details>
  <summary>유재윤</summary>
 <br>
  <ul>
    <li>회원관련 router 생성 및 등록</li>
    <li>회원가입
      <ul>
        <li>API 작성</li>
        <li>회원 DB 설계</li>
      </ul>
    </li>
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
    <li>팀, 매칭 API, DB</li>
    <li>팀 기능</li>
    <ul>
    <li>팀 테이블 관련 넣고 빼기</li>
    <li>팀 테이블 보유 선수 테이블 보여주기</li>
    </ul>
    <li>모든 db 설계</li>
    <li>매칭 기능</li>
   <ul>
    <li>유저 실력에 맞게 매칭</li>
  </ul>
</details>

<details>
  <summary>김지웅</summary>
   <br>
  <ul>
   <li>캐시 구매 API</li>
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
    <li>선수 뽑기 기능
      <ul>
        <li>캐시를 사용하면 데이터베이스 내의 여러 선수중 임의 한 명 추출</li>
        <li>뽑은 선수는 보유 선수 테이블에 저장</li>
      </ul>
    </li>
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
    <li>선수 뽑기 기능
      <ul>
        <li>Request의 body를 통해 전달받은 Json데이터로 생성에 필요한 데이터로 추출</li>
        <li>추출한 데이터로 선수 등록 기능 구현</li>
      </ul>
    </li>
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
    <li>게임 플레이 기능
      <ul>
        <li>스쿼드 포지션별 점수 정규화 후 합산</li>
        <li>상대 스쿼드와 내스쿼드 점수 합산 후 합산한 수중 랜덤난수 나온수가 내스쿼드 점수보다 낮으면 승리</li>
      </ul>
    </li>
    <li>게임 전적
      <ul>
        <li>게임 결과 전적기록으로 남기기</li>
      </ul>
    </li>
  </ul>
</details>
   
<br>
