# Node.js LTS 경량 이미지 사용
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 의존성 정의 파일 복사
COPY package*.json ./

# 프로덕션용 패키지만 설치
RUN npm ci --only=production

# 전체 소스 코드 복사 (data 디렉토리는 무시될 것이며, Firestore를 사용하므로 필요하지 않음)
COPY . .

# 포트 설정 (Cloud Run에서 기본적으로 주입해주는 환경변수 PORT를 사용)
ENV PORT=5000
EXPOSE 5000

# 서버 실행 명령어
CMD [ "npm", "start" ]
