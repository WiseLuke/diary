import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('경고: VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY 환경변수가 정의되지 않았습니다. .env 설정을 확인해주세요.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Supabase tasks 테이블로부터 모든 작업 목록을 조회하는 함수
 * @returns {Promise<Array>} 작업 배열 목록
 */
export async function fetchTasks() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  } catch (error) {
    console.error('fetchTasks 에러:', error);
    throw new Error(error.message || '데이터베이스로부터 목록을 가져오지 못했습니다.');
  }
}

/**
 * Supabase tasks 테이블에 새로운 작업을 등록하는 함수
 * @param {Object} taskData { title, description, tag }
 * @returns {Promise<Object>} 생성된 작업 객체
 */
export async function createTask(taskData) {
  const { title, description, tag } = taskData;
  try {
    const newTask = {
      title: title.trim(),
      description: description ? description.trim() : '',
      tag,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('데이터 추가 후 결과를 반환받지 못했습니다.');
    }

    return data[0];
  } catch (error) {
    console.error('createTask 에러:', error);
    throw error;
  }
}

/**
 * Supabase tasks 테이블의 특정 작업 완료 여부 상태를 변경하는 함수
 * @param {string} taskId 작업 ID
 * @param {boolean} isCompleted 완료 여부
 * @returns {Promise<Object>} 업데이트된 작업 객체
 */
export async function updateTaskStatus(taskId, isCompleted) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        isCompleted,
        updatedAt: new Date().toISOString()
      })
      .eq('id', taskId)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('데이터 상태 변경 후 결과를 반환받지 못했습니다.');
    }

    return data[0];
  } catch (error) {
    console.error('updateTaskStatus 에러:', error);
    throw error;
  }
}

/**
 * Supabase tasks 테이블에서 작업을 삭제하는 함수
 * @param {string} taskId 작업 ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export async function deleteTask(taskId) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('deleteTask 에러:', error);
    throw error;
  }
}
