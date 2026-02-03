import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'

const Toast = forwardRef((props, ref) => {
    const [toasts, setToasts] = useState([])

    useImperativeHandle(ref, () => ({
        show: (message, type = 'info', duration = 3000) => {
            const id = Date.now()
            setToasts((prev) => [...prev, { id, message, type, duration }])

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id)
                }, duration)
            }
        }
    }))

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        layout
                        className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-2xl border flex items-start gap-3 backdrop-blur-md ${toast.type === 'error'
                                ? 'bg-red-900/90 border-red-500 text-white'
                                : toast.type === 'success'
                                    ? 'bg-green-900/90 border-green-500 text-white'
                                    : 'bg-poker-darker/90 border-poker-gold text-white'
                            }`}
                    >
                        <div className={`mt-1 text-lg ${toast.type === 'error' ? 'text-red-400' : toast.type === 'success' ? 'text-green-400' : 'text-poker-gold'
                            }`}>
                            {toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✅' : 'ℹ️'}
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
})

Toast.displayName = 'Toast'

export default Toast
