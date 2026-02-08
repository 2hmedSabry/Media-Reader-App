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
  ChevronDown,
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
  X,
  Minimize2,
  Maximize2,
  PictureInPicture2,
  Settings,
  Github,
  Twitter,
  Type,
  Layout,
  Keyboard,
  Palette,
  Trash2,
  Edit3,
  Tag,
  Filter,
  Check,
  MoreHorizontal,
  BarChart2,
  HardDriveDownload,
  Layers,
  ExternalLink,
  Copy,
  Star,
  RefreshCw,
  FolderOpen,
  ArrowRightCircle,
  Scissors
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
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isSubPickerOpen, setIsSubPickerOpen] = useState(false);
  const [explorerWidth, setExplorerWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'default');
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('shortcuts');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('app-fontSize')) || 16);
  const [showFileDetails, setShowFileDetails] = useState(localStorage.getItem('app-showFileDetails') !== 'false');
  const videoRef = React.useRef(null);
  const [isPipActive, setIsPipActive] = useState(false);
  
  // Context Menu & Tags State
  const [contextMenu, setContextMenu] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null); 
  const [taggingCourseId, setTaggingCourseId] = useState(null);
  const [creatingGroupCourseId, setCreatingGroupCourseId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [tempInput, setTempInput] = useState('');
  const [fileContextMenu, setFileContextMenu] = useState(null);
  const [groupContextMenu, setGroupContextMenu] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [originalProgress, setOriginalProgress] = useState({}); // To revert "Mark All as Completed"
  const [addToGroupState, setAddToGroupState] = useState(null); // { filePath: string }
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setFileContextMenu(null);
      setGroupContextMenu(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const togglePip = async (e) => {
    if (e && e.target && typeof e.target.blur === 'function') e.target.blur();
    try {
      if (document.pictureInPictureElement) {
       } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed:', err);
    }
  };

  useEffect(() => {
    const handlePipChange = () => {
      setIsPipActive(!!document.pictureInPictureElement);
    };
    document.addEventListener('enterpictureinpicture', handlePipChange);
    document.addEventListener('leavepictureinpicture', handlePipChange);
    return () => {
      document.removeEventListener('enterpictureinpicture', handlePipChange);
      document.removeEventListener('leavepictureinpicture', handlePipChange);
    };
  }, []);

  const toggleMiniMode = async (e) => {
    if (e && e.target && typeof e.target.blur === 'function') e.target.blur();
    const newState = !isMiniMode;
    setIsMiniMode(newState);
    if (window.electron && window.electron.toggleMiniMode) {
      await window.electron.toggleMiniMode(newState);
    }
  };

  const handleContextMenu = (e, course) => {
    e.preventDefault();
    const { x, y } = getMenuPosition(e, 200, 350);
    setContextMenu({ x, y, courseId: course.id });
  };
  
  const updateCourse = (courseId, updates) => {
    const newCourses = courses.map(c => 
      c.id === courseId ? { ...c, ...updates } : c
    );
    setCourses(newCourses);
    window.electron.saveCourses(newCourses);
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(prev => ({ ...prev, ...updates }));
    }
  };
  
  const deleteCourse = (courseId) => {
    const newCourses = courses.filter(c => c.id !== courseId);
    setCourses(newCourses);
    window.electron.saveCourses(newCourses);
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(null);
      setAllFiles([]);
    }
    setContextMenu(null);
  };

  useEffect(() => {
    // Method 2: Scoped Watching - only watch active course
    if (selectedCourse) {
      window.electron.watchCourse(selectedCourse.path);
    } else {
      window.electron.stopWatchingCourse();
    }
    
    return () => {
      window.electron.stopWatchingCourse();
    };
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedCourse) return;
    
    // Method 1: Debounced Refresh
    const removeListener = window.electron.onCourseChanged(() => {
      console.log('Syncing files due to disk change...');
      loadFiles(selectedCourse.path);
    });
    
    return () => {
      if (typeof removeListener === 'function') removeListener();
    };
  }, [selectedCourse]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('app-showFileDetails', showFileDetails);
  }, [showFileDetails]);

  // Statistics Tracking
  const [stats, setStats] = useState(() => {
    try {
      const stored = localStorage.getItem('app-stats');
      return stored ? JSON.parse(stored) : { totalSeconds: 0, daily: {}, streaks: 0, lastStudyDate: null };
    } catch {
      return { totalSeconds: 0, daily: {}, streaks: 0, lastStudyDate: null };
    }
  });
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        setStats(prev => {
          const today = new Date().toISOString().split('T')[0];
          const newDaily = { ...prev.daily };
          if (!newDaily[today]) newDaily[today] = 0;
          newDaily[today] += 5; // adding 5 seconds per interval
          
          let newStreak = prev.streaks;
          if (prev.lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (prev.lastStudyDate === yesterdayStr) {
              newStreak = prev.streaks + 1;
            } else {
              newStreak = 1;
            }
          }

          return {
            ...prev,
            totalSeconds: prev.totalSeconds + 5,
            daily: newDaily,
            streaks: newStreak,
            lastStudyDate: today
          };
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('app-stats', JSON.stringify(stats));
  }, [stats]);

  // Listen for native file drops
  useEffect(() => {
    const handleNativeFileDrop = async (filePath) => {
      const folderPath = await window.electron.handleNativeDrop(filePath);
      if (folderPath) {
        handleFolderSelection(folderPath);
      }
    };

    // Make the function globally available for the injected script
    window.handleNativeFileDrop = handleNativeFileDrop;

    return () => {
      delete window.handleNativeFileDrop;
    };
  }, [courses]);

  const toggleFolder = (folderName) => {
    setSelectedFolderId(folderName);
    setExpandedFolders(prev => 
      prev.includes(folderName) 
        ? prev.filter(n => n !== folderName) 
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

      // Check for updates shortly after launch
      setTimeout(async () => {
        try {
          const update = await window.electron.checkUpdates();
          if (update && update.available) {
            setUpdateInfo(update);
          }
        } catch (err) {
          console.error('Update check failed:', err);
        }
      }, 3000);
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

      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

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

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    try {
      const files = e.dataTransfer.files;
      
      if (!files || files.length === 0) {
        return;
      }
      
      const firstFile = files[0];
      const filePath = firstFile.path;
      
      if (!filePath) {
        return;
      }
      
      // Check if it's a directory
      const isDir = await window.electron.isDirectory(filePath);
      
      let folderToAdd;
      
      if (isDir) {
        // It's a folder - add it directly
        folderToAdd = filePath;
      } else {
        // It's a file - get the parent directory
        const pathParts = filePath.split(/[/\\]/);
        pathParts.pop(); // Remove filename
        folderToAdd = pathParts.join('/');
      }
      
      if (folderToAdd) {
        handleFolderSelection(folderToAdd);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
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
    // Only set dragging to false if we're leaving the app container
    if (e.target.classList.contains('app-container')) {
      setIsDragging(false);
    }
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
    const virtualGroups = (selectedCourse?.groups || []).map(g => ({ ...g, isVirtual: true, lessons: [], resources: [] }));
    const filesInGroups = new Set(virtualGroups.flatMap(g => g.files || []));

    const lessons = allFiles.filter(f => ['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));
    const resources = allFiles.filter(f => !['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type));

    // Populate Virtual Groups
    allFiles.forEach(f => {
       if (filesInGroups.has(f.path)) {
          const group = virtualGroups.find(g => g.files && g.files.includes(f.path));
          if (group) {
             if (['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type)) {
                group.lessons.push(f);
             } else {
                group.resources.push(f);
             }
          }
       }
    });

    if (viewMode === 'flat') {
      return { lessons, resources, groups: null, virtualGroups };
    }

    // Group by physical folder
    const groups = {};
    const rootLessons = [];
    const rootResources = [];

    lessons.forEach(f => {
      if (filesInGroups.has(f.path)) return;
      if (!f.folder) {
        rootLessons.push(f);
      } else {
        if (!groups[f.folder]) groups[f.folder] = { lessons: [], resources: [] };
        groups[f.folder].lessons.push(f);
      }
    });
    
    resources.forEach(f => {
      if (filesInGroups.has(f.path)) return;
      if (!f.folder) {
        rootResources.push(f);
      } else {
        if (!groups[f.folder]) groups[f.folder] = { lessons: [], resources: [] };
        groups[f.folder].resources.push(f);
      }
    });
    
    // Merge & Sort
    const physicalGroups = Object.entries(groups).map(([name, data]) => ({
       id: name, // Physical folder name is ID
       name: name,
       lessons: data.lessons,
       resources: data.resources,
       isVirtual: false,
       files: [], // No manual file tracking needed
       subGroups: [] // For nested virtual groups
    }));
    
    const rootVirtualGroups = [];
    
    virtualGroups.forEach(vg => {
       if (vg.parentFolder) {
          const parent = physicalGroups.find(pg => pg.name === vg.parentFolder);
          if (parent) {
             parent.subGroups.push(vg);
          } else {
             rootVirtualGroups.push(vg);
          }
       } else {
          rootVirtualGroups.push(vg);
       }
    });
    
    // Sorting function for files
    const sortFiles = (files) => {
      const mode = selectedCourse?.settings?.sortMode || 'name';
      return [...files].sort((a, b) => {
        if (mode === 'name') return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        if (mode === 'type') return a.type.localeCompare(b.type);
        if (mode === 'size') return (a.size || 0) - (b.size || 0);
        if (mode === 'length') {
          const durA = progress[selectedCourse?.id]?.files?.[a.path]?.duration || 0;
          const durB = progress[selectedCourse?.id]?.files?.[b.path]?.duration || 0;
          return durA - durB;
        }
        return 0;
      });
    };

    // Sort contents of all groups
    const finalGroups = [...rootVirtualGroups, ...physicalGroups].map(g => ({
       ...g,
       lessons: sortFiles(g.lessons || []),
       resources: sortFiles(g.resources || []),
       subGroups: (g.subGroups || []).map(sg => ({
         ...sg,
         lessons: sortFiles(sg.lessons || []),
         resources: sortFiles(sg.resources || [])
       }))
    }));

    const mergedGroups = finalGroups.sort((a, b) => {
       const sortMode = selectedCourse?.settings?.sortMode || 'name';
       if (sortMode === 'name') return a.name.localeCompare(b.name, undefined, { numeric: true });
       if (sortMode === 'type') return (a.isVirtual ? 0 : 1) - (b.isVirtual ? 0 : 1);
       return 0;
    });

    return { 
      lessons: sortFiles(lessons), 
      resources: sortFiles(resources), 
      rootLessons: sortFiles(rootLessons),
      rootResources: sortFiles(rootResources),
      groups: mergedGroups 
    };
  }, [allFiles, viewMode, selectedCourse, progress]);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getMenuPosition = (e, menuWidth = 200, menuHeight = 300) => {
    let x = e.clientX;
    let y = e.clientY;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
    return { x, y };
  };

  const handleFileContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getMenuPosition(e, 220, 240);
    setFileContextMenu({ x, y, file });
  };

  const handleGroupContextMenu = (e, group) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getMenuPosition(e, 220, 280);
    setGroupContextMenu({ x, y, group });
  };

  const markCourseAsCompleted = (courseId, forceComplete = true) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (forceComplete) {
      // Save original progress
      setOriginalProgress(prev => ({ ...prev, [courseId]: progress[courseId] }));
      
      const newFilesProgress = { ...(progress[courseId]?.files || {}) };
      allFiles.forEach(f => {
        if (['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(f.type)) {
          newFilesProgress[f.path] = { time: 1000000, duration: 1000000 }; // Fake completion
        }
      });
      
      const newProgress = {
        ...progress,
        [courseId]: { ...progress[courseId], files: newFilesProgress }
      };
      setProgress(newProgress);
      window.electron.saveProgress(newProgress);
    } else {
      // Revert from originalProgress
      if (originalProgress[courseId]) {
        const newProgress = { ...progress, [courseId]: originalProgress[courseId] };
        setProgress(newProgress);
        window.electron.saveProgress(newProgress);
      }
    }
  };

  const convertGroupToFolder = async (group) => {
    if (!selectedCourse || !group.isVirtual) return;
    
    // Build path respecting the parent folder it's in
    let baseDir = selectedCourse.path;
    if (group.parentFolder && group.parentFolder !== 'Main Folder') {
      baseDir = `${selectedCourse.path}/${group.parentFolder}`;
    }
    
    const groupDir = `${baseDir}/${group.name}`;
    const success = await window.electron.createDir(groupDir);
    
    if (success) {
      for (const filePath of group.files) {
        const fileName = filePath.split(/[/\\]/).pop();
        await window.electron.moveFile({ oldPath: filePath, newPath: `${groupDir}/${fileName}` });
      }
      
      // Remove group from course
      const newGroups = (selectedCourse.groups || []).filter(g => g.id !== group.id);
      updateCourse(selectedCourse.id, { groups: newGroups });
      loadFiles(selectedCourse.path);
      showToast('Converted', `Group converted to physical folder: ${group.name}`);
    }
  };

  const handleCreateGroup = (arg) => {
    // If called from onClick, arg is Event. If called directly, it's string or null.
    let parentFolder = (typeof arg === 'string') ? arg : null;

    if (!selectedCourse) return;
    
    // Auto-detect folder priority:
    // 1. Explicit argument (Context Menu)
    // 2. Selected Folder (User clicked folder header)
    // 3. Selected File's Folder (Context of playing video)
    if (!parentFolder && selectedFolderId) parentFolder = selectedFolderId;
    if (!parentFolder && selectedFile && selectedFile.folder) parentFolder = selectedFile.folder;
    
    setTempInput('');
    setCreatingGroupCourseId({ courseId: selectedCourse.id, parentFolder });
  };

  const handleGroupDrop = (e, groupId) => {
    e.preventDefault();
    e.stopPropagation();
    const filePath = e.dataTransfer.getData('filePath');
    if (!filePath || !selectedCourse) return;

    const currentGroups = selectedCourse.groups || [];
    const targetGroup = currentGroups.find(g => g.id === groupId);
    
    if (targetGroup && (!targetGroup.files || !targetGroup.files.includes(filePath))) {
       const newGroups = currentGroups.map(g => {
         // Add to target
         if (g.id === groupId) {
           return { ...g, files: [...(g.files || []), filePath] };
         }
         // Remove from source (other virtual groups)
         if (g.files && g.files.includes(filePath)) {
           return { ...g, files: g.files.filter(f => f !== filePath) };
         }
         return g;
       });
       updateCourse(selectedCourse.id, { groups: newGroups });
    }
  };

  const handleRootDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const filePath = e.dataTransfer.getData('filePath');
    if (!filePath || !selectedCourse) return;
    
    // Logic for Virtual vs Physical move
    // If it's a virtual file (in categorized.groups array but not valid path?), we assume physical for now based on user context
    
    const fileName = filePath.split(/[/\\]/).pop();
    const newPath = `${selectedCourse.path}/${fileName}`;
    
    if (filePath === newPath) return; // Already in root

    // Check if moving from a virtual group?
    // If we move a file that is tracked in a virtual group to root, we might want to remove it from the group?
    // The current watcher handles physical moves.
    // If it's purely virtual grouping, we just update the group.
    
    // For now, let's assume Physical Move (which is what "Main Folder" implied)
    const success = await window.electron.moveFile({ oldPath: filePath, newPath });
    if (success) {
       showToast('Moved', 'File moved to root');
    }
  };

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
      {isSidebarVisible && !isMiniMode && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand">
              <MonitorPlay size={24} className="accent-color" style={{ color: 'var(--accent)' }} />
              <span>Media Reader</span>
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={addCourse}>
              <FolderPlus size={18} />
              Add Course
            </button>
          </div>

          <div className="course-list">
            <div className="explorer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Your Library</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {filterTag && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                    {filterTag}
                    <X size={10} style={{ marginLeft: '4px', cursor: 'pointer' }} onClick={() => setFilterTag(null)} />
                  </span>
                )}
                <button 
                  onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                  title="Filter by Tags"
                  style={{ background: 'none', border: 'none', color: isTagMenuOpen || filterTag ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', transition: 'color 0.2s' }}
                >
                  <Tag size={14} fill={filterTag ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {isTagMenuOpen && (
              <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 4px' }}>
                <button 
                  onClick={() => { setFilterTag(null); setIsTagMenuOpen(false); }}
                  style={{
                    fontSize: '10px', padding: '4px 8px', borderRadius: '12px',
                    border: '1px solid var(--border)', background: !filterTag ? 'var(--accent)' : 'transparent',
                    color: !filterTag ? '#fff' : 'var(--text-secondary)', cursor: 'pointer'
                  }}
                >
                  All
                </button>
                {[...new Set(courses.flatMap(c => c.tags || []))].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => { setFilterTag(tag); setIsTagMenuOpen(false); }}
                    style={{
                      fontSize: '10px', padding: '4px 8px', borderRadius: '12px',
                      border: '1px solid var(--border)', background: filterTag === tag ? 'var(--accent)' : 'transparent',
                      color: filterTag === tag ? '#fff' : 'var(--text-secondary)', cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {courses
              .filter(c => !filterTag || (c.tags && c.tags.includes(filterTag)))
              .map(course => (
              <div 
                key={course.id} 
                className={`course-item ${selectedCourse?.id === course.id ? 'active' : ''}`}
                onClick={() => setSelectedCourse(course)}
                onContextMenu={(e) => handleContextMenu(e, course)}
                title={course.path}
              >
                <Folder size={18} className="icon" style={{ color: course.color || 'inherit' }} />
                <span style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  flex: 1,
                  color: course.color || 'inherit',
                  fontWeight: course.color ? 600 : 'inherit'
                }}>
                  {course.alias || course.name}
                </span>
                {course.tags && course.tags.length > 0 && (
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.5 }} />
                )}
              </div>
            ))}
          </div>
  
            <div className="sidebar-footer">
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="settings-btn" onClick={() => setIsSettingsOpen(true)} title="Settings">
                  <Settings size={18} />
                </div>
                <div className="settings-btn" onClick={() => setIsStatsOpen(true)} title="Statistics">
                  <BarChart2 size={18} />
                </div>
              </div>
              
              <div className="social-links">
                <button 
                  onClick={() => window.electron.openExternal('https://github.com/2hmedSabry')} 
                  className="social-icon" 
                  title="GitHub"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Github size={16} />
                </button>
                <button 
                  onClick={() => window.electron.openExternal('https://twitter.com/2hmedsabri')} 
                  className="social-icon" 
                  title="Twitter"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Twitter size={16} />
                </button>
                <div className="developer-info">Ahmed Sabry</div>
              </div>
            </div>
          </aside>
        )}
  
        {/* Settings Overlay */}
        {isSettingsOpen && (
          <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
            <div className="settings-card" onClick={e => e.stopPropagation()}>
              <div className="settings-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Settings size={24} className="accent-color" style={{ color: 'var(--accent)' }} /> 
                  Settings & Preferences
                </h2>
                <button className="icon-btn" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
              </div>
              
              <div className="settings-content">
                <div className="settings-tabs">
                  <div className={`settings-tab ${activeTab === 'shortcuts' ? 'active' : ''}`} onClick={() => setActiveTab('shortcuts')}>
                    <Keyboard size={18} /> Shortcuts
                  </div>
                  <div className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
                    <Palette size={18} /> Appearance
                  </div>
                  <div className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                    <Layout size={18} /> General
                  </div>
                </div>
  
                <div className="settings-panel">
                  {activeTab === 'shortcuts' && (
                    <div className="settings-section">
                      <h3>Video Controls</h3>
                      <div className="shortcut-grid">
                        {[
                          { label: 'Play / Pause', keys: ['Space'], desc: 'Toggle video playback' },
                          { label: 'Seek Forward', keys: ['→'], desc: 'Skip ahead 10 seconds' },
                          { label: 'Seek Backward', keys: ['←'], desc: 'Go back 10 seconds' },
                          { label: 'Speed Up', keys: [']'], desc: 'Increase playback rate by 0.25x' },
                          { label: 'Speed Down', keys: ['['], desc: 'Decrease playback rate by 0.25x' },
                          { label: 'Full Screen', keys: ['F'], desc: 'Toggle fullscreen mode' },
                        ].map((s, idx) => (
                          <div key={idx} className="shortcut-item">
                            <div>
                              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{s.label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                            </div>
                            <div className="kbd-group">
                              {s.keys.map(k => <kbd key={k}>{k}</kbd>)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <h3 style={{ marginTop: '40px' }}>Navigation</h3>
                      <div className="shortcut-grid">
                        {[
                          { label: 'Next Lesson', keys: ['N'], desc: 'Jump to next video' },
                          { label: 'Previous Lesson', keys: ['P'], desc: 'Jump to previous video' },
                          { label: 'Search', keys: ['Ctrl', 'F'], desc: 'Open search modal' },
                          { label: 'Close Search', keys: ['Esc'], desc: 'Close search or modals' },
                        ].map((s, idx) => (
                          <div key={idx} className="shortcut-item">
                            <div>
                              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{s.label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                            </div>
                            <div className="kbd-group">
                              {s.keys.map(k => <kbd key={k}>{k}</kbd>)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <h3 style={{ marginTop: '40px' }}>Subtitles & Capture</h3>
                      <div className="shortcut-grid">
                        {[
                          { label: 'Toggle Subtitles', keys: ['C'], desc: 'Show/hide subtitles' },
                          { label: 'Select Subtitle', keys: ['V'], desc: 'Open subtitle picker' },
                          { label: 'Take Snapshot', keys: ['S'], desc: 'Capture current frame as image' },
                        ].map((s, idx) => (
                          <div key={idx} className="shortcut-item">
                            <div>
                              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{s.label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                            </div>
                            <div className="kbd-group">
                              {s.keys.map(k => <kbd key={k}>{k}</kbd>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
  
                  {activeTab === 'appearance' && (
                    <div className="settings-section">
                      <h3>Global Theme</h3>
                      <div className="theme-grid">
                        <div className={`theme-card ${theme === 'default' ? 'active' : ''}`} onClick={() => setTheme('default')}>
                          <div className="theme-preview" style={{ background: '#080a0f' }}>
                            <div style={{ background: '#6366f1', opacity: 0.5 }}></div>
                            <div style={{ background: '#11141d' }}></div>
                          </div>
                          Default Dark
                        </div>
                        <div className={`theme-card ${theme === 'ocean' ? 'active' : ''}`} onClick={() => setTheme('ocean')}>
                          <div className="theme-preview" style={{ background: '#061E29' }}>
                            <div style={{ background: '#5f9598', opacity: 0.5 }}></div>
                            <div style={{ background: '#0a2432' }}></div>
                          </div>
                          Oceanic
                        </div>
                        <div className={`theme-card ${theme === 'warm' ? 'active' : ''}`} onClick={() => setTheme('warm')}>
                          <div className="theme-preview" style={{ background: '#f0f4f4' }}>
                            <div style={{ background: '#ff9b51', opacity: 0.5 }}></div>
                            <div style={{ background: '#ffffff' }}></div>
                          </div>
                          Sunset Light
                        </div>
                      </div>
  
                      <h3 style={{ marginTop: '40px' }}>Typography</h3>
                      <div className="settings-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Type size={18} />
                          <span>Global Font Size</span>
                        </div>
                        <div className="control-group">
                          <input 
                            type="range" 
                            min="12" 
                            max="24" 
                            value={fontSize} 
                            onChange={(e) => setFontSize(parseInt(e.target.value))} 
                          />
                          <span style={{ minWidth: '40px' }}>{fontSize}px</span>
                        </div>
                      </div>

                      <div className="settings-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <List size={18} />
                          <span>Show File Details</span>
                        </div>
                        <button 
                          className={`btn-ghost ${showFileDetails ? 'active-accent' : ''}`}
                          onClick={() => setShowFileDetails(!showFileDetails)}
                        >
                          {showFileDetails ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                    </div>
                  )}
  
                  {activeTab === 'general' && (
                    <div className="settings-section">
                      <h3>App Configuration</h3>
                      <div className="settings-row">
                        <span>Explorer Sidebar Width</span>
                        <div className="control-group">
                          <input 
                            type="range" 
                            min="300" 
                            max="600" 
                            value={explorerWidth} 
                            onChange={(e) => setExplorerWidth(parseInt(e.target.value))} 
                          />
                          <span>{explorerWidth}px</span>
                        </div>
                      </div>
                      <div className="settings-row">
                        <span>Autoplay Next Lesson</span>
                        <button 
                          className={`btn-ghost ${isAutoplay ? 'active-accent' : ''}`}
                          onClick={() => setIsAutoplay(!isAutoplay)}
                        >
                          {isAutoplay ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>

                      <div className="settings-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                           <span style={{ fontWeight: 600 }}>Media Reader</span>
                           <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Version 1.2.0</span>
                         </div>
                         <button 
                           onClick={() => window.electron.openExternal('https://github.com/2hmedSabry/Media-Reader-App')}
                           className="btn-ghost"
                           style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', padding: '8px', cursor: 'pointer', fontSize: '1rem' }}
                         >
                           <Github size={16} /> Check for Updates
                         </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
  

      {/* Main View */}
      <main className="main-view">
        {selectedCourse ? (
          <>
            {!isMiniMode && (
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
            )}

            <div className={`content-wrapper ${isResizing ? 'resizing' : ''}`}>
              {isExplorerVisible && !isMiniMode && (
                <>
                  <div className="lesson-explorer" style={{ 
                    width: `${explorerWidth}px`,
                    ...(selectedCourse?.color && /^#[0-9A-F]{6}$/i.test(selectedCourse.color) ? {
                      '--accent': selectedCourse.color,
                      '--accent-soft': `rgba(${parseInt(selectedCourse.color.slice(1,3), 16)}, ${parseInt(selectedCourse.color.slice(3,5), 16)}, ${parseInt(selectedCourse.color.slice(5,7), 16)}, 0.15)`
                    } : {})
                  }}>
                  <div className="explorer-header-row">
                    <div className="explorer-section-title">Lessons</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {updateInfo && (
                        <button 
                          className="view-toggle-btn active-accent" 
                          onClick={() => window.electron.openExternal(updateInfo.url)}
                          title={`Update Available: v${updateInfo.version}`}
                          style={{ position: 'relative', color: '#fbbf24' }}
                        >
                          <HardDriveDownload size={16} />
                          <span style={{ 
                            position: 'absolute', 
                            top: '4px', 
                            right: '4px', 
                            width: '8px', 
                            height: '8px', 
                            background: '#ef4444', 
                            borderRadius: '50%',
                            border: '2px solid var(--bg-surface)'
                          }} />
                        </button>
                      )}
                      <button 
                         className="view-toggle-btn"
                         onClick={handleCreateGroup}
                         title="Create Virtual Group"
                      >
                        <FolderPlus size={15} />
                      </button>
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
                
                  <div 
                    className="scroll-area"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('drag-over-root');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('drag-over-root');
                    }}
                    onDrop={(e) => {
                      e.currentTarget.classList.remove('drag-over-root');
                      handleRootDrop(e);
                    }}
                  >
                    {viewMode === 'folders' ? (
                      <>
                        {/* Root Lessons (Former Main Folder) */}
                        {categorized.rootLessons.map((file, idx) => (
                          <div 
                            key={`root-L-${idx}`} 
                            className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                            onClick={() => handleFileClick(file)}
                            onContextMenu={(e) => handleFileContextMenu(e, file)}
                            draggable="true"
                            onDragStart={(e) => e.dataTransfer.setData('filePath', file.path)}
                          >
                            <div className="item-main-content">
                              {selectedFile?.path === file.path ? (
                                <Volume2 size={14} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                              ) : (
                                <Play size={14} className="icon" style={{ opacity: 0.6 }} />
                              )}
                              <span className="file-name">{file.name.replace(/\.[^/.]+$/, "")}</span>
                              {showFileDetails && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto', marginRight: '8px' }}>
                                   {formatSize(file.size)}
                                   {progress[selectedCourse?.id]?.files?.[file.path]?.duration > 0 && ` • ${formatDuration(progress[selectedCourse?.id]?.files?.[file.path]?.duration)}`}
                                </span>
                              )}
                              {!showFileDetails && <span style={{ marginLeft: 'auto' }} />}
                              {selectedCourse?.favorites?.includes(file.path) && <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                              {selectedFile?.path === file.path && <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} />}
                            </div>
                            {progress[selectedCourse?.id]?.files?.[file.path]?.duration > 0 && (
                              <div className="mini-progress-bar">
                                <div className="mini-progress-fill" style={{ width: `${(progress[selectedCourse.id].files[file.path].time / progress[selectedCourse.id].files[file.path].duration) * 100}%` }} />
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Root Resources */}
                        {categorized.rootResources.map((file, idx) => (
                          <div 
                            key={`root-R-${idx}`} 
                            className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                            onClick={() => handleFileClick(file)}
                            onContextMenu={(e) => handleFileContextMenu(e, file)}
                            draggable="true"
                            onDragStart={(e) => e.dataTransfer.setData('filePath', file.path)}
                          >
                            <div className="item-main-content">
                              {file.type === 'pdf' ? <FileIcon size={14} style={{ opacity: 0.5 }} /> : <FileText size={14} style={{ opacity: 0.5 }} />}
                              <span className="file-name" style={{ fontSize: '0.9rem' }}>{file.name}</span>
                              {showFileDetails && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto', marginRight: '8px' }}>
                                   {formatSize(file.size)}
                                </span>
                              )}
                              {!showFileDetails && <span style={{ marginLeft: 'auto' }} />}
                              {selectedCourse?.favorites?.includes(file.path) && <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                            </div>
                          </div>
                        ))}

                        {/* Unified Group Loop */}
                        {categorized.groups.map(group => {
                        const isExpanded = expandedFolders.includes(group.id);
                        const isVirtual = group.isVirtual;
                        return (
                          <div 
                            key={group.id} 
                            className="folder-group"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (group.isVirtual) e.currentTarget.classList.add('drag-over');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('drag-over');
                            }}
                            onDrop={(e) => {
                              e.currentTarget.classList.remove('drag-over');
                              if (group.isVirtual) {
                                handleGroupDrop(e, group.id);
                              }
                            }}
                          >
                            <div 
                              className={`lesson-item ${selectedFolderId === group.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(group.id);
                              }}
                              onContextMenu={(e) => handleGroupContextMenu(e, group)}
                            >
                              <div className="item-main-content">
                                {isExpanded ? <ChevronDown size={12} style={{ opacity: 0.4 }} /> : <ChevronRight size={12} style={{ opacity: 0.4 }} />}
                                <Layers size={14} style={{ opacity: 0.5 }} />
                                <span className="file-name" style={{ fontWeight: 500 }}>{group.name}</span>
                                {group.isVirtual && <span className="badge">Virtual</span>}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="folder-content">
                                {/* Nested Virtual Groups */}
                                {(group.subGroups || []).map(subGroup => {
                                  const isSubExpanded = expandedFolders.includes(subGroup.id);
                                  return (
                                    <div 
                                      key={subGroup.id} 
                                      className="folder-group sub-group"
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.classList.add('drag-over');
                                      }}
                                      onDragLeave={(e) => {
                                        e.currentTarget.classList.remove('drag-over');
                                      }}
                                      onDrop={(e) => {
                                        e.currentTarget.classList.remove('drag-over');
                                        handleGroupDrop(e, subGroup.id);
                                      }}
                                    >
                                      <div 
                                        className={`lesson-item ${selectedFolderId === subGroup.id ? 'active' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFolder(subGroup.id);
                                        }}
                                        onContextMenu={(e) => handleGroupContextMenu(e, subGroup)}
                                        style={{ opacity: 0.8 }}
                                      >
                                        <div className="item-main-content">
                                          {isSubExpanded ? <ChevronDown size={10} style={{ opacity: 0.4 }} /> : <ChevronRight size={10} style={{ opacity: 0.4 }} />}
                                          <Layers size={14} style={{ opacity: 0.5 }} />
                                          <span className="file-name" style={{ fontSize: '0.85rem' }}>{subGroup.name}</span>
                                          <span className="badge">Virtual</span>
                                        </div>
                                      </div>
                                      
                                      {isSubExpanded && (
                                        <div className="folder-content">
                                          {/* Sub-group Lessons */}
                                          {subGroup.lessons && subGroup.lessons.map((file, idx) => (
                                            <div 
                                              key={`${subGroup.id}-L-${idx}`} 
                                              className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                                              onClick={(e) => { e.stopPropagation(); handleFileClick(file); }}
                                              onContextMenu={(e) => handleFileContextMenu(e, file)}
                                              draggable="true"
                                              onDragStart={(e) => e.dataTransfer.setData('filePath', file.path)}
                                            >
                                              <div className="item-main-content">
                                                {selectedFile?.path === file.path ? (
                                                  <Volume2 size={12} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                                                ) : (
                                                  <Play size={10} style={{ opacity: 0.4 }} />
                                                )}
                                                <span className="file-name" style={{ fontSize: '0.8rem', ...(selectedFile?.path === file.path ? { color: 'var(--accent)' } : {}) }}>
                                                  {file.name.replace(/\.[^/.]+$/, "")}
                                                </span>
                                                {selectedCourse?.favorites?.includes(file.path) && <Star size={10} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                                                {selectedFile?.path === file.path && <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} />}
                                              </div>
                                            </div>
                                          ))}
                                          {/* Sub-group Resources */}
                                          {subGroup.resources && subGroup.resources.map((file, idx) => (
                                            <div 
                                              key={`${subGroup.id}-R-${idx}`} 
                                              className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                                              onClick={(e) => { e.stopPropagation(); handleFileClick(file); }}
                                              onContextMenu={(e) => handleFileContextMenu(e, file)}
                                              draggable="true"
                                              onDragStart={(e) => e.dataTransfer.setData('filePath', file.path)}
                                            >
                                              <div className="item-main-content">
                                                {file.type === 'pdf' ? <FileIcon size={10} style={{ opacity: 0.5 }} /> : <FileText size={10} style={{ opacity: 0.5 }} />}
                                                <span className="file-name" style={{ fontSize: '0.8rem', opacity: 0.8 }}>{file.name}</span>
                                                {selectedCourse?.favorites?.includes(file.path) && <Star size={10} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Files in this physical folder / virtual group */}
                                {group.lessons.map((file, idx) => (
                                  <div 
                                    key={`${group.id}-L-${idx}`} 
                                    className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleFileClick(file); }}
                                    onContextMenu={(e) => handleFileContextMenu(e, file)}
                                    draggable="true"
                                    onDragStart={(e) => e.dataTransfer.setData('filePath', file.path)}
                                  >
                                    <div className="item-main-content">
                                      {selectedFile?.path === file.path ? (
                                        <Volume2 size={12} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                                      ) : (
                                        <Play size={12} style={{ opacity: 0.4 }} />
                                      )}
                                      <span className="file-name" style={selectedFile?.path === file.path ? { color: 'var(--accent)' } : {}}>{file.name.replace(/\.[^/.]+$/, "")}</span>
                                      {selectedCourse?.favorites?.includes(file.path) && <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                                      {selectedFile?.path === file.path && <CheckCircle2 size={12} style={{ color: 'var(--accent)' }} />}
                                    </div>
                                    {progress[selectedCourse?.id]?.files?.[file.path]?.duration > 0 && (
                                      <div className="mini-progress-bar">
                                        <div className="mini-progress-fill" style={{ width: `${(progress[selectedCourse.id].files[file.path].time / progress[selectedCourse.id].files[file.path].duration) * 100}%` }} />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                
                                {group.resources.map((file, idx) => (
                                  <div 
                                    key={`${group.id}-R-${idx}`} 
                                    className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); handleFileClick(file); }}
                                    onContextMenu={(e) => handleFileContextMenu(e, file)}
                                    draggable="true"
                                    onDragStart={(e) => e.dataTransfer.setData('filePath', file.path)}
                                  >
                                    <div className="item-main-content">
                                      {file.type === 'pdf' ? <FileIcon size={12} style={{ opacity: 0.5 }} /> : <FileText size={12} style={{ opacity: 0.5 }} />}
                                      <span className="file-name" style={{ fontSize: '0.85rem' }}>{file.name}</span>
                                      {showFileDetails && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto', marginRight: '8px' }}>
                                          {formatSize(file.size)}
                                          {progress[selectedCourse?.id]?.files?.[file.path]?.duration > 0 && ` • ${formatDuration(progress[selectedCourse?.id]?.files?.[file.path]?.duration)}`}
                                        </span>
                                      )}
                                      {!showFileDetails && <span style={{ marginLeft: 'auto' }} />}
                                      {selectedCourse?.favorites?.includes(file.path) && <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                      <>
                        {categorized.lessons.map((file, idx) => (
                          <div 
                            key={idx} 
                            className={`lesson-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                            onClick={() => handleFileClick(file)}
                            onContextMenu={(e) => handleFileContextMenu(e, file)}
                          >
                            <div className="item-main-content">
                            <span className="lesson-number">{(idx + 1).toString().padStart(2, '0')}</span>
                            {selectedFile?.path === file.path ? (
                              <Volume2 size={14} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                            ) : (
                              <Play size={14} className="icon" style={{ opacity: 0.6 }} />
                            )}
                             <span className="file-name">{file.name.replace(/\.[^/.]+$/, "")}</span>
                             {showFileDetails && (
                               <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto', marginRight: '8px' }}>
                                  {formatSize(file.size)}
                                  {progress[selectedCourse?.id]?.files?.[file.path]?.duration > 0 && ` • ${formatDuration(progress[selectedCourse?.id]?.files?.[file.path]?.duration)}`}
                               </span>
                             )}
                             {!showFileDetails && <span style={{ marginLeft: 'auto' }} />}
                            {selectedCourse?.favorites?.includes(file.path) && <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
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
                                onContextMenu={(e) => handleFileContextMenu(e, file)}
                              >
                              <div className="item-main-content">
                          {selectedFile?.path === file.path ? (
                            <Volume2 size={14} className="icon playing-icon" style={{ color: 'var(--accent)' }} />
                          ) : (
                            file.type === 'pdf' ? <FileIcon size={14} className="icon" /> : <FileText size={14} className="icon" />
                          )}
                           <span className="file-name">{file.name}</span>
                          {selectedCourse?.favorites?.includes(file.path) && <Star size={12} style={{ color: '#f59e0b' }} fill="#f59e0b" />}
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
                  style={{ display: isMiniMode ? 'none' : 'flex' }}
                />
              </>
            )}

              <div 
                className="viewer-container"
                style={isMiniMode ? { 
                  margin: 0, 
                  borderRadius: 0, 
                  border: 'none',
                  width: '100vw',
                  height: '100vh',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  zIndex: 9999
                } : {}}
              >
                {selectedFile ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {isMiniMode && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '40px',
                        zIndex: 90,
                        WebkitAppRegion: 'drag',
                        cursor: 'grab'
                      }} />
                    )}
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
                        
                        {/* PiP, Notes & Mini Mode Controls */}
                        <div style={{
                          position: 'absolute',
                          top: '24px',
                          right: '24px',
                          display: 'flex',
                          gap: '8px',
                          zIndex: 100,
                          WebkitAppRegion: 'no-drag'
                        }}>
                          <button 
                            onClick={toggleMiniMode}
                            title={isMiniMode ? "Restore Mode" : "Mini Player Mode"}
                            style={{
                              background: isMiniMode ? 'var(--accent)' : 'rgba(0, 0, 0, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              cursor: 'pointer',
                              backdropFilter: 'blur(8px)',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isMiniMode ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                          </button>

                        </div>
                        
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
                      <pre className="text-viewer" style={{ fontSize: `${fontSize}px` }}>{fileContent}</pre>
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
            <h1 style={{ fontWeight: 800, fontSize: '3rem', letterSpacing: '-0.04em' }}>Media Reader</h1>
            <p style={{ maxWidth: '440px', fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
              A distraction-free space for your local media. 
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Add a folder to start your learning journey.</p>
            <button className="btn-primary" style={{ padding: '18px 36px', fontSize: '1.1rem' }} onClick={addCourse}>
              <FolderPlus size={22} />
              Open Media Folder
            </button>
          </div>
        )}
      </main>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            padding: '8px',
            minWidth: '200px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Colors */}
          <div style={{ display: 'flex', gap: '6px', padding: '4px 8px', marginBottom: '4px' }}>
            {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'].map(color => (
              <div 
                key={color}
                onClick={() => { updateCourse(contextMenu.courseId, { color }); setContextMenu(null); }}
                style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: color, cursor: 'pointer',
                  border: '2px solid rgba(255,255,255,0.1)', transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              />
            ))}
            <div className="ctx-divider" style={{ width: '1px', height: '18px', margin: '0 4px' }} />
            <div 
               onClick={() => { updateCourse(contextMenu.courseId, { color: null }); setContextMenu(null); }}
               title="Reset Color"
               style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--text-muted)', cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: '8px', left: '-1px', right: '-1px', height: '1px', background: 'var(--text-muted)', transform: 'rotate(45deg)' }} />
            </div>
          </div>
          
          <button className="ctx-item" onClick={() => { setEditingCourseId(contextMenu.courseId); setTempInput(courses.find(c => c.id === contextMenu.courseId)?.alias || courses.find(c => c.id === contextMenu.courseId)?.name); setContextMenu(null); }}>
            <Edit3 size={14} /> Rename Alias
          </button>

          <button className="ctx-item" onClick={() => { setTaggingCourseId(contextMenu.courseId); setTempInput(''); setContextMenu(null); }}>
            <Tag size={14} /> Add Tag
          </button>

          <div className="ctx-divider" />

          <button className="ctx-item" onClick={() => { 
                const course = courses.find(c => c.id === contextMenu.courseId);
                if (course) window.electron.openPath(course.path);
                setContextMenu(null);
            }}>
            <FolderOpen size={14} /> Open in Finder
          </button>

          <button className="ctx-item" onClick={() => { 
                const course = courses.find(c => c.id === contextMenu.courseId);
                if (course) loadFiles(course.path);
                setContextMenu(null);
            }}>
            <RefreshCw size={14} /> Refresh Folder
          </button>

          <button className="ctx-item" onClick={() => { 
                const isDone = originalProgress[contextMenu.courseId];
                markCourseAsCompleted(contextMenu.courseId, !isDone);
                setContextMenu(null);
            }}>
            <CheckCircle2 size={14} /> {originalProgress[contextMenu.courseId] ? 'Restore Progress' : 'Mark All as Completed'}
          </button>

          <button className="ctx-item" onClick={() => { 
                const course = courses.find(c => c.id === contextMenu.courseId);
                if (course) {
                  setCourseStats(course);
                  setIsStatsOpen(true);
                }
                setContextMenu(null);
            }}>
            <BarChart2 size={14} /> Course Stats
          </button>

          <div className="ctx-divider" />
          
          <button className="ctx-item delete" onClick={() => deleteCourse(contextMenu.courseId)}>
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}

      {fileContextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: fileContextMenu.y,
            left: fileContextMenu.x,
            padding: '8px',
            minWidth: '220px',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
          onClick={e => e.stopPropagation()}
        >
          <button className="ctx-item" onClick={() => { window.electron.openPath(fileContextMenu.file.path); setFileContextMenu(null); }}>
             <FolderOpen size={14} /> Show in Finder
          </button>
          <button className="ctx-item" onClick={() => { window.electron.openExternal(fileContextMenu.file.path); setFileContextMenu(null); }}>
             <ExternalLink size={14} /> Open with Default App
          </button>
          <button className="ctx-item" onClick={() => { navigator.clipboard.writeText(fileContextMenu.file.path); setFileContextMenu(null); showToast('Copied', 'File path copied to clipboard'); }}>
             <Copy size={14} /> Copy File Path
          </button>
          <div className="ctx-divider" />
          <button className="ctx-item" onClick={() => { 
              const favorites = selectedCourse.favorites || [];
              const isFav = favorites.includes(fileContextMenu.file.path);
              const newFavs = isFav ? favorites.filter(p => p !== fileContextMenu.file.path) : [...favorites, fileContextMenu.file.path];
              updateCourse(selectedCourse.id, { favorites: newFavs });
              setFileContextMenu(null);
              showToast(isFav ? 'Removed' : 'Added', `File ${isFav ? 'removed from' : 'added to'} favorites`);
          }}>
             <Star size={14} fill={selectedCourse.favorites?.includes(fileContextMenu.file.path) ? "#f59e0b" : "none"} style={{ color: selectedCourse.favorites?.includes(fileContextMenu.file.path) ? "#f59e0b" : "currentColor"}} /> 
             {selectedCourse.favorites?.includes(fileContextMenu.file.path) ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          <button className="ctx-item" onClick={() => { setAddToGroupState(fileContextMenu.file.path); setFileContextMenu(null); }}>
             <FolderPlus size={14} /> Add to File / Group
          </button>
          <button className="ctx-item" onClick={() => { updateProgress(fileContextMenu.file.path, 0, 0); setFileContextMenu(null); showToast('Reset', 'Progress reset for this file'); }}>
             <RefreshCw size={14} /> Mark as Unplayed
          </button>
        </div>
      )}

      {groupContextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            top: groupContextMenu.y,
            left: groupContextMenu.x,
            padding: '8px',
            minWidth: '220px',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
          onClick={e => e.stopPropagation()}
        >
          {groupContextMenu.group.isVirtual ? (
            <>
               <button className="ctx-item" onClick={() => { 
                   setEditingCourseId('GROUP_RENAME'); // Reusing temp state
                   setCreatingGroupCourseId({ groupId: groupContextMenu.group.id });
                   setTempInput(groupContextMenu.group.name); 
                   setGroupContextMenu(null); 
               }}>
                  <Edit3 size={14} /> Rename Group
               </button>
               <button className="ctx-item" onClick={() => { convertGroupToFolder(groupContextMenu.group); setGroupContextMenu(null); }}>
                  <ArrowRightCircle size={14} /> Convert to Physical Folder
               </button>
               <button className="ctx-item delete" onClick={() => { 
                   const newGroups = selectedCourse.groups.filter(g => g.id !== groupContextMenu.group.id);
                   updateCourse(selectedCourse.id, { groups: newGroups });
                   setGroupContextMenu(null);
               }}>
                  <Trash2 size={14} /> Delete Group
               </button>
            </>
          ) : (
            <button className="ctx-item" onClick={() => { handleCreateGroup(groupContextMenu.group.name); setGroupContextMenu(null); }}>
               <FolderPlus size={14} /> Create Sub-group here
            </button>
          )}
          <div className="ctx-divider" />
          <div style={{ padding: '6px 12px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>SORT BY</div>
          <button className={`ctx-item ${selectedCourse.settings?.sortMode === 'name' ? 'active-accent' : ''}`} onClick={() => { updateCourse(selectedCourse.id, { settings: { ...selectedCourse.settings, sortMode: 'name' } }); setGroupContextMenu(null); }}>
             Name
          </button>
          <button className={`ctx-item ${selectedCourse.settings?.sortMode === 'type' ? 'active-accent' : ''}`} onClick={() => { updateCourse(selectedCourse.id, { settings: { ...selectedCourse.settings, sortMode: 'type' } }); setGroupContextMenu(null); }}>
             Type
          </button>
          <button className={`ctx-item ${selectedCourse.settings?.sortMode === 'size' ? 'active-accent' : ''}`} onClick={() => { updateCourse(selectedCourse.id, { settings: { ...selectedCourse.settings, sortMode: 'size' } }); setGroupContextMenu(null); }}>
             Size
          </button>
          <button className={`ctx-item ${selectedCourse.settings?.sortMode === 'length' ? 'active-accent' : ''}`} onClick={() => { updateCourse(selectedCourse.id, { settings: { ...selectedCourse.settings, sortMode: 'length' } }); setGroupContextMenu(null); }}>
             Length (Duration)
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {editingCourseId && (
        <div className="modal-overlay" onClick={() => { setEditingCourseId(null); setCreatingGroupCourseId(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: '24px', borderRadius: '16px', width: '300px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700 }}>{editingCourseId === 'GROUP_RENAME' ? 'Rename Virtual Group' : 'Rename Alias'}</h3>
            <input 
              value={tempInput}
              onChange={e => setTempInput(e.target.value)}
              autoFocus
              className="search-input" 
              style={{ width: '100%', marginBottom: '16px', background: 'var(--bg-deep)', padding: '12px' }}
              placeholder="Enter new name..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (editingCourseId === 'GROUP_RENAME') {
                    const newGroups = selectedCourse.groups.map(g => g.id === creatingGroupCourseId.groupId ? { ...g, name: tempInput } : g);
                    updateCourse(selectedCourse.id, { groups: newGroups });
                  } else {
                    updateCourse(editingCourseId, { alias: tempInput });
                  }
                  setEditingCourseId(null);
                  setCreatingGroupCourseId(null);
                }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-ghost" onClick={() => { setEditingCourseId(null); setCreatingGroupCourseId(null); }}>Cancel</button>
              <button className="btn-primary" onClick={() => { 
                  if (editingCourseId === 'GROUP_RENAME') {
                    const newGroups = selectedCourse.groups.map(g => g.id === creatingGroupCourseId.groupId ? { ...g, name: tempInput } : g);
                    updateCourse(selectedCourse.id, { groups: newGroups });
                  } else {
                    updateCourse(editingCourseId, { alias: tempInput });
                  }
                  setEditingCourseId(null);
                  setCreatingGroupCourseId(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {taggingCourseId && (
        <div className="modal-overlay" onClick={() => setTaggingCourseId(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: '24px', borderRadius: '16px', width: '340px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700 }}>Manage Tags</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {courses.find(c => c.id === taggingCourseId)?.tags?.map(tag => (
                <span key={tag} style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(var(--accent-rgb), 0.1)' }}>
                  {tag}
                  <X size={14} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => {
                     const currentTags = courses.find(c => c.id === taggingCourseId)?.tags || [];
                     updateCourse(taggingCourseId, { tags: currentTags.filter(t => t !== tag) });
                  }} />
                </span>
              ))}
              {(!courses.find(c => c.id === taggingCourseId)?.tags?.length) && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tags added yet</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                value={tempInput}
                onChange={e => setTempInput(e.target.value)}
                className="search-input" 
                style={{ flex: 1, background: 'var(--bg-deep)', padding: '10px' }}
                placeholder="New tag..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && tempInput.trim()) {
                     const currentTags = courses.find(c => c.id === taggingCourseId)?.tags || [];
                     if (!currentTags.includes(tempInput.trim())) {
                       updateCourse(taggingCourseId, { tags: [...currentTags, tempInput.trim()] });
                       setTempInput('');
                     }
                  }
                }}
              />
              <button className="btn-primary" style={{ minWidth: '44px' }} onClick={() => {
                 if (tempInput.trim()) {
                     const currentTags = courses.find(c => c.id === taggingCourseId)?.tags || [];
                     if (!currentTags.includes(tempInput.trim())) {
                       updateCourse(taggingCourseId, { tags: [...currentTags, tempInput.trim()] });
                       setTempInput('');
                     }
                 }
              }}><Check size={18} /></button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <button className="btn-ghost" onClick={() => setTaggingCourseId(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {creatingGroupCourseId && !editingCourseId && (
        <div className="modal-overlay" onClick={() => setCreatingGroupCourseId(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: '24px', borderRadius: '16px', width: '320px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>New Virtual Group</h3>
            <input 
              value={tempInput}
              onChange={e => setTempInput(e.target.value)}
              autoFocus
              className="search-input" 
              style={{ width: '100%', marginBottom: '16px', background: 'var(--bg-deep)', padding: '10px' }}
              placeholder="Enter group name..."
              onKeyDown={(e) => {
                 if (e.key === 'Enter' && tempInput.trim()) {
                    const course = courses.find(c => c.id === creatingGroupCourseId.courseId);
                    if (course) {
                       const currentGroups = course.groups || [];
                       if (currentGroups.find(g => g.name === tempInput.trim())) {
                          alert("Group name already exists");
                          return;
                       }
                       const newGroups = [...currentGroups, { 
                          id: Date.now().toString(), 
                          name: tempInput.trim(), 
                          files: [],
                          isVirtual: true,
                          subGroups: [],
                          parentFolder: creatingGroupCourseId.parentFolder
                       }];
                       updateCourse(course.id, { groups: newGroups });
                    }
                    setCreatingGroupCourseId(null);
                    setTempInput('');
                 }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn-ghost" onClick={() => setCreatingGroupCourseId(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => { 
                 if (tempInput.trim()) {
                    const course = courses.find(c => c.id === creatingGroupCourseId.courseId);
                    if (course) {
                       const currentGroups = course.groups || [];
                       if (currentGroups.find(g => g.name === tempInput.trim())) {
                          alert("Group name already exists");
                          return;
                       }
                       const newGroups = [...currentGroups, { 
                          id: Date.now().toString(), 
                          name: tempInput.trim(), 
                          files: [],
                          isVirtual: true,
                          subGroups: [],
                          parentFolder: creatingGroupCourseId.parentFolder
                       }];
                       updateCourse(course.id, { groups: newGroups });
                    }
                    setCreatingGroupCourseId(null);
                    setTempInput('');
                 }
              }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Group Modal */}
      {addToGroupState && (
        <div className="modal-overlay" onClick={() => setAddToGroupState(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: '24px', borderRadius: '16px', width: '320px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>Add to Group</h3>
             
             <div className="group-list" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {/* Virtual Groups */}
                {(selectedCourse?.groups || []).filter(g => g.isVirtual).map(g => (
                   <div 
                     key={g.id} 
                     className="group-item-select"
                     style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid transparent', transition: 'all 0.2s' }}
                     onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                     onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                     onClick={() => {
                         const groupId = g.id;
                         const filePath = addToGroupState;
                         
                         const currentGroups = selectedCourse.groups || [];
                         const newGroups = currentGroups.map(grp => {
                            if (grp.id === groupId) {
                              return { ...grp, files: [...(grp.files || []), filePath] };
                            }
                            if (grp.files && grp.files.includes(filePath)) {
                               return { ...grp, files: grp.files.filter(f => f !== filePath) };
                            }
                            return grp;
                         });
                         
                         updateCourse(selectedCourse.id, { groups: newGroups });
                         showToast('Added', `Added to ${g.name}`);
                         setAddToGroupState(null);
                     }}
                   >
                      <Folder size={18} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontWeight: 500 }}>{g.name} <span style={{fontSize: '0.7em', opacity: 0.6}}>(Virtual)</span></span>
                   </div>
                ))}

                <div className="ctx-divider" style={{ margin: '8px 0' }} />

                {/* Physical Folders */}
                {(() => {
                   const folders = [...new Set(allFiles.map(f => f.folder).filter(f => f))].sort();
                   return folders.map(folder => (
                     <div 
                       key={folder} 
                       className="group-item-select"
                       style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid transparent', transition: 'all 0.2s' }}
                       onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                       onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                       onClick={async () => {
                           const filePath = addToGroupState;
                           const fileName = filePath.split(/[/\\]/).pop();
                           const newPath = `${selectedCourse.path}/${folder}/${fileName}`;
                           
                           if (filePath === newPath) {
                              setAddToGroupState(null);
                              return;
                           }

                           const success = await window.electron.moveFile({ oldPath: filePath, newPath });
                           if (success) {
                              showToast('Moved', `Moved to ${folder}`);
                              setAddToGroupState(null);
                           }
                       }}
                     >
                        <FolderOpen size={18} style={{ opacity: 0.6 }} />
                        <span style={{ fontWeight: 500 }}>{folder}</span>
                     </div>
                   ));
                })()}

                {(!selectedCourse?.groups || !selectedCourse.groups.some(g => g.isVirtual)) && (!allFiles.some(f => f.folder)) && (
                   <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontSize: '0.9rem' }}>No groups or folders found.</div>
                )}
             </div>

             <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
               <button className="btn-ghost" onClick={() => setAddToGroupState(null)}>Cancel</button>
               <button className="btn-ghost" style={{ color: 'var(--accent)' }} onClick={() => {
                   setCreatingGroupCourseId({ courseId: selectedCourse.id, parentFolder: null });
                   setAddToGroupState(null);
               }}>
                 <FolderPlus size={16} style={{ marginRight: '6px' }} /> New Group
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsOpen && (() => {
        const today = new Date();
        const days = Array.from({length: 7}, (_, i) => {
           const d = new Date(today);
           d.setDate(d.getDate() - (6 - i));
           return d.toISOString().split('T')[0];
        });
        const data = days.map(day => (stats.daily[day] || 0) / 60); // minutes
        const maxVal = Math.max(...data, 10); // Base scale of at least 10 mins
        
        // SVG Logic
        const width = 500;
        const height = 150;
        const padding = 20;
        const plotWidth = width - padding * 2;
        const plotHeight = height - padding * 2;
        
        const points = data.map((val, i) => {
          const x = padding + (i / (days.length - 1)) * plotWidth;
          const y = height - padding - (val / maxVal) * plotHeight;
          return `${x},${y}`;
        }).join(' ');

        const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

        return (
        <div className="modal-overlay" onClick={() => { setIsStatsOpen(false); setCourseStats(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: '32px', borderRadius: '24px', width: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '14px', letterSpacing: '-0.02em' }}>
                <BarChart2 size={28} style={{ color: 'var(--accent)' }} /> 
                {courseStats ? `${courseStats.alias || courseStats.name}` : 'Overall Progress'}
              </h2>
              <button className="icon-btn" style={{ background: 'var(--bg-elevated)' }} onClick={() => { setIsStatsOpen(false); setCourseStats(null); }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
               <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Hours</div>
                 <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{(stats.totalSeconds / 3600).toFixed(1)}</div>
               </div>
               <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Streak</div>
                 <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>{stats.streaks} <span style={{fontSize:'1rem'}}>days</span></div>
               </div>
               <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Lessons Done</div>
                 <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{courseStats ? Object.keys(progress[courseStats.id]?.files || {}).length : '---'}</div>
               </div>
            </div>

            <div style={{ background: 'var(--bg-deep)', borderRadius: '16px', padding: '24px', position: 'relative' }}>
               <h4 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Last 7 Days Activity (Minutes)</h4>
               <svg width="100%" height="150" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                 {/* Grid Lines */}
                 <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeWidth="1" />
                 <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border)" strokeDasharray="4 4" strokeWidth="1" opacity="0.3" />

                 {/* Area Fill */}
                 <polygon points={fillPoints} fill="var(--accent-soft)" opacity="0.5" />
                 
                 {/* Line */}
                 <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                 
                 {/* Points & Labels */}
                 {data.map((val, i) => {
                    const x = padding + (i / (days.length - 1)) * plotWidth;
                    const y = height - padding - (val / maxVal) * plotHeight;
                    const dayLabel = new Date(days[i]).toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth="2" />
                        <text x={x} y={height + 15} textAnchor="middle" fill="var(--text-muted)" fontSize="10">{dayLabel}</text>
                        {val > 0 && <text x={x} y={y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">{Math.round(val)}</text>}
                      </g>
                    );
                 })}
               </svg>
            </div>
          </div>
        </div>
        );
      })()}

      {toast && (
        <div className="toast">
          <div className="toast-icon" style={{ background: 'var(--accent-soft)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="toast-content">
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{toast.title}</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
