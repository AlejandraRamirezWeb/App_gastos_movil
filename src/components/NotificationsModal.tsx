import { X, Bell, CheckCircle2 } from 'lucide-react';
import type { Notification } from '../hooks/useNotifications';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationsModalProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkRead: (id: string) => void;
}

export function NotificationsModal({ notifications, onClose, onMarkRead }: NotificationsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-bold text-slate-900">Notificaciones</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {notifications.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No tienes notificaciones</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div
                                key={n.id}
                                className={`p-4 rounded-2xl border transition-all ${n.read
                                        ? 'bg-slate-50 border-slate-100 opacity-75'
                                        : 'bg-white border-primary-100 shadow-sm'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="space-y-1">
                                        <p className={`text-sm ${n.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {format(parseISO(n.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <button
                                            onClick={() => onMarkRead(n.id)}
                                            className="p-1 hover:text-green-600 transition-colors"
                                            title="Marcar como leída"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
