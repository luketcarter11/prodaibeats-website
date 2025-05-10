'use client'

import { useEffect, useState } from 'react'
import { supabase, ensureProfilesTable } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import OrdersList from '../../components/OrdersList'

interface UserProfile {
  full_name: string
  display_name: string
  email: string
  billing_address: string
  country: string
  phone: string
  profile_picture_url?: string
}

interface License {
  id: string
  beat_id: string
  beat_name: string
  license_type: 'Non-Exclusive' | 'Non-Exclusive Plus' | 'Exclusive' | 'Exclusive Plus' | 'Exclusive Pro'
  purchased_date: string
  expires?: string
  status: 'active' | 'expired' | 'pending'
  price: number
  download_url: string
  producer: string
  image_url: string
}

export default function AccountPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [userId, setUserId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [licenses, setLicenses] = useState<License[]>([])
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [expandedLicense, setExpandedLicense] = useState<string | null>(null)
  const router = useRouter()
  
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    display_name: '',
    email: '',
    billing_address: '',
    country: '',
    phone: '',
    profile_picture_url: ''
  })

  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Add browser detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log(`Running on ${isMobile ? 'mobile' : 'desktop'} browser`);
      
      // Apply different handling for desktop if needed
      if (!isMobile) {
        // Force a small delay for desktop browsers to ensure Supabase is fully initialized
        setTimeout(() => {
          const currentUser = supabase.auth.getUser();
          console.log('Desktop browser: checking auth state', currentUser);
        }, 500);
      }
    }
  }, []);

  // Immediately when the page loads, try to manually set the session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get all cookies
      const allCookies = document.cookie.split(';').map(c => c.trim());
      
      // Log all cookies to help debug
      console.log('All browser cookies:', allCookies);
      
      // Check specifically for Supabase auth cookie
      const hasAuthCookie = allCookies.some(c => c.startsWith('sb-'));
      console.log('Has Supabase auth cookie:', hasAuthCookie);
      
      if (hasAuthCookie) {
        console.log('Found auth cookie, forcing fetch of user data');
        getUser();
      } else {
        // Force a session refresh
        supabase.auth.refreshSession().then(({ data, error }) => {
          if (error) {
            console.error('Session refresh error:', error);
          } else {
            console.log('Session refreshed successfully:', !!data.session);
            
            if (data.session) {
              // Session is valid, trigger the getUser function
              getUser();
            } else {
              console.log('No valid session after refresh attempt');
              // Try signing in directly with token if available in local storage
              try {
                const localStorageAuth = localStorage.getItem('sb-auth-token');
                if (localStorageAuth) {
                  console.log('Found local storage token, attempting to restore session');
                  const parsedAuth = JSON.parse(localStorageAuth);
                  
                  if (parsedAuth?.access_token && parsedAuth?.refresh_token) {
                    supabase.auth.setSession({
                      access_token: parsedAuth.access_token,
                      refresh_token: parsedAuth.refresh_token
                    }).then(({ data, error }) => {
                      if (error) {
                        console.error('Error restoring session:', error);
                      } else {
                        console.log('Session restored successfully');
                        getUser();
                      }
                    });
                  }
                }
              } catch (err) {
                console.error('Error trying to restore session:', err);
              }
            }
          }
        });
      }
    }
  }, []);

  const handleRetryProfileLoad = () => {
    setRetryCount(prev => prev + 1);
    setLoadingError(null);
    setIsLoading(true);
    getUser();
  };

  const getUser = async () => {
    setIsLoading(true);
    console.log('Fetching user data...', retryCount > 0 ? `(Retry ${retryCount})` : '');
    
    try {
      // Try to directly retrieve the user first
      let userData = await supabase.auth.getUser();
      
      if (userData.error) {
        console.error('Error getting user:', userData.error);
        
        // If we can't get the user, try to refresh the session
        console.log('Attempting to refresh session...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          setLoadingError('Your session has expired. Please sign in again.');
          setIsLoading(false);
          return;
        }
        
        console.log('Session refreshed successfully, retrying user data fetch');
        // Try again with the refreshed session
        userData = await supabase.auth.getUser();
        
        if (userData.error || !userData.data.user) {
          console.error('User data fetch failed after refresh:', userData.error);
          setLoadingError('Unable to retrieve your account information. Please sign in again.');
          setIsLoading(false);
          return;
        }
      }
      
      if (!userData.data?.user) {
        console.log('No user data found');
        setLoadingError('Unable to retrieve user data. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      const user = userData.data.user;
      console.log('User authenticated successfully:', user.id);
      setUserId(user.id);
      setUserEmail(user.email || null);
      
      if (user.email) {
        setProfile(prev => ({ ...prev, email: user.email || '' }));
      }
      
      try {
        // Ensure profiles table exists before trying to access it
        console.log('Ensuring profiles table exists...');
        const { success: tableExists, error: tableError } = await ensureProfilesTable();
        
        console.log('Profile table check result:', { 
          success: tableExists, 
          error: tableError?.message 
        });
        
        if (!tableExists) {
          console.warn('Could not ensure profiles table exists:', tableError);
          // Continue anyway to try direct profile access
        }
        
        // Now try to get the user's profile
        console.log('Fetching user profile for ID:', user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('Profile fetch result:', {
          hasProfile: !!profileData,
          profileError: profileError?.message,
          profileErrorCode: profileError?.code,
          profileErrorDetails: profileError?.details,
          userId: user.id,
          profileData: profileData ? {
            id: profileData.id,
            hasFullName: !!profileData.full_name,
            hasDisplayName: !!profileData.display_name,
            hasEmail: !!profileData.email,
            hasBillingAddress: !!profileData.billing_address,
            hasCountry: !!profileData.country,
            hasPhone: !!profileData.phone,
            hasProfilePicture: !!profileData.profile_picture_url
          } : null
        });
        
        if (profileData && !profileError) {
          console.log('Profile data retrieved successfully');
          setProfile({
            full_name: profileData.full_name || '',
            display_name: profileData.display_name || '',
            email: profileData.email || user.email || '',
            billing_address: profileData.billing_address || '',
            country: profileData.country || '',
            phone: profileData.phone || '',
            profile_picture_url: profileData.profile_picture_url || ''
          });
        } else if (profileError) {
          console.error('Profile fetch error details:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint
          });
          
          if (profileError.code === 'PGRST116') {
            console.log('New user, no profile record found - creating profile');
            
            try {
              // Try using the API route for creating a profile
              console.log('Creating profile via API');
              const response = await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  email: user.email
                }),
              });
              
              const result = await response.json();
              console.log('API profile creation result:', result);
              
              if (result.success && result.profile) {
                console.log('Profile created successfully via API');
                // Set the profile from the API response
                setProfile({
                  full_name: result.profile.full_name || '',
                  display_name: result.profile.display_name || '',
                  email: result.profile.email || user.email || '',
                  billing_address: result.profile.billing_address || '',
                  country: result.profile.country || '',
                  phone: result.profile.phone || '',
                  profile_picture_url: result.profile.profile_picture_url || ''
                });
              } else {
                console.error('API profile creation failed:', result.error);
                
                // Fall back to direct database access if API fails
                console.log('Falling back to direct profile creation');
                const { data: createProfileData, error: createProfileError } = await supabase
                  .from('profiles')
                  .insert({
                    id: user.id,
                    full_name: '',
                    display_name: '',
                    email: user.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .select();
                
                console.log('Direct profile creation result:', {
                  success: !createProfileError,
                  data: createProfileData,
                  error: createProfileError?.message
                });
                
                if (createProfileError) {
                  // Fall back to updating user metadata
                  console.log('Could not create profile, updating user metadata as fallback');
                  await supabase.auth.updateUser({
                    data: {
                      profile_fallback: true,
                      email: user.email
                    }
                  });
                  setLoadingError('Failed to create profile. Please try again or contact support.');
                } else {
                  console.log('Profile created successfully');
                  // Try fetching the profile again
                  const { data: newProfileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                    
                  if (newProfileData) {
                    setProfile({
                      full_name: newProfileData.full_name || '',
                      display_name: newProfileData.display_name || '',
                      email: newProfileData.email || user.email || '',
                      billing_address: newProfileData.billing_address || '',
                      country: newProfileData.country || '',
                      phone: newProfileData.phone || '',
                      profile_picture_url: newProfileData.profile_picture_url || ''
                    });
                  }
                }
              }
            } catch (apiError) {
              console.error('Error using API route to create profile:', apiError);
              setLoadingError('Failed to create profile. Please try again or contact support.');
            }
          } else {
            console.error('Error fetching profile:', profileError);
          }
        }
        
        // Initialize empty licenses array - real licenses will be fetched from the database later
        setLicenses([]);
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error in profile setup:', err);
        setLoadingError('Error loading profile data. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error in account page initialization:', err);
      setLoadingError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Add a session listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, hasSession: !!session });
      if (event === 'SIGNED_IN') {
        console.log('SIGNED_IN event detected, fetching user data');
        getUser();
      } else if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT event detected, redirecting to homepage');
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Replace the useEffect that does the immediate auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Running immediate auth check...');
        // Force a refresh of the auth state
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        console.log('Auth check result:', {
          hasSession: !!session,
          error: error?.message,
          userId: session?.user?.id,
          expiresAt: session?.expires_at,
          nowTime: Math.floor(Date.now() / 1000)
        });
        
        if (error) {
          console.error('Session refresh error:', error);
          setLoadingError(`Session error: ${error.message}`);
          setIsLoading(false);
          return;
        }
        
        if (!session) {
          console.log('No active session after refresh');
          
          // Check if we have cookie or token
          const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
          console.log('Has auth cookie:', hasCookie);
          
          if (hasCookie) {
            console.log('Cookie exists but session refresh failed - trying getSession');
            // Try one more time with getSession
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              console.log('Got session via getSession, proceeding with user data fetch');
              getUser();
              return;
            }
          }
          
          console.log('No valid session found, redirecting to sign in...');
          router.push('/auth/signin');
          return;
        }
        
        console.log('Valid session found, user ID:', session.user.id);
        // Valid session, so fetch user data
        getUser();
      } catch (err) {
        console.error('Unexpected error in auth check:', err);
        setLoadingError('An unexpected error occurred checking your session. Please try signing in again.');
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      console.error("Cannot save profile: No user ID available");
      setSaveStatus('error')
      return
    }
    
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      console.log("Attempting profile update for user:", userId)
      
      // IMPORTANT: Always use the auth.uid() from Supabase Auth
      // This ensures the ID matches what RLS policies expect
      
      // Step 1: First try direct upsert to profiles table
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId, // Always use this ID from auth.getUser()
          full_name: profile.full_name,
          display_name: profile.display_name,
          email: profile.email,
          billing_address: profile.billing_address,
          country: profile.country,
          phone: profile.phone,
          profile_picture_url: profile.profile_picture_url,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id'
        })
      
      // If there's an error with the upsert, try a different approach
      if (upsertError) {
        console.error("Upsert error:", upsertError)
        
        // Step 2: If upsert fails, try checking if the profiles table exists
        const { error: tableCheckError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
        
        if (tableCheckError) {
          console.warn("Profiles table may not exist, trying to create it through RPC")
          
          // Step 3: Try using a custom function to create the table if it doesn't exist
          const { data: rpcData, error: rpcError } = await supabase.rpc('create_profiles_table')
          
          if (rpcError) {
            console.error("Failed to create profiles table via RPC:", rpcError)
            
            // Step 4: Final fallback - update user metadata at minimum
            const { error: authUpdateError } = await supabase.auth.updateUser({
              data: {
                full_name: profile.full_name,
                display_name: profile.display_name,
                country: profile.country,
                profile_picture_url: profile.profile_picture_url
              }
            })
            
            if (authUpdateError) {
              console.error("Auth update error:", authUpdateError)
              throw new Error("Unable to save profile after multiple attempts")
            } else {
              console.log("Profile metadata saved via auth.updateUser")
              setSaveStatus('success')
              setIsEditMode(false)
            }
          } else {
            // Table created, now try the insert again
            const { error: secondInsertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: profile.full_name,
                display_name: profile.display_name,
                billing_address: profile.billing_address,
                country: profile.country,
                phone: profile.phone,
                profile_picture_url: profile.profile_picture_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            if (secondInsertError) {
              console.error("Second insert attempt failed:", secondInsertError)
              throw new Error("Failed to save profile after creating table")
            } else {
              console.log("Profile created successfully after table creation")
              setSaveStatus('success')
              setIsEditMode(false)
            }
          }
        } else {
          // Table exists but upsert failed - try the insert/update separately
          
          // Step 5: Try a select first to determine if we need insert or update
          const { data: existingProfile, error: selectError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single()
          
          if (existingProfile) {
            // Profile exists, do an update
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                full_name: profile.full_name,
                display_name: profile.display_name,
                billing_address: profile.billing_address,
                country: profile.country,
                phone: profile.phone,
                profile_picture_url: profile.profile_picture_url,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
            
            if (updateError) {
              console.error("Update error:", updateError)
              throw new Error("Failed to update profile")
            } else {
              console.log("Profile updated successfully")
              setSaveStatus('success')
              setIsEditMode(false)
            }
          } else {
            // Profile doesn't exist, do an insert
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: profile.full_name,
                display_name: profile.display_name,
                billing_address: profile.billing_address,
                country: profile.country,
                phone: profile.phone,
                profile_picture_url: profile.profile_picture_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            if (insertError) {
              console.error("Insert error:", insertError)
              throw new Error("Failed to create profile")
            } else {
              console.log("Profile created successfully")
              setSaveStatus('success')
              setIsEditMode(false)
            }
          }
        }
      } else {
        // Original upsert worked
        console.log("Profile saved successfully via upsert")
        setSaveStatus('success')
        setIsEditMode(false)
      }
    } catch (error) {
      console.error("Unexpected error saving profile:", error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
      
      // Reset status after delay
      if (saveStatus === 'success') {
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev)
    setSaveStatus('idle')
  }

  const cancelEdit = () => {
    // Reload the profile data to discard changes
    if (userId) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setProfile({
              full_name: data.full_name || '',
              display_name: data.display_name || '',
              email: profile.email,
              billing_address: data.billing_address || '',
              country: data.country || '',
              phone: data.phone || '',
              profile_picture_url: data.profile_picture_url || ''
            })
          }
        })
    }
    setIsEditMode(false)
    setSaveStatus('idle')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDownload = (licenseId: string, url: string) => {
    setIsDownloading(licenseId)
    
    // Simulate download delay
    setTimeout(() => {
      // In a real application, this would trigger an actual file download
      console.log(`Downloading license ${licenseId} from ${url}`)
      setIsDownloading(null)
      
      // For demo purposes - this would be a real download in production
      window.open(url, '_blank')
    }, 1500)
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getLicenseStatusStyle = (status: License['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400 border-green-700'
      case 'expired':
        return 'bg-red-900/30 text-red-400 border-red-700'
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700'
    }
  }

  const countries = [
    { value: '', label: 'Select a country' },
    { value: 'AF', label: 'Afghanistan' },
    { value: 'AL', label: 'Albania' },
    { value: 'DZ', label: 'Algeria' },
    { value: 'AD', label: 'Andorra' },
    { value: 'AO', label: 'Angola' },
    { value: 'AI', label: 'Anguilla' },
    { value: 'AG', label: 'Antigua & Barbuda' },
    { value: 'AR', label: 'Argentina' },
    { value: 'AM', label: 'Armenia' },
    { value: 'AW', label: 'Aruba' },
    { value: 'AU', label: 'Australia' },
    { value: 'AT', label: 'Austria' },
    { value: 'AZ', label: 'Azerbaijan' },
    { value: 'BS', label: 'Bahamas' },
    { value: 'BH', label: 'Bahrain' },
    { value: 'BD', label: 'Bangladesh' },
    { value: 'BB', label: 'Barbados' },
    { value: 'BY', label: 'Belarus' },
    { value: 'BE', label: 'Belgium' },
    { value: 'BZ', label: 'Belize' },
    { value: 'BJ', label: 'Benin' },
    { value: 'BM', label: 'Bermuda' },
    { value: 'BT', label: 'Bhutan' },
    { value: 'BO', label: 'Bolivia' },
    { value: 'BA', label: 'Bosnia & Herzegovina' },
    { value: 'BW', label: 'Botswana' },
    { value: 'BR', label: 'Brazil' },
    { value: 'BN', label: 'Brunei Darussalam' },
    { value: 'BG', label: 'Bulgaria' },
    { value: 'BF', label: 'Burkina Faso' },
    { value: 'BI', label: 'Burundi' },
    { value: 'KH', label: 'Cambodia' },
    { value: 'CM', label: 'Cameroon' },
    { value: 'CA', label: 'Canada' },
    { value: 'CV', label: 'Cape Verde' },
    { value: 'KY', label: 'Cayman Islands' },
    { value: 'CF', label: 'Central African Republic' },
    { value: 'TD', label: 'Chad' },
    { value: 'CL', label: 'Chile' },
    { value: 'CN', label: 'China' },
    { value: 'CO', label: 'Colombia' },
    { value: 'KM', label: 'Comoros' },
    { value: 'CG', label: 'Congo' },
    { value: 'CD', label: 'Congo, Democratic Republic' },
    { value: 'CR', label: 'Costa Rica' },
    { value: 'HR', label: 'Croatia' },
    { value: 'CU', label: 'Cuba' },
    { value: 'CY', label: 'Cyprus' },
    { value: 'CZ', label: 'Czech Republic' },
    { value: 'DK', label: 'Denmark' },
    { value: 'DJ', label: 'Djibouti' },
    { value: 'DM', label: 'Dominica' },
    { value: 'DO', label: 'Dominican Republic' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'EG', label: 'Egypt' },
    { value: 'SV', label: 'El Salvador' },
    { value: 'GQ', label: 'Equatorial Guinea' },
    { value: 'ER', label: 'Eritrea' },
    { value: 'EE', label: 'Estonia' },
    { value: 'ET', label: 'Ethiopia' },
    { value: 'FK', label: 'Falkland Islands' },
    { value: 'FO', label: 'Faroe Islands' },
    { value: 'FJ', label: 'Fiji' },
    { value: 'FI', label: 'Finland' },
    { value: 'FR', label: 'France' },
    { value: 'GF', label: 'French Guiana' },
    { value: 'PF', label: 'French Polynesia' },
    { value: 'GA', label: 'Gabon' },
    { value: 'GM', label: 'Gambia' },
    { value: 'GE', label: 'Georgia' },
    { value: 'DE', label: 'Germany' },
    { value: 'GH', label: 'Ghana' },
    { value: 'GI', label: 'Gibraltar' },
    { value: 'GR', label: 'Greece' },
    { value: 'GL', label: 'Greenland' },
    { value: 'GD', label: 'Grenada' },
    { value: 'GP', label: 'Guadeloupe' },
    { value: 'GU', label: 'Guam' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'GN', label: 'Guinea' },
    { value: 'GW', label: 'Guinea-Bissau' },
    { value: 'GY', label: 'Guyana' },
    { value: 'HT', label: 'Haiti' },
    { value: 'VA', label: 'Holy See (Vatican)' },
    { value: 'HN', label: 'Honduras' },
    { value: 'HK', label: 'Hong Kong' },
    { value: 'HU', label: 'Hungary' },
    { value: 'IS', label: 'Iceland' },
    { value: 'IN', label: 'India' },
    { value: 'ID', label: 'Indonesia' },
    { value: 'IR', label: 'Iran' },
    { value: 'IQ', label: 'Iraq' },
    { value: 'IE', label: 'Ireland' },
    { value: 'IL', label: 'Israel' },
    { value: 'IT', label: 'Italy' },
    { value: 'CI', label: 'Ivory Coast' },
    { value: 'JM', label: 'Jamaica' },
    { value: 'JP', label: 'Japan' },
    { value: 'JO', label: 'Jordan' },
    { value: 'KZ', label: 'Kazakhstan' },
    { value: 'KE', label: 'Kenya' },
    { value: 'KI', label: 'Kiribati' },
    { value: 'KP', label: 'Korea, North' },
    { value: 'KR', label: 'Korea, South' },
    { value: 'KW', label: 'Kuwait' },
    { value: 'KG', label: 'Kyrgyzstan' },
    { value: 'LA', label: 'Laos' },
    { value: 'LV', label: 'Latvia' },
    { value: 'LB', label: 'Lebanon' },
    { value: 'LS', label: 'Lesotho' },
    { value: 'LR', label: 'Liberia' },
    { value: 'LY', label: 'Libya' },
    { value: 'LI', label: 'Liechtenstein' },
    { value: 'LT', label: 'Lithuania' },
    { value: 'LU', label: 'Luxembourg' },
    { value: 'MO', label: 'Macao' },
    { value: 'MK', label: 'Macedonia' },
    { value: 'MG', label: 'Madagascar' },
    { value: 'MW', label: 'Malawi' },
    { value: 'MY', label: 'Malaysia' },
    { value: 'MV', label: 'Maldives' },
    { value: 'ML', label: 'Mali' },
    { value: 'MT', label: 'Malta' },
    { value: 'MH', label: 'Marshall Islands' },
    { value: 'MQ', label: 'Martinique' },
    { value: 'MR', label: 'Mauritania' },
    { value: 'MU', label: 'Mauritius' },
    { value: 'YT', label: 'Mayotte' },
    { value: 'MX', label: 'Mexico' },
    { value: 'FM', label: 'Micronesia' },
    { value: 'MD', label: 'Moldova' },
    { value: 'MC', label: 'Monaco' },
    { value: 'MN', label: 'Mongolia' },
    { value: 'ME', label: 'Montenegro' },
    { value: 'MS', label: 'Montserrat' },
    { value: 'MA', label: 'Morocco' },
    { value: 'MZ', label: 'Mozambique' },
    { value: 'MM', label: 'Myanmar' },
    { value: 'NA', label: 'Namibia' },
    { value: 'NR', label: 'Nauru' },
    { value: 'NP', label: 'Nepal' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'NC', label: 'New Caledonia' },
    { value: 'NZ', label: 'New Zealand' },
    { value: 'NI', label: 'Nicaragua' },
    { value: 'NE', label: 'Niger' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'NU', label: 'Niue' },
    { value: 'NF', label: 'Norfolk Island' },
    { value: 'NO', label: 'Norway' },
    { value: 'OM', label: 'Oman' },
    { value: 'PK', label: 'Pakistan' },
    { value: 'PW', label: 'Palau' },
    { value: 'PS', label: 'Palestine' },
    { value: 'PA', label: 'Panama' },
    { value: 'PG', label: 'Papua New Guinea' },
    { value: 'PY', label: 'Paraguay' },
    { value: 'PE', label: 'Peru' },
    { value: 'PH', label: 'Philippines' },
    { value: 'PL', label: 'Poland' },
    { value: 'PT', label: 'Portugal' },
    { value: 'PR', label: 'Puerto Rico' },
    { value: 'QA', label: 'Qatar' },
    { value: 'RE', label: 'Reunion' },
    { value: 'RO', label: 'Romania' },
    { value: 'RU', label: 'Russian Federation' },
    { value: 'RW', label: 'Rwanda' },
    { value: 'KN', label: 'Saint Kitts and Nevis' },
    { value: 'LC', label: 'Saint Lucia' },
    { value: 'VC', label: 'Saint Vincent & Grenadines' },
    { value: 'WS', label: 'Samoa' },
    { value: 'SM', label: 'San Marino' },
    { value: 'ST', label: 'Sao Tome & Principe' },
    { value: 'SA', label: 'Saudi Arabia' },
    { value: 'SN', label: 'Senegal' },
    { value: 'RS', label: 'Serbia' },
    { value: 'SC', label: 'Seychelles' },
    { value: 'SL', label: 'Sierra Leone' },
    { value: 'SG', label: 'Singapore' },
    { value: 'SK', label: 'Slovakia' },
    { value: 'SI', label: 'Slovenia' },
    { value: 'SB', label: 'Solomon Islands' },
    { value: 'SO', label: 'Somalia' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'SS', label: 'South Sudan' },
    { value: 'ES', label: 'Spain' },
    { value: 'LK', label: 'Sri Lanka' },
    { value: 'SD', label: 'Sudan' },
    { value: 'SR', label: 'Suriname' },
    { value: 'SZ', label: 'Swaziland' },
    { value: 'SE', label: 'Sweden' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'SY', label: 'Syria' },
    { value: 'TW', label: 'Taiwan' },
    { value: 'TJ', label: 'Tajikistan' },
    { value: 'TZ', label: 'Tanzania' },
    { value: 'TH', label: 'Thailand' },
    { value: 'TL', label: 'Timor-Leste' },
    { value: 'TG', label: 'Togo' },
    { value: 'TK', label: 'Tokelau' },
    { value: 'TO', label: 'Tonga' },
    { value: 'TT', label: 'Trinidad & Tobago' },
    { value: 'TN', label: 'Tunisia' },
    { value: 'TR', label: 'Turkey' },
    { value: 'TM', label: 'Turkmenistan' },
    { value: 'TC', label: 'Turks & Caicos Islands' },
    { value: 'TV', label: 'Tuvalu' },
    { value: 'UG', label: 'Uganda' },
    { value: 'UA', label: 'Ukraine' },
    { value: 'AE', label: 'United Arab Emirates' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'US', label: 'United States' },
    { value: 'UY', label: 'Uruguay' },
    { value: 'UZ', label: 'Uzbekistan' },
    { value: 'VU', label: 'Vanuatu' },
    { value: 'VE', label: 'Venezuela' },
    { value: 'VN', label: 'Vietnam' },
    { value: 'VG', label: 'Virgin Islands (British)' },
    { value: 'VI', label: 'Virgin Islands (U.S.)' },
    { value: 'YE', label: 'Yemen' },
    { value: 'ZM', label: 'Zambia' },
    { value: 'ZW', label: 'Zimbabwe' }
  ]

  // Define a consistent input style for all form elements
  const inputClass = "w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
  const disabledInputClass = "w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2 text-gray-400 focus:outline-none cursor-not-allowed"

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File size exceeds 2MB limit')
      return
    }
    
    setUploadProgress(0)
    setUploadError(null)
    
    try {
      // Read file as Base64
      const reader = new FileReader()
      
      // Use a promise to handle the file reading
      const readFileAsBase64 = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string
          resolve(base64)
        }
        reader.onerror = () => {
          reject(new Error('Failed to read file'))
        }
        
        // Set up progress handling
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
          }
        }
        
        // Read the file
        reader.readAsDataURL(file)
      })
      
      // Get the Base64 string
      const base64Data = await readFileAsBase64
      
      // Skip uploading to storage and directly use the Base64 data
      // This avoids any storage bucket permission issues
      
      // Update the profile with the Base64 image data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: base64Data, // Store Base64 directly in profile
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      console.log('Profile picture saved successfully as Base64')
      
      // Update local state
      setProfile(prev => ({ ...prev, profile_picture_url: base64Data }))
      setSaveStatus('success')
      
      // Reset progress after success
      setTimeout(() => {
        setUploadProgress(null)
      }, 1000)
      
    } catch (err) {
      console.error('Profile picture upload error:', err)
      setUploadError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setUploadProgress(null)
    }
  }

  const toggleLicense = (license: string) => {
    if (expandedLicense === license) {
      setExpandedLicense(null)
    } else {
      setExpandedLicense(license)
    }
  }

  // Add this function to handle profile creation button click
  const handleCreateProfile = async () => {
    if (!userId) {
      console.error('Cannot create profile: No user ID available');
      return;
    }
    
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      // Try using the API route for creating a profile
      console.log('Creating profile via API');
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          email: userEmail
        }),
      });
      
      const result = await response.json();
      console.log('API profile creation result:', result);
      
      if (result.success && result.profile) {
        console.log('Profile created successfully via API');
        // Set the profile from the API response
        setProfile({
          full_name: result.profile.full_name || '',
          display_name: result.profile.display_name || '',
          email: result.profile.email || userEmail || '',
          billing_address: result.profile.billing_address || '',
          country: result.profile.country || '',
          phone: result.profile.phone || '',
          profile_picture_url: result.profile.profile_picture_url || ''
        });
        
        // Reset loading state
        setIsLoading(false);
      } else {
        console.error('API profile creation failed:', result.error);
        setLoadingError(`Failed to create profile: ${result.error}`);
        setIsLoading(false);
      }
    } catch (apiError) {
      console.error('Error using API route to create profile:', apiError);
      setLoadingError('Failed to create profile. Please try again.');
      setIsLoading(false);
    }
  };

  // Add this function to handle session refresh
  const handleRefreshSession = async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      console.log('Manually refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        setLoadingError('Could not refresh your session. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      if (!data.session) {
        console.log('No session returned after refresh');
        setLoadingError('Your session has expired. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('Session refreshed successfully, expires at:', data.session.expires_at);
      
      // Get user data with the refreshed session
      getUser();
    } catch (err) {
      console.error('Unexpected error refreshing session:', err);
      setLoadingError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Add this function to reset the auth state
  const handleResetAuth = async () => {
    try {
      console.log('Resetting auth state...');
      setIsLoading(true);
      
      // First call API to clear server-side cookies
      const response = await fetch('/api/auth/reset-session', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      console.log('Auth reset result:', data);
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        // Clear any Supabase related items from localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            console.log(`Clearing localStorage item: ${key}`);
            localStorage.removeItem(key);
          }
        });
        
        // Clear client-side cookies
        document.cookie.split(';').forEach(c => {
          const cookie = c.trim();
          const name = cookie.split('=')[0];
          if (name.startsWith('sb-')) {
            console.log(`Clearing client-side cookie: ${name}`);
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to sign in page
      console.log('Auth state reset complete, redirecting to sign in page');
      router.push('/auth/signin');
    } catch (err) {
      console.error('Failed to reset auth state:', err);
      setLoadingError('Failed to reset auth state. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-.3s]" />
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-.5s]" />
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md w-full bg-[#111111] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Account Error</h2>
          <p className="text-red-400 mb-6">{loadingError}</p>
          
          <div className="mt-6 flex flex-col space-y-4">
            <button
              onClick={handleRefreshSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh Session
            </button>
            
            <button
              onClick={handleResetAuth}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors"
            >
              Reset Auth State & Sign In Again
            </button>
            
            {userId && (
              <button
                onClick={handleCreateProfile}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
              >
                Create Profile
              </button>
            )}
            
            <button
              onClick={handleRetryProfileLoad}
              className="px-4 py-2 border border-white/10 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Retry
            </button>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Your Account</h1>
        <p className="text-gray-400 mb-8">Welcome back, {profile.email}</p>
        
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-[#111111] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Your Profile</h2>
              {!isEditMode ? (
                <button
                  onClick={toggleEditMode}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                >
                  Edit Details
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-white/10 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Picture */}
            <div className="flex items-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#1A1A1A] border border-white/10">
                  {profile.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src="/logo.png" alt="Default Profile" className="w-16 h-16 opacity-50" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-2 text-center">Your profile picture</p>
              </div>
            </div>

            {/* Profile Form */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={isEditMode ? inputClass : disabledInputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={profile.display_name}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={isEditMode ? inputClass : disabledInputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  disabled={true}
                  className={disabledInputClass}
                />
                <p className="text-xs text-gray-500 mt-1">To change your email, please contact support</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Phone Number <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={isEditMode ? inputClass : disabledInputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Billing Address
                </label>
                <textarea
                  name="billing_address"
                  value={profile.billing_address}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={isEditMode ? inputClass : disabledInputClass}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Country
                </label>
                <select
                  name="country"
                  value={profile.country}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={isEditMode ? inputClass : disabledInputClass}
                >
                  {countries.map(country => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>

          {/* Orders Section */}
          {userId && <OrdersList userId={userId} />}

          {/* Account Actions */}
          <div className="bg-[#111111] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 