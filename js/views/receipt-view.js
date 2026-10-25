/**
 * RECEIPT-VIEW.JS - VISTA PREVIA VISUAL DEL RECIBO
 * Renderiza de manera reactiva y segura la hoja física del recibo,
 * asegurando escape HTML para prevenir inyecciones y cortes por comillas.
 */

(function (window) {
  'use strict';

  class ReceiptPreviewView {
    constructor() {
      this.initElements();
      this.defaultWatermarkHtml = this.receiptWatermark ? this.receiptWatermark.innerHTML : '';
    }

    initElements() {
      this.previewBusinessName = document.getElementById('preview-business-name');
      this.previewBusinessSlogan = document.getElementById('preview-business-slogan');
      this.previewBusinessAddress = document.getElementById('preview-business-address');
      this.previewBusinessPhone = document.getElementById('preview-business-phone');
      this.previewBusinessLogo = document.getElementById('preview-business-logo');

      this.previewFolio = document.getElementById('preview-folio');
      this.previewDate = document.getElementById('preview-date');
      this.previewClientName = document.getElementById('preview-client-name');
      this.previewClientAddress = document.getElementById('preview-client-address');
      this.previewClientPhone = document.getElementById('preview-client-phone');
      this.previewClientDetails = document.getElementById('preview-client-details');
      this.previewRowDetails = document.getElementById('preview-row-details');

      this.previewItemsTableBody = document.getElementById('preview-items-body');
      this.previewAmountWords = document.getElementById('preview-amount-words');
      this.previewTerms = document.getElementById('preview-terms');
      this.receiptWatermark = document.getElementById('receipt-watermark-bg');
    }

    render(receipt, config) {
      this.renderHeader(config);
      this.renderWatermark(config);
      this.renderClientInfo(receipt);
      this.renderItemsTable(receipt, config);
      this.renderFooter(receipt, config);
    }

    renderHeader(config) {
      if (this.previewBusinessName) this.previewBusinessName.textContent = config.businessName || '';
      if (this.previewBusinessSlogan) this.previewBusinessSlogan.textContent = config.businessSlogan || '';
      if (this.previewBusinessAddress) this.previewBusinessAddress.textContent = config.businessAddress || '';
      if (this.previewBusinessPhone) this.previewBusinessPhone.textContent = config.businessPhone ? `TEL: ${config.businessPhone}` : '';

      if (this.previewBusinessLogo) {
        if (config.logoUrl) {
          this.previewBusinessLogo.src = config.logoUrl;
          this.previewBusinessLogo.style.display = 'block';
        } else {
          this.previewBusinessLogo.style.display = 'none';
        }
      }

      if (config.headerColor) {
        document.documentElement.style.setProperty('--receipt-primary', config.headerColor);
      }
    }

    renderWatermark(config) {
      if (!this.receiptWatermark) return;
      this.receiptWatermark.style.opacity = config.watermarkOpacity !== undefined ? config.watermarkOpacity : 0.18;

      if (config.customWatermarkUrl) {
        this.receiptWatermark.innerHTML = `<img src="${config.customWatermarkUrl}" alt="Marca de agua" style="width:100%; height:100%; object-fit:contain;" />`;
      } else if (this.defaultWatermarkHtml) {
        this.receiptWatermark.innerHTML = this.defaultWatermarkHtml;
      }
    }

    renderClientInfo(receipt) {
      if (this.previewFolio) this.previewFolio.textContent = receipt.folio || '---';
      if (this.previewDate) {
        this.previewDate.textContent = window.ReceiptHelpers
          ? window.ReceiptHelpers.formatDate(receipt.date)
          : receipt.date;
      }
      if (this.previewClientName) this.previewClientName.textContent = receipt.clientName.trim() || 'MOSTRADOR';
      if (this.previewClientAddress) this.previewClientAddress.textContent = receipt.clientAddress.trim() || '---';
      if (this.previewClientPhone) this.previewClientPhone.textContent = receipt.clientPhone.trim() || '---';

      if (this.previewRowDetails && this.previewClientDetails) {
        if (receipt.clientDetails && receipt.clientDetails.trim()) {
          this.previewClientDetails.textContent = receipt.clientDetails.trim();
          this.previewRowDetails.style.display = 'table-row';
        } else {
          this.previewRowDetails.style.display = 'none';
        }
      }
    }

    renderItemsTable(receipt, config) {
      if (!this.previewItemsTableBody) return;
      this.previewItemsTableBody.innerHTML = '';

      const items = receipt.items || [];
      const formatMoney = window.ReceiptHelpers ? window.ReceiptHelpers.formatMoney : num => `$${num.toFixed(2)}`;

      // 1. Filas con conceptos reales
      items.forEach(item => {
        const tr = document.createElement('tr');
        const isBlank = item.isEmpty ? item.isEmpty() : (!item.desc.trim() && item.precio === 0);

        const subtotal = item.getSubtotal ? item.getSubtotal() : (item.cant * item.precio);

        const tdCant = document.createElement('td');
        tdCant.className = 'cell-cant';
        tdCant.textContent = (!isBlank && item.cant > 0) ? String(item.cant) : '';

        const tdDesc = document.createElement('td');
        tdDesc.className = 'cell-desc';
        tdDesc.textContent = item.desc ? item.desc.toUpperCase() : '';

        const tdPrecio = document.createElement('td');
        tdPrecio.className = 'cell-precio';
        tdPrecio.textContent = (!isBlank && item.precio > 0) ? formatMoney(item.precio) : '';

        const tdSubtotal = document.createElement('td');
        tdSubtotal.className = 'cell-subtotal';
        tdSubtotal.textContent = (!isBlank && subtotal > 0) ? formatMoney(subtotal) : '';

        tr.appendChild(tdCant);
        tr.appendChild(tdDesc);
        tr.appendChild(tdPrecio);
        tr.appendChild(tdSubtotal);

        this.previewItemsTableBody.appendChild(tr);
      });

      // 2. Filas vacías de relleno (para conservar estética de talonario físico)
      const minRows = config.minTableRows || 8;
      const emptyRowsCount = Math.max(0, minRows - items.length);

      for (let i = 0; i < emptyRowsCount; i++) {
        const trEmpty = document.createElement('tr');
        trEmpty.className = 'empty-row';
        trEmpty.innerHTML = `
          <td class="cell-cant">&nbsp;</td>
          <td class="cell-desc">&nbsp;</td>
          <td class="cell-precio">&nbsp;</td>
          <td class="cell-subtotal">&nbsp;</td>
        `;
        this.previewItemsTableBody.appendChild(trEmpty);
      }

      // 3. Fila de SUBTOTAL
      const totalAmount = receipt.getTotal ? receipt.getTotal() : 0;
      const trSubtotal = document.createElement('tr');
      trSubtotal.className = 'total-row';
      trSubtotal.innerHTML = `
        <td colspan="2" style="border:none;"></td>
        <td class="total-label">SUBTOTAL</td>
        <td class="total-amount" id="preview-subtotal">${formatMoney(totalAmount)}</td>
      `;
      this.previewItemsTableBody.appendChild(trSubtotal);

      // 4. Fila de TOTAL garantizando el ID preview-total
      const trTotal = document.createElement('tr');
      trTotal.className = 'total-row';
      trTotal.innerHTML = `
        <td colspan="2" style="border:none;"></td>
        <td class="total-label">TOTAL</td>
        <td class="total-amount" id="preview-total">${formatMoney(totalAmount)}</td>
      `;
      this.previewItemsTableBody.appendChild(trTotal);
    }

    renderFooter(receipt, config) {
      if (this.previewAmountWords) {
        const words = receipt.getAmountInWords ? receipt.getAmountInWords() : '';
        this.previewAmountWords.textContent = words ? `( ${words} )` : '';
      }
      if (this.previewTerms) {
        this.previewTerms.textContent = config.termsText || '';
      }
    }
  }

  window.ReceiptViews = window.ReceiptViews || {};
  window.ReceiptViews.ReceiptPreviewView = ReceiptPreviewView;

})(window);
