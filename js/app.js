/**
 * APP.JS - CONTROLADOR PRINCIPAL Y ORQUESTADOR DE ARQUITECTURA LIMPIA
 * Conecta el Modelo de Dominio, Servicios de Exportación/Persistencia y Vistas de UI.
 */

(function (window) {
  'use strict';

  class ReceiptApp {
    constructor() {
      // 1. Instanciar Servicios (Capa de Infraestructura / Datos)
      this.storageService = new window.ReceiptServices.StorageService();
      this.pdfService = new window.ReceiptServices.PdfService();
      this.shareService = window.ReceiptServices.ShareService;

      // 2. Cargar Estado de Configuración del Negocio
      this.config = this.storageService.loadConfig();

      // 3. Crear Estado Inicial del Recibo (Modelo de Dominio)
      this.receipt = this.createInitialReceipt();

      // 4. Instanciar Vistas (Capa de Presentación)
      this.previewView = new window.ReceiptViews.ReceiptPreviewView();

      this.formView = new window.ReceiptViews.ReceiptFormView({
        onDataChange: () => this.handleDataChange(),
        onAddItem: () => this.addItem(),
        onRemoveItem: (index) => this.removeItem(index)
      });

      this.settingsModalView = new window.ReceiptViews.SettingsModalView({
        onSave: (newConfig) => this.handleSaveConfig(newConfig)
      });

      // 5. Vincular Botones de Cabecera y Navegación Móvil
      this.attachGlobalEvents();

      // 6. Primer Renderizado Completo
      this.renderAll();

      // 7. Registro de Service Worker para PWA Offline real
      this.registerServiceWorker();
    }

    createInitialReceipt() {
      const today = window.ReceiptHelpers.getLocalDateString();
      return new window.ReceiptModels.Receipt({
        folio: '0148',
        date: today,
        clientName: 'TRANSPORTES DEL GOLFO S.A.',
        clientAddress: 'MINATITLAN, VER.',
        clientPhone: '922 145 8890',
        clientDetails: 'NISSAN TSURU 2015 - BLANCO',
        items: [
          { cant: 1, desc: 'SERVICIO DE REEMPLAZO DE BULBO', precio: 2700 }
        ]
      });
    }

    attachGlobalEvents() {
      // Botones de descarga de PDF (en Header y en Sidebar)
      const downloadButtons = document.querySelectorAll('#btn-download-pdf, .btn-download-pdf-action');
      downloadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.pdfService.downloadPdf(this.receipt);
        });
      });

      // Botón Imprimir
      const btnPrint = document.getElementById('btn-print');
      if (btnPrint) {
        btnPrint.addEventListener('click', () => {
          this.pdfService.printDirect();
        });
      }

      // Botón Compartir / WhatsApp
      const btnShare = document.getElementById('btn-share');
      if (btnShare) {
        btnShare.addEventListener('click', () => {
          this.shareService.shareReceipt(this.receipt);
        });
      }

      // Botón Limpiar / Nuevo Recibo
      const btnReset = document.getElementById('btn-reset');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          if (confirm('¿Deseas limpiar todos los campos para crear un nuevo recibo?')) {
            this.resetReceipt();
          }
        });
      }

      // Botón Cargar Ejemplo
      const btnLoadExample = document.getElementById('btn-load-example');
      if (btnLoadExample) {
        btnLoadExample.addEventListener('click', () => {
          this.loadExampleData();
        });
      }

      // Botón Abrir Ajustes
      const btnSettings = document.getElementById('btn-open-settings');
      if (btnSettings) {
        btnSettings.addEventListener('click', () => {
          this.settingsModalView.open(this.config);
        });
      }

      // Pestañas de navegación en móvil
      const tabEdit = document.getElementById('tab-btn-edit');
      const tabPreview = document.getElementById('tab-btn-preview');

      if (tabEdit && tabPreview) {
        tabEdit.addEventListener('click', () => {
          document.body.classList.remove('show-preview');
          tabEdit.classList.add('active');
          tabPreview.classList.remove('active');
        });

        tabPreview.addEventListener('click', () => {
          document.body.classList.add('show-preview');
          tabPreview.classList.add('active');
          tabEdit.classList.remove('active');
        });
      }
    }

    handleDataChange() {
      this.previewView.render(this.receipt, this.config);
      this.storageService.saveDraft(this.receipt);
    }

    addItem(itemData) {
      this.receipt.addItem(itemData);
      this.formView.renderItems(this.receipt.items);
      this.handleDataChange();
    }

    removeItem(index) {
      this.receipt.removeItem(index);
      this.formView.renderItems(this.receipt.items);
      this.handleDataChange();
    }

    handleSaveConfig(newConfig) {
      this.config = newConfig;
      const result = this.storageService.saveConfig(this.config);

      if (result.success) {
        if (window.showToast) window.showToast('💾 Configuración guardada correctamente');
      } else {
        alert(result.error);
      }

      this.previewView.render(this.receipt, this.config);
    }

    resetReceipt() {
      const nextFolio = this.receipt.getNextFolio();
      const today = window.ReceiptHelpers.getLocalDateString();

      this.receipt = new window.ReceiptModels.Receipt({
        folio: nextFolio,
        date: today,
        clientName: '',
        clientAddress: '', // Ahora inicia completamente vacío sin fijar Minatitlán
        clientPhone: '',
        clientDetails: '',
        items: [
          { cant: 1, desc: '', precio: 0 }
        ]
      });

      this.renderAll();
      if (window.showToast) window.showToast('✨ Formulario listo para nuevo recibo');
    }

    loadExampleData() {
      this.receipt = this.createInitialReceipt();
      this.renderAll();
      if (window.showToast) window.showToast('📋 Ejemplo de prueba cargado');
    }

    renderAll() {
      this.formView.setReceipt(this.receipt);
      this.previewView.render(this.receipt, this.config);
    }

    registerServiceWorker() {
      if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            .catch(err => console.log('Service Worker no activo en este entorno:', err));
        });
      }
    }
  }

  // Inicialización al cargar el DOM y compatibilidad global
  document.addEventListener('DOMContentLoaded', () => {
    const app = new ReceiptApp();
    window.receiptApp = app;

    // Adaptador de retrocompatibilidad para llamadas previas de pdf-generator
    window.receiptPdfGenerator = {
      downloadPdf: () => app.pdfService.downloadPdf(app.receipt),
      printDirect: () => app.pdfService.printDirect(),
      shareReceipt: () => app.shareService.shareReceipt(app.receipt)
    };
  });

})(window);
