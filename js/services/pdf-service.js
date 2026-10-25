/**
 * PDF-SERVICE.JS - MOTOR ROBUSTO DE EXPORTACIÓN A PDF
 * Soluciona el error en móviles (display:none), evita desbordamientos y cortes de firmas,
 * y garantiza descarga segura y nítida en todos los navegadores.
 */

(function (window) {
  'use strict';

  class PdfService {
    constructor() {
      this.receiptElementId = 'receipt-paper-target';
    }

    /**
     * Construye un nombre de archivo limpio y válido para cualquier sistema operativo
     */
    generateFileName(receipt) {
      const folio = window.ReceiptHelpers.sanitizeFilename(receipt.folio, '001');
      const client = window.ReceiptHelpers.sanitizeFilename(receipt.clientName, 'CLIENTE');
      const date = receipt.date || (window.ReceiptHelpers ? window.ReceiptHelpers.getLocalDateString() : 'fecha');
      return `Recibo_${folio}_${client}_${date}.pdf`;
    }

    /**
     * Clona el recibo en un contenedor fuera de pantalla con ancho fijo de 800px.
     * Esto garantiza que en teléfonos móviles (donde la vista previa está en display:none)
     * html2canvas nunca reciba un nodo de 0x0px y genere siempre un PDF en alta resolución.
     */
    createOffscreenRenderClone(sourceElement) {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '-9999px';
      container.style.width = '800px';
      container.style.minHeight = '1050px';
      container.style.zIndex = '-9999';
      container.style.backgroundColor = '#ffffff';
      container.style.display = 'block';
      container.style.visibility = 'visible';
      container.style.overflow = 'visible';

      const clone = sourceElement.cloneNode(true);
      clone.style.width = '800px';
      clone.style.maxWidth = '800px';
      clone.style.margin = '0';
      clone.style.display = 'flex';
      clone.style.visibility = 'visible';

      container.appendChild(clone);
      document.body.appendChild(container);

      return {
        container,
        targetElement: clone,
        destroy: () => {
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }
      };
    }

    /**
     * Genera y descarga el documento PDF
     */
    async downloadPdf(receipt) {
      const sourceElement = document.getElementById(this.receiptElementId);
      if (!sourceElement) {
        alert('Error: No se encontró la plantilla del recibo.');
        return;
      }

      const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
      if (!jsPDFClass || typeof window.html2canvas === 'undefined') {
        alert('Error: Las librerías jsPDF o html2canvas no están cargadas.');
        return;
      }

      const filename = this.generateFileName(receipt);
      const downloadButtons = document.querySelectorAll('#btn-download-pdf, .btn-download-pdf-action');
      const originalStates = [];

      downloadButtons.forEach(btn => {
        originalStates.push({ btn, html: btn.innerHTML, disabled: btn.disabled });
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Creando PDF...</span>';
      });

      if (window.showToast) {
        window.showToast('⏳ Procesando y creando PDF en alta resolución...');
      }

      let renderSession = null;

      try {
        // Renderizado seguro fuera de pantalla para garantizar dimensiones 800px en cualquier dispositivo
        renderSession = this.createOffscreenRenderClone(sourceElement);

        // Pequeña espera para sincronización de estilos en el DOM clonado
        await new Promise(r => setTimeout(r, 60));

        const canvas = await window.html2canvas(renderSession.targetElement, {
          scale: 2.2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0
        });

        // Configuración de hoja Carta (Letter)
        const pdf = new jsPDFClass({
          orientation: 'portrait',
          unit: 'mm',
          format: 'letter'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();   // 215.9 mm
        const pageHeight = pdf.internal.pageSize.getHeight(); // 279.4 mm
        const margin = 10; // mm
        const printableWidth = pageWidth - (margin * 2);      // 195.9 mm
        const printableHeight = pageHeight - (margin * 2);    // 259.4 mm

        let imgHeight = (canvas.height * printableWidth) / canvas.width;
        let imgWidth = printableWidth;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Ajuste inteligente: si se pasa ligeramente de una hoja (~15%), reescalar para que quepa en 1 sola página
        if (imgHeight > printableHeight && imgHeight <= (printableHeight * 1.18)) {
          const scaleFactor = printableHeight / imgHeight;
          imgHeight = printableHeight;
          imgWidth = printableWidth * scaleFactor;
          const xPos = margin + ((printableWidth - imgWidth) / 2);
          pdf.addImage(imgData, 'JPEG', xPos, margin, imgWidth, imgHeight);
        } else if (imgHeight <= printableHeight) {
          // Centrado vertical estético
          const yPos = margin + ((printableHeight - imgHeight) / 2);
          pdf.addImage(imgData, 'JPEG', margin, yPos, printableWidth, imgHeight);
        } else {
          // Multihop / Paginación si el recibo es muy extenso
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'JPEG', margin, position + margin, printableWidth, imgHeight);
          heightLeft -= printableHeight;

          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', margin, position + margin, printableWidth, imgHeight);
            heightLeft -= printableHeight;
          }
        }

        // Descarga directa con el método nativo oficial de jsPDF (soporta Chrome, Edge, Safari, Firefox y móviles)
        pdf.save(filename);

        if (window.showToast) {
          window.showToast(`✅ Recibo descargado: ${filename}`);
        }

      } catch (err) {
        console.error('Error durante la generación de PDF:', err);
        if (window.showToast) {
          window.showToast('⚠️ Error al generar PDF, abriendo vista de impresión...');
        }
        window.print();
      } finally {
        if (renderSession) {
          renderSession.destroy();
        }
        downloadButtons.forEach((btn, index) => {
          if (originalStates[index]) {
            btn.disabled = originalStates[index].disabled;
            btn.innerHTML = originalStates[index].html;
          }
        });
      }
    }

    /**
     * Impresión directa nativa
     */
    printDirect() {
      window.print();
    }
  }

  window.ReceiptServices = window.ReceiptServices || {};
  window.ReceiptServices.PdfService = PdfService;

})(window);
