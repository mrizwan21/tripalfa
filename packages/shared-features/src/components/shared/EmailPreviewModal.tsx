import { useState } from 'react';
import { Mail, X, Send, CheckCircle2, Loader2, User, FileText, Globe } from 'lucide-react';

interface EmailPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSend: (email: string) => void;
  readonly documentType: string;
  readonly referenceNo: string;
  readonly recipientName: string;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  onSend,
  documentType,
  referenceNo,
  recipientName,
}: EmailPreviewModalProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!email?.includes('@')) return;

    setIsSending(true);
    // Simulate SMTP dispatch
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSending(false);
    setIsSuccess(true);
    onSend(email);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale relative border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-pure-black/20 hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-apple-blue shadow-sm">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-pure-black tracking-tight">Dispatch Document</h2>
              <p className="text-[10px] font-semibold text-pure-black/30 mt-1">Universal SMTP Branch: Hub Ready</p>
            </div>
          </div>

          {isSuccess === false ? (
            <>
              <div className="space-y-4">
                <div className="p-6 bg-light-gray rounded-xl border border-navy/5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pure-black shadow-sm">
                      <User size={18} />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="email-input" className="text-[9px] font-semibold text-pure-black/30 block mb-1">
                        Recipient Branch
                      </label>
                      <input
                        id="email-input"
                        type="email"
                        placeholder="Enter email address..."
                        className="w-full bg-transparent text-sm font-bold text-pure-black outline-none placeholder:text-pure-black/20"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                    <Globe size={120} />
                  </div>
                  <div className="relative space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 bg-apple-blue/20 text-apple-blue rounded-lg text-[8px] font-semibold border border-apple-blue/20">
                        Email Preview
                      </div>
                      <FileText size={18} className="text-white/20" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/40 mb-1">Subject</p>
                      <p className="text-sm font-bold text-white">
                        {documentType} for Booking {referenceNo} - Travel Document
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/40 mb-1">Greeting</p>
                      <p className="text-sm font-bold text-white">
                        Dear {recipientName}, please find your travel documents attached...
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-white/20">Attachment Size: 1.2 MB</span>
                      <span className="text-[10px] font-semibold text-apple-blue">Signed & Secure</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={isSending || !email?.includes('@')}
                className="w-full py-5 bg-black text-apple-blue rounded-xl text-xs font-semibold tracking-tight shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isSending ? 'Transmitting Branch...' : 'Send Travel Document'}
              </button>
            </>
          ) : (
            <div className="py-12 space-y-6 flex flex-col items-center animate-scale text-center">
              <div className="w-24 h-24 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-[0_20px_50px_rgba(34,197,94,0.3)]">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-pure-black tracking-tight">Dispatch Successful</h3>
                <p className="text-[10px] font-semibold text-pure-black/30">Recipient: {email}</p>
              </div>
              <p className="text-xs font-medium text-pure-black/40 max-w-[250px] leading-relaxed">
                The document branch has been successfully synchronized with the remote mail server.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}