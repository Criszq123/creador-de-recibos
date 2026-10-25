/**
 * SETTINGS-MODAL-VIEW.JS - VISTA DEL MODAL DE PERSONALIZACIÓN
 * Gestiona los ajustes del negocio, paleta de colores, compresión de logos/marcas de agua
 * y opciones para limpiar imágenes personalizadas.
 */

(function (window) {
  'use strict';

  class SettingsModalView {
    constructor(callbacks = {}) {
      this.callbacks = callbacks; // onSave(config), onConfigPreview(config)
      this.tempConfig = {};
      this.initElements();
      this.attachEvents();
    }

    initElements() {
      this.modal = document.getElementById('settings-modal');
      this.btnClose = document.getElementById('btn-close-modal');
      this.btnSave = document.getElementById('btn-save-settings');

      this.inputBName = document.getElementById('modal-input-bname');
      this.inputBSlogan = document.getElementById('modal-input-bslogan');
      this.inputBAddress = document.getElementById('modal-input-baddress');
      this.inputBPhone = document.getElementById('modal-input-bphone');
      this.inputColor = document.getElementById('modal-input-color');
      this.inputOpacity = document.getElementById('modal-input-opacity');
      this.inputTerms = document.getElementById('modal-input-terms');
      this.inputLogo = document.getElementById('modal-input-logo');
      this.inputWatermark = document.getElementById('modal-input-watermark');

      // Botón para cancelar dentro del modal
      this.btnCancel = this.modal ? this.modal.querySelector('.btn-secondary') : null;

      // Inyectar botones para quitar logo o restaurar marca de agua original si no existen
      this.setupImageActionButtons();
    }

    setupImageActionButtons() {
      if (this.inputLogo && !document.getElementById('btn-remove-logo')) {
        const btnRemoveLogo = document.createElement('button');
        btnRemoveLogo.type = 'button';
        btnRemoveLogo.id = 'btn-remove-logo';
        btnRemoveLogo.className = 'btn btn-secondary btn-sm';
        btnRemoveLogo.style.marginTop = '6px';
        btnRemoveLogo.textContent = '🗑️ Quitar Logo Actual';
        btnRemoveLogo.addEventListener('click', () => {
          this.tempConfig.logoUrl = null;
          if (this.inputLogo) this.inputLogo.value = '';
          if (window.showToast) window.showToast('Logo eliminado de la vista previa');
        });
        this.inputLogo.parentNode.appendChild(btnRemoveLogo);
      }

      if (this.inputWatermark && !document.getElementById('btn-reset-watermark')) {
        const btnResetWatermark = document.createElement('button');
        btnResetWatermark.type = 'button';
        btnResetWatermark.id = 'btn-reset-watermark';
        btnResetWatermark.className = 'btn btn-secondary btn-sm';
        btnResetWatermark.style.marginTop = '6px';
        btnResetWatermark.textContent = '🔄 Restaurar Marca de Agua Original';
        btnResetWatermark.addEventListener('click', () => {
          this.tempConfig.customWatermarkUrl = null;
          if (this.inputWatermark) this.inputWatermark.value = '';
          if (window.showToast) window.showToast('Marca de agua original restaurada');
        });
        this.inputWatermark.parentNode.appendChild(btnResetWatermark);
      }
    }

    attachEvents() {
      // Cerrar modal
      if (this.btnClose) {
        this.btnClose.addEventListener('click', () => this.close());
      }
      if (this.btnCancel) {
        this.btnCancel.addEventListener('click', () => this.close());
      }

      // Cerrar al hacer clic en el backdrop oscuro
      if (this.modal) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) {
            this.close();
          }
        });
      }

      // Cerrar con tecla Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
          this.close();
        }
      });

      // Swatches de colores
      document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
          swatch.classList.add('active');
          const color = swatch.getAttribute('data-color');
          if (this.inputColor) {
            this.inputColor.value = color;
          }
          this.tempConfig.headerColor = color;
        });
      });

      if (this.inputColor) {
        this.inputColor.addEventListener('input', (e) => {
          this.tempConfig.headerColor = e.target.value;
          document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.toggle('active', s.getAttribute('data-color') === e.target.value);
          });
        });
      }

      // Carga y compresión de Logo
      if (this.inputLogo) {
        this.inputLogo.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (file) {
            try {
              if (window.showToast) window.showToast('⏳ Optimizando logo...');
              const compressed = await window.ReceiptHelpers.compressImage(file, 400, 300, 0.85);
              this.tempConfig.logoUrl = compressed;
              if (window.showToast) window.showToast('✅ Logo cargado correctamente');
            } catch (err) {
              alert('No se pudo procesar la imagen del logo: ' + err.message);
            }
          }
        });
      }

      // Carga y compresión de Marca de Agua
      if (this.inputWatermark) {
        this.inputWatermark.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (file) {
            try {
              if (window.showToast) window.showToast('⏳ Optimizando marca de agua...');
              const compressed = await window.ReceiptHelpers.compressImage(file, 800, 800, 0.80);
              this.tempConfig.customWatermarkUrl = compressed;
              if (window.showToast) window.showToast('✅ Marca de agua cargada correctamente');
            } catch (err) {
              alert('No se pudo procesar la imagen de marca de agua: ' + err.message);
            }
          }
        });
      }

      // Guardar cambios
      if (this.btnSave) {
        this.btnSave.addEventListener('click', () => {
          this.saveChanges();
        });
      }
    }

    open(config) {
      if (!this.modal) return;
      this.tempConfig = { ...config };

      if (this.inputBName) this.inputBName.value = config.businessName || '';
      if (this.inputBSlogan) this.inputBSlogan.value = config.businessSlogan || '';
      if (this.inputBAddress) this.inputBAddress.value = config.businessAddress || '';
      if (this.inputBPhone) this.inputBPhone.value = config.businessPhone || '';
      if (this.inputColor) this.inputColor.value = config.headerColor || '#659B34';
      if (this.inputOpacity) this.inputOpacity.value = config.watermarkOpacity !== undefined ? config.watermarkOpacity : 0.18;
      if (this.inputTerms) this.inputTerms.value = config.termsText || '';

      if (this.inputLogo) this.inputLogo.value = '';
      if (this.inputWatermark) this.inputWatermark.value = '';

      // Sincronizar estado visual del swatch
      document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.getAttribute('data-color') === config.headerColor);
      });

      this.modal.classList.add('active');
    }

    close() {
      if (this.modal) {
        this.modal.classList.remove('active');
      }
    }

    saveChanges() {
      const updatedConfig = {
        ...this.tempConfig,
        businessName: this.inputBName ? this.inputBName.value.trim() : 'MI NEGOCIO',
        businessSlogan: this.inputBSlogan ? this.inputBSlogan.value.trim() : '',
        businessAddress: this.inputBAddress ? this.inputBAddress.value.trim() : '',
        businessPhone: this.inputBPhone ? this.inputBPhone.value.trim() : '',
        headerColor: this.inputColor ? this.inputColor.value : '#659B34',
        watermarkOpacity: this.inputOpacity ? (parseFloat(this.inputOpacity.value) || 0.18) : 0.18,
        termsText: this.inputTerms ? this.inputTerms.value.trim() : ''
      };

      if (typeof this.callbacks.onSave === 'function') {
        this.callbacks.onSave(updatedConfig);
      }
      this.close();
    }
  }

  window.ReceiptViews = window.ReceiptViews || {};
  window.ReceiptViews.SettingsModalView = SettingsModalView;

})(window);
