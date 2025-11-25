import { useState, useRef, useEffect } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/check';

const defaultLeaveConfig = {
  sheetIndex: 0,
  headerRow: 12,
  startRow: 13,
  startColumn: 'A',
  endColumn: 'S'
};

const defaultAttendanceConfig = {
  sheetIndex: 0,
  headerRow: 5,
  startRow: 6,
  startColumn: 'A',
  endColumn: 'R'
};

const defaultInsuranceConfig = {
  sheetIndex: 0,
  headerRow: 1,
  startRow: 2,
  startColumn: 'A',
  endColumn: 'T'
};

const defaultInsuranceMappings = [
  { id: 1, sourceColumn: 'D', targetColumn: 'A', type: 'text', label: 'Mã số BHXH → Số sổ BHXH' },
  { id: 2, sourceColumn: 'C', targetColumn: 'B', type: 'text', label: 'Họ và tên → Họ và tên' },
  { id: 3, sourceColumn: 'B', targetColumn: 'N', type: 'text', label: 'MNV → Mã nhân viên' },
  { id: 4, sourceColumn: 'E', targetColumn: 'C', type: 'date', label: 'Từ ngày → Từ ngày' },
  { id: 5, sourceColumn: 'F', targetColumn: 'D', type: 'date', label: 'Đến ngày → Đến ngày' },
  { id: 6, sourceColumn: 'Q', targetColumn: 'K', type: 'text', label: 'Thông tin TK → Số tài khoản' },
  { id: 7, sourceColumn: 'C', targetColumn: 'L', type: 'text', label: 'Họ và tên → Tên chủ tài khoản' },
];

