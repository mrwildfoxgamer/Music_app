import json
import requests
import os

def get_github_files(username, repo, path="music/songs", token=None):
    url = f"https://api.github.com/repos/{username}/{repo}/contents/{path}"
    headers = {}
    if token:
        headers['Authorization'] = f'token {token}'
        headers['Accept'] = 'application/vnd.github.v3+json'
    
    try:
        print(f"Fetching files from: {url}")
        response = requests.get(url, headers=headers)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            files = response.json()
            print(f"Found {len(files)} items")
            return files
        elif response.status_code == 404:
            print("music/songs folder not found. Creating empty playlist.")
            return []
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"Exception occurred: {e}")
        return []

def generate_playlist():
    # Get environment variables
    repo_full_name = os.environ.get('GITHUB_REPOSITORY', '')
    token = os.environ.get('GITHUB_TOKEN', '')
    
    print(f"Repository: {repo_full_name}")
    print(f"Token available: {'Yes' if token else 'No'}")
    
    if not repo_full_name:
        print("Error: GITHUB_REPOSITORY environment variable not found")
        return
    
    try:
        username, repo = repo_full_name.split('/')
        print(f"Username: {username}, Repo: {repo}")
    except ValueError:
        print(f"Error: Invalid repository format: {repo_full_name}")
        return
    
    # Get files from GitHub API
    files = get_github_files(username, repo, "music/songs", token)
    
    # Generate playlist
    playlist = []
    audio_extensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac']
    
    for i, file_info in enumerate(files):
        if not isinstance(file_info, dict):
            continue
            
        filename = file_info.get('name', '')
        download_url = file_info.get('download_url', '')
        
        # Check if it's an audio file
        if any(filename.lower().endswith(ext) for ext in audio_extensions):
            # Remove extension for processing
            name_without_ext = os.path.splitext(filename)[0]
            
            # Try to parse artist and title
            if ' - ' in name_without_ext:
                parts = name_without_ext.split(' - ', 1)
                artist = parts[0].strip()
                title = parts[1].strip()
            else:
                title = name_without_ext.strip()
                artist = "Unknown Artist"
            
            # Create song entry
            song = {
                "id": len(playlist) + 1,
                "title": title,
                "artist": artist,
                "url": download_url,
                "filename": filename
            }
            
            playlist.append(song)
            print(f"Added: {artist} - {title}")
    
    # Sort playlist by filename for consistency
    playlist.sort(key=lambda x: x['filename'].lower())
    
    # Update IDs after sorting and remove filename
    for i, song in enumerate(playlist):
        song['id'] = i + 1
        del song['filename']
    
    # Create music directory if it doesn't exist
    os.makedirs('music', exist_ok=True)
    
    # Write playlist to file
    playlist_path = 'music/playlist.json'
    try:
        with open(playlist_path, 'w', encoding='utf-8') as f:
            json.dump(playlist, f, indent=2, ensure_ascii=False)
        print(f"Successfully created {playlist_path} with {len(playlist)} songs")
        
        # Print first few songs for verification
        if playlist:
            print("\nFirst few songs in playlist:")
            for song in playlist[:3]:
                print(f"  {song['id']}. {song['artist']} - {song['title']}")
        else:
            print("Warning: No audio files found in music/songs folder")
            
    except Exception as e:
        print(f"Error writing playlist file: {e}")

if __name__ == "__main__":
    generate_playlist()