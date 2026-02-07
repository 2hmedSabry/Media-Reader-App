import React, { useState, useEffect, useMemo } from 'react';
import { 
  Folder, 
  Play, 
  FileText, 
  File as FileIcon, 
  FolderPlus, 
  CheckCircle2, 
  Library,
  List,
  FolderTree,
  ChevronRight,
  MonitorPlay,
  PanelLeftClose,
  PanelLeftOpen,
  Volume2
} from 'lucide-react';

const App = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('folders'); // 'flat' or 'folders'
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [isExplorerVisible, setIsExplorerVisible] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [progress, setProgress] = useState({});
  const videoRef = React.useRef(null);

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => 
      prev.includes(folderName) 
        ? prev.filter(f => f !== folderName) 
        : [...prev, folderName]
    );
  };

  useEffect(() => {
    const init = async () => {
      const [loadedCourses, loadedProgress] = await Promise.all([
        window.electron.loadCourses(),
        window.electron.loadProgress()
      ]);
      setCourses(loadedCourses);
      setProgress(loadedProgress || {});
    };
    init();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFile) return;
      const video = videoRef.current;
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (video) video.paused ? video.play() : video.pause();
          break;
        case 'f':
          if (video) {
            if (document.fullscreenElement) document.exitFullscreen();
            else video.requestFullscreen();
          }
          break;
        case 'arrowright':
          if (video) video.currentTime += 10;
          break;
        case 'arrowleft':
          if (video) video.currentTime -= 10;
          break;
        case 'n':
          playNext();
          break;
        case 'p':
          playPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, allFiles]);

  useEffect(() => {
    if (selectedCourse) {
      loadFiles(selectedCourse.path);
    }
  }, [selectedCourse]);

  const playNext = () => {
    const lessons = categorized.lessons;
    const currentIndex = lessons.findIndex(f => f.path === selectedFile?.path);
    if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
      handleFileClick(lessons[currentIndex + 1]);
    }
  };

  const playPrev = () => {
    const lessons = categorized.lessons;
    const currentIndex = lessons.findIndex(f => f.path === selectedFile?.path);
    if (currentIndex > 0) {
      handleFileClick(lessons[currentIndex - 1]);
    }
  };

  const updateProgress = (filePath, time) => {
    if (!selectedCourse) return;
    const newProgress = {
      ...progress,
      [selectedCourse.id]: {
        lastFile: filePath,
        time: time || 0
      }
    };
    setProgress(newProgress);
    window.electron.saveProgress(newProgress);
  };

  const loadFiles = async (path) => {
    const files = await window.electron.readDir(path);
    setAllFiles(files);
    
    // Restore progress
    const courseProgress = progress[selectedCourse.id];
    if (courseProgress) {
      const lastFile = files.find(f => f.path === courseProgress.lastFile);
      if (lastFile) {
        handleFileClick(lastFile);
        return;
      }
    }

    // Auto-select first video if no progress
    const firstVideo = files.find(f => ['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));
    if (firstVideo) handleFileClick(firstVideo);
  };

  const handleFolderSelection = (path) => {
    if (path) {
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
      handleFolderSelection(files[0].path);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    const savedProgress = progress[selectedCourse?.id];
    const initialTime = (savedProgress?.lastFile === file.path) ? savedProgress.time : 0;
    updateProgress(file.path, initialTime);

    if (['txt', 'md', 'js', 'json', 'py', 'css', 'html'].includes(file.type)) {
      const content = await window.electron.readFile(file.path);
      setFileContent(content);
    } else {
      setFileContent(null);
    }

    if (file.folder) {
      setExpandedFolders(prev => prev.includes(file.folder) ? prev : [...prev, file.folder]);
    }

    // Auto-scroll to active item
    setTimeout(() => {
      const activeItem = document.querySelector('.lesson-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  // Grouping
  const categorized = useMemo(() => {
    const lessons = allFiles.filter(f => ['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));
    const resources = allFiles.filter(f => !['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));

    if (viewMode === 'flat') {
      return { lessons, resources, groups: null };
    }

    // Group by folder
    const groups = {};
    lessons.forEach(f => {
      const folder = f.folder || 'Main Folder';
      if (!groups[folder]) groups[folder] = { lessons: [], resources: [] };
      groups[folder].lessons.push(f);
    });
    
    resources.forEach(f => {
      const folder = f.folder || 'Main Folder';
      if (!groups[folder]) groups[folder] = { lessons: [], resources: [] };
      groups[folder].resources.push(f);
    });

    return { lessons, resources, groups };
  }, [allFiles, viewMode]);

  return (
    <div 
      className={`app-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Sidebar */}
      {isSidebarVisible && (
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
      )}

      {/* Main View */}
      <main className="main-view">
        {selectedCourse ? (
          <>
            <header className="top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  className="icon-btn" 
                  onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                  title="Toggle Sidebar"
                >
                  <Library size={20} />
                </button>
                {!isExplorerVisible && (
                  <button className="icon-btn" onClick={() => setIsExplorerVisible(true)}>
                    <PanelLeftOpen size={20} />
                  </button>
                )}
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedCourse.name}</h2>
                  {selectedFile && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      {selectedFile.folder ? `${selectedFile.folder} > ` : ''}{selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </header>

            <div className="content-wrapper">
              {isExplorerVisible && (
                <div className="lesson-explorer">
                  <div className="explorer-header-row">
                    <div className="explorer-section-title">Lessons</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="view-toggle-btn" 
                        onClick={() => setViewMode(viewMode === 'flat' ? 'folders' : 'flat')}
                      >
                        {viewMode === 'flat' ? <FolderTree size={16} /> : <List size={16} />}
                      </button>
                      <button 
                        className="view-toggle-btn" 
                        onClick={() => setIsExplorerVisible(false)}
                      >
                        <PanelLeftClose size={16} />
                      </button>
                    </div>
                  </div>
                
                  <div className="scroll-area">
                    {viewMode === 'folders' ? (
                      Object.entries(categorized.groups).map(([folderName, group]) => {
                        const isExpanded = expandedFolders.includes(folderName);
                        return (
                          <div key={folderName} className={`folder-group ${isExpanded ? 'active' : ''}`}>
                            <div className="folder-name clickable" onClick={() => toggleFolder(folderName)}>
                              <ChevronRight size={14} className={`chevron ${isExpanded ? 'rotated' : ''}`} />
                              <Folder size={14} style={{ opacity: 0.5 }} />
                              <span className="folder-text">{folderName}</span>
                              <span className="badge">{group.lessons.length}</span>
                            </div>
                            
                            {isExpanded && (
                              <div className="folder-content">
                                {group.lessons.map((file, idx) => (
                                  <div 
                                    key={`lesson-${idx}`} 
                                    className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                                    onClick={() => handleFileClick(file)}
                                  >
                                    {selectedFile?.path === file.path ? (
                                      <Volume2 size={12} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                                    ) : (
                                      <Play size={12} className="icon" style={{ opacity: 0.4 }} />
                                    )}
                                    <span className="file-name">{file.name.replace(/\.[^/.]+$/, "")}</span>
                                    {selectedFile?.path === file.path && <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} />}
                                  </div>
                                ))}
                                {group.resources.map((file, idx) => (
                                  <div 
                                    key={`res-${idx}`} 
                                    className={`lesson-item resource ${selectedFile?.path === file.path ? 'active' : ''}`}
                                    onClick={() => handleFileClick(file)}
                                  >
                                    {selectedFile?.path === file.path ? (
                                      <Volume2 size={12} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                                    ) : (
                                      file.type === 'pdf' ? <FileIcon size={12} className="icon" /> : <FileText size={12} className="icon" />
                                    )}
                                    <span className="file-name">{file.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <>
                        {categorized.lessons.map((file, idx) => (
                          <div 
                            key={idx} 
                            className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                            onClick={() => handleFileClick(file)}
                          >
                            <span className="lesson-number">{(idx + 1).toString().padStart(2, '0')}</span>
                            {selectedFile?.path === file.path ? (
                              <Volume2 size={14} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                            ) : (
                              <Play size={14} className="icon" style={{ opacity: 0.6 }} />
                            )}
                            <span className="file-name">{file.name.replace(/\.[^/.]+$/, "")}</span>
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
                                {selectedFile?.path === file.path ? (
                                  <Volume2 size={14} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                                ) : (
                                  file.type === 'pdf' ? <FileIcon size={14} className="icon" /> : <FileText size={14} className="icon" />
                                )}
                                <span className="file-name">{file.name}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="viewer-container">
                {selectedFile ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {['mp4', 'mkv', 'webm', 'mov', 'm4v'].includes(selectedFile.type) ? (
                      <video 
                        ref={videoRef}
                        controls 
                        className="video-player" 
                        src={`file://${selectedFile.path}`} 
                        key={selectedFile.path}
                        autoPlay
                        onLoadedMetadata={(e) => {
                          const savedTime = progress[selectedCourse?.id]?.time;
                          if (savedTime && progress[selectedCourse?.id]?.lastFile === selectedFile.path) {
                            e.target.currentTime = savedTime;
                          }
                        }}
                        onEnded={playNext}
                        onTimeUpdate={(e) => {
                          if (Math.floor(e.target.currentTime) % 5 === 0) {
                            updateProgress(selectedFile.path, e.target.currentTime);
                          }
                        }}
                      />
                    ) : selectedFile.type === 'pdf' ? (
                      <embed src={`file://${selectedFile.path}`} type="application/pdf" className="pdf-viewer" />
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
