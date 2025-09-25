// ============================
// File Sharing Web Application - CloudShare
// ============================

(() => {
  // Application state
  const state = {
    files: JSON.parse(localStorage.getItem('cloudshare_files')) || [],
    folders: JSON.parse(localStorage.getItem('cloudshare_folders')) || [],
    currentPath: '',
    selectedFiles: [],
    viewMode: 'grid'
  };

  // DOM Elements
  const elements = {
    header: document.getElementById('site-header'),
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    uploadProgress: document.getElementById('uploadProgress'),
    progressFill: document.getElementById('progressFill'),
    uploadStatus: document.getElementById('uploadStatus'),
    filesGrid: document.getElementById('filesGrid'),
    emptyState: document.getElementById('emptyState'),
    breadcrumb: document.getElementById('breadcrumb'),
    contextMenu: document.getElementById('contextMenu'),
    modal: document.getElementById('modal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalActions: document.getElementById('modalActions'),
    toast: document.getElementById('toast'),
    advancedFileInput: document.getElementById('advancedFileInput'),
    fileCount: document.getElementById('fileCount'),
    startUploadBtn: document.getElementById('startUploadBtn'),
    clearSelectionBtn: document.getElementById('clearSelectionBtn'),
    uploadFolder: document.getElementById('uploadFolder'),
    generateLinks: document.getElementById('generateLinks'),
    shareableFiles: document.getElementById('shareableFiles'),
    shareLinks: document.getElementById('shareLinks'),
    downloadLink: document.getElementById('downloadLink'),
    previewLink: document.getElementById('previewLink')
  };

  // ============================
  // Core Functions
  // ============================

  // Initialize application
  function init() {
    setupEventListeners();
    setupScrollEffects();
    setupRevealAnimations();
    renderFiles();
    populateFolderSelect();
    populateShareableFiles();
    
    // Initialize with some demo files if empty
    if (state.files.length === 0) {
      createDemoFiles();
    }
  }

  // Create demo files for showcase
  function createDemoFiles() {
    const demoFiles = [
      {
        id: generateId(),
        name: 'Welcome.txt',
        type: 'text/plain',
        size: 1024,
        dateAdded: new Date().toISOString(),
        path: '',
        icon: '📄',
        downloadUrl: '#',
        previewUrl: '#'
      },
      {
        id: generateId(),
        name: 'presentation.pdf',
        type: 'application/pdf',
        size: 2048000,
        dateAdded: new Date().toISOString(),
        path: '',
        icon: '📑',
        downloadUrl: '#',
        previewUrl: '#'
      },
      {
        id: generateId(),
        name: 'vacation-photo.jpg',
        type: 'image/jpeg',
        size: 5242880,
        dateAdded: new Date().toISOString(),
        path: '',
        icon: '🖼️',
        downloadUrl: '#',
        previewUrl: '#'
      }
    ];

    const demoFolders = [
      {
        id: generateId(),
        name: 'Documents',
        path: '',
        dateCreated: new Date().toISOString(),
        icon: '📁'
      },
      {
        id: generateId(),
        name: 'Photos',
        path: '',
        dateCreated: new Date().toISOString(),
        icon: '📸'
      }
    ];

    state.files = demoFiles;
    state.folders = demoFolders;
    saveState();
    renderFiles();
    populateFolderSelect();
    populateShareableFiles();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Upload zone interactions
    if (elements.uploadZone) {
      elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
      elements.uploadZone.addEventListener('dragover', handleDragOver);
      elements.uploadZone.addEventListener('dragleave', handleDragLeave);
      elements.uploadZone.addEventListener('drop', handleDrop);
    }

    if (elements.fileInput) {
      elements.fileInput.addEventListener('change', handleFileSelect);
    }

    // Advanced upload form
    if (elements.advancedFileInput) {
      elements.advancedFileInput.addEventListener('change', updateFileCount);
    }

    if (elements.startUploadBtn) {
      elements.startUploadBtn.addEventListener('click', handleAdvancedUpload);
    }

    if (elements.clearSelectionBtn) {
      elements.clearSelectionBtn.addEventListener('click', clearFileSelection);
    }

    // File management
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('contextmenu', handleContextMenu);

    // View toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => toggleView(btn.dataset.view));
    });

    // Create folder button
    const createFolderBtn = document.getElementById('createFolderBtn');
    if (createFolderBtn) {
      createFolderBtn.addEventListener('click', showCreateFolderModal);
    }

    // Copy buttons
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', () => copyToClipboard(btn.dataset.target));
    });

    // Modal close
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    if (elements.modalOverlay) {
      elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) closeModal();
      });
    }

    // Smooth scrolling for navigation
    setupSmoothScrolling();
  }

  // Setup scroll effects for header
  function setupScrollEffects() {
    if (!elements.header) return;

    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      elements.header.classList.toggle('scrolled', scrollTop > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Setup smooth scrolling
  function setupSmoothScrolling() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href.length === 1) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const headerHeight = elements.header?.getBoundingClientRect().height || 0;
      const offset = headerHeight + 8;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  // Setup reveal animations
  function setupRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
  }

  // ============================
  // File Upload Functions
  // ============================

  function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
  }

  function processFiles(files) {
    if (files.length === 0) return;

    showUploadProgress();
    
    files.forEach((file, index) => {
      setTimeout(() => {
        addFile(file);
        const progress = ((index + 1) / files.length) * 100;
        updateUploadProgress(progress);
        
        if (index === files.length - 1) {
          setTimeout(hideUploadProgress, 500);
        }
      }, index * 200);
    });
  }

  function addFile(file) {
    const fileObj = {
      id: generateId(),
      name: file.name,
      type: file.type,
      size: file.size,
      dateAdded: new Date().toISOString(),
      path: state.currentPath,
      icon: getFileIcon(file.type),
      downloadUrl: generateDownloadUrl(file.name),
      previewUrl: generatePreviewUrl(file.name)
    };

    state.files.push(fileObj);
    saveState();
    renderFiles();
    populateShareableFiles();
    
    showToast(`File "${file.name}" uploaded successfully!`, 'success');
  }

  function showUploadProgress() {
    const uploadContent = elements.uploadZone.querySelector('.upload-content');
    if (uploadContent) uploadContent.style.opacity = '0';
    elements.uploadProgress.style.display = 'flex';
  }

  function updateUploadProgress(percentage) {
    elements.progressFill.style.width = percentage + '%';
    elements.uploadStatus.textContent = `Uploading... ${Math.round(percentage)}%`;
  }

  function hideUploadProgress() {
    elements.uploadProgress.style.display = 'none';
    const uploadContent = elements.uploadZone.querySelector('.upload-content');
    if (uploadContent) uploadContent.style.opacity = '1';
    elements.progressFill.style.width = '0%';
  }

  // Advanced upload functions
  function updateFileCount() {
    const count = elements.advancedFileInput.files.length;
    elements.fileCount.textContent = count === 0 ? 'No files selected' : 
                                    count === 1 ? '1 file selected' : 
                                    `${count} files selected`;
  }

  function handleAdvancedUpload() {
    const files = Array.from(elements.advancedFileInput.files);
    if (files.length === 0) {
      showToast('Please select files first', 'error');
      return;
    }

    processFiles(files);
    clearFileSelection();
  }

  function clearFileSelection() {
    elements.advancedFileInput.value = '';
    updateFileCount();
  }

  // ============================
  // File Management Functions
  // ============================

  function renderFiles() {
    const currentFiles = state.files.filter(file => file.path === state.currentPath);
    const currentFolders = state.folders.filter(folder => folder.path === state.currentPath);
    
    if (currentFiles.length === 0 && currentFolders.length === 0) {
      elements.filesGrid.innerHTML = '<div class="empty-state" id="emptyState"><div class="empty-icon">📂</div><h3>No files yet</h3><p>Upload your first file to get started</p></div>';
      return;
    }

    let html = '';

    // Render folders first
    currentFolders.forEach(folder => {
      html += `
        <div class="file-item folder-item" data-id="${folder.id}" data-type="folder">
          <div class="file-icon">${folder.icon}</div>
          <div class="file-name">${folder.name}</div>
          <div class="file-meta">Folder • ${new Date(folder.dateCreated).toLocaleDateString()}</div>
        </div>
      `;
    });

    // Render files
    currentFiles.forEach(file => {
      const fileSize = formatFileSize(file.size);
      const fileDate = new Date(file.dateAdded).toLocaleDateString();
      
      html += `
        <div class="file-item" data-id="${file.id}" data-type="file">
          <div class="file-icon">${file.icon}</div>
          <div class="file-name">${file.name}</div>
          <div class="file-meta">${fileSize} • ${fileDate}</div>
        </div>
      `;
    });

    elements.filesGrid.innerHTML = html;
    updateBreadcrumb();
  }

  function updateBreadcrumb() {
    const pathParts = state.currentPath ? state.currentPath.split('/') : [];
    let html = '<a href="#" data-path="">Home</a>';
    
    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += (index === 0 ? '' : '/') + part;
      html += ` / <a href="#" data-path="${currentPath}">${part}</a>`;
    });
    
    elements.breadcrumb.innerHTML = html;
  }

  function handleDocumentClick(e) {
    // Handle breadcrumb navigation
    const breadcrumbLink = e.target.closest('.breadcrumb a');
    if (breadcrumbLink) {
      e.preventDefault();
      navigateToPath(breadcrumbLink.dataset.path);
      return;
    }

    // Handle file/folder clicks
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      const id = fileItem.dataset.id;
      const type = fileItem.dataset.type;
      
      if (type === 'folder') {
        openFolder(id);
      } else {
        openFile(id);
      }
      return;
    }

    // Close context menu
    hideContextMenu();
  }

  function navigateToPath(path) {
    state.currentPath = path;
    renderFiles();
  }

  function openFolder(folderId) {
    const folder = state.folders.find(f => f.id === folderId);
    if (folder) {
      const newPath = folder.path ? `${folder.path}/${folder.name}` : folder.name;
      navigateToPath(newPath);
    }
  }

  function openFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (file) {
      showFilePreview(file);
    }
  }

  function showFilePreview(file) {
    elements.modalTitle.textContent = file.name;
    elements.modalBody.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">${file.icon}</div>
        <h3>${file.name}</h3>
        <p><strong>Type:</strong> ${file.type}</p>
        <p><strong>Size:</strong> ${formatFileSize(file.size)}</p>
        <p><strong>Date Added:</strong> ${new Date(file.dateAdded).toLocaleString()}</p>
        <p><strong>Download URL:</strong> <code>${file.downloadUrl}</code></p>
      </div>
    `;
    elements.modalActions.innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="downloadFile('${file.id}')">Download</button>
    `;
    showModal();
  }

  // ============================
  // Context Menu Functions
  // ============================

  function handleContextMenu(e) {
    const fileItem = e.target.closest('.file-item');
    if (!fileItem) return;

    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, fileItem);
  }

  function showContextMenu(x, y, fileItem) {
    const fileId = fileItem.dataset.id;
    const fileType = fileItem.dataset.type;
    
    elements.contextMenu.style.left = x + 'px';
    elements.contextMenu.style.top = y + 'px';
    elements.contextMenu.style.display = 'block';
    
    // Setup context menu actions
    document.getElementById('downloadFile').onclick = () => {
      if (fileType === 'file') downloadFile(fileId);
      hideContextMenu();
    };
    
    document.getElementById('shareFile').onclick = () => {
      if (fileType === 'file') shareFile(fileId);
      hideContextMenu();
    };
    
    document.getElementById('renameFile').onclick = () => {
      renameItem(fileId, fileType);
      hideContextMenu();
    };
    
    document.getElementById('deleteFile').onclick = () => {
      deleteItem(fileId, fileType);
      hideContextMenu();
    };
  }

  function hideContextMenu() {
    elements.contextMenu.style.display = 'none';
  }

  // ============================
  // File Actions
  // ============================

  function downloadFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (file) {
      // In a real application, this would trigger an actual download
      showToast(`Downloading "${file.name}"...`, 'success');
    }
  }

  function shareFile(fileId) {
    const file = state.files.find(f => f.id === fileId);
    if (file) {
      selectFileForSharing(fileId);
      // Smooth scroll to share section
      document.getElementById('share').scrollIntoView({ behavior: 'smooth' });
    }
  }

  function renameItem(itemId, type) {
    const item = type === 'file' ? 
      state.files.find(f => f.id === itemId) :
      state.folders.find(f => f.id === itemId);
      
    if (!item) return;

    const newName = prompt(`Rename ${type}:`, item.name);
    if (newName && newName !== item.name) {
      item.name = newName;
      saveState();
      renderFiles();
      showToast(`${type} renamed successfully!`, 'success');
    }
  }

  function deleteItem(itemId, type) {
    const confirmDelete = confirm(`Are you sure you want to delete this ${type}?`);
    if (!confirmDelete) return;

    if (type === 'file') {
      state.files = state.files.filter(f => f.id !== itemId);
    } else {
      state.folders = state.folders.filter(f => f.id !== itemId);
    }

    saveState();
    renderFiles();
    populateShareableFiles();
    showToast(`${type} deleted successfully!`, 'success');
  }

  // ============================
  // Sharing Functions
  // ============================

  function populateShareableFiles() {
    if (!elements.shareableFiles) return;

    const files = state.files.filter(f => f.path === state.currentPath);
    
    if (files.length === 0) {
      elements.shareableFiles.innerHTML = '<p style="color: var(--muted); text-align: center;">No files to share</p>';
      return;
    }

    let html = '';
    files.forEach(file => {
      html += `
        <div class="shareable-file-item" data-file-id="${file.id}">
          <span class="file-icon">${file.icon}</span>
          <div>
            <div class="file-name">${file.name}</div>
            <div class="file-meta">${formatFileSize(file.size)}</div>
          </div>
        </div>
      `;
    });

    elements.shareableFiles.innerHTML = html;

    // Add click handlers
    elements.shareableFiles.querySelectorAll('.shareable-file-item').forEach(item => {
      item.addEventListener('click', () => selectFileForSharing(item.dataset.fileId));
    });
  }

  function selectFileForSharing(fileId) {
    // Remove previous selection
    elements.shareableFiles.querySelectorAll('.shareable-file-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Select current file
    const selectedItem = elements.shareableFiles.querySelector(`[data-file-id="${fileId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }

    const file = state.files.find(f => f.id === fileId);
    if (file) {
      elements.downloadLink.value = file.downloadUrl;
      elements.previewLink.value = file.previewUrl;
      elements.shareLinks.style.display = 'block';
    }
  }

  function copyToClipboard(targetId) {
    const input = document.getElementById(targetId);
    if (input) {
      input.select();
      document.execCommand('copy');
      showToast('Link copied to clipboard!', 'success');
    }
  }

  // ============================
  // Folder Management
  // ============================

  function showCreateFolderModal() {
    elements.modalTitle.textContent = 'Create New Folder';
    elements.modalBody.innerHTML = `
      <div class="form-field">
        <label for="folderName">Folder Name</label>
        <input type="text" id="folderName" placeholder="Enter folder name" autofocus>
      </div>
    `;
    elements.modalActions.innerHTML = `
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createFolder()">Create Folder</button>
    `;
    showModal();
  }

  function createFolder() {
    const folderNameInput = document.getElementById('folderName');
    const folderName = folderNameInput.value.trim();
    
    if (!folderName) {
      showToast('Please enter a folder name', 'error');
      return;
    }

    const newFolder = {
      id: generateId(),
      name: folderName,
      path: state.currentPath,
      dateCreated: new Date().toISOString(),
      icon: '📁'
    };

    state.folders.push(newFolder);
    saveState();
    renderFiles();
    populateFolderSelect();
    closeModal();
    showToast(`Folder "${folderName}" created successfully!`, 'success');
  }

  function populateFolderSelect() {
    if (!elements.uploadFolder) return;

    let html = '<option value="">Root Folder</option>';
    state.folders.forEach(folder => {
      const fullPath = folder.path ? `${folder.path}/${folder.name}` : folder.name;
      html += `<option value="${fullPath}">${fullPath}</option>`;
    });

    elements.uploadFolder.innerHTML = html;
  }

  // ============================
  // View Management
  // ============================

  function toggleView(viewMode) {
    state.viewMode = viewMode;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewMode);
    });

    // Update grid layout
    if (viewMode === 'list') {
      elements.filesGrid.classList.add('list-view');
    } else {
      elements.filesGrid.classList.remove('list-view');
    }
  }

  // ============================
  // Modal Functions
  // ============================

  function showModal() {
    elements.modalOverlay.style.display = 'flex';
  }

  function closeModal() {
    elements.modalOverlay.style.display = 'none';
  }

  // ============================
  // Utility Functions
  // ============================

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📑';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation')) return '📋';
    if (mimeType.startsWith('text/')) return '📄';
    return '📎';
  }

  function generateDownloadUrl(filename) {
    // In a real application, this would be a proper download URL
    return `${window.location.origin}/download/${encodeURIComponent(filename)}`;
  }

  function generatePreviewUrl(filename) {
    // In a real application, this would be a proper preview URL
    return `${window.location.origin}/preview/${encodeURIComponent(filename)}`;
  }

  function saveState() {
    localStorage.setItem('cloudshare_files', JSON.stringify(state.files));
    localStorage.setItem('cloudshare_folders', JSON.stringify(state.folders));
  }

  function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 3000);
  }

  // ============================
  // Global Functions (for onclick handlers)
  // ============================

  window.closeModal = closeModal;
  window.createFolder = createFolder;
  window.downloadFile = downloadFile;

  // ============================
  // Initialize Application
  // ============================

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();