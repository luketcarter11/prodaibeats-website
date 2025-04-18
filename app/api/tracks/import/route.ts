import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Track } from '@/types/track';

// Get available tracks that have been downloaded but not yet imported
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Ensure the directory exists
    try {
      await fs.promises.access(dataDir);
    } catch (error) {
      return NextResponse.json({ 
        success: true, 
        tracks: [] 
      });
    }
    
    // Read all JSON files in the data directory
    const files = await fs.promises.readdir(dataDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const tracks = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(dataDir, file);
        const content = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(content);
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      tracks 
    });
    
  } catch (error: any) {
    console.error('Error retrieving tracks:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: `Error retrieving tracks: ${error.message}` 
    }, { status: 500 });
  }
}

// Import tracks into the main data.ts file
export async function POST(request: Request) {
  try {
    const { trackIds, bpmValues, keyValues } = await request.json();
    
    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No track IDs provided'
      }, { status: 400 });
    }
    
    const dataDir = path.join(process.cwd(), 'data');
    const tracks: Track[] = [];
    
    // Process each selected track
    for (let i = 0; i < trackIds.length; i++) {
      const trackId = trackIds[i];
      const filePath = path.join(dataDir, `${trackId}.json`);
      
      try {
        // Read track data
        const content = await fs.promises.readFile(filePath, 'utf8');
        const trackData = JSON.parse(content);
        
        // Update BPM and key if provided
        if (bpmValues && bpmValues[i]) {
          trackData.metadata.bpm = parseInt(bpmValues[i], 10);
        }
        
        if (keyValues && keyValues[i]) {
          trackData.metadata.key = keyValues[i];
        }
        
        // Create a track object in the format expected by the application
        const track: Track = {
          id: trackData.trackId,
          title: trackData.title,
          artist: trackData.artist,
          coverUrl: trackData.coverUrl,
          price: 12.99, // Default to the Non-Exclusive license price
          bpm: trackData.metadata.bpm || 0,
          key: trackData.metadata.key || 'Unknown',
          duration: trackData.metadata.duration || '0:00',
          tags: trackData.metadata.tags || [],
          audioUrl: trackData.audioUrl,
          licenseType: 'Non-Exclusive'
        };
        
        tracks.push(track);
        
        // Rename the imported JSON file to mark it as processed
        await fs.promises.rename(
          filePath,
          path.join(dataDir, `${trackId}.imported.json`)
        );
      } catch (error) {
        console.error(`Error processing track ${trackId}:`, error);
      }
    }
    
    // Read the existing data.ts file
    const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.ts');
    let dataFileContent: string;
    
    try {
      dataFileContent = await fs.promises.readFile(dataFilePath, 'utf8');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Could not read the data.ts file'
      }, { status: 500 });
    }
    
    // Find the tracks array in the file
    const tracksArrayStartRegex = /const tracks: Track\[\] = \[/;
    const match = tracksArrayStartRegex.exec(dataFileContent);
    
    if (!match) {
      return NextResponse.json({ 
        success: false, 
        message: 'Could not find the tracks array in data.ts'
      }, { status: 500 });
    }
    
    // Format the new tracks as JavaScript objects
    const newTracksCode = tracks.map(track => `
  {
    id: '${track.id}',
    title: '${track.title.replace(/'/g, "\\'")}',
    artist: '${track.artist.replace(/'/g, "\\'")}',
    coverUrl: '${track.coverUrl}',
    price: ${track.price},
    bpm: ${track.bpm},
    key: '${track.key}',
    duration: '${track.duration}',
    tags: [${track.tags.map(tag => `'${tag.replace(/'/g, "\\'")}'`).join(', ')}],
    audioUrl: '${track.audioUrl}'
  },`).join('');
    
    // Insert the new tracks at the beginning of the array
    const updatedContent = dataFileContent.replace(
      tracksArrayStartRegex,
      `const tracks: Track[] = [${newTracksCode}`
    );
    
    // Write the updated content back to the file
    await fs.promises.writeFile(dataFilePath, updatedContent, 'utf8');
    
    return NextResponse.json({ 
      success: true, 
      message: `${tracks.length} tracks imported successfully`,
      importedTracks: tracks
    });
    
  } catch (error: any) {
    console.error('Error importing tracks:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: `Error importing tracks: ${error.message}` 
    }, { status: 500 });
  }
} 