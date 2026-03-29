import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Order, Customer } from '../types';

interface Props {
  order: Order;
  customer: Partial<Customer>;
}

export function InvoiceButton({ order, customer }: Props) {
  const [loading, setLoading] = useState(false);

  const openInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, customer }),
      });
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    } catch (e) {
      console.error('Invoice error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openInvoice}
      disabled={loading}
      className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      <FileText size={16} />
      {loading ? 'Generating...' : 'VAT Invoice'}
    </button>
  );
}
