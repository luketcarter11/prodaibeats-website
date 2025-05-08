'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  license_type: 'Basic' | 'Premium' | 'Exclusive'
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
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Authentication error:', error.message);
        setLoadingError(`Authentication error: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      if (!data?.user) {
        console.log('No user data found');
        setLoadingError('Unable to retrieve user data. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('User authenticated successfully:', data.user.id);
      setUserId(data.user.id);
      setUserEmail(data.user.email || null);
      
      if (data.user.email) {
        setProfile(prev => ({ ...prev, email: data.user.email || '' }));
      }
      
      try {
        // First check if the profiles table exists
        console.log('Checking profiles table...');
        const { error: tableCheckError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (tableCheckError) {
          console.warn('Profiles table may not exist:', tableCheckError.message);
          // Table doesn't exist - we'll create the user profile when they save
        } else {
          // Table exists, try to get the user's profile
          console.log('Fetching user profile for ID:', data.user.id);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileData && !profileError) {
            console.log('Profile data retrieved successfully');
            setProfile({
              full_name: profileData.full_name || '',
              display_name: profileData.display_name || '',
              email: data.user.email || '',
              billing_address: profileData.billing_address || '',
              country: profileData.country || '',
              phone: profileData.phone || '',
              profile_picture_url: profileData.profile_picture_url || ''
            });
          } else if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.log('New user, no profile record found');
            } else {
              console.error('Error fetching profile:', profileError);
            }
          }
        }
        
        // Load sample license data
        console.log('Loading sample license data');
        setLicenses([
          {
            id: 'lic_123456',
            beat_id: 'beat_1',
            beat_name: 'Midnight Dreams',
            license_type: 'Premium',
            purchased_date: '2023-12-15',
            expires: '2024-12-15',
            status: 'active',
            price: 79.99,
            download_url: '/downloads/beat_1_stems.zip',
            producer: 'Producer X',
            image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
          },
          {
            id: 'lic_789012',
            beat_id: 'beat_2',
            beat_name: 'Summer Vibes',
            license_type: 'Basic',
            purchased_date: '2023-10-05',
            expires: '2024-10-05',
            status: 'active',
            price: 29.99,
            download_url: '/downloads/beat_2.mp3',
            producer: 'Beat Maker Pro',
            image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
          },
          {
            id: 'lic_345678',
            beat_id: 'beat_3',
            beat_name: 'Urban Nights',
            license_type: 'Exclusive',
            purchased_date: '2023-08-20',
            status: 'active',
            price: 249.99,
            download_url: '/downloads/beat_3_exclusive.zip',
            producer: 'Urban Beats',
            image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
          },
          {
            id: 'lic_901234',
            beat_id: 'beat_4',
            beat_name: 'Retro Wave',
            license_type: 'Basic',
            purchased_date: '2023-05-10',
            expires: '2024-05-10',
            status: 'expired',
            price: 19.99,
            download_url: '/downloads/beat_4.mp3',
            producer: 'Retro Studios',
            image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
          },
          {
            id: 'lic_567890',
            beat_id: 'beat_5',
            beat_name: 'Chill Flow',
            license_type: 'Premium',
            purchased_date: '2024-02-28',
            expires: '2025-02-28',
            status: 'pending',
            price: 59.99,
            download_url: '/downloads/beat_5_stems.zip',
            producer: 'Chill House',
            image_url: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
          }
        ]);
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

  useEffect(() => {
    getUser();
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
      
      // Step 1: First try direct upsert to profiles table
      const { data: upsertData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: profile.full_name,
          display_name: profile.display_name,
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
  const inputClass = "w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 [&:-webkit-autofill]:bg-zinc-900/50"
  const disabledInputClass = "w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-gray-400 focus:outline-none cursor-not-allowed [&:-webkit-autofill]:bg-zinc-900/50"

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

  return (
    <main className="min-h-screen bg-black text-white py-20 px-4">
      {/* Add global styles to handle autofill styling */}
      <style jsx global>{`
        /* Chrome, Safari, Edge autofill style override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px #121212 inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
          background-color: transparent !important;
        }
        
        /* For Firefox */
        input:autofill,
        select:autofill,
        textarea:autofill {
          background-color: #121212 !important;
          color: white !important;
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-heading font-bold mb-2">Your Account</h1>
        <p className="text-gray-400 mb-10">Welcome back, {userEmail || 'loading...'}</p>

        <div className="space-y-8">
          <section className="border border-white/10 rounded-lg p-6 bg-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Your Profile</h2>
              {!isLoading && !loadingError && (
                isEditMode ? (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-1 bg-zinc-800 text-white text-sm rounded hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={toggleEditMode}
                    className="px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                  >
                    Edit Details
                  </button>
                )
              )}
            </div>
            
            {isLoading ? (
              <div className="text-center py-6">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-purple-500 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-400">Loading your profile...</p>
              </div>
            ) : loadingError ? (
              <div className="text-center py-6">
                <div className="text-red-500 mb-4">{loadingError}</div>
                <button
                  onClick={handleRetryProfileLoad}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-4 py-2 ml-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
                >
                  Sign In Again
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 w-full">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 mb-2">
                      {profile.profile_picture_url ? (
                        <img 
                          src={profile.profile_picture_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          loading="eager"
                          onError={(e) => {
                            console.error('Profile image failed to load');
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJoLTEyIHctMTIiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiPgogIDxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIxIiBkPSJNMTYgN2E0IDQgMCAxMS04IDAgNCA0IDAgMDE4IDB6TTEyIDE0YTcgNyAwIDAwLTcgN2gxNGE3IDcgMCAwMC03LTd6IiAvPgo8L3N2Zz4=';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {isEditMode && (
                      <label 
                        htmlFor="profile-picture-upload"
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-white">Change Photo</span>
                      </label>
                    )}
                    
                    <input
                      type="file"
                      id="profile-picture-upload"
                      accept="image/*"
                      onChange={handleProfilePicUpload}
                      className="hidden"
                      disabled={!isEditMode || uploadProgress !== null}
                    />
                  </div>
                  
                  {uploadProgress !== null && (
                    <div className="w-full max-w-[12rem] mt-2">
                      <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-1">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
                  
                  {uploadError && (
                    <p className="text-sm text-red-500 mt-2">{uploadError}</p>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {isEditMode ? 'JPG, PNG or GIF, max 2MB' : 'Your profile picture'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={profile.full_name}
                      onChange={isEditMode ? handleChange : undefined}
                      readOnly={!isEditMode}
                      className={isEditMode ? inputClass : disabledInputClass}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-400 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="display_name"
                      name="display_name"
                      value={profile.display_name}
                      onChange={isEditMode ? handleChange : undefined}
                      readOnly={!isEditMode}
                      className={isEditMode ? inputClass : disabledInputClass}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profile.email}
                      readOnly
                      className={disabledInputClass}
                    />
                    <p className="mt-1 text-xs text-gray-500">To change your email, please contact support</p>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                      Phone Number <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={isEditMode ? handleChange : undefined}
                      readOnly={!isEditMode}
                      className={isEditMode ? inputClass : disabledInputClass}
                      placeholder="+1 (123) 456-7890"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="billing_address" className="block text-sm font-medium text-gray-400 mb-1">
                    Billing Address
                  </label>
                  <textarea
                    id="billing_address"
                    name="billing_address"
                    value={profile.billing_address}
                    onChange={isEditMode ? handleChange : undefined}
                    readOnly={!isEditMode}
                    rows={3}
                    className={isEditMode ? inputClass : disabledInputClass}
                    placeholder="Street address, city, state, ZIP"
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-400 mb-1">
                    Country
                  </label>
                  {isEditMode ? (
                    <select
                      id="country"
                      name="country"
                      value={profile.country}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {countries.map(country => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="country_display"
                      value={countries.find(c => c.value === profile.country)?.label || profile.country}
                      readOnly
                      className={disabledInputClass}
                    />
                  )}
                </div>
                
                {isEditMode && (
                  <div className="flex items-center justify-between">
                    <div>
                      {saveStatus === 'success' && (
                        <p className="text-green-500 text-sm">Profile updated successfully</p>
                      )}
                      {saveStatus === 'error' && (
                        <p className="text-red-500 text-sm">Failed to update profile. Please try again.</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
                
                {!isEditMode && saveStatus === 'success' && (
                  <div className="text-green-500 text-sm mb-2">
                    Profile updated successfully
                  </div>
                )}
              </form>
            )}
          </section>

          <section className="border border-white/10 rounded-lg p-6 bg-white/5">
            <h2 className="text-xl font-semibold mb-4">Licenses & Orders</h2>
            {licenses.length === 0 ? (
              <p className="text-sm text-gray-400">You haven't purchased any licenses yet. Your beats will appear here after checkout.</p>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {licenses.map(license => (
                    <div 
                      key={license.id} 
                      className="flex flex-col md:flex-row bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                    >
                      <div className="w-full md:w-40 h-32 md:h-auto relative">
                        <div 
                          className="absolute inset-0 bg-cover bg-center" 
                          style={{ backgroundImage: `url(${license.image_url})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>
                      
                      <div className="flex-1 p-4">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{license.beat_name}</h3>
                            <p className="text-sm text-gray-400">Producer: {license.producer}</p>
                            
                            <div className="flex flex-wrap gap-2 my-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700">
                                {license.license_type} License
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getLicenseStatusStyle(license.status)}`}>
                                {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">
                              Purchased: {formatDate(license.purchased_date)}
                              {license.expires && ` • Expires: ${formatDate(license.expires)}`}
                            </p>
                          </div>
                          
                          <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end">
                            <p className="text-lg font-semibold">${license.price.toFixed(2)}</p>
                            <button
                              onClick={() => handleDownload(license.id, license.download_url)}
                              disabled={license.status === 'pending' || license.status === 'expired' || isDownloading === license.id}
                              className={`mt-2 px-3 py-1 text-sm rounded transition-colors ${
                                license.status === 'active' 
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                  : 'bg-gray-800 text-gray-400 cursor-not-allowed'
                              } disabled:opacity-50`}
                            >
                              {isDownloading === license.id ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Downloading...
                                </span>
                              ) : license.status === 'pending' ? (
                                'Processing...'
                              ) : license.status === 'expired' ? (
                                'Expired'
                              ) : (
                                'Download'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-medium mb-4">License Information</h3>
                  
                  <div className="space-y-2">
                    {/* Non-Exclusive License Dropdown */}
                    <div className="bg-zinc-900/70 rounded-lg overflow-hidden border border-white/5">
                      <button 
                        onClick={() => toggleLicense('non-exclusive')}
                        className="w-full px-5 py-3 flex justify-between items-center hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        <div className="flex items-center">
                          <h4 className="font-medium text-white">Non-Exclusive License</h4>
                        </div>
                        <div className="flex items-center">
                          <span className="text-purple-400 font-medium mr-3">$12.99</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-gray-400 transition-transform ${expandedLicense === 'non-exclusive' ? 'transform rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {expandedLicense === 'non-exclusive' && (
                        <div className="p-5 bg-black/30">
                          <ul className="space-y-1.5 text-sm text-gray-300">
                            <li>• MP3 File (Tagless)</li>
                            <li>• Up to 100k streams</li>
                            <li>• All platforms</li>
                            <li>• 50% royalty split</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Non-Exclusive Plus Dropdown */}
                    <div className="bg-zinc-900/70 rounded-lg overflow-hidden border border-white/5">
                      <button 
                        onClick={() => toggleLicense('non-exclusive-plus')}
                        className="w-full px-5 py-3 flex justify-between items-center hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        <div className="flex items-center">
                          <h4 className="font-medium text-white">Non-Exclusive Plus</h4>
                        </div>
                        <div className="flex items-center">
                          <span className="text-purple-400 font-medium mr-3">$24.99</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-gray-400 transition-transform ${expandedLicense === 'non-exclusive-plus' ? 'transform rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {expandedLicense === 'non-exclusive-plus' && (
                        <div className="p-5 bg-black/30">
                          <ul className="space-y-1.5 text-sm text-gray-300">
                            <li>• MP3 File (Tagless)</li>
                            <li>• Unlimited streams</li>
                            <li>• All platforms</li>
                            <li>• 40% royalty split</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Exclusive Dropdown */}
                    <div className="bg-zinc-900/70 rounded-lg overflow-hidden border border-white/5">
                      <button 
                        onClick={() => toggleLicense('exclusive')}
                        className="w-full px-5 py-3 flex justify-between items-center hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        <div className="flex items-center">
                          <h4 className="font-medium text-white">Exclusive</h4>
                        </div>
                        <div className="flex items-center">
                          <span className="text-purple-400 font-medium mr-3">$29.99</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-gray-400 transition-transform ${expandedLicense === 'exclusive' ? 'transform rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {expandedLicense === 'exclusive' && (
                        <div className="p-5 bg-black/30">
                          <ul className="space-y-1.5 text-sm text-gray-300">
                            <li>• MP3 File (Tagless)</li>
                            <li>• Up to 100k streams</li>
                            <li>• All platforms</li>
                            <li>• 50% royalty split</li>
                            <li>• Producer keeps distribution</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Exclusive Plus Dropdown */}
                    <div className="bg-zinc-900/70 rounded-lg overflow-hidden border border-white/5">
                      <button 
                        onClick={() => toggleLicense('exclusive-plus')}
                        className="w-full px-5 py-3 flex justify-between items-center hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        <div className="flex items-center">
                          <h4 className="font-medium text-white">Exclusive Plus</h4>
                          <span className="ml-4 bg-purple-600 text-white text-xs px-2.5 py-0.5 rounded-full">
                            Best Value
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-purple-400 font-medium mr-3">$49.99</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-gray-400 transition-transform ${expandedLicense === 'exclusive-plus' ? 'transform rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {expandedLicense === 'exclusive-plus' && (
                        <div className="p-5 bg-black/30">
                          <ul className="space-y-1.5 text-sm text-gray-300">
                            <li>• MP3 File (Tagless)</li>
                            <li>• Unlimited streams</li>
                            <li>• All platforms</li>
                            <li>• 30% royalty split</li>
                            <li>• Producer keeps distribution</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Exclusive Pro Dropdown */}
                    <div className="bg-zinc-900/70 rounded-lg overflow-hidden border border-white/5">
                      <button 
                        onClick={() => toggleLicense('exclusive-pro')}
                        className="w-full px-5 py-3 flex justify-between items-center hover:bg-zinc-800/50 transition-colors text-left"
                      >
                        <div className="flex items-center">
                          <h4 className="font-medium text-white">Exclusive Pro</h4>
                        </div>
                        <div className="flex items-center">
                          <span className="text-purple-400 font-medium mr-3">$79.99</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-gray-400 transition-transform ${expandedLicense === 'exclusive-pro' ? 'transform rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {expandedLicense === 'exclusive-pro' && (
                        <div className="p-5 bg-black/30">
                          <ul className="space-y-1.5 text-sm text-gray-300">
                            <li>• MP3 File (Tagless)</li>
                            <li>• Unlimited streams</li>
                            <li>• All platforms</li>
                            <li>• 10% royalty split</li>
                            <li>• Producer keeps distribution</li>
                            <li>• Free Non-Exclusive Plus beat</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-500 text-xs mt-6">
                    For questions about your licenses or to upgrade, please <Link href="/contact" className="text-purple-400 hover:text-purple-300">contact our support team</Link>.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="border border-white/10 rounded-lg p-6 bg-white/5">
            <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Log Out
            </button>
          </section>
        </div>
      </div>
    </main>
  )
} 