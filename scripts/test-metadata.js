// Basic script to test metadata extraction from titles
// To run: node scripts/test-metadata.js

// Import the metadata extractor functions
// Note: This is a simple test script that uses CommonJS require
// In a real Next.js app, you would use the proper import statements
const metadataExtractor = require('../src/lib/metadataExtractor');

// Sample track titles to test
const testTitles = [
  "Deep River 140 BPM UK Drill Type Beat",
  "DARK ENERGY [150 BPM] - Trap Beat",
  "Melancholy Vibes | Lo-Fi | 90bpm | Dm",
  "Dreamy Night - Ambient Trap Type Beat (85 BPM)",
  "Summer Groove Funk | Happy Vibes | G Major | 110BPM",
  "Hard Hitting Drill Instrumental 2024 (Am)",
  "Emotional Piano - Hip Hop Beat - 80 BPM",
  "Aggressive 808 Slap - Trap Beat - 160BPM - F#m",
  "Cloud 9 - Chill LoFi Type Beat",
  "Underground Boom Bap - Old School Hip Hop - 90 BPM"
];

// Function to display extraction results
function testExtraction(title) {
  console.log("\n===================================");
  console.log(`Testing: "${title}"`);
  console.log("===================================");
  
  try {
    // Extract metadata
    const metadata = metadataExtractor.extractMetadataFromTitle(title);
    
    // Get confidence levels
    const confidence = metadataExtractor.getMetadataConfidence(metadata);
    
    // Display results
    console.log("Extracted Metadata:");
    console.log("------------------");
    console.log(`BPM: ${metadata.bpm || 'Not detected'} ${confidence.bpm ? `(${confidence.bpm}% confidence)` : ''}`);
    console.log(`Key: ${metadata.key || 'Not detected'} ${confidence.key ? `(${confidence.key}% confidence)` : ''}`);
    console.log(`Genre: ${metadata.genre || 'Not detected'} ${confidence.genre ? `(${confidence.genre}% confidence)` : ''}`);
    console.log(`Mood: ${metadata.mood || 'Not detected'} ${confidence.mood ? `(${confidence.mood}% confidence)` : ''}`);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Test each title
console.log("\n🎵 METADATA EXTRACTION TEST 🎵");
console.log("This script tests the automatic metadata extraction from track titles");
console.log("---------------------------------------------------------------------");

testTitles.forEach(testExtraction);

// Test a custom title if provided as command line argument
const customTitle = process.argv[2];
if (customTitle) {
  console.log("\n\n📝 TESTING CUSTOM TITLE 📝");
  testExtraction(customTitle);
}

console.log("\n---------------------------------------------------------------------");
console.log("Test complete! This functionality is integrated into the track import page.");
console.log("Available moods:", metadataExtractor.getAvailableMoods().slice(0, 10).join(", "), "...");
console.log("Available genres:", metadataExtractor.getAvailableGenres().slice(0, 10).join(", "), "..."); 