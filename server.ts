import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// ─── Ghana Tax Calculation ────────────────────────────────────────────────────
app.post('/api/finance/calculate-tax', (req, res) => {
  const { baseAmount } = req.body;
  if (typeof baseAmount !== 'number' || baseAmount < 0) {
    return res.status(400).json({ error: 'Invalid baseAmount' });
  }
  const vat        = +(baseAmount * 0.15).toFixed(2);
  const nhil       = +(baseAmount * 0.025).toFixed(2);
  const getFund    = +(baseAmount * 0.025).toFixed(2);
  const covidLevy  = +(baseAmount * 0.01).toFixed(2);
  const totalTax   = +(vat + nhil + getFund + covidLevy).toFixed(2);
  const totalAmount = +(baseAmount + totalTax).toFixed(2);

  res.json({ baseAmount, taxes: { vat, nhil, getFund, covidLevy, totalTax }, totalAmount });
});

// ─── Paystack Payment Initialisation ─────────────────────────────────────────
app.post('/api/payment/initialize', async (req, res) => {
  const { email, amount, orderId } = req.body;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    // Dev fallback — return a test reference so the app keeps working
    console.warn('[Paystack] PAYSTACK_SECRET_KEY not set — returning dev fallback.');
    return res.json({ data: { reference: orderId, status: 'dev_mode' } });
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),   // pesewas
        currency: 'GHS',
        reference: orderId,
        channels: ['card', 'mobile_money', 'bank'],
        metadata: { order_id: orderId },
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[Paystack] init error:', err);
    res.status(502).json({ error: 'Payment gateway unavailable' });
  }
});

// ─── Paystack Payment Verification ───────────────────────────────────────────
app.get('/api/payment/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return res.json({ data: { status: 'success', reference } }); // dev fallback
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[Paystack] verify error:', err);
    res.status(502).json({ error: 'Verification failed' });
  }
});

// ─── Paystack Webhook ─────────────────────────────────────────────────────────
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (secretKey) {
    const hash = crypto.createHmac('sha512', secretKey).update(req.body).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      console.warn('[Paystack Webhook] Invalid signature — rejected');
      return res.status(401).send('Unauthorised');
    }
  }

  const event = JSON.parse(req.body.toString());
  console.log('[Paystack Webhook] Event:', event.event, '| Ref:', event.data?.reference);

  // TODO: Dispatch event to a Cloud Function or queue for Firestore update
  // For now, log and acknowledge
  if (event.event === 'charge.success') {
    const { reference, amount, customer } = event.data;
    console.log(`[Paystack] Payment confirmed: ${reference}, GH₵ ${(amount / 100).toFixed(2)}, ${customer.email}`);
  }

  res.sendStatus(200);
});

