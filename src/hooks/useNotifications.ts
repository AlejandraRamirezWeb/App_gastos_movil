import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NotificationItem {
    uniqueId: string;
    id: string;
    type: 'contact_request' | 'expense_request';
    senderName: string;
    details: string;
    amount?: number;
    date: string;
}

export function useNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            // 1. SOLICITUDES DE AMISTAD (Sin Join, solo IDs)
            const { data: contactRequests, error: contactError } = await supabase
                .from('contacts')
                .select('*')
                .eq('friend_id', userId)
                .eq('status', 'pending');

            if (contactError) console.error('Error fetching contacts:', contactError);

            // 2. GASTOS COMPARTIDOS (Sin Join, solo IDs)
            const { data: expenseRequests, error: expenseError } = await supabase
                .from('expenses')
                .select('*')
                .eq('shared_with_user_id', userId)
                .eq('status', 'pending');

            if (expenseError) console.error('Error fetching expenses:', expenseError);

            // 3. Obtener Nombres Manualmente (Para evitar errores de Foreign Key)
            const senderIds = new Set<string>();
            contactRequests?.forEach((c: any) => senderIds.add(c.user_id));
            expenseRequests?.forEach((e: any) => senderIds.add(e.user_id));

            const namesMap: Record<string, string> = {};

            if (senderIds.size > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', Array.from(senderIds));

                profiles?.forEach((p: any) => {
                    namesMap[p.id] = p.full_name || p.email || 'Usuario Desconocido';
                });
            }

            // 4. Armar la lista final
            const formattedContacts = (contactRequests || []).map((c: any) => ({
                uniqueId: `contact-${c.id}`,
                id: c.id,
                type: 'contact_request' as const,
                senderName: namesMap[c.user_id] || 'Alguien',
                details: 'Quiere añadirte a sus contactos',
                date: c.created_at
            }));

            const formattedExpenses = (expenseRequests || []).map((e: any) => ({
                uniqueId: `expense-${e.id}`,
                id: e.id,
                type: 'expense_request' as const,
                senderName: namesMap[e.user_id] || 'Tu contacto',
                details: e.description || 'Gasto compartido',
                amount: e.amount,
                date: e.created_at
            }));

            setNotifications([...formattedContacts, ...formattedExpenses].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            ));

        } catch (err) {
            console.error('Error general notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIONES (Sin cambios, funcionan bien) ---

    const handleExpenseRequest = async (expenseId: string, accept: boolean) => {
        await supabase
            .from('expenses')
            .update({ status: accept ? 'approved' : 'rejected' })
            .eq('id', expenseId);
        fetchNotifications();
    };

    const handleContactRequest = async (contactId: string, accept: boolean) => {
        if (accept) {
            // 1. Marcar como aceptada la solicitud original
            const { data: req } = await supabase.from('contacts').select('*').eq('id', contactId).single();

            if (req) {
                await supabase.from('contacts').update({ status: 'accepted' }).eq('id', contactId);

                // 2. Verificar si ya existe el contacto inverso para no duplicar
                const { data: existing } = await supabase
                    .from('contacts')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('friend_id', req.user_id)
                    .single();

                // 3. Si no existe, crearlo (Para que tú también lo tengas en tu lista)
                if (!existing) {
                    await supabase.from('contacts').insert({
                        user_id: userId,
                        friend_id: req.user_id,
                        name: req.name || 'Nuevo Amigo', // Nombre temporal, luego lo editas
                        status: 'accepted',
                        is_sender: false
                    });
                }
            }
        } else {
            await supabase.from('contacts').delete().eq('id', contactId);
        }
        fetchNotifications();
    };

    useEffect(() => {
        fetchNotifications();

        // Suscripción Realtime Simple
        const sub = supabase.channel('notifications_robust')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, fetchNotifications)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchNotifications)
            .subscribe();

        return () => { sub.unsubscribe(); };
    }, [userId]);

    return { notifications, unreadCount: notifications.length, refresh: fetchNotifications, handleContactRequest, handleExpenseRequest };
}