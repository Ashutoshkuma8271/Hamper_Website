import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile from Supabase:', error.message);
        return null;
      }
      return (data as Profile) || null;
    } catch (err) {
      console.warn('Profile fetch exception:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      
      if (currentSession?.user?.id) {
        setSession(currentSession);
        const userProf = await fetchProfile(currentSession.user.id);
        
        if (!mounted) return;
        
        if (userProf) {
          setProfile(userProf);
        } else {
          // If the profile was deleted from DB, immediately clear orphaned session
          // so the user can register / sign up first cleanly!
          try {
            await supabase?.auth.signOut();
          } catch (e) {
            // ignore
          }
          setSession(null);
          setProfile(null);
        }
      } else {
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    });


    // 2. Auth State Change Listener
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user?.id) {
        const userProf = await fetchProfile(sess.user.id);
        if (userProf) {
          setProfile(userProf);
        } else {
          // No profile found - user record deleted from table
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // 3. Realtime subscription to profiles table for live updates / role changes / account deletions
  useEffect(() => {
    if (!supabase || !session?.user?.id) return;

    const channel = supabase
      .channel(`profile-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            // Profile deleted from database in real-time!
            // Cleanly sign out so user can sign up again
            await supabase?.auth.signOut();
            setSession(null);
            setProfile(null);
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const refreshProfile = async () => {
    if (!session?.user?.id || !supabase) return;
    const p = await fetchProfile(session.user.id);
    if (p) {
      setProfile(p);
    } else {
      await supabase?.auth.signOut();
      setSession(null);
      setProfile(null);
    }
  };


  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      isVendor: profile?.role === 'vendor',
      signOut: async () => {
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.error('Sign out error:', e);
          }
        }
        // Clear any stored intent or cached tokens
        try {
          sessionStorage.removeItem('a_s_hamper_account_intent');
          sessionStorage.removeItem('a_s_hamper_auth_error');
        } catch (e) {
          // ignore
        }
        setSession(null);
        setProfile(null);
      },
      refreshProfile,
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

