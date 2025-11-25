import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/check';

function App() {
  const [leaveFile, setLeaveFile] = useState(null);
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Config mặc định
  const [leaveConfig, setLeaveConfig] = useState({
    sheetIndex: 0,
    headerRow: 12,
    startRow: 13,
    startColumn: 'A',
    endColumn: 'S'
  });
  
  const [attendanceConfig, setAttendanceConfig] = useState({
    sheetIndex: 0,
    headerRow: 5,
    startRow: 6,
    startColumn: 'A',
    endColumn: 'R'
  });

  const handleFileChange = (type, file) => {
    if (file) {
      if (type === 'leave') {
        setLeaveFile(file);
      } else {
        setAttendanceFile(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileChange(type, file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leaveFile || !attendanceFile) {
      setError('Vui lòng chọn cả 2 file!');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('leaveFile', leaveFile);
    formData.append('attendanceFile', attendanceFile);
    
    // Thêm config vào formData
    formData.append('leaveFileConfig', JSON.stringify(leaveConfig));
    formData.append('attendanceFileConfig', JSON.stringify(attendanceConfig));

    try {
      const response = await fetch(`${API_URL}/leave`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

    const handleDownload = () => {
    if (result?.downloadUrl) {
      // Nếu downloadUrl đã là URL đầy đủ (bắt đầu với http/https), dùng trực tiếp
      // Nếu không, nối với API_URL (cho trường hợp download từ server)
      const downloadUrl = result.downloadUrl.startsWith('http://') || result.downloadUrl.startsWith('https://')
        ? result.downloadUrl
        : `${API_URL}${result.downloadUrl}`;
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="app-container">
      <div className="container">
        <h1>📊 Check Excel Files</h1>
        <p className="subtitle">Upload file nghỉ phép và file chấm công để kiểm tra</p>

        <div className="config-toggle">
          <button 
            type="button" 
            className="config-btn"
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? '▼' : '▶'} Cấu hình Excel (Tùy chọn)
          </button>
        </div>

        {showConfig && (
          <div className="config-section">
            <div className="config-group">
              <h3>📄 File Nghỉ Phép (Leave File)</h3>
              <div className="config-inputs">
                <div className="config-input">
                  <label>Sheet Index:</label>
                  <input 
                    type="number" 
                    value={leaveConfig.sheetIndex}
                    onChange={(e) => setLeaveConfig({...leaveConfig, sheetIndex: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="config-input">
                  <label>Header Row:</label>
                  <input 
                    type="number" 
                    value={leaveConfig.headerRow}
                    onChange={(e) => setLeaveConfig({...leaveConfig, headerRow: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div className="config-input">
                  <label>Start Row:</label>
                  <input 
                    type="number" 
                    value={leaveConfig.startRow}
                    onChange={(e) => setLeaveConfig({...leaveConfig, startRow: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div className="config-input">
                  <label>Start Column:</label>
                  <input 
                    type="text" 
                    value={leaveConfig.startColumn}
                    onChange={(e) => setLeaveConfig({...leaveConfig, startColumn: e.target.value.toUpperCase()})}
                    maxLength="2"
                    placeholder="A"
                  />
                </div>
                <div className="config-input">
                  <label>End Column:</label>
                  <input 
                    type="text" 
                    value={leaveConfig.endColumn}
                    onChange={(e) => setLeaveConfig({...leaveConfig, endColumn: e.target.value.toUpperCase()})}
                    maxLength="2"
                    placeholder="S"
                  />
                </div>
              </div>
            </div>

            <div className="config-group">
              <h3>📋 File Chấm Công (Attendance File)</h3>
              <div className="config-inputs">
                <div className="config-input">
                  <label>Sheet Index:</label>
                  <input 
                    type="number" 
                    value={attendanceConfig.sheetIndex}
                    onChange={(e) => setAttendanceConfig({...attendanceConfig, sheetIndex: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="config-input">
                  <label>Header Row:</label>
                  <input 
                    type="number" 
                    value={attendanceConfig.headerRow}
                    onChange={(e) => setAttendanceConfig({...attendanceConfig, headerRow: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div className="config-input">
                  <label>Start Row:</label>
                  <input 
                    type="number" 
                    value={attendanceConfig.startRow}
                    onChange={(e) => setAttendanceConfig({...attendanceConfig, startRow: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div className="config-input">
                  <label>Start Column:</label>
                  <input 
                    type="text" 
                    value={attendanceConfig.startColumn}
                    onChange={(e) => setAttendanceConfig({...attendanceConfig, startColumn: e.target.value.toUpperCase()})}
                    maxLength="2"
                    placeholder="A"
                  />
                </div>
                <div className="config-input">
                  <label>End Column:</label>
                  <input 
                    type="text" 
                    value={attendanceConfig.endColumn}
                    onChange={(e) => setAttendanceConfig({...attendanceConfig, endColumn: e.target.value.toUpperCase()})}
                    maxLength="2"
                    placeholder="R"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-section">
            <div className="file-input-wrapper">
              <label
                htmlFor="leaveFile"
                className="file-input-label"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'leave')}
              >
                <div className="file-icon">📄</div>
                <div className="file-label-text">File Nghỉ Phép (Leave File)</div>
                <div className="file-name">
                  {leaveFile ? leaveFile.name : 'Chưa chọn file'}
                </div>
                <input
                  type="file"
                  id="leaveFile"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange('leave', e.target.files[0])}
                  className="file-input"
                />
              </label>
            </div>

            <div className="file-input-wrapper">
              <label
                htmlFor="attendanceFile"
                className="file-input-label"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'attendance')}
              >
                <div className="file-icon">📋</div>
                <div className="file-label-text">File Chấm Công (Attendance File)</div>
                <div className="file-name">
                  {attendanceFile ? attendanceFile.name : 'Chưa chọn file'}
                </div>
                <input
                  type="file"
                  id="attendanceFile"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange('attendance', e.target.files[0])}
                  className="file-input"
                />
              </label>
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading || !leaveFile || !attendanceFile}>
            {loading ? 'Đang xử lý...' : 'Kiểm Tra'}
          </button>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang xử lý file...</p>
          </div>
        )}

        {error && (
          <div className="result error">
            <h3>❌ Lỗi</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result success">
            <h3>✅ {result.message}</h3>
            
            <div className="result-info">
              <strong>Tổng số dòng:</strong> {result.summary?.totalLeaveRows || 0}
            </div>
            
            <div className="result-info">
              <strong>Số dòng có lỗi:</strong> {result.summary?.issuesFound || 0}
            </div>

            {result.summary?.mnvWithIssues && result.summary.mnvWithIssues.length > 0 && (
              <div className="result-info">
                <strong>MNV có lỗi:</strong> {result.summary.mnvWithIssues.join(', ')}
              </div>
            )}

            {result.summary?.issuesFound > 0 && (
              <div className="issues-section">
                <strong className="issues-title">Chi tiết lỗi:</strong>
                <div className="issues-list">
                  {result.summary.checkResults
                    .filter(item => item.hasIssue)
                    .map((item, index) => (
                      <div key={index} className="issue-item">
                        <strong>MNV {item.mnv}:</strong> {item.message}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {result.downloadUrl && (
              <button onClick={handleDownload} className="download-btn">
                📥 Tải File Đã Cập Nhật
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
