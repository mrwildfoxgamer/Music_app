import json
import os
from urllib.parse import quote

def generate_playlist():
    # Get environment variables
    repo_full_name = os.environ.get('GITHUB_REPOSITORY', '')
    branch = os.environ.get('GITHUB_BRANCH', 'main')  # Default to 'main'
    
    print(f"Repository: {repo_full_name}")
    print(f"Branch: {branch}")
    
    if not repo_full_name:
        print("Error: GITHUB_REPOSITORY environment variable not found")
        return

    try:
        username, repo = repo_full_name.split('/')
    except ValueError:
        print(f"Error: Invalid repository format: {repo_full_name}")
        return

    # Generate playlist from LOCAL files
    playlist = []
    audio_extensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac']
    songs_dir = 'music/songs'
    
    if not os.path.exists(songs_dir):
        print(f"Directory not found: {songs_dir}")
        os.makedirs(songs_dir, exist_ok=True)
        print(f"Created directory: {songs_dir}")

    print(f"Scanning local directory: {songs_dir}")
    
    for filename in os.listdir(songs_dir):
        filepath = os.path.join(songs_dir, filename)
        if os.path.isfile(filepath) and any(filename.lower().endswith(ext) for ext in audio_extensions):
            # Create GitHub raw URL
            encoded_filename = quote(filename)
            download_url = f"https://raw.githubusercontent.com/{username}/{repo}/{branch}/music/songs/{encoded_filename}"
            
            # Parse artist and title
            name_without_ext = os.path.splitext(filename)[0]
            if ' - ' in name_without_ext:
                artist, title = name_without_ext.split(' - ', 1)
            else:
                artist = "Unknown Artist"
                title = name_without_ext
            
            playlist.append({
                "id": len(playlist) + 1,
                "title": title.strip(),
                "artist": artist.strip(),
                "url": download_url
            })
            print(f"Added: {artist.strip()} - {title.strip()}")

    # Sort by title
    playlist.sort(key=lambda x: x['title'].lower())
    
    # Update IDs after sorting
    for i, song in enumerate(playlist):
        song['id'] = i + 1

    # Write playlist
    playlist_path = 'music/playlist.json'
    with open(playlist_path, 'w', encoding='utf-8') as f:
        json.dump(playlist, f, indent=2, ensure_ascii=False)
    
    print(f"Playlist generated with {len(playlist)} songs at {playlist_path}")

if __name__ == "__main__":
    generate_playlist()