import { AnimatePresence, motion } from 'motion/react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

const config = {
  success: { Icon: CheckCircle2, cls: 'bg-green-50 border-green-200', iconCls: 'text-green-500', textCls: 'text-green-800' },
  error:   { Icon: AlertCircle,  cls: 'bg-red-50 border-red-200',     iconCls: 'text-red-500',   textCls: 'text-red-800'   },
  warning: { Icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200', iconCls: 'text-amber-500', textCls: 'text-amber-800' },
  info:    { Icon: Info,         cls: 'bg-blue-50 border-blue-200',   iconCls: 'text-blue-500',  textCls: 'text-blue-800'  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" role="region" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map(toast => {
          const { Icon, cls, iconCls, textCls } = config[toast.type];
          return (
            <motion.div
              key={toast.id}
              role="alert"
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl max-w-sm w-full',
                cls
              )}
            >
              <Icon size={18} className={cn('shrink-0 mt-0.5', iconCls)} aria-hidden />
              <p className={cn('text-sm font-medium flex-1 leading-relaxed', textCls)}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X size={14} className={textCls} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
