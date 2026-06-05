# DeskDiary - 할 일 및 아이디어 관리 애플리케이션

이 프로젝트는 React 기반의 프론트엔드와 Express 기반의 백엔드 API 서버로 구성된 개인 할 일 및 아이디어 관리 도구입니다.

## 프로젝트 구조

```text
├── backend/            # Express 백엔드 API 서버 (로컬 JSON DB 사용)
├── frontend/           # React + Vite 프론트엔드 클라이언트
└── .github/workflows/  # GitHub Actions를 통한 자동 배포 워크플로우
```

---

## 로컬 실행 방법

이 프로젝트를 로컬에서 구동하려면 프론트엔드와 백엔드를 각각 실행해야 합니다.

### 1. 백엔드 서버 실행

```bash
cd backend
npm install
npm run dev
```

* 백엔드는 `http://localhost:5001` 포트에서 실행됩니다. (설정은 `backend/.env` 파일에서 수정할 수 있습니다.)
* 데이터는 `backend/data/tasks.json` 파일에 저장되며, 깃허브에는 업로드되지 않습니다.

### 2. 프론트엔드 클라이언트 실행

```bash
cd frontend
npm install
npm run dev
```

* 프론트엔드는 기본적으로 로컬의 `http://localhost:5173` 등에서 실행되며, 백엔드 API(`http://localhost:5001/api`)와 통신합니다.

---

## 깃허브 배포 및 GitHub Actions

본 프로젝트는 GitHub Pages를 활용하여 프론트엔드가 자동으로 배포되도록 구성되어 있습니다.

### 배포 URL
* **URL**: `https://WiseLuke.github.io/diary/`

### 자동 배포 작동 방식
1. `main` 브랜치에 코드가 푸시될 때마다 GitHub Actions(`deploy.yml`)가 자동으로 트리거됩니다.
2. Actions 빌드 머신에서 프론트엔드 의존성을 설치하고 빌드를 진행합니다.
3. 빌드된 정적 파일(`frontend/dist`)들이 `gh-pages` 브랜치로 자동 배포됩니다.

> [!NOTE]
> 백엔드 서버는 로컬 환경(`localhost:5001`)에서 실행되므로, 배포된 웹사이트를 정상적으로 이용하기 위해서는 **로컬에서 백엔드 서버를 띄워두어야 합니다**.
