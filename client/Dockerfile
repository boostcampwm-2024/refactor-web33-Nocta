# 1. Node.js 20 기반 빌드 이미지
FROM node:20 AS build
WORKDIR /app

# 2. 모노레포 루트에서 필요한 파일 복사
COPY . .
# COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
# COPY ./client/package.json ./client/panda.config.ts ./client/vite.config.ts ./client/tsconfig.json ./client/
# COPY ./client/src/styles ./client/src/styles
# COPY ./@noctaCrdt/package.json ./@noctaCrdt/

# 3. pnpm 설치 및 의존성 설치
RUN npm install -g pnpm
RUN pnpm install

# 4. 애플리케이션 빌드
RUN pnpm --filter client run build

# 5. 빌드된 정적 파일 준비 (Nginx에서 제공)
CMD ["echo", "Build completed. Use the Nginx container to serve the files."]