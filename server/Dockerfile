# 1. Node.js 20 기반 이미지
FROM node:20
WORKDIR /app

# 2. 모노레포 루트에서 필요한 파일 복사
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
COPY ./server/package.json ./server/
COPY ./@noctaCrdt/package.json ./@noctaCrdt/

# 3. pnpm 설치 및 의존성 설치
RUN npm install -g pnpm
RUN pnpm install

# 4. 애플리케이션 소스 복사 및 빌드
COPY . .
RUN pnpm --filter server run build

# 5. NestJS 서버 실행
EXPOSE 3000
CMD ["pnpm", "--filter", "server", "run", "start:prod"]