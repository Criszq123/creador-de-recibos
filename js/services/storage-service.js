/**
 * STORAGE-SERVICE.JS - REPOSITORIO DE CONFIGURACIÓN Y PERSISTENCIA LOCAL
 * Maneja el almacenamiento local seguro y previene errores de cuota en localStorage.
 */

(function (window) {
  'use strict';

  class StorageService {
    constructor() {
      this.configKey = 'recibos_app_config_v2';
      this.draftKey = 'recibos_app_draft_v2';

      this.defaultConfig = {
        businessName: 'AUTO CLIMAS DEL SURESTE',
        businessSlogan: 'Mantenimiento y Reparación de Climas Automotrices',
        businessAddress: 'Av. Justo Sierra #120, Col. Centro, Minatitlán, Ver.',
        businessPhone: '922 123 4567 / 922 987 6543',
        headerColor: '#659B34',
        watermarkOpacity: 0.18,
        customWatermarkUrl: null,
        logoUrl: null,
        minTableRows: 8,
        termsText: 'Garantía de 30 días sobre mano de obra y piezas instaladas. No aplica por mal uso o alteración eléctrica.'
      };
    }

    /**
     * Carga y combina la configuración guardada con los valores por defecto
     */
    loadConfig() {
      try {
        const saved = localStorage.getItem(this.configKey) || localStorage.getItem('recibos_app_config_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...this.defaultConfig, ...parsed };
        }
      } catch (e) {
        console.warn('Error al leer configuración de localStorage:', e);
      }
      return { ...this.defaultConfig };
    }

    /**
     * Guarda la configuración de forma segura capturando posibles excepciones de cuota
     */
    saveConfig(config) {
      try {
        localStorage.setItem(this.configKey, JSON.stringify(config));
        return { success: true };
      } catch (err) {
        console.error('Error al guardar configuración en localStorage:', err);
        return {
          success: false,
          error: (err.name === 'QuotaExceededError' || err.code === 22)
            ? 'El espacio local está lleno. Intenta con un logo o imagen de menor resolución.'
            : 'No se pudo guardar la configuración en el navegador.'
        };
      }
    }

    /**
     * Guarda el borrador del recibo actual para que no se pierda al recargar la página
     */
    saveDraft(receipt) {
      try {
        localStorage.setItem(this.draftKey, JSON.stringify(receipt));
      } catch (e) {
        // Ignorar fallas silenciosas de borrador
      }
    }

    /**
     * Carga el borrador guardado si existe
     */
    loadDraft() {
      try {
        const saved = localStorage.getItem(this.draftKey);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Error al leer borrador de localStorage:', e);
      }
      return null;
    }

    /**
     * Limpia el borrador
     */
    clearDraft() {
      try {
        localStorage.removeItem(this.draftKey);
      } catch (e) {}
    }
  }

  window.ReceiptServices = window.ReceiptServices || {};
  window.ReceiptServices.StorageService = StorageService;

})(window);
