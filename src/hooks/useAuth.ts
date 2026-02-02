import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false); // Set loading to false as soon as we have a session/user

            // Sync profile in background if user exists
            if (currentUser) {
                supabase.from('profiles').upsert({
                    id: currentUser.id,
                    email: currentUser.email
                }).then(({ error }) => {
                    if (error) console.error('useAuth: background profile sync error:', error);
                    else console.log('useAuth: background profile sync success');
                });
            }
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                // Sync profile in background
                supabase.from('profiles').upsert({
                    id: currentUser.id,
                    email: currentUser.email
                });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return {
        user,
        loading,
        signOut: () => supabase.auth.signOut(),
    };
}
