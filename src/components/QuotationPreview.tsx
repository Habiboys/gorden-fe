import { CheckCircle, Download, Loader2, Printer, Send, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { documentsApi } from '../utils/api';
import { Button } from './ui/button';

interface QuotationPreviewProps {
  doc: any;
  onClose: () => void;
  onRefresh?: () => void;
}

export function QuotationPreview({ doc, onClose, onRefresh }: QuotationPreviewProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Handle both frontend mock format (quotationData) and backend format (data)
  const quotationData = doc?.quotationData || doc?.data;

  // Handle both camelCase and snake_case field names
  const documentNumber = doc?.documentNumber || doc?.document_number || '-';
  const createdAt = doc?.createdAt || (doc?.created_at ? new Date(doc.created_at).toLocaleDateString('id-ID') : '-');
  const customerName = doc?.customerName || doc?.customer_name || '-';
  const customerPhone = doc?.customerPhone || doc?.customer_phone || '-';
  const customerEmail = doc?.customerEmail || doc?.customer_email || '-';
  const customerAddress = doc?.customerAddress || doc?.address || '';
  const referralCode = doc?.referralCode || doc?.referral_code || '';
  const discount = doc?.discount || 0;
  const totalAmount = doc?.amount || doc?.total_amount || 0;
  const status = doc?.status || 'DRAFT';

  if (!doc) return null;

  const calculateItemTotal = (item: any) => {
    const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
    return discountedPrice * (item.quantity || 1);
  };

  const calculateWindowTotal = (window: any) => {
    if (!window.items) return 0;
    return window.items.reduce((sum: number, item: any) => sum + calculateItemTotal(item), 0);
  };

  const calculateSubtotal = () => {
    if (!quotationData?.windows) return parseFloat(totalAmount) || 0;
    return quotationData.windows.reduce((total: number, window: any) => {
      return total + calculateWindowTotal(window);
    }, 0);
  };

  const calculateDiscount = () => {
    return calculateSubtotal() * (discount / 100);
  };

  const calculateGrandTotal = () => {
    if (!quotationData?.windows) return parseFloat(totalAmount) || 0;
    return calculateSubtotal() - calculateDiscount();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPdf(true);
      await documentsApi.downloadPDF(doc.id, `${documentNumber}.pdf`);
      toast.success('PDF berhasil diunduh');
    } catch (error: any) {
      toast.error('Gagal mengunduh PDF: ' + error.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      const response = await documentsApi.sendEmail(doc.id);
      if (response.success) {
        toast.success(`Email berhasil dikirim ke ${customerEmail}`);
        onRefresh?.();
      }
    } catch (error: any) {
      toast.error('Gagal mengirim email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setUpdatingStatus(true);
      const response = await documentsApi.updateStatus(doc.id, 'PAID');
      if (response.success) {
        toast.success(response.message || 'Status berhasil diperbarui');
        onRefresh?.();
        onClose();
      }
    } catch (error: any) {
      toast.error('Gagal memperbarui status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col my-4">
        {/* Header Actions - No Print */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between print:hidden sticky top-0 bg-white z-10">
          <h2 className="text-lg text-gray-900">Preview Surat Penawaran</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="border-gray-300"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-600"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSendEmail}
              disabled={sendingEmail}
            >
              {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Kirim Email
            </Button>
            {status !== 'PAID' && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleMarkAsPaid}
                disabled={updatingStatus}
              >
                {updatingStatus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Tandai Lunas
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quotation Document */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="max-w-4xl mx-auto bg-white" id="quotation-document">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl text-[#EB216A] mb-2">AMAGRIYA GORDEN</h1>
                  <p className="text-sm text-gray-600">
                    Jl. Contoh Alamat No. 123<br />
                    Jakarta Selatan, DKI Jakarta 12345<br />
                    Telp: (021) 1234-5678 | WA: 0812-3456-7890<br />
                    Email: info@amagriyagorden.com
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">No. Surat</p>
                  <p className="text-base text-gray-900">{documentNumber}</p>
                  <p className="text-sm text-gray-600 mt-2">Tanggal</p>
                  <p className="text-base text-gray-900">{createdAt}</p>
                </div>
              </div>

              <div className="border-t-4 border-[#EB216A] my-6"></div>

              <div className="text-center mb-6">
                <h2 className="text-xl text-gray-900">SURAT PENAWARAN</h2>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Kepada Yth,</p>
              <p className="text-base text-gray-900">{customerName}</p>
              <p className="text-sm text-gray-600">{customerPhone}</p>
              <p className="text-sm text-gray-600">{customerEmail}</p>
              {customerAddress && (
                <p className="text-sm text-gray-600 mt-1 max-w-md">{customerAddress}</p>
              )}
              {referralCode && (
                <p className="text-sm text-purple-600 mt-2">Kode Referral: {referralCode}</p>
              )}
            </div>

            {/* Intro Text */}
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Dengan hormat,<br />
                Bersama ini kami mengajukan penawaran harga untuk pembuatan gorden sebagai berikut:
              </p>
            </div>

            {/* Items per Window - only show if we have window data */}
            {quotationData?.windows && quotationData.windows.length > 0 ? (
              <div className="space-y-6 mb-6">
                {/* Calculator Type Header */}
                {quotationData.calculatorType && (
                  <div className="bg-[#EB216A]/10 border border-[#EB216A]/30 rounded-lg px-4 py-3">
                    <p className="text-sm font-medium text-[#EB216A]">
                      Jenis Kalkulator: {quotationData.calculatorType}
                    </p>
                  </div>
                )}

                {quotationData.windows.map((window: any, windowIndex: number) => (
                  <div key={window.id || windowIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Window Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{window.title}</p>
                          <p className="text-xs text-gray-600">{window.size} — Qty: {window.quantity || 1}x</p>
                          {window.fabricType && (
                            <p className="text-xs text-[#EB216A] mt-1">Kain: {window.fabricType}</p>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Rp{(window.subtotal || calculateWindowTotal(window)).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Items Table - use window.items or quotationData.items filtered by window */}
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-600">No</th>
                          <th className="px-4 py-2 text-left text-xs text-gray-600">Nama Item</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-600">Harga</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-600">Qty</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-600">Satuan</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-600">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {/* Get items for this window from quotationData.items if available */}
                        {(quotationData.items?.filter((item: any) => item.id?.startsWith(`${windowIndex + 1}-`)) || window.items || []).map((item: any, itemIndex: number) => (
                          <tr key={item.id || itemIndex}>
                            <td className="px-4 py-2 text-gray-600">{itemIndex + 1}</td>
                            <td className="px-4 py-2">
                              <p className="text-gray-900">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500">{item.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900">
                              Rp{(item.price || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-2 text-center text-gray-900">{item.quantity || 1}</td>
                            <td className="px-4 py-2 text-center text-gray-500">{item.unit || '-'}</td>
                            <td className="px-4 py-2 text-right text-gray-900">
                              Rp{(item.subtotal || calculateItemTotal(item)).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Total: Rp{parseFloat(totalAmount).toLocaleString('id-ID')}</p>
              </div>
            )}

            {/* Summary */}
            <div className="border-t-2 border-gray-300 pt-4 mb-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">Rp{calculateSubtotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon ({discount}%):</span>
                    <span className="text-red-600">- Rp{calculateDiscount().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="text-base text-gray-900">Total Biaya:</span>
                    <span className="text-lg text-[#EB216A]">
                      Rp{calculateGrandTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            {quotationData?.paymentTerms && (
              <div className="mb-6">
                <h3 className="text-sm text-gray-900 mb-2">Informasi Pembayaran:</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {quotationData.paymentTerms}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {quotationData?.notes && (
              <div className="mb-6">
                <h3 className="text-sm text-gray-900 mb-2">Catatan:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {quotationData.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-start">
                <div className="text-sm text-gray-600">
                  <p>Hormat kami,</p>
                  <p className="mt-16">_________________</p>
                  <p className="text-gray-900">Amagriya Gorden</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Mengetahui,</p>
                  <p className="mt-16">_________________</p>
                  <p className="text-gray-900">{customerName}</p>
                </div>
              </div>
            </div>

            {/* Company Info Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>Amagriya Gorden - Solusi Terbaik untuk Keindahan Rumah Anda</p>
              <p className="mt-1">www.amagriya.com | Instagram: @amagriyagorden</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          #quotation-document {
            max-width: none;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
