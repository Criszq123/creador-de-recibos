/**
 * SHARE-SERVICE.JS - SERVICIO PARA COMPARTIR RECIBOS POR WHATSAPP Y WEB SHARE API
 * Resuelve el bug de total en $0.00 y gestiona prefijos telefónicos nacionales e internacionales.
 */

(function (window) {
  'use strict';

  class ShareService {
    /**
     * Sanea y formatea el teléfono para WhatsApp
     */
    static formatPhoneForWhatsApp(rawPhone) {
      if (!rawPhone) return '';
      const digits = String(rawPhone).replace(/[^0-9]/g, '');
      if (!digits) return '';

      // Si tiene 10 dígitos (formato estándar México sin prefijo), agregar 52
      if (digits.length === 10) {
        return `52${digits}`;
      }

      // Si ya tiene 12 dígitos empezando en 52 (ej: 529221234567), no duplicar 52
      if (digits.length === 12 && digits.startsWith('52')) {
        return digits;
      }

      // Cualquier otro número internacional, usar los dígitos capturados
      return digits;
    }

    /**
     * Construye el texto formal para compartir
     */
    static buildShareMessage(receipt) {
      const folio = receipt.folio || '001';
      const client = receipt.clientName ? receipt.clientName.trim() : 'CLIENTE';
      const totalFormatted = window.ReceiptHelpers
        ? window.ReceiptHelpers.formatMoney(receipt.getTotal())
        : `$${receipt.getTotal().toFixed(2)}`;
      const itemsSummary = receipt.getItemsSummaryText ? receipt.getItemsSummaryText() : '';
      const amountInWords = receipt.getAmountInWords ? receipt.getAmountInWords() : '';

      return `📄 *NOTA DE VENTA / RECIBO*\n` +
        `*Folio:* ${folio}\n` +
        `*Fecha:* ${window.ReceiptHelpers ? window.ReceiptHelpers.formatDate(receipt.date) : receipt.date}\n` +
        `*Cliente:* ${client}\n\n` +
        `*Conceptos:*\n${itemsSummary || '• Venta general'}\n\n` +
        `*TOTAL:* ${totalFormatted}\n` +
        `_(${amountInWords})_\n\n` +
        `_Generado con Creador de Recibos_`;
    }

    /**
     * Comparte el recibo vía Web Share API en dispositivos compatibles o abre WhatsApp directamente
     */
    static async shareReceipt(receipt) {
      const message = this.buildShareMessage(receipt);
      const title = `Recibo #${receipt.folio} - ${receipt.clientName || 'Cliente'}`;

      // Intento con Web Share API (si está soportado en móvil)
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: message
          });
          if (window.showToast) {
            window.showToast('✅ Recibo compartido exitosamente');
          }
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            // El usuario cerró manualmente la hoja de compartir -> NO forzar WhatsApp
            return;
          }
          console.warn('Web Share API falló, recurriendo a WhatsApp Web:', err);
        }
      }

      // Apertura de WhatsApp como fallback directo
      const phone = this.formatPhoneForWhatsApp(receipt.clientPhone);
      const encodedText = encodeURIComponent(message);
      const waUrl = phone
        ? `https://wa.me/${phone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

      window.open(waUrl, '_blank');
    }
  }

  window.ReceiptServices = window.ReceiptServices || {};
  window.ReceiptServices.ShareService = ShareService;

})(window);
