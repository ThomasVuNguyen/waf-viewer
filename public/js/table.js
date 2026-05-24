/**
 * table.js — Paginated, sortable, searchable data table for MAF mutations
 */

const DataTable = (() => {
  // Default visible columns (the most useful subset)
  const DEFAULT_COLUMNS = [
    'Hugo_Symbol',
    'Chromosome',
    'Start_Position',
    'Variant_Classification',
    'Variant_Type',
    'Reference_Allele',
    'Tumor_Seq_Allele2',
    'HGVSp_Short',
    'IMPACT',
    'SIFT',
    'PolyPhen',
    't_depth',
    't_alt_count',
    'callers',
  ];

  const ROWS_PER_PAGE = 50;

  let allColumns = [];
  let visibleColumns = [...DEFAULT_COLUMNS];
  let allMutations = [];
  let filteredMutations = [];
  let sortColumn = null;
  let sortDirection = 'none'; // 'asc', 'desc', 'none'
  let currentPage = 1;
  let searchQuery = '';

  // Callbacks
  let onRowClick = null;

  /**
   * Initialize table with parsed data
   */
  function init(data, rowClickHandler) {
    allColumns = data.columns;
    allMutations = data.mutations;
    filteredMutations = [...allMutations];
    onRowClick = rowClickHandler;
    currentPage = 1;
    sortColumn = null;
    sortDirection = 'none';
    searchQuery = '';

    // Filter visible columns to only those present in the data
    visibleColumns = DEFAULT_COLUMNS.filter(c => allColumns.includes(c));

    renderTable();
    setupSearch();
    setupColumnPicker();
  }

  function renderTable() {
    renderHead();
    renderBody();
    renderPagination();
  }

  function renderHead() {
    const thead = document.getElementById('dataTableHead');
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    // Row number column
    const thNum = document.createElement('th');
    thNum.textContent = '#';
    thNum.style.width = '50px';
    thNum.style.cursor = 'default';
    tr.appendChild(thNum);

    visibleColumns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.replace(/_/g, ' ');
      th.dataset.column = col;

      // Sort icon
      const icon = document.createElement('span');
      icon.className = 'sort-icon';
      icon.textContent = '↕';
      th.appendChild(icon);

      if (sortColumn === col) {
        th.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
        icon.textContent = sortDirection === 'asc' ? '↑' : '↓';
      }

      th.addEventListener('click', () => handleSort(col));
      tr.appendChild(th);
    });

    thead.appendChild(tr);
  }

  function renderBody() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = Math.min(start + ROWS_PER_PAGE, filteredMutations.length);
    const pageData = filteredMutations.slice(start, end);

    if (pageData.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = visibleColumns.length + 1;
      td.style.textAlign = 'center';
      td.style.padding = '48px';
      td.style.color = '#8a9bb5';
      td.innerHTML = searchQuery
        ? `No mutations matching "<strong>${escapeHtml(searchQuery)}</strong>"`
        : 'No mutations found';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    pageData.forEach((mutation, idx) => {
      const tr = document.createElement('tr');

      // Row number
      const tdNum = document.createElement('td');
      tdNum.textContent = start + idx + 1;
      tdNum.style.color = '#8a9bb5';
      tdNum.style.fontSize = '0.75rem';
      tr.appendChild(tdNum);

      visibleColumns.forEach(col => {
        const td = document.createElement('td');
        const value = mutation[col] || '';

        if (col === 'IMPACT') {
          td.innerHTML = renderImpactBadge(value);
        } else if (col === 'SIFT' || col === 'PolyPhen') {
          td.innerHTML = renderPrediction(value);
        } else {
          td.textContent = value || '—';
          td.title = value;
        }

        tr.appendChild(td);
      });

      tr.addEventListener('click', () => {
        if (onRowClick) onRowClick(mutation);
      });

      tbody.appendChild(tr);
    });
  }

  function renderPagination() {
    const container = document.getElementById('tablePagination');
    const totalPages = Math.ceil(filteredMutations.length / ROWS_PER_PAGE);
    const start = (currentPage - 1) * ROWS_PER_PAGE + 1;
    const end = Math.min(currentPage * ROWS_PER_PAGE, filteredMutations.length);

    container.innerHTML = `
      <span class="pagination-info">
        Showing ${filteredMutations.length > 0 ? start : 0}–${end} of ${filteredMutations.length.toLocaleString()} mutations
      </span>
      <div class="pagination-buttons" id="paginationButtons"></div>
    `;

    const btnContainer = document.getElementById('paginationButtons');

    // Prev
    addPageBtn(btnContainer, '← Prev', currentPage > 1, () => {
      currentPage--;
      renderBody();
      renderPagination();
      scrollToTable();
    });

    // Page numbers (show max 7)
    const pages = getPageNumbers(currentPage, totalPages, 7);
    pages.forEach(p => {
      if (p === '...') {
        const span = document.createElement('span');
        span.textContent = '…';
        span.style.color = '#8a9bb5';
        span.style.padding = '0 4px';
        btnContainer.appendChild(span);
      } else {
        addPageBtn(btnContainer, p, true, () => {
          currentPage = p;
          renderBody();
          renderPagination();
          scrollToTable();
        }, p === currentPage);
      }
    });

    // Next
    addPageBtn(btnContainer, 'Next →', currentPage < totalPages, () => {
      currentPage++;
      renderBody();
      renderPagination();
      scrollToTable();
    });
  }

  function addPageBtn(container, label, enabled, handler, isActive = false) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.disabled = !enabled;
    if (isActive) btn.classList.add('active');
    btn.addEventListener('click', handler);
    container.appendChild(btn);
  }

  function getPageNumbers(current, total, maxVisible) {
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    
    const pages = [];
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) pages.push(i);

    if (end < total) {
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }

    return pages;
  }

  /**
   * Handle column sort
   */
  function handleSort(col) {
    if (sortColumn === col) {
      sortDirection = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? 'none' : 'asc';
    } else {
      sortColumn = col;
      sortDirection = 'asc';
    }

    if (sortDirection === 'none') {
      filteredMutations = applySearch(allMutations);
    } else {
      filteredMutations.sort((a, b) => {
        let va = a[col] || '';
        let vb = b[col] || '';

        // Try numeric comparison
        const na = parseFloat(va);
        const nb = parseFloat(vb);
        if (!isNaN(na) && !isNaN(nb)) {
          return sortDirection === 'asc' ? na - nb : nb - na;
        }

        va = va.toLowerCase();
        vb = vb.toLowerCase();
        if (va < vb) return sortDirection === 'asc' ? -1 : 1;
        if (va > vb) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    currentPage = 1;
    renderTable();
  }

  /**
   * Search setup
   */
  function setupSearch() {
    const input = document.getElementById('tableSearch');
    input.value = '';

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = input.value.trim().toLowerCase();
        filteredMutations = applySearch(allMutations);
        if (sortColumn && sortDirection !== 'none') {
          handleSort(sortColumn); // re-apply sort
          return;
        }
        currentPage = 1;
        renderBody();
        renderPagination();
      }, 200);
    });
  }

  function applySearch(mutations) {
    if (!searchQuery) return [...mutations];
    return mutations.filter(m => {
      return visibleColumns.some(col => {
        const val = (m[col] || '').toLowerCase();
        return val.includes(searchQuery);
      });
    });
  }

  /**
   * Column picker
   */
  function setupColumnPicker() {
    const btn = document.getElementById('columnPickerBtn');
    const overlay = document.getElementById('columnPickerOverlay');
    const closeBtn = document.getElementById('columnPickerClose');
    const resetBtn = document.getElementById('columnPickerReset');
    const searchInput = document.getElementById('columnPickerSearch');

    btn.addEventListener('click', () => {
      renderColumnPickerGrid();
      overlay.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });

    resetBtn.addEventListener('click', () => {
      visibleColumns = DEFAULT_COLUMNS.filter(c => allColumns.includes(c));
      renderColumnPickerGrid();
      currentPage = 1;
      renderTable();
    });

    searchInput.addEventListener('input', () => {
      renderColumnPickerGrid(searchInput.value.toLowerCase());
    });
  }

  function renderColumnPickerGrid(filter = '') {
    const grid = document.getElementById('columnPickerGrid');
    grid.innerHTML = '';

    allColumns
      .filter(col => !filter || col.toLowerCase().includes(filter))
      .forEach(col => {
        const label = document.createElement('label');
        label.className = 'column-picker-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = visibleColumns.includes(col);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            // Insert in original order
            const insertIdx = allColumns.indexOf(col);
            let placed = false;
            for (let i = 0; i < visibleColumns.length; i++) {
              if (allColumns.indexOf(visibleColumns[i]) > insertIdx) {
                visibleColumns.splice(i, 0, col);
                placed = true;
                break;
              }
            }
            if (!placed) visibleColumns.push(col);
          } else {
            visibleColumns = visibleColumns.filter(c => c !== col);
          }
          currentPage = 1;
          renderTable();
        });

        const span = document.createElement('span');
        span.textContent = col;

        label.appendChild(checkbox);
        label.appendChild(span);
        grid.appendChild(label);
      });
  }

  /**
   * Rendering helpers
   */
  function renderImpactBadge(impact) {
    if (!impact) return '<span class="badge badge-modifier">—</span>';
    const cls = impact === 'HIGH' ? 'badge-high'
      : impact === 'MODERATE' ? 'badge-moderate'
      : impact === 'LOW' ? 'badge-low'
      : 'badge-modifier';
    return `<span class="badge ${cls}">${impact}</span>`;
  }

  function renderPrediction(value) {
    if (!value || value === '') return '<span style="color:#8a9bb5">—</span>';
    // SIFT: "tolerated(0.59)" or PolyPhen: "benign(0.02)"
    const match = value.match(/^(\w+)\(([\d.]+)\)$/);
    if (!match) return `<span style="color:#e8e9ea">${escapeHtml(value)}</span>`;

    const label = match[1];
    const score = parseFloat(match[2]);
    let cls = 'prediction-good';

    if (label === 'deleterious' || label === 'deleterious_low_confidence' ||
        label === 'probably_damaging' || label === 'possibly_damaging') {
      cls = score > 0.5 ? 'prediction-bad' : 'prediction-warn';
    }

    return `<span class="${cls}">${escapeHtml(label)} <small>(${score})</small></span>`;
  }

  function scrollToTable() {
    document.getElementById('tableSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();
