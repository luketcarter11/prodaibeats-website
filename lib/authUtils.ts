import { supabase } from './supabaseClient';

/**
 * Sign up a new user with email, password and profile data
 */
export const signUp = async (email: string, password: string, userData: { full_name: string }) => {
  try {
    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) throw error;
    
    console.log("Signup successful, user created:", data.user?.id);
    return { success: true, data };
  } catch (error: any) {
    console.error("Signup error:", error.message);
    return { 
      success: false, 
      error: error.message || "An unexpected error occurred during signup" 
    };
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (email: string, password: string) => {
  try {
    // Sign in the user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    console.log("Login successful");
    return { success: true, data };
  } catch (error: any) {
    console.error("Login error:", error.message);
    return { 
      success: false, 
      error: error.message || "Invalid login credentials" 
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error("Logout error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get the current user session
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    return { 
      success: true, 
      session: data.session, 
      user: data.session?.user 
    };
  } catch (error: any) {
    console.error("Session retrieval error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get the user's profile data
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return { success: true, profile: data };
  } catch (error: any) {
    console.error("Profile retrieval error:", error.message);
    return { success: false, error: error.message };
  }
}; 