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
  Volume2,
  Search,
  Command,
  Subtitles,
  Zap,
  ZapOff,
  Camera,
  X
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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState({});
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [subtitleUrl, setSubtitleUrl] = useState(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isSubPickerOpen, setIsSubPickerOpen] = useState(false);
  const [explorerWidth, setExplorerWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(null);
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
      // Search shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        setSearchQuery('');
        return;
      }

      if (isSearchOpen) {
        if (e.key === 'Escape') setIsSearchOpen(false);
        return;
      }

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
        case '[':
          setPlaybackRate(prev => Math.max(0.5, prev - 0.25));
          break;
        case ']':
          setPlaybackRate(prev => Math.min(3, prev + 0.25));
          break;
        case 'c':
          setShowSubtitles(prev => !prev);
          break;
        case 'v':
          setIsSubPickerOpen(prev => !prev);
          break;
        case 's':
          takeSnapshot();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, allFiles, isSearchOpen, subtitleUrl]);

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

  const pickSubtitle = async (file) => {
    const content = await window.electron.getSubtitle(file.path);
    if (content) {
      if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
      const blob = new Blob([content], { type: 'text/vtt' });
      setSubtitleUrl(URL.createObjectURL(blob));
      setShowSubtitles(true);
      setIsSubPickerOpen(false);
    }
  };

  const showToast = (title, message, icon = 'Camera') => {
    setToast({ title, message, icon });
    setTimeout(() => setToast(null), 3500);
  };

  const takeSnapshot = async () => {
    const video = videoRef.current;
    if (!video || !selectedFile) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Data = canvas.toDataURL('image/jpeg', 0.95);
      const timestamp = Math.floor(video.currentTime);
      
      const filePath = selectedFile.path;
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      const videoName = selectedFile.name.replace(/\.[^/.]+$/, "");
      const fileName = `${videoName}_snap_${timestamp}s.jpg`;
      const finalPath = `${dir}/${fileName}`;

      const success = await window.electron.saveSnapshot({ base64Data, filePath: finalPath });
      if (success) {
        showToast('Captured', 'Snapshot saved to course folder');
      }
    } catch (err) {
      console.error('Failed to take snapshot:', err);
    }
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX - (isSidebarVisible ? 280 : 0) - 40;
    if (newWidth >= 300 && newWidth <= 800) {
      setExplorerWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const updateProgress = (filePath, time, duration) => {
    if (!selectedCourse) return;
    
    const courseId = selectedCourse.id;
    const currentCourseProgress = progress[courseId] || { lastFile: '', files: {} };
    
    const newProgress = {
      ...progress,
      [courseId]: {
        ...currentCourseProgress,
        lastFile: filePath,
        files: {
          ...currentCourseProgress.files,
          [filePath]: {
            time: time || 0,
            duration: duration || currentCourseProgress.files?.[filePath]?.duration || 0
          }
        }
      }
    };
    setProgress(newProgress);
    window.electron.saveProgress(newProgress);
  };

  const loadFiles = async (path) => {
    const files = await window.electron.readDir(path);
    setAllFiles(files);
    
    const courseProgress = progress[selectedCourse.id];
    if (courseProgress && courseProgress.lastFile) {
      const lastFile = files.find(f => f.path === courseProgress.lastFile);
      if (lastFile) {
        handleFileClick(lastFile);
        return;
      }
    }

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
    const courseProgress = progress[selectedCourse?.id];
    const fileProgress = courseProgress?.files?.[file.path];
    const initialTime = fileProgress ? fileProgress.time : 0;
    
    setSubtitleUrl(null); // Clear previous subtitle URL

    // Switch immediately, the video component will handle the time restore via onLoadedMetadata
    if (['txt', 'md', 'js', 'json', 'py', 'css', 'html'].includes(file.type)) {
      const content = await window.electron.readFile(file.path);
      setFileContent(content);
    } else {
      setFileContent(null);
    }

    if (file.folder) {
      setExpandedFolders(prev => prev.includes(file.folder) ? prev : [...prev, file.folder]);
    }

    // Auto-Subtitle Detection
    if (['mp4', 'mkv', 'webm', 'mov', 'm4v'].includes(file.type)) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const subFile = allFiles.find(f => 
        f.folder === file.folder && 
        f.name.toLowerCase().startsWith(baseName.toLowerCase()) && 
        ['srt', 'vtt'].includes(f.type.toLowerCase())
      );

      if (subFile) {
        const content = await window.electron.getSubtitle(subFile.path);
        if (content) {
          if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
          const blob = new Blob([content], { type: 'text/vtt' });
          setSubtitleUrl(URL.createObjectURL(blob));
        }
      } else {
        setSubtitleUrl(null);
      }
    }

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

  const searchResults = useMemo(() => {
    if (!searchQuery) return { lessons: [], library: [] };
    const query = searchQuery.toLowerCase();
    
    return {
      lessons: allFiles.filter(f => 
        ['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type) &&
        f.name.toLowerCase().includes(query)
      ).slice(0, 5),
      library: courses.filter(c => 
        c.name.toLowerCase().includes(query)
      ).slice(0, 4)
    };
  }, [allFiles, courses, searchQuery]);

  return (
    <div 
      className={`app-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="search-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                autoFocus
                placeholder="Search lessons or folders... (Esc to close)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (searchResults.lessons.length > 0) {
                      handleFileClick(searchResults.lessons[0]);
                      setIsSearchOpen(false);
                    } else if (searchResults.library.length > 0) {
                      setSelectedCourse(searchResults.library[0]);
                      setIsSearchOpen(false);
                    }
                  }
                  if (e.key === 'Escape') setIsSearchOpen(false);
                }}
                className="search-input"
              />
            </div>
            <div className="search-results">
              {searchResults.lessons.length > 0 && (
                <div className="search-category">
                  <div className="category-header">In this Course</div>
                  {searchResults.lessons.map((file, idx) => (
                    <div 
                      key={`file-${idx}`} 
                      className="search-result-item"
                      onClick={() => {
                        handleFileClick(file);
                        setIsSearchOpen(false);
                      }}
                    >
                      <Play size={14} className="icon" style={{ opacity: 0.5 }} />
                      <div className="result-info">
                        <span className="result-name">{file.name.replace(/\.[^/.]+$/, "")}</span>
                        {file.folder && <span className="result-folder">{file.folder}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.library.length > 0 && (
                <div className="search-category">
                  <div className="category-header">Library & Courses</div>
                  {searchResults.library.map((course, idx) => (
                    <div 
                      key={`course-${idx}`} 
                      className="search-result-item"
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsSearchOpen(false);
                      }}
                    >
                      <Library size={14} className="icon" style={{ color: 'var(--accent)' }} />
                      <div className="result-info">
                        <span className="result-name">{course.name}</span>
                        <span className="result-folder">Course Folder</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && searchResults.lessons.length === 0 && searchResults.library.length === 0 && (
                <div className="no-results">
                  <div className="search-empty-visual" />
                  No matches found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedCourse.name} {playbackRate !== 1 && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '2px 6px', 
                      backgroundColor: 'var(--accent-soft)', 
                      color: 'var(--accent)', 
                      borderRadius: '4px',
                      marginLeft: '8px'
                    }}>
                      {playbackRate}x
                    </span>
                  )}</h2>
                  {selectedFile && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      {selectedFile.folder ? `${selectedFile.folder} > ` : ''}{selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </header>

            <div className={`content-wrapper ${isResizing ? 'resizing' : ''}`}>
              {isExplorerVisible && (
                <>
                  <div className="lesson-explorer" style={{ width: `${explorerWidth}px` }}>
                  <div className="explorer-header-row">
                    <div className="explorer-section-title">Lessons</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className={`view-toggle-btn ${isAutoplay ? 'active-accent' : ''}`}
                        onClick={() => setIsAutoplay(!isAutoplay)}
                        title={isAutoplay ? 'Disable Autoplay' : 'Enable Autoplay'}
                      >
                        {isAutoplay ? <Zap size={15} /> : <ZapOff size={15} />}
                      </button>
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
                                  <div className="item-main-content">
                                    {selectedFile?.path === file.path ? (
                                      <Volume2 size={12} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                                    ) : (
                                      <Play size={12} className="icon" style={{ opacity: 0.4 }} />
                                    )}
                                    <span className="file-name">{file.name.replace(/\.[^/.]+$/, "")}</span>
                                    {selectedFile?.path === file.path && <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} />}
                                  </div>
                                  {progress[selectedCourse?.id]?.files?.[file.path]?.duration > 0 && (
                                    <div className="mini-progress-bar">
                                      <div 
                                        className="mini-progress-fill" 
                                        style={{ width: `${(progress[selectedCourse.id].files[file.path].time / progress[selectedCourse.id].files[file.path].duration) * 100}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                              {group.resources.map((file, idx) => (
                                <div 
                                  key={`res-${idx}`} 
                                  className={`lesson-item resource ${selectedFile?.path === file.path ? 'active' : ''}`}
                                  onClick={() => handleFileClick(file)}
                                >
                                  <div className="item-main-content">
                                    {selectedFile?.path === file.path ? (
                                      <Volume2 size={12} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                                    ) : (
                                      file.type === 'pdf' ? <FileIcon size={12} className="icon" /> : <FileText size={12} className="icon" />
                                    )}
                                    <span className="file-name">{file.name}</span>
                                  </div>
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
                            <div className="item-main-content">
                            <span className="lesson-number">{(idx + 1).toString().padStart(2, '0')}</span>
                            {selectedFile?.path === file.path ? (
                              <Volume2 size={14} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                            ) : (
                              <Play size={14} className="icon" style={{ opacity: 0.6 }} />
                            )}
                            <span className="file-name">{file.name.replace(/\.[^/.]+$/, "")}</span>
                            {selectedFile?.path === file.path && <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />}
                          </div>
                          {progress[selectedCourse?.id]?.files?.[file.path]?.duration > 0 && (
                            <div className="mini-progress-bar">
                              <div 
                                className="mini-progress-fill" 
                                style={{ width: `${(progress[selectedCourse.id].files[file.path].time / progress[selectedCourse.id].files[file.path].duration) * 100}%` }}
                              />
                            </div>
                          )}
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
                              <div className="item-main-content">
                          {selectedFile?.path === file.path ? (
                            <Volume2 size={14} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                          ) : (
                            file.type === 'pdf' ? <FileIcon size={14} className="icon" /> : <FileText size={14} className="icon" />
                          )}
                          <span className="file-name">{file.name}</span>
                        </div>
                      </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div 
                  className="resizer-bar" 
                  onMouseDown={() => setIsResizing(true)}
                />
              </>
            )}

              <div className="viewer-container">
                {selectedFile ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {['mp4', 'mkv', 'webm', 'mov', 'm4v'].includes(selectedFile.type) ? (
                      <>
                        <video 
                          ref={videoRef}
                          controls 
                          className="video-player" 
                          src={`file://${selectedFile.path}`} 
                          key={selectedFile.path}
                          autoPlay={isAutoplay}
                          onLoadedMetadata={(e) => {
                            e.target.playbackRate = playbackRate;
                            const savedProgress = progress[selectedCourse?.id]?.files?.[selectedFile.path];
                            if (savedProgress?.time) {
                              // If video was finished (near the end), restart from the beginning
                              const isFinished = savedProgress.duration > 0 && 
                                               (savedProgress.duration - savedProgress.time < 1.5 || 
                                                savedProgress.time / savedProgress.duration > 0.98);
                              
                              e.target.currentTime = isFinished ? 0 : savedProgress.time;
                            }
                            updateProgress(selectedFile.path, e.target.currentTime, e.target.duration);
                          }}
                          onEnded={() => isAutoplay && playNext()}
                          onTimeUpdate={(e) => {
                            e.target.playbackRate = playbackRate;
                            if (Math.floor(e.target.currentTime) % 5 === 0) {
                              updateProgress(selectedFile.path, e.target.currentTime, e.target.duration);
                            }

                            // Countdown Logic
                            if (isAutoplay && e.target.duration > 0) {
                              const timeLeft = Math.floor(e.target.duration - e.target.currentTime);
                              if (timeLeft <= 12 && timeLeft > 0) {
                                if (countdown === null || countdown !== timeLeft) {
                                  setCountdown(timeLeft);
                                }
                              } else if (countdown !== null) {
                                setCountdown(null);
                              }
                            }
                          }}
                        >
                          {subtitleUrl && showSubtitles && (
                            <track 
                              label="English"
                              kind="subtitles"
                              srcLang="en"
                              src={subtitleUrl}
                              default
                            />
                          )}
                        </video>
                        
                        {countdown !== null && isAutoplay && (
                          <div className="next-lesson-button" onClick={() => { setCountdown(null); playNext(); }}>
                            <div className="next-content">
                              <Play size={16} fill="currentColor" />
                              <span className="next-label">Next Video</span>
                              <span className="next-timer">{countdown}s</span>
                            </div>
                            <div className="next-progress-container">
                              <div className="next-progress-fill" style={{ width: `${(countdown / 12) * 100}%` }} />
                            </div>
                            <button className="next-cancel-btn" onClick={(e) => {
                              e.stopPropagation();
                              setIsAutoplay(false);
                              setCountdown(null);
                            }} title="Cancel Autoplay">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        
                        {isSubPickerOpen && (
                          <div className="subtitle-picker-overlay" onClick={() => setIsSubPickerOpen(false)}>
                            <div className="subtitle-picker-card" onClick={e => e.stopPropagation()}>
                              <div className="picker-header">
                                <Subtitles size={20} className="accent-color" style={{ color: 'var(--accent)' }} />
                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Select Subtitle</span>
                              </div>
                              <div className="picker-list">
                                {allFiles
                                  .filter(f => f.folder === selectedFile.folder && ['srt', 'vtt'].includes(f.type.toLowerCase()))
                                  .map((f, idx) => (
                                    <div key={idx} className="picker-item" onClick={() => pickSubtitle(f)}>
                                      <FileText size={16} />
                                      <div className="picker-item-info">
                                        <span className="picker-item-name">{f.name}</span>
                                        <span className="picker-item-ext">{f.type.toUpperCase()} File</span>
                                      </div>
                                    </div>
                                  ))}
                                {allFiles.filter(f => f.folder === selectedFile.folder && ['srt', 'vtt'].includes(f.type.toLowerCase())).length === 0 && (
                                  <div className="picker-empty">
                                    <Subtitles size={32} style={{ opacity: 0.1, marginBottom: '12px' }} />
                                    <p>No subtitle files found in this folder</p>
                                  </div>
                                )}
                              </div>
                              <button className="picker-close-btn" onClick={() => setIsSubPickerOpen(false)}>Close</button>
                            </div>
                          </div>
                        )}
                      </>
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
                    <div className="video-empty-visual" />
                    <MonitorPlay size={48} style={{ marginBottom: '16px', opacity: 0.1 }} />
                    <h3>Select a lesson to begin</h3>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: '80px 40px' }}>
            <div className="welcome-visual" />
            <h1 style={{ fontWeight: 800, fontSize: '3rem', letterSpacing: '-0.04em' }}>Calm Study</h1>
            <p style={{ maxWidth: '440px', fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
              A distraction-free space for your local courses. 
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Add a folder to start your learning journey.</p>
            <button className="btn-primary" style={{ padding: '18px 36px', fontSize: '1.1rem' }} onClick={addCourse}>
              <FolderPlus size={22} />
              Open Course Folder
            </button>
          </div>
        )}
      </main>

      {toast && (
        <div className="toast">
          <div className="toast-icon">
            <Camera size={20} />
          </div>
          <div className="toast-content">
            <h4>{toast.title}</h4>
            <p>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
