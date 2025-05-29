import json
import requests
import os

def get_github_files(username, repo, path="music/songs", token=None):
    url = f"https://api.github.com/repos/{username}/{repo}/contents/{path}"
    headers = {'Authorization': f'token {token}'} if token else {}
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching files: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def generate_playlist():
    # Get repo info from environment variables
    repo_full_name = os.environ.get('GITHUB_REPOSITORY', '')
    if not repo_full_name:
        print("GITHUB_REPOSITORY not found")
        return
    
    username, repo = repo_full_name.split('/')
    token = os.environ.get('GITHUB_TOKEN')
    
    print(f"Generating playlist for {username}/{repo}")
    
    files = get_github_files(username, repo, "music/songs", token)
    playlist = []
    
    for i, file in enumerate(files):
        if file['name'].lower().endswith(('.mp3', '.m4a', '.wav', '.ogg')):
            filename = os.path.splitext(file['name'])[0]
            
            # Try to parse artist - title from filename
            if ' - ' in filename:
                artist, title = filename.split(' - ', 1)
            else:
                title = filename
                artist = "Unknown Artist"
            
            playlist.append({
                "id": i + 1,
                "title": title.strip(),
                "artist": artist.strip(),
                "url": file['download_url'],
                "filename": file['name']
            })
    
    # Sort by filename for consistency
    playlist.sort(key=lambda x: x['filename'])
    
    # Update IDs after sorting
    for i, song in enumerate(playlist):
        song['id'] = i + 1
        del song['filename']  # Remove filename from final output
    
    # Write to music/playlist.json
    os.makedirs('music', exist_ok=True)
    with open('music/playlist.json', 'w', encoding='utf-8') as f:
        json.dump(playlist, f, indent=2, ensure_ascii=False)
    
    print(f"Generated playlist with {len(playlist)} songs")

if __name__ == "__main__":
    generate_playlist()