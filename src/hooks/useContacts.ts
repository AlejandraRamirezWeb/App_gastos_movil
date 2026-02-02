import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Contact {
    id: string;
    name: string;
    user_id: string;
}

export function useContacts(userId: string | undefined) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchContacts = async () => {
            console.log('useContacts: Fetching contacts for userId:', userId);
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('user_id', userId)
                .order('name');

            if (error) {
                console.error('useContacts: Error fetching contacts:', error);
            } else {
                console.log('useContacts: Fetched contacts successfully, count:', data?.length || 0);
                setContacts(data || []);
            }
            setLoading(false);
        };

        fetchContacts();

        // Subscribe to changes
        const subscription = supabase
            .channel('contacts_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'contacts',
                filter: `user_id=eq.${userId}`
            }, fetchContacts)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    const addContact = async (name: string) => {
        console.log('useContacts: addContact called with', { name, userId });
        if (!userId) {
            console.error('useContacts: No userId found, cannot add contact');
            return;
        }

        const { error } = await supabase
            .from('contacts')
            .insert([{ name, user_id: userId }]);

        if (error) {
            console.error('useContacts: Error adding contact to Supabase:', error);
            alert('Error al añadir contacto: ' + error.message);
        } else {
            console.log('useContacts: Contact added successfully');

            // Re-fetch to update list
            const { data } = await supabase
                .from('contacts')
                .select('*')
                .eq('user_id', userId)
                .order('name');
            setContacts(data || []);
        }
    };

    const deleteContact = async (id: string) => {
        console.log('useContacts: deleteContact called for id:', id);

        // Optimistic Update
        setContacts(prev => prev.filter(c => c.id !== id));

        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('useContacts: Error deleting contact from Supabase:', error);
            alert('❌ No se pudo eliminar de la nube:\n' + error.message);
            // Restore state on failure
            const { data } = await supabase
                .from('contacts')
                .select('*')
                .eq('user_id', userId)
                .order('name');
            setContacts(data || []);
        } else {
            console.log('useContacts: Contact deleted successfully');
        }
    };

    return {
        contacts,
        loading,
        addContact,
        deleteContact
    };
}
