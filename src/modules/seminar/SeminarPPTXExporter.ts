import pptxgen from 'pptxgenjs';
import type { Presentation, SeminarStyle } from './SeminarTypes';

const sanitizeFilename = (name: string) => name.replace(/[\\/:"*?<>|]/g, '_').substring(0, 50);

export const exportToPPTX = async (presentation: Presentation, style: SeminarStyle) => {
  try {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    const fileName = sanitizeFilename(presentation.title || 'Seminario');
    
    for (const slide of presentation.slides) {
      const pSlide = pptx.addSlide();
      const bgColor = style === 'academico' ? '020d1f' : style === 'minimalista' ? '0a0a0a' : style === 'profissional' ? '001f3f' : 'FFFFFF';
      const textColor = bgColor === 'FFFFFF' ? '000000' : '00f5ff';
      pSlide.background = { fill: bgColor };
      
      if (slide.type === 'capa') {
        pSlide.addText(slide.title, { x: 1, y: 1.5, w: 8, h: 1, fontSize: 36, bold: true, color: textColor, align: 'center' });
        if (slide.subtitle) pSlide.addText(slide.subtitle, { x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 18, color: textColor, align: 'center' });
      } else {
        pSlide.addText(slide.title, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 24, bold: true, color: textColor });
        
        if (slide.bullets) {
          pSlide.addText(
            slide.bullets.map(b => ({ text: b, options: { bullet: true, color: 'FFFFFF', fontSize: 14 } })), 
            { x: 0.5, y: 1.5, w: 5.5, h: 3.5 }
          );
        } else if (slide.content) {
          pSlide.addText(slide.content, { x: 0.5, y: 1.5, w: 5.5, h: 3.5, color: 'FFFFFF', fontSize: 14 });
        }
        
        if (slide.imageQuery) {
          try {
            // Usa LoremFlickr mas com um formato mais simples
            const tag = slide.imageQuery.split(',')[0].split(' ')[0] || 'science';
            pSlide.addImage({ 
              path: `https://loremflickr.com/800/600/${encodeURIComponent(tag)}`, 
              x: 6.2, y: 1.2, w: 3.3, h: 3.5 
            });
          } catch (imgError) {
            console.warn('Erro ao carregar imagem para slide PPTX:', imgError);
          }
        }
      }
      
      if (slide.script) pSlide.addNotes(slide.script);
    }
    
    await pptx.writeFile({ fileName: `${fileName}.pptx` });
  } catch (error) {
    console.error('Erro ao exportar para PPTX:', error);
    alert('Falha ao exportar PowerPoint. Verifique sua conexão ou tente novamente.');
    throw error;
  }
};
