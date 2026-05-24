/**
 * app.js — Main application controller
 *
 * Handles drag & drop, file reading, and orchestrates
 * parser → dashboard → table → detail flow.
 */

(function () {
  'use strict';

  // DOM references
  const dropZoneView = document.getElementById('dropZoneView');
  const dropZone = document.getElementById('dropZone');
  const dropZoneContent = document.getElementById('dropZoneContent');
  const dropZoneLoading = document.getElementById('dropZoneLoading');
  const loadingText = document.getElementById('loadingText');
  const fileInput = document.getElementById('fileInput');
  const loadDemoBtn = document.getElementById('loadDemoBtn');

  const dashboardView = document.getElementById('dashboardView');
  const fileNameEl = document.getElementById('fileName');
  const metadataBanner = document.getElementById('metadataBanner');
  const statsRow = document.getElementById('statsRow');
  const newFileBtn = document.getElementById('newFileBtn');

  // State
  let currentData = null;

  // =====================
  // Drag & Drop
  // =====================
  
  // Prevent default drag behaviors on the whole page
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Highlight drop zone on drag
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('drag-over');
    });
  });

  // Handle file drop
  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Click to browse
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  // New file button
  newFileBtn.addEventListener('click', resetToDropZone);

  // Load demo button
  loadDemoBtn.addEventListener('click', loadDemo);

  // =====================
  // File handling
  // =====================

  function handleFile(file) {
    showLoading(`Parsing ${file.name}…`);

    // Use setTimeout to allow UI to update before blocking parse
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          showLoading('Building mutation index…');

          setTimeout(() => {
            const data = MAFParser.parse(text);
            const stats = MAFParser.computeStats(data);

            currentData = { ...data, stats };
            showDashboard(file.name);
          }, 50);
        } catch (err) {
          console.error('Parse error:', err);
          alert('Failed to parse MAF file. Please check the file format.');
          hideLoading();
        }
      };

      reader.onerror = () => {
        alert('Failed to read file.');
        hideLoading();
      };

      reader.readAsText(file);
    }, 100);
  }

  async function loadDemo() {
    showLoading('Fetching demo file…');

    try {
      const res = await fetch('/demo/5b913527-2907-4006-b096-c460e6054c10.wxs.aliquot_ensemble_masked.maf');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      showLoading('Parsing demo mutations…');
      const text = await res.text();

      setTimeout(() => {
        const data = MAFParser.parse(text);
        const stats = MAFParser.computeStats(data);

        currentData = { ...data, stats };
        showDashboard('demo.maf');
      }, 50);
    } catch (err) {
      console.error('Failed to load demo:', err);
      alert('Could not load demo file. Make sure the demo/ folder is accessible.');
      hideLoading();
    }
  }

  // =====================
  // View transitions
  // =====================

  function showDashboard(fileName) {
    fileNameEl.textContent = fileName;

    // Render dashboard components
    Dashboard.renderMetadata(currentData.metadata, metadataBanner);
    Dashboard.renderStats(currentData.stats, statsRow);
    Dashboard.renderCharts(currentData.stats);
    DataTable.init(currentData, (mutation) => DetailPanel.open(mutation));

    // Switch views
    dropZoneView.style.display = 'none';
    dashboardView.classList.add('active');
  }

  function resetToDropZone() {
    dashboardView.classList.remove('active');
    dashboardView.style.display = 'none';
    dropZoneView.style.display = '';
    
    hideLoading();
    fileInput.value = '';
    currentData = null;

    // Reset display for next load
    setTimeout(() => {
      dashboardView.style.display = '';
    }, 50);
  }

  // =====================
  // Loading state
  // =====================

  function showLoading(message) {
    dropZoneContent.style.display = 'none';
    dropZoneLoading.classList.add('active');
    loadingText.textContent = message || 'Parsing…';
  }

  function hideLoading() {
    dropZoneLoading.classList.remove('active');
    dropZoneContent.style.display = '';
  }
})();
