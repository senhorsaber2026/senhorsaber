import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Presentation } from './SeminarTypes';

const sanitizeFilename = (name: string) => name.replace(/[\\/:"*?<>|]/g, '_').substring(0, 50);

export const generatePDF = async (presentation: Presentation, setCurrentSlide: (n: number) => void) => {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
    const element = document.getElementById('slide-export-container');
    if (!element) throw new Error('Container de exportação não encontrado');
    
    const fileName = sanitizeFilename(presentation.title || 'Seminario');
    
    for (let i = 0; i < presentation.slides.length; i++) {
      setCurrentSlide(i);
      // Aguarda renderização completa
      await new Promise(r => setTimeout(r, 1000));
      
      const canvas = await html2canvas(element, { 
        scale: 1.5, // Reduzi um pouco para evitar estouro de memória em navegadores móveis
        useCORS: true, 
        logging: false,
        backgroundColor: '#020d1f',
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      if (i > 0) doc.addPage([1280, 720], 'landscape');
      doc.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
    }
    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique se o documento é muito grande ou possui imagens bloqueadas.');
    throw error;
  }
};
