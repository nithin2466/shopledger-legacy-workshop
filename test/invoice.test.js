'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

// These fixtures are deliberately in memory; this suite never imports the store.

test('invoice uses the order HSN slab for GST and totals', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }];
  var orderTotals = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, total: orderTotals.total });

  assert.equal(orderTotals.tax, 5);
  assert.equal(orderTotals.total, 105);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
  assert.equal(invoiceFigures.tax, orderTotals.tax);
  assert.equal(invoiceFigures.total, orderTotals.total);
});

test('invoice uses the order coupon discount cap and applies tax after discount', function () {
  var items = [{ id: 2, name: 'Rice', hsn: '1006', price: 2500, qty: 1 }];
  var orderTotals = pricing.computeTotals(items, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10', total: orderTotals.total });

  assert.equal(orderTotals.discount, 150);
  assert.equal(orderTotals.tax, 117.5);
  assert.equal(orderTotals.total, 2467.5);
  assert.equal(invoiceFigures.discount, orderTotals.discount);
  assert.equal(invoiceFigures.tax, orderTotals.tax);
  assert.equal(invoiceFigures.total, orderTotals.total);
});

test('invoice accepts explicit decimal gstRate values', function () {
  var figures = invoice.computeInvoiceFigures({ items: [{ name: 'Tea', price: 100, qty: 1, gstRate: 0.05 }] });

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 5);
  assert.equal(figures.total, 105);
});

test('rendered invoice matches the order total without a mismatch banner', function () {
  var html = invoice.render({
    id: 42,
    date: '2026-11-21',
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }],
    subtotal: 100,
    tax: 5,
    total: 105
  });

  assert.match(html, /Invoice Total<\/td><td class="r">[^<]*105\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

