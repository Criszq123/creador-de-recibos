/**
 * FORM-VIEW.JS - VISTA DEL FORMULARIO Y CAPTURA DE DATOS
 * Maneja los campos de entrada, conceptos dinámicos y previene truncado por comillas o caracteres especiales.
 */

(function (window) {
  'use strict';

  class ReceiptFormView {
    constructor(callbacks = {}) {
      this.callbacks = callbacks; // onDataChange, onAddItem, onRemoveItem
      this.initElements();
      this.attachEventListeners();
    }

    initElements() {
      this.inputFolio = document.getElementById('input-folio');
      this.inputDate = document.getElementById('input-date');
      this.inputClientName = document.getElementById('input-client-name');
      this.inputClientAddress = document.getElementById('input-client-address');
      this.inputClientPhone = document.getElementById('input-client-phone');
      this.inputClientDetails = document.getElementById('input-client-details');
      this.itemsContainer = document.getElementById('items-form-container');
      this.btnAddItem = document.getElementById('btn-add-item');
    }

    attachEventListeners() {
      const notifyChange = () => {
        if (typeof this.callbacks.onDataChange === 'function') {
          this.callbacks.onDataChange();
        }
      };

      const bindInput = (input, setter) => {
        if (!input) return;
        input.addEventListener('input', (e) => {
          setter(e.target.value);
          notifyChange();
        });
      };

      bindInput(this.inputFolio, val => { if (this.currentReceipt) this.currentReceipt.folio = val; });
      bindInput(this.inputDate, val => { if (this.currentReceipt) this.currentReceipt.date = val; });
      bindInput(this.inputClientName, val => { if (this.currentReceipt) this.currentReceipt.clientName = val; });
      bindInput(this.inputClientAddress, val => { if (this.currentReceipt) this.currentReceipt.clientAddress = val; });
      bindInput(this.inputClientPhone, val => { if (this.currentReceipt) this.currentReceipt.clientPhone = val; });
      bindInput(this.inputClientDetails, val => { if (this.currentReceipt) this.currentReceipt.clientDetails = val; });

      if (this.btnAddItem) {
        this.btnAddItem.addEventListener('click', () => {
          if (typeof this.callbacks.onAddItem === 'function') {
            this.callbacks.onAddItem();
          }
        });
      }
    }

    /**
     * Sincroniza los valores del modelo con los campos del formulario
     */
    setReceipt(receipt) {
      this.currentReceipt = receipt;
      if (this.inputFolio) this.inputFolio.value = receipt.folio || '';
      if (this.inputDate) this.inputDate.value = receipt.date || '';
      if (this.inputClientName) this.inputClientName.value = receipt.clientName || '';
      if (this.inputClientAddress) this.inputClientAddress.value = receipt.clientAddress || '';
      if (this.inputClientPhone) this.inputClientPhone.value = receipt.clientPhone || '';
      if (this.inputClientDetails) this.inputClientDetails.value = receipt.clientDetails || '';

      this.renderItems(receipt.items);
    }

    /**
     * Renderiza las filas dinámicas de conceptos en el formulario
     */
    renderItems(items) {
      if (!this.itemsContainer) return;
      this.itemsContainer.innerHTML = '';

      const escapeHtml = window.ReceiptHelpers ? window.ReceiptHelpers.escapeHtml : str => str;

      items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-form-row';
        row.dataset.index = index;

        const cantValue = item.cant !== undefined && item.cant !== null ? item.cant : 1;
        const descEscaped = escapeHtml(item.desc || '');
        const precioValue = item.precio > 0 ? item.precio : '';

        row.innerHTML = `
          <div class="item-row-header">
            <span class="item-row-number">Concepto #${index + 1}</span>
            <button type="button" class="btn-remove-item" data-index="${index}" title="Eliminar este concepto">
              ✕ Quitar
            </button>
          </div>
          <div class="item-inputs-grid">
            <div>
              <label class="form-label" style="font-size:10.5px;">CANT.</label>
              <input type="number" class="form-input item-cant" data-index="${index}" value="${cantValue}" min="0.1" step="any" placeholder="1">
            </div>
            <div>
              <label class="form-label" style="font-size:10.5px;">DESCRIPCIÓN</label>
              <input type="text" class="form-input item-desc" data-index="${index}" value="${descEscaped}" placeholder="Ej: SERVICIO DE REEMPLAZO DE BULBO">
            </div>
            <div>
              <label class="form-label" style="font-size:10.5px;">PRECIO U.</label>
              <input type="number" class="form-input item-precio" data-index="${index}" value="${precioValue}" min="0" step="any" placeholder="0.00">
            </div>
          </div>
        `;

        // Eventos en vivo para cada fila
        const cantInput = row.querySelector('.item-cant');
        const descInput = row.querySelector('.item-desc');
        const precioInput = row.querySelector('.item-precio');
        const removeBtn = row.querySelector('.btn-remove-item');

        cantInput.addEventListener('input', (e) => {
          item.cant = Math.max(0, parseFloat(e.target.value) || 0);
          if (typeof this.callbacks.onDataChange === 'function') {
            this.callbacks.onDataChange();
          }
        });

        descInput.addEventListener('input', (e) => {
          item.desc = e.target.value;
          if (typeof this.callbacks.onDataChange === 'function') {
            this.callbacks.onDataChange();
          }
        });

        precioInput.addEventListener('input', (e) => {
          item.precio = Math.max(0, parseFloat(e.target.value) || 0);
          if (typeof this.callbacks.onDataChange === 'function') {
            this.callbacks.onDataChange();
          }
        });

        removeBtn.addEventListener('click', () => {
          if (typeof this.callbacks.onRemoveItem === 'function') {
            this.callbacks.onRemoveItem(index);
          }
        });

        this.itemsContainer.appendChild(row);
      });
    }
  }

  window.ReceiptViews = window.ReceiptViews || {};
  window.ReceiptViews.ReceiptFormView = ReceiptFormView;

})(window);
