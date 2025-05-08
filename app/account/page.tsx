'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        <div className="space-y-8">
          {/* Orders Section */}
          {userId && <OrdersList userId={userId} />}
          
          {/* Additional account sections can be added here */}
        </div>
      </div>
    </div>
  );
} 