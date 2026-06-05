import { useState, useEffect } from 'react';
import { fetchTasks, createTask, updateTaskStatus, deleteTask } from './utils/api';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 폼 입력 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTag, setSelectedTag] = useState('업무'); // 기본 태그 설정

  // 필터 상태 ('all' | 'active' | 'completed')
  const [filterType, setFilterType] = useState('all');

  // 태그 목록 상수 (글로벌 룰: 매직 넘버/스트링 대신 상수)
  const availableTags = ['업무', '개인', '아이디어', '학습'];

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAllTasks();
  }, []);

  /**
   * 백엔드에서 모든 작업 목록을 불러와 상태에 저장하는 함수
   */
  async function loadAllTasks() {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setErrorMsg(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * 새로운 작업을 추가하는 서브밋 핸들러 함수
   * @param {Event} event 폼 이벤트
   */
  async function handleAddTask(event) {
    event.preventDefault();
    setErrorMsg('');

    // 프론트엔드 입력값 1차 검증 (글로벌 룰: 안전)
    if (!title.trim()) {
      setErrorMsg('제목을 입력해 주세요.');
      return;
    }

    try {
      const newTask = await createTask({
        title: title.trim(),
        description: description.trim(),
        tag: selectedTag
      });
      
      // 상태 업데이트 및 폼 초기화
      setTasks(prevTasks => [newTask, ...prevTasks]);
      setTitle('');
      setDescription('');
      setSelectedTag('업무');
    } catch (err) {
      setErrorMsg(err.message || '작업 등록 중 오류가 발생했습니다.');
    }
  }

  /**
   * 작업 완료 여부 상태를 변경하는 핸들러 함수
   * @param {string} taskId 작업 ID
   * @param {boolean} currentStatus 현재 완료 상태
   */
  async function handleToggleStatus(taskId, currentStatus) {
    try {
      const updated = await updateTaskStatus(taskId, !currentStatus);
      setTasks(prevTasks =>
        prevTasks.map(item => (item.id === taskId ? updated : item))
      );
    } catch (err) {
      setErrorMsg(err.message || '상태 변경 중 오류가 발생했습니다.');
    }
  }

  /**
   * 작업을 삭제하는 핸들러 함수
   * @param {string} taskId 작업 ID
   */
  async function handleDeleteTask(taskId) {
    if (!window.confirm('정말로 이 작업을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(item => item.id !== taskId));
    } catch (err) {
      setErrorMsg(err.message || '삭제 중 오류가 발생했습니다.');
    }
  }

  // 필터링된 태스크 목록
  const filteredTasks = tasks.filter(task => {
    if (filterType === 'active') return !task.isCompleted;
    if (filterType === 'completed') return task.isCompleted;
    return true;
  });

  // 통계 계산
  const totalCount = tasks.length;
  const activeCount = tasks.filter(t => !t.isCompleted).length;
  const completedCount = tasks.filter(t => t.isCompleted).length;

  /**
   * 날짜 포맷팅 헬퍼 함수
   * @param {string} dateString ISO 날짜 문자열
   * @returns {string} 포맷팅된 날짜 문자열
   */
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  }

  return (
    <div className="app-container">
      {/* 헤더 & 통계 영역 */}
      <header className="app-header">
        <div className="header-title-section">
          <h1>데스크다이어리 (DeskDiary)</h1>
        </div>
        
        <div className="dashboard-stats">
          <div className="glass-panel stat-card total">
            <span className="stat-label">전체 내역</span>
            <span className="stat-value">{totalCount}개</span>
          </div>
          <div className="glass-panel stat-card active">
            <span className="stat-label">진행 중</span>
            <span className="stat-value">{activeCount}개</span>
          </div>
          <div className="glass-panel stat-card completed">
            <span className="stat-label">완료됨</span>
            <span className="stat-value">{completedCount}개</span>
          </div>
        </div>
      </header>

      {/* 에러 메시지 알림 */}
      {errorMsg && (
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'var(--pastel-rose)', color: 'var(--pastel-rose)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorMsg}</span>
          <button className="delete-btn" onClick={() => setErrorMsg('')}>닫기</button>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="app-content">
        
        {/* 왼쪽: 등록 폼 */}
        <section className="glass-panel form-panel">
          <h2 className="form-title">새로운 태스크 작성</h2>
          <form className="task-form" onSubmit={handleAddTask}>
            <div className="form-group">
              <label htmlFor="task-title">제목</label>
              <input
                id="task-title"
                type="text"
                className="glass-input"
                placeholder="어떤 일을 하실 건가요?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={50}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="task-desc">설명 (선택)</label>
              <textarea
                id="task-desc"
                className="glass-input"
                placeholder="상세 정보를 입력해 주세요."
                rows="4"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label>카테고리 태그</label>
              <div className="tag-selector">
                {availableTags.map(tag => (
                  <div
                    key={tag}
                    className={`tag-option ${selectedTag === tag ? 'selected' : ''}`}
                    data-tag={tag}
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn">등록하기</button>
          </form>
        </section>

        {/* 오른쪽: 태스크 리스트 */}
        <section className="list-panel">
          <div className="list-header">
            <h2 className="list-title">할 일 & 아이디어 목록</h2>
            <div className="filter-group">
              <button
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                전체
              </button>
              <button
                className={`filter-btn ${filterType === 'active' ? 'active' : ''}`}
                onClick={() => setFilterType('active')}
              >
                진행 중
              </button>
              <button
                className={`filter-btn ${filterType === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterType('completed')}
              >
                완료됨
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="empty-state">데이터를 불러오는 중입니다...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="glass-panel empty-state">
              등록된 태스크가 없습니다. 새로운 작업을 등록해 보세요!
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map(task => (
                <article
                  key={task.id}
                  className={`glass-panel task-card ${task.isCompleted ? 'completed' : ''}`}
                >
                  <div className="task-card-header">
                    <div className="task-title-area">
                      <div
                        className="checkbox-wrapper"
                        onClick={() => handleToggleStatus(task.id, task.isCompleted)}
                      >
                        <div className={`custom-checkbox ${task.isCompleted ? 'checked' : ''}`} />
                      </div>
                      <h3 className="task-title">{task.title}</h3>
                    </div>
                    <span className="task-tag" data-tag={task.tag}>
                      {task.tag}
                    </span>
                  </div>

                  {task.description && (
                    <p className="task-desc">{task.description}</p>
                  )}

                  <div className="task-card-footer">
                    <span className="task-date">
                      {formatDate(task.createdAt)}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