// ─── GRA-Compliant VAT Invoice Generation ────────────────────────────────────
app.post('/api/invoice/generate', (req, res) => {
  const { order, customer } = req.body;
  if (!order || !customer) return res.status(400).send('Missing order or customer');

  const invoiceNumber = `INV-${order.id || Date.now()}`;
  const issueDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' });
  const taxInfo = (() => {
    const base = order.items?.reduce((s: number, i: any) => s + i.price * i.quantity, 0) || order.totalAmount;
    const vat       = +(base * 0.15).toFixed(2);
    const nhil      = +(base * 0.025).toFixed(2);
    const getFund   = +(base * 0.025).toFixed(2);
    const covidLevy = +(base * 0.01).toFixed(2);
    const totalTax  = +(vat + nhil + getFund + covidLevy).toFixed(2);
    return { base, vat, nhil, getFund, covidLevy, totalTax, total: +(base + totalTax).toFixed(2) };
  })();

  const rowsHtml = (order.items || []).map((item: any) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0">${item.name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right">GH₵ ${Number(item.price).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right">GH₵ ${(item.price * item.quantity).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>VAT Invoice ${invoiceNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1a1a1a;background:#fff;padding:32px}
    @media print{body{padding:0}.no-print{display:none}@page{margin:20mm}}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #E12222;margin-bottom:24px}
    .logo{font-size:28px;font-weight:900;color:#E12222;letter-spacing:-1px}
    .logo-sub{font-size:11px;color:#666;margin-top:2px}
    .tax-info{text-align:right;font-size:11px;color:#555;line-height:1.8}
    .inv-meta{display:flex;justify-content:space-between;margin-bottom:24px;gap:16px}
    .inv-box{background:#f9f9f9;border:1px solid #eee;border-radius:8px;padding:14px;flex:1}
    .inv-box h4{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#888;margin-bottom:6px}
    .inv-box p{font-size:13px;font-weight:700;line-height:1.6}
    .inv-box .sub{font-weight:400;color:#666;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#1a1a1a;color:#fff;padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
    th:nth-child(2){text-align:center}th:nth-child(3),th:nth-child(4){text-align:right}
    tfoot td{padding:8px;font-size:12px;border-top:1px solid #eee}
    tfoot tr:last-child td{border-top:2px solid #E12222;font-size:14px;font-weight:900;color:#E12222}
    .tax-box{background:#fff8f8;border:1px solid #fdd;border-radius:8px;padding:14px;margin-bottom:20px}
    .tax-box h4{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#E12222;margin-bottom:8px}
    .tax-row{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;color:#555}
    .footer{font-size:11px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:16px;margin-top:8px}
    .badge{display:inline-block;background:#E12222;color:#fff;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:4px}
    .print-btn{background:#E12222;color:#fff;border:none;padding:10px 24px;border-radius:10px;font-weight:700;cursor:pointer;font-size:13px;margin-bottom:24px}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  <div class="header">
    <div>
      <div class="logo">MELCOM</div>
      <div class="logo-sub">Melcom Ghana Limited</div>
      <div style="font-size:11px;color:#555;margin-top:4px;line-height:1.6">
        Independence Avenue, Accra, Ghana<br/>
        Tel: +233 30 277 0000 · support@melcom.com.gh
      </div>
    </div>
    <div class="tax-info">
      <div class="badge">VAT Invoice</div>
      <div>TIN: <strong>C0003849284</strong></div>
      <div>VAT Reg: <strong>V0013288X</strong></div>
      <div>Invoice No: <strong>${invoiceNumber}</strong></div>
      <div>Date: <strong>${issueDate}</strong></div>
    </div>
  </div>

  <div class="inv-meta">
    <div class="inv-box">
      <h4>Bill To</h4>
      <p>${customer.firstName || ''} ${customer.lastName || ''}</p>
      <p class="sub">${customer.email || ''}</p>
      <p class="sub">${order.shippingDetails?.phone || customer.phone || ''}</p>
      <p class="sub">${order.shippingDetails?.address || ''}, ${order.shippingDetails?.city || ''}</p>
    </div>
    <div class="inv-box">
      <h4>Order Details</h4>
      <p>Order: ${order.id}</p>
      <p class="sub">Payment: ${order.paymentMethod}</p>
      <p class="sub">Status: <strong style="color:${order.status === 'Paid' || order.status === 'Delivered' ? '#16a34a' : '#E12222'}">${order.status}</strong></p>
      <p class="sub">Ref: ${order.paymentReference || '—'}</p>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
    <tfoot>
      <tr><td colspan="3" style="text-align:right">Subtotal (excl. tax)</td><td style="text-align:right">GH₵ ${taxInfo.base.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td></tr>
    </tfoot>
  </table>

  <div class="tax-box">
    <h4>Tax Breakdown (Ghana Revenue Authority)</h4>
    <div class="tax-row"><span>Value Added Tax (VAT) — 15%</span><span>GH₵ ${taxInfo.vat.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span></div>
    <div class="tax-row"><span>National Health Insurance Levy (NHIL) — 2.5%</span><span>GH₵ ${taxInfo.nhil.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span></div>
    <div class="tax-row"><span>Ghana Education Trust Fund (GETFund) — 2.5%</span><span>GH₵ ${taxInfo.getFund.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span></div>
    <div class="tax-row"><span>COVID-19 Health Recovery Levy — 1%</span><span>GH₵ ${taxInfo.covidLevy.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span></div>
    <div class="tax-row" style="font-weight:700;color:#E12222;border-top:1px solid #fdd;margin-top:6px;padding-top:6px">
      <span>Total Tax Payable</span><span>GH₵ ${taxInfo.totalTax.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</span>
    </div>
  </div>

  <table style="max-width:320px;margin-left:auto">
    <tfoot>
      <tr><td style="text-align:right;padding:8px">Total Tax</td><td style="text-align:right;padding:8px">GH₵ ${taxInfo.totalTax.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td></tr>
      <tr><td colspan="2" style="height:1px"></td></tr>
      <tr><td style="text-align:right;padding:10px;border-top:2px solid #E12222;font-size:15px;font-weight:900;color:#E12222">TOTAL DUE</td><td style="text-align:right;padding:10px;border-top:2px solid #E12222;font-size:15px;font-weight:900;color:#E12222">GH₵ ${taxInfo.total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td></tr>
    </tfoot>
  </table>

  <div class="footer">
    <p>This is a computer-generated VAT invoice. Melcom Ghana Limited is registered as a VAT-registered trader under the Ghana Revenue Authority Act, 2000 (Act 592).</p>
    <p style="margin-top:4px">Thank you for shopping with Melcom — Ghana's Premier Retail Chain.</p>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// ─── Order Confirmation Email ─────────────────────────────────────────────────
// Uses SendGrid if SENDGRID_API_KEY is set, otherwise logs to console.
app.post('/api/email/order-confirmation', async (req, res) => {
  const { order, customer } = req.body;
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@melcom.com.gh';
  const toEmail = customer?.email;

  if (!toEmail) return res.status(400).json({ error: 'No recipient email' });

  const itemsText = (order.items || []).map((i: any) => `  • ${i.name} ×${i.quantity} — GH₵ ${i.price}`).join('\n');
  const subject = `Order Confirmed: ${order.id} — Melcom Ghana`;
  const body = `Dear ${customer.firstName || 'Customer'},\n\nThank you for your order!\n\nOrder ID: ${order.id}\nTotal: GH₵ ${order.totalAmount}\nPayment: ${order.paymentMethod}\n\nItems:\n${itemsText}\n\nWe'll notify you when your order is on its way.\n\nMelcom Ghana Customer Care\nsupport@melcom.com.gh | +233 30 277 0000`;

  if (!apiKey) {
    console.log(`[Email] Dev mode — would send to ${toEmail}:\nSubject: ${subject}\n${body}`);
    return res.json({ message: 'Dev mode: email logged to console' });
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail, name: `${customer.firstName} ${customer.lastName || ''}`.trim() }] }],
        from: { email: fromEmail, name: 'Melcom Ghana' },
        subject,
        content: [
          { type: 'text/plain', value: body },
          { type: 'text/html', value: body.replace(/\n/g, '<br>') },
        ],
      }),
    });
    if (response.ok) res.json({ message: 'Email sent' });
    else { const err = await response.text(); throw new Error(err); }
  } catch (err) {
    console.error('[Email] SendGrid error:', err);
    res.status(502).json({ error: 'Email delivery failed' });
  }
});

// ─── Vite Dev Middleware / Static Serve ──────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════╗
║   Melcom E-Business Platform                 ║
║   Running on http://localhost:${PORT}            ║
║   Admin panel: http://localhost:${PORT}/admin    ║
╚══════════════════════════════════════════════╝`);
  });
}

startServer();
