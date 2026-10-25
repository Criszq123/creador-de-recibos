/**
 * HELPERS.JS - Utilidades puras para formateo, fechas, saneamiento y compresión de imágenes
 */

(function (window) {
  'use strict';

  /**
   * Obtiene la fecha actual en formato local YYYY-MM-DD evitando el desfase de zona horaria UTC
   */
  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea una fecha YYYY-MM-DD a DD/MM/YYYY para presentación
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Formatea un número como moneda $X,XXX.00
   */
  function formatMoney(amount, currencySymbol = '$') {
    const num = parseFloat(amount);
    if (isNaN(num)) return `${currencySymbol}0.00`;
    return currencySymbol + num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Escapa caracteres HTML especiales para evitar XSS y truncado por comillas
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Sanea un texto para usarlo de forma segura en nombres de archivo (Windows / Mac / Linux)
   */
  function sanitizeFilename(str, fallback = 'archivo') {
    if (!str || !String(str).trim()) return fallback;
    let clean = String(str).trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // Caracteres no alfanuméricos
      .replace(/_+/g, '_')
      .substring(0, 30);
    return clean || fallback;
  }

  /**
   * Comprime y redimensiona una imagen en el navegador antes de guardarla en base64
   * Previene QuotaExceededError en localStorage
   * @param {File} file
   * @param {number} maxWidth
   * @param {number} maxHeight
   * @param {number} quality (0 a 1)
   * @returns {Promise<string>} DataURL comprimido
   */
  function compressImage(file, maxWidth = 600, maxHeight = 600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('El archivo no es una imagen válida.'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Error al decodificar la imagen.'));
        img.onload = () => {
          let { width, height } = img;

          // Escalar manteniendo proporción
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Si el archivo original era PNG con transparencia y no excede dimensiones, conservar PNG
          const mimeType = (file.type === 'image/png') ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Notificaciones flotantes (Toast)
   */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Exportar al objeto global ReceiptApp o window
  window.ReceiptHelpers = {
    getLocalDateString,
    formatDate,
    formatMoney,
    escapeHtml,
    sanitizeFilename,
    compressImage,
    showToast
  };

  // Mantener showToast accesible globalmente para retrocompatibilidad
  window.showToast = showToast;

})(window);
