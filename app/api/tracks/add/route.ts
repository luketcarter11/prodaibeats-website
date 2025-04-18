import { NextRequest, NextResponse } from 'next/server'
import { promises as fsPromises } from 'fs'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Track } from '@/types/track'
import { updateTracksData } from '@/lib/scanTracks'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract track data
    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const bpm = parseInt(formData.get('bpm') as string)
    const key = formData.get('key') as string
    const price = parseFloat(formData.get('price') as string)
    const licenseType = formData.get('licenseType') as string
    const tags = (formData.get('tags') as string || '')
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    
    // Get files
    const audioFile = formData.get('audioFile') as File
    const coverFile = formData.get('coverFile') as File | null
    
    // Validate required fields
    if (!title || !artist || !bpm || !key || !audioFile) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Generate a track ID
    const trackId = `track_${uuidv4().replace(/-/g, '').substring(0, 16)}`
    
    // Create directories if they don't exist
    const publicDir = path.join(process.cwd(), 'public')
    const audioDir = path.join(publicDir, 'audio')
    const coversDir = path.join(publicDir, 'images/covers')
    const dataDir = path.join(process.cwd(), 'data')
    
    await fsPromises.mkdir(audioDir, { recursive: true })
    await fsPromises.mkdir(coversDir, { recursive: true })
    await fsPromises.mkdir(dataDir, { recursive: true })
    
    // Save audio file
    const audioFileName = `${trackId}.mp3`
    const audioFilePath = path.join(audioDir, audioFileName)
    
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    await fsPromises.writeFile(audioFilePath, audioBuffer)
    
    // Save cover image if provided, or use default
    let coverFileName = 'default-cover.jpg'
    
    if (coverFile) {
      coverFileName = `${trackId}${path.extname(coverFile.name)}`
      const coverFilePath = path.join(coversDir, coverFileName)
      
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer())
      await fsPromises.writeFile(coverFilePath, coverBuffer)
    }
    
    // Get audio duration
    let duration = '0:30' // Default placeholder
    // In a real app, you would use a library to get the actual duration
    
    // Create track object
    const track: Track = {
      id: trackId,
      title,
      artist,
      coverUrl: `/images/covers/${coverFileName}`,
      price,
      bpm,
      key,
      duration,
      tags,
      audioUrl: `/audio/${audioFileName}`,
      licenseType: licenseType as any
    }
    
    // Save track data to JSON file
    const trackDataPath = path.join(dataDir, `${trackId}.imported.json`)
    await fsPromises.writeFile(
      trackDataPath,
      JSON.stringify(track, null, 2)
    )
    
    // Mark file as imported
    const importFlagPath = path.join(dataDir, `${trackId}.imported`)
    await fsPromises.writeFile(importFlagPath, '')
    
    // Update tracks in data.ts
    await updateTracksData([track])
    
    return NextResponse.json({
      success: true,
      message: 'Track added successfully',
      track
    })
  } catch (error) {
    console.error('Error adding track:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    )
  }
} 