// ============================
// CloudShare File Sharing Application
// Pure Frontend Implementation with Local Storage
// ============================

(() => {
  'use strict';

  // ============================
  // Global State Management
  // ============================
  
  let files = JSON.parse(localStorage.getItem('cloudshare_files') || '[]');
  let sharedFiles = JSON.parse(localStorage.getItem('cloudshare_shared') || '[]');
  let currentFolder = 'root';
  let selectedFile = null;
  let currentView = 'grid';

  // DOM Elements
  const header = document.getElementById('site-header');
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const fileGrid = document.getElementById('fileGrid');
  const emptyState = document.getElementById('emptyState');
  const emptyShared = document.getElementById('emptyShared');
  const sharedList = document.getElementById('sharedList');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const breadcrumb = document.getElementById('breadcrumb');
  const toast = document.getElementById('toast');
  
  // Modals
  const previewModal = document.getElementById('previewModal');
  const shareModal = document.getElementById('shareModal');
  const contextMenu = document.getElementById('contextMenu');
  
  // Controls
  const viewButtons = document.querySelectorAll('.view-btn');
  const sortSelect = document.getElementById('sortSelect');

  // ============================
  // File Type Detection & Icons
  // ============================

  const fileTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
    video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
    audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
    document: ['doc', 'docx', 'txt', 'rtf', 'odt'],
    pdf: ['pdf'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'html', 'css', 'py', 'java', 'cpp', 'json', 'xml']
  };

  const fileIcons = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    document: '📄',
    pdf: '📕',
    archive: '📦',
    code: '💻',
    default: '📄'
  };

  function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    for (const [type, extensions] of Object.entries(fileTypes)) {
      if (extensions.includes(ext)) {
        return type;
      }
    }
    return 'default';
  }

  function getFileIcon(type) {
    return fileIcons[type] || fileIcons.default;
  }

  // ============================
  // Utility Functions
  // ============================

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function generateShareLink(fileId) {
    return `${window.location.origin}${window.location.pathname}?share=${fileId}`;
  }

  function showToast(message, type = 'default') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function saveData() {
    localStorage.setItem('cloudshare_files', JSON.stringify(files));
    localStorage.setItem('cloudshare_shared', JSON.stringify(sharedFiles));
  }

  // ============================
  // Header Scroll Effect
  // ============================

  function handleScroll() {
    const scrolled = window.scrollY > 8;
    header.classList.toggle('scrolled', scrolled);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ============================
  // Smooth Scrolling
  // ============================

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href.length === 1) return;
    
    const target = document.querySelector(href);
    if (!target) return;
    
    e.preventDefault();
    const headerHeight = header.getBoundingClientRect().height;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  });

  // ============================
  // Reveal Animation
  // ============================

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('reveal-in'));
  }

  // ============================
  // File Upload Functionality
  // ============================

  function handleFiles(fileList) {
    const fileArray = Array.from(fileList);
    
    if (fileArray.length === 0) return;
    
    uploadProgress.hidden = false;
    progressFill.style.width = '0%';
    progressText.textContent = 'Preparing upload...';

    let processed = 0;
    const total = fileArray.length;

    fileArray.forEach((file, index) => {
      setTimeout(() => {
        processFile(file, () => {
          processed++;
          const progress = (processed / total) * 100;
          progressFill.style.width = progress + '%';
          progressText.textContent = `Uploading ${processed}/${total} files...`;

          if (processed === total) {
            setTimeout(() => {
              uploadProgress.hidden = true;
              showToast(`${total} file(s) uploaded successfully!`, 'success');
              renderFiles();
            }, 500);
          }
        });
      }, index * 100); // Stagger uploads for visual effect
    });
  }

  function processFile(file, callback) {
    // Simulate file processing with FileReader for preview generation
    const reader = new FileReader();
    const fileObj = {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: getFileType(file.name),
      uploadDate: Date.now(),
      folder: currentFolder,
      data: null // In real app, this would be uploaded to server
    };

    // For demo purposes, we'll store a limited amount of data
    if (file.size < 100000) { // Only store small files for demo
      reader.onload = (e) => {
        fileObj.data = e.target.result;
        files.push(fileObj);
        saveData();
        callback();
      };
      reader.readAsDataURL(file);
    } else {
      // For larger files, just store metadata
      files.push(fileObj);
      saveData();
      callback();
    }
  }

  // Upload zone drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  });

  // ============================
  // File Management
  // ============================

  function sortFiles(files, sortBy) {
    return [...files].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.uploadDate - a.uploadDate;
        case 'size':
          return b.size - a.size;
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  }

  function renderFiles() {
    const folderFiles = files.filter(file => file.folder === currentFolder);
    const sortedFiles = sortFiles(folderFiles, sortSelect.value);

    if (sortedFiles.length === 0) {
      fileGrid.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    fileGrid.className = `file-grid ${currentView === 'list' ? 'list-view' : ''}`;
    
    fileGrid.innerHTML = sortedFiles.map(file => `
      <div class="file-item" data-id="${file.id}" oncontextmenu="showContextMenu(event, '${file.id}')">
        <div class="file-icon ${file.type}">
          ${getFileIcon(file.type)}
        </div>
        <div class="file-info">
          <h4 title="${file.name}">${file.name}</h4>
          <div class="file-meta">
            ${formatFileSize(file.size)} • ${formatDate(file.uploadDate)}
          </div>
        </div>
        <div class="file-actions">
          <button class="file-action" onclick="previewFile('${file.id}')" title="Preview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </button>
          <button class="file-action" onclick="shareFile('${file.id}')" title="Share">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
            </svg>
          </button>
          <button class="file-action" onclick="downloadFile('${file.id}')" title="Download">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  function renderSharedFiles() {
    if (sharedFiles.length === 0) {
      sharedList.innerHTML = '';
      emptyShared.hidden = false;
      return;
    }

    emptyShared.hidden = true;
    sharedList.innerHTML = sharedFiles.map(shared => {
      const file = files.find(f => f.id === shared.fileId);
      if (!file) return '';

      return `
        <div class="shared-item">
          <div class="file-icon ${file.type}">
            ${getFileIcon(file.type)}
          </div>
          <div class="shared-info">
            <h4>${file.name}</h4>
            <p>Shared on ${formatDate(shared.sharedDate)} • ${shared.accessCount || 0} access(es)</p>
          </div>
          <div class="shared-link">
            <span>${shared.link}</span>
            <button class="btn btn-ghost" onclick="copyToClipboard('${shared.link}')">Copy</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================
  // File Actions
  // ============================

  window.previewFile = function(fileId) {
    selectedFile = files.find(f => f.id === fileId);
    if (!selectedFile) return;

    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = selectedFile.name;

    // Generate preview based on file type
    let previewContent = '';
    if (selectedFile.type === 'image' && selectedFile.data) {
      previewContent = `<img src="${selectedFile.data}" alt="${selectedFile.name}" style="max-width: 100%; height: auto; border-radius: 8px;">`;
    } else if (selectedFile.type === 'text' && selectedFile.data) {
      previewContent = `<pre style="background: var(--surface-2); padding: 16px; border-radius: 8px; overflow: auto; max-height: 400px;">${selectedFile.data}</pre>`;
    } else {
      previewContent = `
        <div style="text-align: center; padding: 40px;">
          <div class="file-icon ${selectedFile.type}" style="width: 80px; height: 80px; margin: 0 auto 16px; font-size: 40px;">
            ${getFileIcon(selectedFile.type)}
          </div>
          <h3>${selectedFile.name}</h3>
          <p>Size: ${formatFileSize(selectedFile.size)}<br>
          Type: ${selectedFile.type}<br>
          Uploaded: ${formatDate(selectedFile.uploadDate)}</p>
        </div>
      `;
    }

    modalBody.innerHTML = previewContent;
    previewModal.hidden = false;
  };

  window.downloadFile = function(fileId) {
    const file = files.find(f => f.id === (fileId || selectedFile?.id));
    if (!file) return;

    // In a real application, this would download from server
    if (file.data) {
      const link = document.createElement('a');
      link.href = file.data;
      link.download = file.name;
      link.click();
    } else {
      // For demo purposes, show a message
      showToast('File downloaded successfully!', 'success');
    }
    
    closeModal();
  };

  window.shareFile = function(fileId) {
    selectedFile = files.find(f => f.id === (fileId || selectedFile?.id));
    if (!selectedFile) return;

    // Check if already shared
    let sharedFile = sharedFiles.find(s => s.fileId === selectedFile.id);
    if (!sharedFile) {
      sharedFile = {
        fileId: selectedFile.id,
        link: generateShareLink(selectedFile.id),
        sharedDate: Date.now(),
        accessCount: 0
      };
      sharedFiles.push(sharedFile);
      saveData();
    }

    document.getElementById('shareLink').value = sharedFile.link;
    shareModal.hidden = false;
    closeModal();
    renderSharedFiles();
  };

  window.deleteFile = function(fileId) {
    const file = files.find(f => f.id === (fileId || selectedFile?.id));
    if (!file) return;

    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      files = files.filter(f => f.id !== file.id);
      sharedFiles = sharedFiles.filter(s => s.fileId !== file.id);
      saveData();
      renderFiles();
      renderSharedFiles();
      showToast('File deleted successfully!', 'success');
      closeModal();
      hideContextMenu();
    }
  };

  // ============================
  // Context Menu
  // ============================

  window.showContextMenu = function(event, fileId) {
    event.preventDefault();
    selectedFile = files.find(f => f.id === fileId);
    if (!selectedFile) return;

    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.hidden = false;
  };

  function hideContextMenu() {
    contextMenu.hidden = true;
  }

  document.addEventListener('click', hideContextMenu);

  // ============================
  // Modal Functions
  // ============================

  window.closeModal = function() {
    previewModal.hidden = true;
    selectedFile = null;
  };

  window.closeShareModal = function() {
    shareModal.hidden = true;
  };

  window.copyShareLink = function() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    showToast('Share link copied to clipboard!', 'success');
  };

  window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Link copied to clipboard!', 'success');
    });
  };

  // ============================
  // View Controls
  // ============================

  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      viewButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderFiles();
    });
  });

  sortSelect.addEventListener('change', renderFiles);

  // ============================
  // Demo Data (for testing purposes)
  // ============================

  function createDemoFiles() {
    if (files.length > 0) return; // Don't create demo files if user files exist

    const demoFiles = [
      { name: 'presentation.pdf', size: 2500000, type: 'pdf' },
      { name: 'photo.jpg', size: 1200000, type: 'image' },
      { name: 'document.docx', size: 450000, type: 'document' },
      { name: 'video.mp4', size: 15000000, type: 'video' },
      { name: 'music.mp3', size: 3200000, type: 'audio' },
      { name: 'archive.zip', size: 8500000, type: 'archive' }
    ];

    demoFiles.forEach(demo => {
      files.push({
        id: generateId(),
        name: demo.name,
        size: demo.size,
        type: demo.type,
        uploadDate: Date.now() - Math.random() * 86400000 * 7, // Random date within last week
        folder: 'root',
        data: null
      });
    });

    saveData();
  }

  // ============================
  // Initialization
  // ============================

  function init() {
    createDemoFiles(); // Create demo files if none exist
    renderFiles();
    renderSharedFiles();

    // Check for shared file access
    const urlParams = new URLSearchParams(window.location.search);
    const sharedFileId = urlParams.get('share');
    if (sharedFileId) {
      const sharedFile = sharedFiles.find(s => s.fileId === sharedFileId);
      if (sharedFile) {
        // Increment access count
        sharedFile.accessCount = (sharedFile.accessCount || 0) + 1;
        saveData();
        previewFile(sharedFileId);
        showToast('Shared file opened!', 'success');
      } else {
        showToast('Shared file not found!', 'error');
      }
    }
  }

  // Start the application
  init();

})();