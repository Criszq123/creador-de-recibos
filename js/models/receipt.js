/**
 * RECEIPT.JS - MODELO DE DOMINIO Y ENTIDADES DE NEGOCIO
 * Contiene la lógica pura de conceptos, cálculos de subtotal, total e importes.
 */

(function (window) {
  'use strict';

  class ReceiptItem {
    constructor(data = {}) {
      this.cant = parseFloat(data.cant) || 1;
      this.desc = (data.desc !== undefined && data.desc !== null) ? String(data.desc) : '';
      this.precio = parseFloat(data.precio) || 0;
    }

    getSubtotal() {
      const c = (this.cant > 0) ? this.cant : 0;
      const p = (this.precio > 0) ? this.precio : 0;
      return Math.round((c * p) * 100) / 100;
    }

    isEmpty() {
      return !this.desc.trim() && this.precio === 0;
    }
  }

  class Receipt {
    constructor(data = {}) {
      const today = window.ReceiptHelpers ? window.ReceiptHelpers.getLocalDateString() : new Date().toISOString().slice(0, 10);

      this.folio = data.folio ? String(data.folio).trim() : '0148';
      this.date = data.date || today;
      this.clientName = data.clientName ? String(data.clientName) : '';
      this.clientAddress = data.clientAddress ? String(data.clientAddress) : '';
      this.clientPhone = data.clientPhone ? String(data.clientPhone) : '';
      this.clientDetails = data.clientDetails ? String(data.clientDetails) : '';

      this.items = [];
      if (Array.isArray(data.items) && data.items.length > 0) {
        this.items = data.items.map(i => new ReceiptItem(i));
      } else {
        this.items = [new ReceiptItem({ cant: 1, desc: '', precio: 0 })];
      }
    }

    addItem(itemData = { cant: 1, desc: '', precio: 0 }) {
      this.items.push(new ReceiptItem(itemData));
    }

    removeItem(index) {
      if (this.items.length <= 1) {
        this.items[0] = new ReceiptItem({ cant: 1, desc: '', precio: 0 });
      } else {
        this.items.splice(index, 1);
      }
    }

    getSubtotal() {
      return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
    }

    getTotal() {
      return this.getSubtotal();
    }

    getAmountInWords() {
      const total = this.getTotal();
      if (typeof window.numeroALetras === 'function') {
        return window.numeroALetras(total, 'PESOS', 'M.N.');
      }
      return `${total.toFixed(2)} PESOS 00/100 M.N.`;
    }

    getNextFolio() {
      const numeric = parseInt(this.folio.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(numeric)) {
        const next = String(numeric + 1);
        const padLen = Math.max(4, this.folio.length);
        return next.padStart(padLen, '0');
      }
      return '0001';
    }

    getItemsSummaryText() {
      return this.items
        .filter(item => item.desc && item.desc.trim())
        .map(item => {
          const money = window.ReceiptHelpers ? window.ReceiptHelpers.formatMoney(item.getSubtotal()) : `$${item.getSubtotal().toFixed(2)}`;
          return `• ${item.cant}x ${item.desc.trim().toUpperCase()} - ${money}`;
        })
        .join('\n');
    }
  }

  window.ReceiptModels = {
    ReceiptItem,
    Receipt
  };

})(window);
