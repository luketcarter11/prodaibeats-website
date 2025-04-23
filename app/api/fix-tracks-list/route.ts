import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log('🔧 Running fix-tracks-list endpoint...')
    const { stdout, stderr } = await execAsync('npx tsx scripts/fixListJson.ts')
    
    if (stderr) {
      console.error('❌ Fix script stderr:', stderr)
      return NextResponse.json({ 
        success: false, 
        error: stderr 
      }, { status: 500 })
    }
    
    console.log('✅ Fix script ran successfully:', stdout)
    return NextResponse.json({ 
      success: true, 
      output: stdout 
    })
  } catch (error) {
    console.error('❌ Fix script failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 