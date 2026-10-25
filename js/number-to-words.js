/**
 * NUMBER-TO-WORDS.JS
 * Conversor numérico a texto en español con formato monetario mexicano / latinoamericano.
 * Corrige errores de redondeo de centavos (evita 100/100 M.N.) y preposiciones en millones.
 * Ej: 2700.50 -> "DOS MIL SETECIENTOS PESOS 50/100 M.N."
 * Ej: 1000000 -> "UN MILLÓN DE PESOS 00/100 M.N."
 */

(function (window) {
  'use strict';

  function numeroALetras(cantidad, moneda = 'PESOS', sufijoMoneda = 'M.N.') {
    if (cantidad === null || cantidad === undefined || isNaN(cantidad)) {
      return '';
    }

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = {
      11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
      16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
      21: 'VEINTIÚN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
      25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
    };
    const centenas = [
      '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS',
      'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
    ];

    function leerGrupo(num) {
      if (num === 0) return '';
      if (num === 100) return 'CIEN';

      const c = Math.floor(num / 100);
      const d = Math.floor((num % 100) / 10);
      const u = num % 10;
      let resultado = '';

      if (c > 0) {
        resultado += centenas[c] + ' ';
      }

      const du = num % 100;
      if (du > 0) {
        if (especiales[du]) {
          resultado += especiales[du];
        } else if (d > 2 && u > 0) {
          resultado += decenas[d] + ' Y ' + unidades[u];
        } else if (d > 0) {
          resultado += decenas[d];
        } else if (u > 0) {
          resultado += unidades[u];
        }
      }

      return resultado.trim();
    }

    // 1. Redondeo estricto a 2 decimales PREVIO a calcular el entero para evitar centavos = 100
    const valorAbsoluto = Math.abs(Number(cantidad));
    const totalRedondeado = Math.round(valorAbsoluto * 100) / 100;
    const entero = Math.floor(totalRedondeado);
    const centavos = Math.round((totalRedondeado - entero) * 100);
    const centavosTexto = String(centavos).padStart(2, '0') + '/100 ' + sufijoMoneda;

    if (entero === 0) {
      return `CERO ${moneda} ${centavosTexto}`.trim();
    }

    const millones = Math.floor(entero / 1000000);
    const miles = Math.floor((entero % 1000000) / 1000);
    const resto = entero % 1000;

    const partes = [];

    if (millones > 0) {
      if (millones === 1) {
        partes.push('UN MILLÓN');
      } else {
        partes.push(leerGrupo(millones) + ' MILLONES');
      }
    }

    if (miles > 0) {
      if (miles === 1) {
        partes.push('MIL');
      } else {
        partes.push(leerGrupo(miles) + ' MIL');
      }
    }

    if (resto > 0) {
      partes.push(leerGrupo(resto));
    }

    const textoEntero = partes.join(' ');
    
    // Regla gramatical: "UN MILLÓN DE PESOS" si no hay miles ni centenas intermedias
    let nombreMoneda = moneda;
    if (entero === 1) {
      nombreMoneda = (moneda === 'PESOS') ? 'PESO' : moneda;
    } else if (millones > 0 && miles === 0 && resto === 0) {
      nombreMoneda = `DE ${moneda}`;
    }

    return `${textoEntero} ${nombreMoneda} ${centavosTexto}`.trim();
  }

  window.numeroALetras = numeroALetras;

})(window);
