const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const DEFAULT_PORT = 5000;
const port = process.env.PORT || DEFAULT_PORT;

// 글로벌 룰: 매직 넘버 대신 이름이 명확한 상수 선언
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const ALLOWED_TAGS = ['업무', '개인', '아이디어', '학습'];

// Firebase Admin SDK 초기화
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK가 로컬 서비스 계정 키를 통해 초기화되었습니다.');
  } catch (error) {
    console.error('로컬 Firebase 서비스 계정 키 파싱 실패:', error);
    admin.initializeApp();
  }
} else {
  // Cloud Run 배포 환경에서는 IAM 역할에 의해 자동 인증됨
  admin.initializeApp();
  console.log('Firebase Admin SDK가 기본 사용자 인증 정보로 초기화되었습니다.');
}

const db = admin.firestore();
const tasksCollection = db.collection('tasks');

// 미들웨어 설정
app.use(cors());
app.use(express.json());

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
app.get('/api/tasks', async (req, res) => {
  try {
    const snapshot = await tasksCollection.orderBy('createdAt', 'asc').get();
    const tasks = [];
    snapshot.forEach(doc => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('작업 목록 조회 중 에러 발생:', error);
    res.status(500).json({ success: false, message: '데이터베이스 조회 중 에러가 발생했습니다.' });
  }
});

// 2. 새 작업 생성
app.post('/api/tasks', async (req, res) => {
  const { title, description, tag } = req.body;

  // 글로벌 룰: 외부 입력값 검증 후 처리
  const validationError = validateTaskInput(title, description, tag);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const newTask = {
      title: title.trim(),
      description: description ? description.trim() : '',
      tag,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const docRef = await tasksCollection.add(newTask);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...newTask
      }
    });
  } catch (error) {
    console.error('작업 생성 중 에러 발생:', error);
    res.status(500).json({ success: false, message: '데이터베이스 저장 중 에러가 발생했습니다.' });
  }
});

// 3. 작업 상태 수정 (완료 여부 토글 혹은 내용 수정)
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, tag, isCompleted } = req.body;

  try {
    const docRef = tasksCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: '해당 작업을 찾을 수 없습니다.' });
    }

    const currentTask = doc.data();
    const updateData = {};

    // 수정할 값이 넘어왔을 경우 유효성 검사 수행
    if (title !== undefined || description !== undefined || tag !== undefined) {
      const checkTitle = title !== undefined ? title : currentTask.title;
      const checkDesc = description !== undefined ? description : currentTask.description;
      const checkTag = tag !== undefined ? tag : currentTask.tag;

      const validationError = validateTaskInput(checkTitle, checkDesc, checkTag);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      updateData.title = checkTitle.trim();
      updateData.description = checkDesc ? checkDesc.trim() : '';
      updateData.tag = checkTag;
    }

    if (isCompleted !== undefined) {
      if (typeof isCompleted !== 'boolean') {
        return res.status(400).json({ success: false, message: '완료 상태값은 Boolean 형태여야 합니다.' });
      }
      updateData.isCompleted = isCompleted;
    }

    updateData.updatedAt = new Date().toISOString();

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('작업 수정 중 에러 발생:', error);
    res.status(500).json({ success: false, message: '데이터베이스 업데이트 중 에러가 발생했습니다.' });
  }
});

// 4. 작업 삭제
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = tasksCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: '삭제할 작업을 찾을 수 없습니다.' });
    }

    await docRef.delete();
    res.json({ success: true, message: '작업이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('작업 삭제 중 에러 발생:', error);
    res.status(500).json({ success: false, message: '데이터베이스 삭제 중 에러가 발생했습니다.' });
  }
});

// 서버 구동
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 정상적으로 시작되었습니다.`);
});
