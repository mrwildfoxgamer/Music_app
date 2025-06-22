#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * GitHub Music Playlist Generator
 * Generates playlist.json by scanning a GitHub repository for music files
 */

// Configuration
const CONFIG = {
  // GitHub repository details
  GITHUB_OWNER: 'mrwildfoxgamer',        // Replace with your GitHub username
  GITHUB_REPO: 'Music_app',       // Replace with your repository name
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '', // Optional: GitHub token for private repos
  
  // Music folder path in the repository (empty string for root)
  MUSIC_FOLDER: 'music',                // e.g., 'music', 'songs', or '' for root
  
  // Supported audio file extensions
  AUDIO_EXTENSIONS: ['.webm','.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
  
  // Output file
  OUTPUT_FILE: 'playlist.json',
  
  // Base URL for raw files (will be constructed automatically)
  BASE_URL: ''
};

/**
 * Makes HTTP requests to GitHub API
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Music-Playlist-Generator',
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers
    };

    if (CONFIG.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${CONFIG.GITHUB_TOKEN}`;
    }

    const req = https.request(url, { headers }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`GitHub API Error: ${parsed.message || 'Unknown error'}`));
          } else {
            resolve(parsed);
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Recursively scans GitHub repository for music files
 */
async function scanRepository(owner, repo, path = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  console.log(`Scanning: ${path || 'root directory'}`);
  
  try {
    const contents = await makeRequest(url);
    let musicFiles = [];
    
    for (const item of contents) {
      if (item.type === 'file') {
        const ext = getFileExtension(item.name);
        if (CONFIG.AUDIO_EXTENSIONS.includes(ext)) {
          musicFiles.push({
            name: item.name,
            path: item.path,
            downloadUrl: item.download_url,
            size: item.size
          });
        }
      } else if (item.type === 'dir') {
        // Recursively scan subdirectories
        const subFiles = await scanRepository(owner, repo, item.path);
        musicFiles = musicFiles.concat(subFiles);
      }
    }
    
    return musicFiles;
  } catch (error) {
    console.error(`Error scanning ${path}:`, error.message);
    return [];
  }
}

/**
 * Extracts file extension
 */
function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * Extracts song title and artist from filename
 * Supports formats like:
 * - "Artist - Song Title.mp3"
 * - "Song Title.mp3"
 * - "01. Artist - Song Title.mp3"
 */
function parseFilename(filename) {
  // Remove file extension
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  
  // Remove track numbers (e.g., "01. ", "1. ", "001 - ")
  let cleanName = nameWithoutExt.replace(/^\d+[\.\-\s]+/, '');
  
  // Check if filename contains " - " separator
  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim()
    };
  }
  
  // If no separator, use filename as title
  return {
    artist: 'Unknown Artist',
    title: cleanName.trim()
  };
}

/**
 * Estimates duration from file size (very rough approximation)
 */
