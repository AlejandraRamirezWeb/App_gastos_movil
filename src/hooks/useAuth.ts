import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                // Sync profile for discovery
                await supabase.from('profiles').upsert({
                    id: currentUser.id,
                    email: currentUser.email
                });
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return {
        user,
        loading,
        signOut: () => supabase.auth.signOut(),
    };
}
