const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * 백엔드 서버로부터 모든 작업 목록을 조회하는 함수
 * @returns {Promise<Array>} 작업 배열 목록
 */
export async function fetchTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) {
      throw new Error('서버로부터 목록을 가져오지 못했습니다.');
    }
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('fetchTasks 에러:', error);
    throw new Error(error.message || '네트워크 연결 상태를 확인해 주세요.');
  }
}

/**
 * 새로운 작업을 등록하는 함수
 * @param {Object} taskData { title, description, tag }
 * @returns {Promise<Object>} 생성된 작업 객체
 */
export async function createTask(taskData) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || '작업을 등록하는 데 실패했습니다.');
    }
    return result.data;
  } catch (error) {
    console.error('createTask 에러:', error);
    throw error;
  }
}

/**
 * 작업의 완료 여부 상태를 변경하는 함수
 * @param {string} taskId 작업 ID
 * @param {boolean} isCompleted 완료 여부
 * @returns {Promise<Object>} 업데이트된 작업 객체
 */
export async function updateTaskStatus(taskId, isCompleted) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isCompleted }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || '작업 상태 변경에 실패했습니다.');
    }
    return result.data;
  } catch (error) {
    console.error('updateTaskStatus 에러:', error);
    throw error;
  }
}

/**
 * 작업을 삭제하는 함수
 * @param {string} taskId 작업 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export async function deleteTask(taskId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || '작업을 삭제하는 데 실패했습니다.');
    }
    return result.success;
  } catch (error) {
    console.error('deleteTask 에러:', error);
    throw error;
  }
}
