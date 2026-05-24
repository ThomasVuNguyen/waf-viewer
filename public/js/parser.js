/**
 * parser.js — MAF (Mutation Annotation Format) file parser
 * 
 * Handles GDC-style MAF files with:
 *   - Header comments (#version, #annotation.spec, #contigs, etc.)
 *   - Tab-separated column headers
 *   - Tab-separated data rows
 *
 * Returns { metadata, columns, mutations }
 */

const MAFParser = (() => {
  /**
   * Parse raw MAF text content into structured data.
   * @param {string} text - Raw file content
   * @returns {{ metadata: Object, columns: string[], mutations: Object[] }}
   */
  function parse(text) {
    const lines = text.split('\n');
    const metadata = {};
    const mutations = [];
    let columns = [];
    let headerFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines
      if (!line.trim()) continue;

      // Parse comment/metadata lines
      if (line.startsWith('#')) {
        parseMetadataLine(line, metadata);
        continue;
      }

      // First non-comment line is the column header
      if (!headerFound) {
        columns = line.split('\t').map(c => c.trim());
        headerFound = true;
        continue;
      }

      // Data rows
      const fields = line.split('\t');
      if (fields.length < 5) continue; // skip malformed rows

      const row = {};
      for (let j = 0; j < columns.length; j++) {
        row[columns[j]] = fields[j] !== undefined ? fields[j].trim() : '';
      }
      mutations.push(row);
    }

    return { metadata, columns, mutations };
  }

  /**
   * Parse a single comment line into metadata key/value
   */
  function parseMetadataLine(line, metadata) {
    // Remove leading '#'
    const content = line.substring(1).trim();
    const spaceIdx = content.indexOf(' ');

    if (spaceIdx === -1) {
      metadata[content] = true;
      return;
    }

    const key = content.substring(0, spaceIdx).trim();
    const value = content.substring(spaceIdx + 1).trim();
    metadata[key] = value;
  }

  /**
   * Compute summary statistics from parsed data.
   */
  function computeStats(data) {
    const { mutations } = data;
    const stats = {
      totalMutations: mutations.length,
      variantClassification: {},
      variantType: {},
      chromosomes: {},
      genes: {},
      impacts: {},
      callers: {},
      uniqueGenes: new Set(),
      sampleBarcodes: new Set(),
    };

    for (const m of mutations) {
      // Variant Classification
      const vc = m.Variant_Classification || 'Unknown';
      stats.variantClassification[vc] = (stats.variantClassification[vc] || 0) + 1;

      // Variant Type
      const vt = m.Variant_Type || 'Unknown';
      stats.variantType[vt] = (stats.variantType[vt] || 0) + 1;

      // Chromosome
      const chr = m.Chromosome || 'Unknown';
      stats.chromosomes[chr] = (stats.chromosomes[chr] || 0) + 1;

      // Genes
      const gene = m.Hugo_Symbol || 'Unknown';
      stats.genes[gene] = (stats.genes[gene] || 0) + 1;
      if (gene !== 'Unknown') stats.uniqueGenes.add(gene);

      // Impact
      const impact = m.IMPACT || 'Unknown';
      stats.impacts[impact] = (stats.impacts[impact] || 0) + 1;

      // Callers
      if (m.callers) {
        m.callers.split(';').forEach(c => {
          const caller = c.trim();
          if (caller) stats.callers[caller] = (stats.callers[caller] || 0) + 1;
        });
      }

      // Sample barcodes
      if (m.Tumor_Sample_Barcode) stats.sampleBarcodes.add(m.Tumor_Sample_Barcode);
    }

    stats.uniqueGeneCount = stats.uniqueGenes.size;
    stats.uniqueGenes = [...stats.uniqueGenes];
    stats.sampleBarcodes = [...stats.sampleBarcodes];

    return stats;
  }

  return { parse, computeStats };
})();
