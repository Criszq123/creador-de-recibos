/**
 * PDF-GENERATOR.JS - PUENTE DE COMPATIBILIDAD
 * Redirige llamadas a la nueva arquitectura limpia (ReceiptServices.PdfService).
 */

(function (window) {
  'use strict';

  class ReceiptPdfGeneratorBridge {
    downloadPdf() {
      if (window.receiptApp && window.receiptApp.pdfService) {
        return window.receiptApp.pdfService.downloadPdf(window.receiptApp.receipt);
      }
    }

    printDirect() {
      if (window.receiptApp && window.receiptApp.pdfService) {
        return window.receiptApp.pdfService.printDirect();
      }
      window.print();
    }

    shareReceipt() {
      if (window.receiptApp && window.receiptApp.shareService) {
        return window.receiptApp.shareService.shareReceipt(window.receiptApp.receipt);
      }
    }
  }

  window.receiptPdfGenerator = window.receiptPdfGenerator || new ReceiptPdfGeneratorBridge();

})(window);