function App() {
  const [leaveFile, setLeaveFile] = useState(null);
  const [attendanceFile, setAttendanceFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Config mặc định
  const [fileInputKeys, setFileInputKeys] = useState({
    leave: 0,
    attendance: 0,
    insurance: 0
  });

  const [leaveConfig, setLeaveConfig] = useState(defaultLeaveConfig);
  const [attendanceConfig, setAttendanceConfig] = useState(defaultAttendanceConfig);
  const [insuranceConfig, setInsuranceConfig] = useState(defaultInsuranceConfig);
  const [insuranceMappings, setInsuranceMappings] = useState(
    () => defaultInsuranceMappings.map((item) => ({ ...item }))
  );
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const handleFileChange = (type, file) => {
    if (file) {
      if (type === 'leave') {
        setLeaveFile(file);
      } else if (type === 'attendance') {
        setAttendanceFile(file);
      } else if (type === 'insurance') {
        setInsuranceFile(file);
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

  const handleRemoveFile = (type) => {
    if (type === 'leave') {
      setLeaveFile(null);
      setFileInputKeys((prev) => ({ ...prev, leave: prev.leave + 1 }));
    } else if (type === 'attendance') {
      setAttendanceFile(null);
      setFileInputKeys((prev) => ({ ...prev, attendance: prev.attendance + 1 }));
    } else if (type === 'insurance') {
      setInsuranceFile(null);
      setFileInputKeys((prev) => ({ ...prev, insurance: prev.insurance + 1 }));
    }
  };

  const handleClearAllFiles = () => {
    setLeaveFile(null);
    setAttendanceFile(null);
    setInsuranceFile(null);
    setFileInputKeys((prev) => ({
      leave: prev.leave + 1,
      attendance: prev.attendance + 1,
      insurance: (prev.insurance || 0) + 1
    }));
  };

  const buildAbsoluteUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    const base = API_URL.replace(/\/$/, '');
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${base}${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leaveFile || !attendanceFile || !insuranceFile) {
      setError('Vui lòng chọn đủ 3 file (nghỉ phép, chấm công, BHXH)!');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('leaveFile', leaveFile);
    formData.append('attendanceFile', attendanceFile);
    formData.append('insuranceFile', insuranceFile);
    
    // Thêm config vào formData
    formData.append('leaveFileConfig', JSON.stringify(leaveConfig));
    formData.append('attendanceFileConfig', JSON.stringify(attendanceConfig));
    formData.append('insuranceFileConfig', JSON.stringify(insuranceConfig));
    formData.append('insuranceColumnMappings', JSON.stringify(
      insuranceMappings
        .filter(item => item.sourceColumn && item.targetColumn)
        .map(item => ({
          sourceColumn: item.sourceColumn.trim().toUpperCase(),
          targetColumn: item.targetColumn.trim().toUpperCase(),
          type: item.type || 'text',
          format: item.format || undefined
        }))
    ));

    try {
      const apiBase = API_URL.replace(/\/$/, '');
      const response = await fetch(`${apiBase}/leave`, {
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

  const handleMappingChange = (id, field, value) => {
    setInsuranceMappings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const showToast = (message, type = 'success') => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    setToast({ message, type });
    toastTimeout.current = setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const addMappingRow = () => {
    setInsuranceMappings((prev) => [
      ...prev,
      {
        id: Date.now(),
        sourceColumn: '',
        targetColumn: '',
        type: 'text',
        label: ''
      }
    ]);
    showToast('Đã thêm cặp cột mới!');
  };

  const removeMappingRow = (id) => {
    setInsuranceMappings((prev) => prev.filter((item) => item.id !== id));
  };

  const resetMappingsToDefault = () => {
    setInsuranceMappings(defaultInsuranceMappings.map((item) => ({ ...item })));
    showToast('Đã khôi phục cấu hình mapping mặc định', 'info');
  };

  const handleDownloadFile = (downloadUrl) => {
    if (!downloadUrl) {
      setError('Không tìm thấy đường dẫn tải xuống.');
      return;
    }

    const finalUrl = buildAbsoluteUrl(downloadUrl);

    if (!finalUrl) {
      setError('Đường dẫn tải xuống không hợp lệ.');
      return;
    }

    window.open(finalUrl, '_blank');
  };

  return (
    <div className="app-container">
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
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

            <div className="config-group">
              <h3>📘 File BHXH (Insurance File)</h3>
              <p className="config-hint">
                Chọn sheet và vùng cột cần đọc/ghi. Bạn có thể tuỳ chỉnh các cặp cột cần copy dữ liệu giữa file nghỉ phép và BHXH.
              </p>
              <div className="config-inputs">
                <div className="config-input">
                  <label>Sheet Index:</label>
                  <input 
                    type="number" 
                    value={insuranceConfig.sheetIndex}
                    onChange={(e) => setInsuranceConfig({...insuranceConfig, sheetIndex: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="config-input">
                  <label>Header Row:</label>
                  <input 
                    type="number" 
                    value={insuranceConfig.headerRow}
                    onChange={(e) => setInsuranceConfig({...insuranceConfig, headerRow: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div className="config-input">
                  <label>Start Row:</label>
                  <input 
                    type="number" 
                    value={insuranceConfig.startRow}
                    onChange={(e) => setInsuranceConfig({...insuranceConfig, startRow: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div className="config-input">
                  <label>Start Column:</label>
                  <input 
                    type="text" 
                    value={insuranceConfig.startColumn}
                    onChange={(e) => setInsuranceConfig({...insuranceConfig, startColumn: e.target.value.toUpperCase()})}
                    maxLength="2"
                    placeholder="A"
                  />
                </div>
                <div className="config-input">
                  <label>End Column:</label>
                  <input 
                    type="text" 
                    value={insuranceConfig.endColumn}
                    onChange={(e) => setInsuranceConfig({...insuranceConfig, endColumn: e.target.value.toUpperCase()})}
                    maxLength="2"
                    placeholder="T"
                  />
                </div>
              </div>

              <div className="mapping-section">
                <div className="mapping-header">
                  <h4>🔁 Mapping cột dữ liệu</h4>
                  <div className="mapping-actions">
                    <button type="button" className="btn small" onClick={addMappingRow}>
                      + Thêm cặp cột
                    </button>
                    <button type="button" className="btn secondary small" onClick={resetMappingsToDefault}>
                      Khôi phục mặc định
                    </button>
                  </div>
                </div>
                <div className="mapping-list">
                  {insuranceMappings.map((mapping) => (
                    <div className="mapping-row" key={mapping.id}>
                      <div className="mapping-input">
                        <label>Cột Leave</label>
                        <input
                          type="text"
                          value={mapping.sourceColumn}
                          onChange={(e) => handleMappingChange(mapping.id, 'sourceColumn', e.target.value.toUpperCase())}
                          maxLength="2"
                          placeholder="Ví dụ: D"
                        />
                      </div>
                      <div className="mapping-input">
                        <label>Cột BHXH</label>
                        <input
                          type="text"
                          value={mapping.targetColumn}
                          onChange={(e) => handleMappingChange(mapping.id, 'targetColumn', e.target.value.toUpperCase())}
                          maxLength="2"
                          placeholder="Ví dụ: A"
                        />
                      </div>
                      <div className="mapping-input">
                        <label>Kiểu dữ liệu</label>
                        <select
                          value={mapping.type || 'text'}
                          onChange={(e) => handleMappingChange(mapping.id, 'type', e.target.value)}
                        >
                          <option value="text">Text</option>
                          <option value="date">Date (dd/MM/yyyy)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        className="remove-mapping-btn"
                        onClick={() => removeMappingRow(mapping.id)}
                        disabled={insuranceMappings.length <= 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="config-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowConfig(false)}
              >
                Đóng cấu hình
              </button>
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
                  {leaveFile ? (
                    <div className="file-details">
                      <span>{leaveFile.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleRemoveFile('leave');
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    'Chưa chọn file'
                  )}
                </div>
                <input
                  type="file"
                  id="leaveFile"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange('leave', e.target.files[0])}
                  className="file-input"
                  key={fileInputKeys.leave}
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
                  {attendanceFile ? (
                    <div className="file-details">
                      <span>{attendanceFile.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleRemoveFile('attendance');
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    'Chưa chọn file'
                  )}
                </div>
                <input
                  type="file"
                  id="attendanceFile"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange('attendance', e.target.files[0])}
                  className="file-input"
                  key={fileInputKeys.attendance}
                />
              </label>
            </div>

            <div className="file-input-wrapper">
              <label
                htmlFor="insuranceFile"
                className="file-input-label"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'insurance')}
              >
                <div className="file-icon">📘</div>
                <div className="file-label-text">File BHXH (Insurance File)</div>
                <div className="file-name">
                  {insuranceFile ? (
                    <div className="file-details">
                      <span>{insuranceFile.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleRemoveFile('insurance');
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    'Chưa chọn file'
                  )}
                </div>
                <input
                  type="file"
                  id="insuranceFile"
                  accept=".xlsx"
                  onChange={(e) => handleFileChange('insurance', e.target.files[0])}
                  className="file-input"
                  key={fileInputKeys.insurance}
                />
              </label>
            </div>
          </div>

          <div className="upload-actions">
            <button type="submit" className="btn" disabled={loading || !leaveFile || !attendanceFile || !insuranceFile}>
              {loading ? 'Đang xử lý...' : 'Kiểm Tra'}
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={handleClearAllFiles}
              disabled={!leaveFile && !attendanceFile && !insuranceFile}
            >
              Xóa tất cả file
            </button>
          </div>
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

            <div className="download-buttons">
              {result.downloadUrl && (
                <button onClick={() => handleDownloadFile(result.downloadUrl)} className="download-btn">
                  📥 Tải File Nghỉ Phép đã cập nhật
                </button>
              )}
              {result.insuranceDownloadUrl && (
                <button onClick={() => handleDownloadFile(result.insuranceDownloadUrl)} className="download-btn secondary">
                  📥 Tải File BHXH đã cập nhật
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
