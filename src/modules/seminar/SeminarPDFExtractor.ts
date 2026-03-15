import * as pdfjsLib from 'pdfjs-dist';
import type { SeminarMode } from './SeminarTypes';

export const extractTextFromPDF = async (file: File, mode: SeminarMode, pageRange: string): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  let pages: number[] = [];
  
  if (mode === 'por_pagina' && pageRange) {
    const parts = pageRange.split('-').map(p => parseInt(p.trim()));
    if (parts.length === 2) for (let i = parts[0]; i <= parts[1]; i++) pages.push(i);
    else if (parts.length === 1) pages.push(parts[0]);
  }
  
  if (pages.length === 0) {
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) pages.push(i);
  }
  
  for (const p of pages) {
    if (p > pdf.numPages) continue;
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    fullText += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return fullText;
};