function estimateDuration(sizeInBytes) {
  // Very rough estimate: assume 128kbps MP3
  // 128kbps = 16KB/s, so duration ≈ size / 16000
  const seconds = Math.round(sizeInBytes / 16000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Generates playlist.json from music files
 */
function generatePlaylist(musicFiles, owner, repo) {
  console.log(`\nGenerating playlist from ${musicFiles.length} music files...`);
  
  const playlist = musicFiles.map((file, index) => {
    const { artist, title } = parseFilename(file.name);
    
    return {
      id: index + 1,
      title: title,
      artist: artist,
      url: file.downloadUrl,
      duration: estimateDuration(file.size),
      filename: file.name,
      path: file.path
    };
  });
  
  // Sort playlist by artist, then by title
  playlist.sort((a, b) => {
    if (a.artist !== b.artist) {
      return a.artist.localeCompare(b.artist);
    }
    return a.title.localeCompare(b.title);
  });
  
  return playlist;
}

/**
 * Saves playlist to JSON file
 */
function savePlaylist(playlist, filename) {
  try {
    const jsonContent = JSON.stringify(playlist, null, 2);
    fs.writeFileSync(filename, jsonContent, 'utf8');
    console.log(`\n✅ Successfully generated ${filename}`);
    console.log(`📁 Total songs: ${playlist.length}`);
    
    // Show sample entries
    if (playlist.length > 0) {
      console.log('\n📋 Sample entries:');
      playlist.slice(0, 3).forEach((song, i) => {
        console.log(`${i + 1}. ${song.artist} - ${song.title} (${song.duration})`);
      });
      if (playlist.length > 3) {
        console.log(`   ... and ${playlist.length - 3} more songs`);
      }
    }
  } catch (error) {
    console.error('❌ Error saving playlist:', error.message);
    process.exit(1);
  }
}

/**
 * Validates configuration
 */
function validateConfig() {
  if (!CONFIG.GITHUB_OWNER || CONFIG.GITHUB_OWNER === 'your-username') {
    console.error('❌ Please set GITHUB_OWNER in the configuration');
    process.exit(1);
  }
  
  if (!CONFIG.GITHUB_REPO || CONFIG.GITHUB_REPO === 'your-music-repo') {
    console.error('❌ Please set GITHUB_REPO in the configuration');
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎵 GitHub Music Playlist Generator');
  console.log('==================================\n');
  
  // Validate configuration
  validateConfig();
  
  console.log(`Repository: ${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}`);
  console.log(`Music folder: ${CONFIG.MUSIC_FOLDER || 'root'}`);
  console.log(`Supported formats: ${CONFIG.AUDIO_EXTENSIONS.join(', ')}\n`);
  
  try {
    // Scan repository for music files
    const musicFiles = await scanRepository(
      CONFIG.GITHUB_OWNER, 
      CONFIG.GITHUB_REPO, 
      CONFIG.MUSIC_FOLDER
    );
    
    if (musicFiles.length === 0) {
      console.log('⚠️  No music files found in the repository');
      console.log('Make sure:');
      console.log('- The repository contains music files');
      console.log('- The MUSIC_FOLDER path is correct');
      console.log('- The repository is public (or you have a valid GitHub token)');
      return;
    }
    
    // Generate playlist
    const playlist = generatePlaylist(musicFiles, CONFIG.GITHUB_OWNER, CONFIG.GITHUB_REPO);
    
    // Save to file
    savePlaylist(playlist, CONFIG.OUTPUT_FILE);
    
    console.log(`\n🎉 Playlist generation complete!`);
    console.log(`Upload ${CONFIG.OUTPUT_FILE} to your music player app.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Command line argument handling
if (process.argv.length > 2) {
  const args = process.argv.slice(2);
  
  // Allow command line arguments to override config
  args.forEach(arg => {
    if (arg.startsWith('--owner=')) {
      CONFIG.GITHUB_OWNER = arg.substring(8);
    } else if (arg.startsWith('--repo=')) {
      CONFIG.GITHUB_REPO = arg.substring(7);
    } else if (arg.startsWith('--folder=')) {
      CONFIG.MUSIC_FOLDER = arg.substring(9);
    } else if (arg.startsWith('--output=')) {
      CONFIG.OUTPUT_FILE = arg.substring(9);
    } else if (arg === '--help' || arg === '-h') {
      console.log('GitHub Music Playlist Generator');
      console.log('Usage: node generate-playlist.js [options]');
      console.log('');
      console.log('Options:');
      console.log('  --owner=USERNAME    GitHub username/organization');
      console.log('  --repo=REPOSITORY   Repository name');
      console.log('  --folder=PATH       Music folder path (default: music)');
      console.log('  --output=FILE       Output filename (default: playlist.json)');
      console.log('  --help, -h          Show this help message');
      console.log('');
      console.log('Environment Variables:');
      console.log('  GITHUB_TOKEN        GitHub personal access token (for private repos)');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-playlist.js --owner=myuser --repo=my-music');
      console.log('  node generate-playlist.js --owner=myuser --repo=songs --folder=audio');
      process.exit(0);
    }
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generatePlaylist, scanRepository, parseFilename };