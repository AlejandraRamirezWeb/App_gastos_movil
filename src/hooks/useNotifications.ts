import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    message: string;
    type: string;
    read: boolean;
    created_at: string;
}

export function useNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notifications:', error);
            } else {
                setNotifications(data || []);
                setUnreadCount(data?.filter(n => !n.read).length || 0);
            }
        };

        fetchNotifications();

        const subscription = supabase
            .channel('notifications_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, fetchNotifications)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) console.error('Error marking notification as read:', error);
    };

    return {
        notifications,
        unreadCount,
        markAsRead
    };
}
