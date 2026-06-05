const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const DEFAULT_PORT = 5000;
const port = process.env.PORT || DEFAULT_PORT;

// 글로벌 룰: 매직 넘버 대신 이름이 명확한 상수 선언
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const ALLOWED_TAGS = ['업무', '개인', '아이디어', '학습'];

const DATA_DIR_PATH = path.join(__dirname, 'data');
const DATA_FILE_PATH = path.join(DATA_DIR_PATH, 'tasks.json');

// 미들웨어 설정
app.use(cors());
app.use(express.json());

/**
 * 데이터 디렉토리 및 파일이 존재하지 않는 경우 초기화하는 함수
 */
function initializeDatabase() {
  if (!fs.existsSync(DATA_DIR_PATH)) {
    fs.mkdirSync(DATA_DIR_PATH, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

/**
 * 로컬 JSON 파일로부터 작업 데이터를 읽어오는 함수
 * @returns {Array} 작업 목록 배열
 */
function loadTasksData() {
  try {
    initializeDatabase();
    const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('데이터를 불러오는 중 에러 발생:', error);
    return [];
  }
}

/**
 * 작업 데이터를 로컬 JSON 파일에 저장하는 함수
 * @param {Array} tasksData 저장할 작업 목록 배열
 */
function saveTasksData(tasksData) {
  try {
    initializeDatabase();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(tasksData, null, 2), 'utf-8');
  } catch (error) {
    console.error('데이터를 저장하는 중 에러 발생:', error);
  }
}

/**
 * 외부 입력값을 검증하는 유효성 검사 함수 (글로벌 룰: 안전)
 * @param {string} title 제목
 * @param {string} description 설명
 * @param {string} tag 태그
 * @returns {string|null} 에러 메시지 (정상일 경우 null)
 */
function validateTaskInput(title, description, tag) {
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return '제목은 필수 입력 사항이며 비어 둘 수 없습니다.';
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return `제목은 최대 ${MAX_TITLE_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (description && (typeof description !== 'string' || description.length > MAX_DESCRIPTION_LENGTH)) {
    return `설명은 최대 ${MAX_DESCRIPTION_LENGTH}자 이하로 입력해 주세요.`;
  }
  if (!tag || !ALLOWED_TAGS.includes(tag)) {
    return `허용되지 않은 태그입니다. 허용 태그: [${ALLOWED_TAGS.join(', ')}]`;
  }
  return null;
}

// -------------------------------------------------------------
// API 엔드포인트 구현
// -------------------------------------------------------------

// 1. 모든 작업 목록 조회
app.get('/api/tasks', (req, res) => {
  const tasks = loadTasksData();
  res.json({ success: true, data: tasks });
});

// 2. 새 작업 생성
app.post('/api/tasks', (req, res) => {
  const { title, description, tag } = req.body;

  // 글로벌 룰: 외부 입력값 검증 후 처리
  const validationError = validateTaskInput(title, description, tag);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const tasks = loadTasksData();
  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    description: description ? description.trim() : '',
    tag,
    isCompleted: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveTasksData(tasks);

  res.status(201).json({ success: true, data: newTask });
});

// 3. 작업 상태 수정 (완료 여부 토글 혹은 내용 수정)
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, tag, isCompleted } = req.body;
  
  const tasks = loadTasksData();
  const taskIndex = tasks.findIndex(item => item.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: '해당 작업을 찾을 수 없습니다.' });
  }

  const currentTask = tasks[taskIndex];

  // 수정할 값이 넘어왔을 경우 유효성 검사 수행
  if (title !== undefined || description !== undefined || tag !== undefined) {
    const checkTitle = title !== undefined ? title : currentTask.title;
    const checkDesc = description !== undefined ? description : currentTask.description;
    const checkTag = tag !== undefined ? tag : currentTask.tag;

    const validationError = validateTaskInput(checkTitle, checkDesc, checkTag);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    currentTask.title = checkTitle.trim();
    currentTask.description = checkDesc ? checkDesc.trim() : '';
    currentTask.tag = checkTag;
  }

  if (isCompleted !== undefined) {
    if (typeof isCompleted !== 'boolean') {
      return res.status(400).json({ success: false, message: '완료 상태값은 Boolean 형태여야 합니다.' });
    }
    currentTask.isCompleted = isCompleted;
  }

  currentTask.updatedAt = new Date().toISOString();
  tasks[taskIndex] = currentTask;
  saveTasksData(tasks);

  res.json({ success: true, data: currentTask });
});

// 4. 작업 삭제
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = loadTasksData();
  const initialLength = tasks.length;
  
  const filteredTasks = tasks.filter(item => item.id !== id);

  if (filteredTasks.length === initialLength) {
    return res.status(404).json({ success: false, message: '삭제할 작업을 찾을 수 없습니다.' });
  }

  saveTasksData(filteredTasks);
  res.json({ success: true, message: '작업이 성공적으로 삭제되었습니다.' });
});

// 서버 구동
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 정상적으로 시작되었습니다.`);
});
