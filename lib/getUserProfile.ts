import { supabase } from './supabaseClient';

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  billing_address?: string;
  country?: string;
  phone?: string;
  profile_picture_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches a user's profile from the Supabase profiles table
 * @param userId - The UUID of the user to fetch
 * @returns The user profile or null if not found
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, display_name, billing_address, country, phone, profile_picture_url, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching profile:', err);
    return null;
  }
};

/**
 * Updates a user's profile in the Supabase profiles table
 * @param profile - The profile data to update
 * @returns Success status
 */
export const updateUserProfile = async (profile: UserProfile): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        display_name: profile.display_name,
        billing_address: profile.billing_address,
        country: profile.country,
        phone: profile.phone,
        profile_picture_url: profile.profile_picture_url,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id' 
      });

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error updating profile:', err);
    return false;
  }
}; 