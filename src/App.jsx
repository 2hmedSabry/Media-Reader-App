import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, 
  Play, 
  FileText, 
  File as FileIcon, 
  FolderPlus, 
  CheckCircle2, 
  Library,
  ChevronRight,
  MonitorPlay
} from 'lucide-react';

const App = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const init = async () => {
      const loaded = await window.electron.loadCourses();
      setCourses(loaded);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadFiles(selectedCourse.path);
    }
  }, [selectedCourse]);

  const loadFiles = async (path) => {
    const files = await window.electron.readDir(path);
    setAllFiles(files);
    // Auto-select first video if available
    const firstVideo = files.find(f => ['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));
    if (firstVideo) handleFileClick(firstVideo);
  };

  const handleFolderSelection = (path) => {
    if (path) {
      // Check if course already exists
      if (courses.some(c => c.path === path)) return;

      const name = path.split(/[\\/]/).pop() || path;
      const newCourses = [...courses, { name, path, id: Date.now() }];
      setCourses(newCourses);
      window.electron.saveCourses(newCourses);
      setSelectedCourse(newCourses[newCourses.length - 1]);
    }
  };

  const addCourse = async () => {
    const path = await window.electron.selectFolder();
    handleFolderSelection(path);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const path = files[0].path;
      handleFolderSelection(path);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    if (['txt', 'md', 'js', 'json', 'py', 'css', 'html'].includes(file.type)) {
      const content = await window.electron.readFile(file.path);
      setFileContent(content);
    } else {
      setFileContent(null);
    }
  };

  // Grouping
  const categorized = useMemo(() => {
    const lessons = allFiles.filter(f => ['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));
    const resources = allFiles.filter(f => !['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));
    return { lessons, resources };
  }, [allFiles]);

  return (
    <div 
      className={`app-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <MonitorPlay size={24} className="accent-color" style={{ color: 'var(--accent)' }} />
            <span>CourseReader</span>
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={addCourse}>
            <FolderPlus size={18} />
            Add Course
          </button>
        </div>

        <div className="course-list">
          <div className="explorer-section-title">Your Library</div>
          {courses.map(course => (
            <div 
              key={course.id} 
              className={`course-item ${selectedCourse?.id === course.id ? 'active' : ''}`}
              onClick={() => setSelectedCourse(course)}
            >
              <Folder size={18} className="icon" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {course.name}
              </span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main View */}
      <main className="main-view">
        {selectedCourse ? (
          <>
            <header className="top-bar">
              <div>
                <h2 style={{ fontSize: '1.25rem' }}>{selectedCourse.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{categorized.lessons.length} Lessons • {categorized.resources.length} Resources</p>
              </div>
            </header>

            <div className="content-wrapper">
              <div className="lesson-explorer">
                <div className="explorer-section-title">Lessons</div>
                <div className="scroll-area">
                  {categorized.lessons.map((file, idx) => (
                    <div 
                      key={idx} 
                      className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                      onClick={() => handleFileClick(file)}
                    >
                      <span className="lesson-number">{(idx + 1).toString().padStart(2, '0')}</span>
                      <Play size={14} className="icon" style={{ opacity: 0.6 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name.replace(/\.[^/.]+$/, "")}
                      </span>
                      {selectedFile?.path === file.path && <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />}
                    </div>
                  ))}

                  {categorized.resources.length > 0 && (
                    <>
                      <div className="explorer-section-title" style={{ marginTop: '20px', paddingLeft: 0 }}>Resources</div>
                      {categorized.resources.map((file, idx) => (
                        <div 
                          key={`res-${idx}`} 
                          className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                          onClick={() => handleFileClick(file)}
                        >
                          {file.type === 'pdf' ? <File size={14} className="icon" /> : <FileText size={14} className="icon" />}
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="viewer-container">
                {selectedFile ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {['mp4', 'mkv', 'webm', 'mov', 'm4v'].includes(selectedFile.type) ? (
                      <video 
                        controls 
                        className="video-player" 
                        src={`file://${selectedFile.path}`} 
                        key={selectedFile.path}
                        autoPlay
                      />
                    ) : selectedFile.type === 'pdf' ? (
                      <embed 
                        src={`file://${selectedFile.path}`} 
                        type="application/pdf" 
                        className="pdf-viewer" 
                      />
                    ) : fileContent !== null ? (
                      <pre className="text-viewer">{fileContent}</pre>
                    ) : (
                      <div className="empty-state">
                        <FileIcon size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                        <p>Preview not available for .{selectedFile.type}</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>{selectedFile.path}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <MonitorPlay size={64} style={{ marginBottom: '24px', opacity: 0.1 }} />
                    <h3>Select a lesson to begin</h3>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Library size={80} style={{ marginBottom: '32px', opacity: 0.05, color: '#fff' }} />
            <h1 style={{ fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.03em' }}>Calm Study</h1>
            <p style={{ maxWidth: '400px', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              A distraction-free space for your local courses. 
              Add a folder to start your journey.
            </p>
            <button className="btn-primary" style={{ marginTop: '32px', padding: '16px 32px', fontSize: '1rem' }} onClick={addCourse}>
              <FolderPlus size={20} />
              Open Course Folder
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
