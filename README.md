# MAF Viewer

Drag & drop a MAF (Mutation Annotation Format) file and explore somatic mutations visually.

## What is this?

An application where you can drag & drop a `.maf` file and view everything about it — variant classifications, chromosome distribution, top mutated genes, SIFT/PolyPhen predictions, gnomAD frequencies, and more.

## Features

- **Drag & drop** — drop any GDC-style `.maf` file
- **Summary dashboard** — total mutations, unique genes, impact breakdown, callers used
- **Interactive charts** — variant classification donut, mutation type bar, chromosome distribution, top genes
- **Searchable data table** — all 120+ MAF columns, sortable, filterable, paginated
- **Mutation detail panel** — click any row to see full annotations (SIFT, PolyPhen, gnomAD, COSMIC, etc.)
- **Column picker** — show/hide any column

## Quick Start

```bash
npm install
npm start
# Open http://localhost:3000
```

## Docker

```bash
docker compose up -d
# Open http://localhost:3000
```

## Technical Requirements

- Self-hostable with Docker Compose
- Simple to import into Coolify and run
- No backend processing — all parsing happens client-side in the browser

## Demo

A sample MAF file from GDC/TCGA is included in the `demo/` folder. Click "Load demo MAF" on the landing page to try it.