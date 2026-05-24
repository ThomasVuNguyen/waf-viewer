/**
 * detail.js — Mutation detail slide-in panel
 *
 * Shows all fields grouped into logical sections with
 * color-coded predictions and impact indicators.
 */

const DetailPanel = (() => {
  const overlay = () => document.getElementById('detailOverlay');
  const panel = () => document.getElementById('detailPanel');
  const titleEl = () => document.getElementById('detailTitle');
  const bodyEl = () => document.getElementById('detailBody');
  const closeBtn = () => document.getElementById('detailClose');

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    closeBtn().addEventListener('click', close);
    overlay().addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  /**
   * Open the detail panel for a mutation row
   */
  function open(mutation) {
    init();

    const gene = mutation.Hugo_Symbol || 'Unknown';
    const hgvs = mutation.HGVSp_Short || mutation.HGVSp || '';
    titleEl().innerHTML = `<span class="detail-panel-gene">${escapeHtml(gene)}</span> ${escapeHtml(hgvs)}`;

    bodyEl().innerHTML = renderSections(mutation);

    overlay().classList.add('active');
    panel().classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay().classList.remove('active');
    panel().classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Organize mutation fields into grouped sections
   */
  function renderSections(m) {
    const sections = [
      {
        title: 'Gene & Position',
        fields: [
          ['Gene Symbol', m.Hugo_Symbol],
          ['Entrez Gene ID', m.Entrez_Gene_Id],
          ['Chromosome', m.Chromosome],
          ['Start Position', m.Start_Position],
          ['End Position', m.End_Position],
          ['Strand', m.Strand],
          ['NCBI Build', m.NCBI_Build],
          ['Transcript', m.Transcript_ID],
          ['Exon', m.Exon_Number],
          ['Biotype', m.BIOTYPE],
          ['Canonical', m.CANONICAL],
        ],
      },
      {
        title: 'Variant Details',
        fields: [
          ['Classification', m.Variant_Classification],
          ['Type', m.Variant_Type],
          ['Reference Allele', m.Reference_Allele],
          ['Tumor Allele 1', m.Tumor_Seq_Allele1],
          ['Tumor Allele 2', m.Tumor_Seq_Allele2],
          ['HGVSc', m.HGVSc],
          ['HGVSp', m.HGVSp],
          ['HGVSp Short', m.HGVSp_Short],
          ['Consequence', m.Consequence],
          ['Impact', m.IMPACT, 'impact'],
          ['Variant Class', m.VARIANT_CLASS],
          ['dbSNP RS', m.dbSNP_RS],
          ['Context', m.CONTEXT],
        ],
      },
      {
        title: 'Functional Predictions',
        fields: [
          ['SIFT', m.SIFT, 'prediction'],
          ['PolyPhen', m.PolyPhen, 'prediction'],
          ['Domains', m.DOMAINS],
        ],
      },
      {
        title: 'Allele Depth',
        fields: [
          ['Tumor Depth', m.t_depth],
          ['Tumor Ref Count', m.t_ref_count],
          ['Tumor Alt Count', m.t_alt_count],
          ['Normal Depth', m.n_depth],
          ['Normal Ref Count', m.n_ref_count],
          ['Normal Alt Count', m.n_alt_count],
        ],
      },
      {
        title: 'Population Frequencies',
        fields: [
          ['gnomAD AF', m.gnomAD_AF],
          ['gnomAD AFR', m.gnomAD_AFR_AF],
          ['gnomAD AMR', m.gnomAD_AMR_AF],
          ['gnomAD ASJ', m.gnomAD_ASJ_AF],
          ['gnomAD EAS', m.gnomAD_EAS_AF],
          ['gnomAD NFE', m.gnomAD_NFE_AF],
          ['gnomAD SAS', m.gnomAD_SAS_AF],
          ['1000G AF', m['1000G_AF']],
          ['MAX AF', m.MAX_AF],
          ['MAX AF Pop', m.MAX_AF_POPS],
        ],
      },
      {
        title: 'Clinical Significance',
        fields: [
          ['CLIN_SIG', m.CLIN_SIG],
          ['COSMIC', m.COSMIC],
          ['Hotspot', m.hotspot],
          ['SOMATIC', m.SOMATIC],
          ['PubMed', m.PUBMED],
          ['PHENO', m.PHENO],
        ],
      },
      {
        title: 'Sample Information',
        fields: [
          ['Tumor Barcode', m.Tumor_Sample_Barcode],
          ['Normal Barcode', m.Matched_Norm_Sample_Barcode],
          ['Tumor UUID', m.Tumor_Sample_UUID],
          ['Normal UUID', m.Matched_Norm_Sample_UUID],
          ['Callers', m.callers],
          ['Mutation Status', m.Mutation_Status],
          ['Center', m.Center],
        ],
      },
      {
        title: 'RNA Evidence',
        fields: [
          ['RNA Support', m.RNA_Support],
          ['RNA Depth', m.RNA_depth],
          ['RNA Ref Count', m.RNA_ref_count],
          ['RNA Alt Count', m.RNA_alt_count],
        ],
      },
    ];

    return sections.map(section => {
      const fields = section.fields
        .filter(f => f[1] !== undefined && f[1] !== '')
        .map(f => renderField(f[0], f[1], f[2]))
        .join('');

      if (!fields) return '';

      return `
        <div class="detail-section">
          <div class="detail-section-title">${section.title}</div>
          ${fields}
        </div>
      `;
    }).join('');
  }

  function renderField(label, value, type) {
    if (value === undefined || value === null || value === '') {
      return ''; // skip empty fields
    }

    let renderedValue = escapeHtml(String(value));

    if (type === 'impact') {
      const cls = value === 'HIGH' ? 'badge-high'
        : value === 'MODERATE' ? 'badge-moderate'
        : value === 'LOW' ? 'badge-low'
        : 'badge-modifier';
      renderedValue = `<span class="badge ${cls}">${escapeHtml(value)}</span>`;
    } else if (type === 'prediction') {
      renderedValue = renderPredictionValue(value);
    }

    return `
      <div class="detail-field">
        <span class="detail-field-label">${label}</span>
        <span class="detail-field-value">${renderedValue}</span>
      </div>
    `;
  }

  function renderPredictionValue(value) {
    const match = String(value).match(/^(\w+)\(([\d.]+)\)$/);
    if (!match) return escapeHtml(value);

    const label = match[1];
    const score = parseFloat(match[2]);

    let cls = 'prediction-good';
    if (label === 'deleterious' || label === 'deleterious_low_confidence' ||
        label === 'probably_damaging' || label === 'possibly_damaging') {
      cls = score > 0.5 ? 'prediction-bad' : 'prediction-warn';
    }

    return `<span class="${cls}">${escapeHtml(label)} (${score})</span>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { open, close, init };
})();
