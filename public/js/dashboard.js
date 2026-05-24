/**
 * dashboard.js — Renders summary stats and Chart.js visualizations
 * 
 * Uses the Scientific Mode palette for all chart colors.
 */

const Dashboard = (() => {
  // Scientific Mode chart palette
  const PALETTE = [
    '#1e96a5', // teal
    '#f0c382', // gold
    '#eb5f3c', // coral
    '#145aaa', // blue
    '#6dd5a8', // mint
    '#c77dba', // lavender
    '#4ecdc4', // aqua
    '#ff9f43', // amber
    '#78b4e8', // sky
    '#e8786c', // salmon
    '#9ed174', // lime
    '#d4a0e8', // orchid
    '#f7dc6f', // yellow
    '#45b7d1', // cyan
    '#ff7675', // rose
    '#a29bfe', // periwinkle
    '#fd79a8', // pink
    '#81ecec', // light teal
    '#ffeaa7', // cream
    '#74b9ff', // light blue
    '#55efc4', // light green
    '#fab1a0', // peach
  ];

  const IMPACT_COLORS = {
    HIGH: '#eb5f3c',
    MODERATE: '#f0c382',
    LOW: '#1e96a5',
    MODIFIER: '#8a9bb5',
    Unknown: '#555',
  };

  // Chart.js defaults for Scientific Mode
  function setChartDefaults() {
    Chart.defaults.color = '#e8e9ea';
    Chart.defaults.borderColor = 'rgba(30, 150, 165, 0.1)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.animation.duration = 800;
    Chart.defaults.animation.easing = 'easeOutQuart';
  }

  let charts = [];

  /**
   * Render the metadata banner
   */
  function renderMetadata(metadata, el) {
    const fields = [
      { label: 'GDC Version', key: 'version' },
      { label: 'Annotation Spec', key: 'annotation.spec' },
      { label: 'File Date', key: 'filedate' },
      { label: 'Sort Order', key: 'sort.order' },
      { label: 'Normal Aliquot', key: 'normal.aliquot' },
      { label: 'Tumor Aliquot', key: 'tumor.aliquot' },
    ];

    el.innerHTML = fields
      .filter(f => metadata[f.key])
      .map(f => `
        <div class="metadata-item">
          <span class="metadata-label">${f.label}</span>
          <span class="metadata-value">${truncate(metadata[f.key], 36)}</span>
        </div>
      `).join('');
  }

  /**
   * Render the stats cards
   */
  function renderStats(stats, el) {
    const callerList = Object.keys(stats.callers).join(', ') || '—';
    const highImpact = stats.impacts['HIGH'] || 0;
    const moderateImpact = stats.impacts['MODERATE'] || 0;

    const cards = [
      {
        label: 'Total Mutations',
        value: stats.totalMutations.toLocaleString(),
        detail: `across ${Object.keys(stats.chromosomes).length} chromosomes`,
        color: '',
      },
      {
        label: 'Unique Genes',
        value: stats.uniqueGeneCount.toLocaleString(),
        detail: 'genes with mutations',
        color: 'gold',
      },
      {
        label: 'High Impact',
        value: highImpact.toLocaleString(),
        detail: `${moderateImpact} moderate impact`,
        color: 'coral',
      },
      {
        label: 'Variant Types',
        value: Object.keys(stats.variantType).length,
        detail: Object.keys(stats.variantType).join(', '),
        color: '',
      },
      {
        label: 'Callers',
        value: Object.keys(stats.callers).length,
        detail: callerList,
        color: '',
      },
    ];

    el.innerHTML = cards.map(c => `
      <div class="stat-card">
        <span class="stat-card-label">${c.label}</span>
        <span class="stat-card-value ${c.color}">${c.value}</span>
        <span class="stat-card-detail">${c.detail}</span>
      </div>
    `).join('');
  }

  /**
   * Render all charts
   */
  function renderCharts(stats) {
    setChartDefaults();
    destroyCharts();

    charts.push(renderVariantClassChart(stats));
    charts.push(renderVariantTypeChart(stats));
    charts.push(renderChromosomeChart(stats));
    charts.push(renderTopGenesChart(stats));
  }

  function renderVariantClassChart(stats) {
    const sorted = Object.entries(stats.variantClassification)
      .sort((a, b) => b[1] - a[1]);

    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);

    return new Chart(document.getElementById('chartVariantClass'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: PALETTE.slice(0, labels.length),
          borderColor: '#02070d',
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: '#0a2850',
            titleColor: '#fef4e8',
            bodyColor: '#e8e9ea',
            borderColor: 'rgba(30,150,165,0.3)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: ctx => {
                const pct = ((ctx.parsed / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  function renderVariantTypeChart(stats) {
    const sorted = Object.entries(stats.variantType)
      .sort((a, b) => b[1] - a[1]);

    return new Chart(document.getElementById('chartVariantType'), {
      type: 'bar',
      data: {
        labels: sorted.map(e => e[0]),
        datasets: [{
          data: sorted.map(e => e[1]),
          backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(30,150,165,0.05)' },
            ticks: { color: '#8a9bb5' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#e8e9ea', font: { weight: '600' } },
          },
        },
      },
    });
  }

  function renderChromosomeChart(stats) {
    // Sort chromosomes naturally
    const chrOrder = ['chr1','chr2','chr3','chr4','chr5','chr6','chr7','chr8','chr9','chr10',
      'chr11','chr12','chr13','chr14','chr15','chr16','chr17','chr18','chr19','chr20',
      'chr21','chr22','chrX','chrY','chrM'];

    const orderedEntries = chrOrder
      .filter(c => stats.chromosomes[c])
      .map(c => [c.replace('chr', ''), stats.chromosomes[c]]);

    return new Chart(document.getElementById('chartChromosome'), {
      type: 'bar',
      data: {
        labels: orderedEntries.map(e => e[0]),
        datasets: [{
          data: orderedEntries.map(e => e[1]),
          backgroundColor: orderedEntries.map((_, i) => {
            const hue = (i / orderedEntries.length) * 180 + 170;
            return `hsla(${hue}, 60%, 50%, 0.75)`;
          }),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8a9bb5', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(30,150,165,0.05)' },
            ticks: { color: '#8a9bb5' },
          },
        },
      },
    });
  }

  function renderTopGenesChart(stats) {
    const top20 = Object.entries(stats.genes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return new Chart(document.getElementById('chartTopGenes'), {
      type: 'bar',
      data: {
        labels: top20.map(e => e[0]),
        datasets: [{
          data: top20.map(e => e[1]),
          backgroundColor: top20.map((_, i) => {
            const t = i / top20.length;
            return `rgba(30, 150, 165, ${1 - t * 0.6})`;
          }),
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: 'rgba(30,150,165,0.05)' },
            ticks: { color: '#8a9bb5' },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#fef4e8', font: { size: 11, weight: '500' } },
          },
        },
      },
    });
  }

  function destroyCharts() {
    charts.forEach(c => c && c.destroy());
    charts = [];
  }

  function truncate(str, max) {
    if (!str) return '—';
    return str.length > max ? str.substring(0, max) + '…' : str;
  }

  return { renderMetadata, renderStats, renderCharts };
})();
