import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateLicensePDF, LicenseType } from '../../../lib/generateLicense'
import fs from 'fs'
import path from 'path'

// Initialize Supabase client
const getSupabase = (useServiceRole = false) => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = useServiceRole 
      ? process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    console.log('Supabase setup:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      usingServiceRole: useServiceRole
    })

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    return createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    throw error
  }
}

// Helper function to check if error is a "resource already exists" error
const isResourceExistsError = (error: any): boolean => {
  if (!error) return false
  const errorMessage = error.message || (typeof error === 'string' ? error : '')
  return errorMessage.includes('already exists')
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { orderId, trackTitle, licenseType } = body
    
    console.log('License generation request:', { orderId, trackTitle, licenseType })

    if (!orderId || !trackTitle || !licenseType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate license type
    if (!isValidLicenseType(licenseType)) {
      return NextResponse.json(
        { error: `Invalid license type: ${licenseType}` },
        { status: 400 }
      )
    }

    // Check fonts directory - for diagnostics only
    try {
      const fontsDir = path.join(process.cwd(), 'public', 'fonts')
      if (fs.existsSync(fontsDir)) {
        const fontFiles = fs.readdirSync(fontsDir)
        console.log('Available fonts in public/fonts directory:', fontFiles)
      } else {
        console.log('Fonts directory not found or not accessible')
      }
    } catch (fontDirError) {
      console.error('Error checking fonts directory:', fontDirError)
    }

    // Generate the PDF
    console.log('Generating PDF for:', { orderId, trackTitle, licenseType })
    
    const effectiveDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    try {
      // Generate PDF using jsPDF
      console.log('Starting PDF generation...')
      const pdfBuffer = await generateLicensePDF({
        orderId,
        trackTitle,
        licenseType,
        effectiveDate
      })
      
      console.log('PDF generated successfully, size:', pdfBuffer.length)

      // Save PDF locally for debugging
      const tempDir = path.join(process.cwd(), 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      const localFilePath = path.join(tempDir, `${orderId}.pdf`)
      console.log('Saving PDF locally to:', localFilePath)
      fs.writeFileSync(localFilePath, pdfBuffer)
      console.log('PDF saved locally successfully')

      // Initialize Supabase client with service role for all operations
      console.log('Initializing Supabase admin client...')
      const adminSupabase = getSupabase(true)
      
      // Check if the licenses bucket exists
      console.log('Checking for storage bucket...')
      const { data: buckets, error: bucketsError } = await adminSupabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError)
        return NextResponse.json(
          { error: `Storage bucket error: ${bucketsError.message}` },
          { status: 500 }
        )
      }
      
      console.log('Available buckets:', buckets?.map(b => b.name))
      
      // Check if "licenses" bucket exists
      let licensesBucket = buckets?.find(b => b.name === 'licenses')
      
      if (!licensesBucket) {
        console.log('Creating licenses bucket...')
        
        // Create bucket and handle potential errors
        const { data: bucketData, error: createBucketError } = await adminSupabase.storage.createBucket('licenses', {
          public: false
        })
        
        if (createBucketError && !isResourceExistsError(createBucketError)) {
          // Only treat as error if it's not a "resource already exists" error
          console.error('Error creating bucket:', createBucketError)
          return NextResponse.json(
            { error: `Failed to create storage bucket: ${createBucketError.message}` },
            { status: 500 }
          )
        }
        
        if (isResourceExistsError(createBucketError)) {
          console.log('Licenses bucket already exists (returned as error but continuing)')
        } else {
          console.log('Licenses bucket created successfully')
        }
      } else {
        console.log('Licenses bucket already exists')
      }
      
      // Upload to Supabase storage
      const fileName = `${orderId}.pdf`
      
      console.log('Uploading to storage bucket "licenses":', fileName)
      
      try {
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('licenses')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          return NextResponse.json(
            { error: `Failed to upload license: ${uploadError.message}` },
            { status: 500 }
          )
        }

        console.log('Successfully uploaded PDF:', uploadData)
        console.log('Updating order...')

        // Update the order with the license file path
        const { error: updateError } = await adminSupabase
          .from('orders')
          .update({ license_file: fileName })
          .eq('id', orderId)

        if (updateError) {
          console.error('Order update error:', updateError)
          return NextResponse.json(
            { error: `Failed to update order: ${updateError.message}` },
            { status: 500 }
          )
        }

        console.log('Successfully updated order with license file')

        // Get a URL for the file
        const { data: urlData, error: urlError } = await adminSupabase.storage
          .from('licenses')
          .createSignedUrl(fileName, 60 * 60 * 24) // 24 hour signed URL
          
        console.log('Generated signed URL:', urlData?.signedUrl ? 'Success' : 'Failed')

        // Return success response
        return NextResponse.json({
          success: true,
          fileName,
          signedUrl: urlData?.signedUrl
        })
      } catch (uploadError) {
        console.error('Error during upload process:', uploadError)
        return NextResponse.json(
          { error: `Upload process error: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}` },
          { status: 500 }
        )
      }
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      return NextResponse.json(
        { error: `Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('License generation error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

// Helper function to validate license type
function isValidLicenseType(type: string): type is LicenseType {
  return ['Non-Exclusive', 'Non-Exclusive Plus', 'Exclusive', 'Exclusive Plus', 'Exclusive Pro'].includes(type);
} 