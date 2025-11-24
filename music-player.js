/**
 * music-player.js
 * Full replacement implementing MP3 <-> FLAC source switching with fallbacks.
 *
 * Expected HTML element IDs:
 *  - audio element:        #audioPlayer
 *  - playlist container:   #playlist
 *  - loading message:      #loading
 *  - current title:        #currentTitle
 *  - current artist:       #currentArtist
 *  - mp3 button:           #mp3Btn
 *  - flac button:          #flacBtn
 *  - playlist toggle btn:  #viewToggleBtn (optional)
 *
 * Playlist file formats supported:
 *  - Array of objects: [ { title, artist, src } , ... ]
 *  - Object with songs property: { songs: [ ... ] }
 *
 * Candidate playlist locations tried (in order):
 *  - For MP3:  'playlist.json', 'music/playlist.json'
 *  - For FLAC: 'music/FLAC/playlist.json', 'music/playlist.json', 'playlist.json'
 *
 * If a playlist mixes extensions, this script will filter by .mp3 or .flac when a source is selected.
 */

(function () {
  'use strict';

  // DOM references (null-safe)
  const audio = document.getElementById('audioPlayer');
  const playlistContainer = document.getElementById('playlist');
  const loadingEl = document.getElementById('loading') || createInlineLoading();
  const currentTitleEl = document.getElementById('currentTitle');
  const currentArtistEl = document.getElementById('currentArtist');

  const mp3Btn = document.getElementById('mp3Btn');
  const flacBtn = document.getElementById('flacBtn');
  const viewToggleBtn = document.getElementById('viewToggleBtn');

  // Internal state
  let songs = [];
  let currentIndex = -1;
  let currentSource = 'mp3'; // 'mp3' or 'flac'

  // Utility: create a minimal loading element if the page doesn't have one
  function createInlineLoading() {
    const div = document.createElement('div');
    div.id = 'loading';
    div.style.display = 'none';
    if (playlistContainer && playlistContainer.parentNode) {
      playlistContainer.parentNode.insertBefore(div, playlistContainer);
    } else {
      document.body.appendChild(div);
    }
    return div;
  }

  // Helper: set active button visual state
  function setActiveSourceBtn(source) {
    currentSource = source;
    if (mp3Btn) mp3Btn.classList.toggle('active', source === 'mp3');
    if (flacBtn) flacBtn.classList.toggle('active', source === 'flac');
  }

  // Helper: best-effort fetch JSON, returns parsed object or null
  async function tryFetchJson(url) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      // network or parse error
      return null;
    }
  }

  // Detect FLAC support in the current browser
  function browserCanPlayFlac() {
    try {
      if (!audio || typeof audio.canPlayType !== 'function') return false;
      // Some browsers recognize 'audio/flac' MIME, some 'audio/x-flac'
      const r = audio.canPlayType('audio/flac') || audio.canPlayType('audio/x-flac');
      return !!r && r !== 'no';
    } catch (e) {
      return false;
    }
  }

  // Normalize playlist entries — return { title, artist, src }
  function normalizeEntry(item) {
    if (!item) return null;
    const src = (item.src || item.file || item.url || item.path || item.source || '').toString();
    const title = item.title || item.name || (src ? src.split('/').pop() : 'Unknown');
    const artist = item.artist || item.artistName || item.album || '';
    return { title, artist, src };
  }

  // Build playlist UI
  function renderPlaylist() {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = '';

    if (!songs || songs.length === 0) {
      const msg = document.createElement('div');
      msg.className = 'playlist-empty';
      msg.textContent = 'No songs to show for this source.';
      playlistContainer.appendChild(msg);
      return;
    }

    songs.forEach((song, i) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.dataset.index = i;

      const titleDiv = document.createElement('div');
      titleDiv.className = 'pl-title';
      titleDiv.textContent = song.title || song.src.split('/').pop();

      const artistDiv = document.createElement('div');
      artistDiv.className = 'pl-artist';
      artistDiv.textContent = song.artist || '';

      item.appendChild(titleDiv);
      item.appendChild(artistDiv);

      item.addEventListener('click', () => {
        playIndex(i);
      });

      playlistContainer.appendChild(item);
    });
  }

  // Set audio src and play
  function playIndex(i) {
    if (!songs || !songs[i]) return;
    currentIndex = i;
    const s = songs[i];
    if (!s || !s.src) return;
    if (!audio) {
      console.warn('audio element not found');
      return;
    }
    audio.src = s.src;
    if (currentTitleEl) currentTitleEl.textContent = s.title || '';
    if (currentArtistEl) currentArtistEl.textContent = s.artist || '';
    audio.play().catch(err => {
      // Autoplay/policy might prevent immediate play; just log
      console.warn('Audio play failed:', err);
    });

    // visually mark active item
    markActivePlaylistItem();
  }

  function markActivePlaylistItem() {
    if (!playlistContainer) return;
    const items = playlistContainer.querySelectorAll('.playlist-item');
    items.forEach(it => it.classList.remove('playing'));
    const cur = playlistContainer.querySelector(`.playlist-item[data-index="${currentIndex}"]`);
    if (cur) cur.classList.add('playing');
  }

  // Load playlist for a given source ('mp3' or 'flac')
  async function loadPlaylistForSource(source) {
    if (!playlistContainer) return;
    loadingEl.style.display = '';
    loadingEl.textContent = 'Loading playlist...';
    playlistContainer.innerHTML = '';
    songs = [];
    currentIndex = -1;

    // Candidate files to try (ordered)
    const candidates = source === 'flac'
      ? ['music/FLAC/playlist.json', 'music/playlist.json', 'playlist.json']
      : ['playlist.json', 'music/playlist.json'];

    let data = null, usedPath = null;
    for (const p of candidates) {
      data = await tryFetchJson(p);
      if (data) { usedPath = p; break; }
    }

    if (!data) {
      loadingEl.textContent = 'No playlist found.';
      return;
    }

    // Accept an array or object with songs property
    let list = Array.isArray(data) ? data : (Array.isArray(data.songs) ? data.songs : []);
    if (!list || list.length === 0) {
      loadingEl.textContent = 'Playlist is empty.';
      return;
    }

    // Normalize entries
    const normalized = list.map(normalizeEntry).filter(Boolean);

    // Filter by extension for the requested source
    const ext = source === 'flac' ? '.flac' : '.mp3';
    const filtered = normalized.filter(e => e.src.toLowerCase().endsWith(ext));

    // If filter yields nothing, fall back to all entries (avoid giving user empty UX when they have mixed metadata)
    songs = filtered.length ? filtered : normalized;

    // If still empty, show message
    if (!songs.length) {
      loadingEl.textContent = `No ${source.toUpperCase()} tracks found in playlist.`;
      return;
    }

    // Build UI
    renderPlaylist();
    loadingEl.style.display = 'none';

    // Auto-play first track if none playing
    playIndex(0);
  }

  // Hook up UI events
  function wireUpControls() {
    if (mp3Btn) {
      mp3Btn.addEventListener('click', () => {
        setActiveSourceBtn('mp3');
        loadPlaylistForSource('mp3');
      });
    }

    if (flacBtn) {
      flacBtn.addEventListener('click', () => {
        setActiveSourceBtn('flac');
        loadPlaylistForSource('flac');
      });
    }

    if (viewToggleBtn && playlistContainer) {
      viewToggleBtn.addEventListener('click', () => {
        const hidden = playlistContainer.style.display === 'none' || playlistContainer.classList.contains('hidden');
        if (hidden) {
          playlistContainer.style.display = '';
          playlistContainer.classList.remove('hidden');
        } else {
          playlistContainer.style.display = 'none';
          playlistContainer.classList.add('hidden');
        }
      });
    }

    // Audio end -> play next
    if (audio) {
      audio.addEventListener('ended', () => {
        if (songs && songs.length && currentIndex + 1 < songs.length) {
          playIndex(currentIndex + 1);
        } else {
          // optionally loop or stop
          currentIndex = -1;
          markActivePlaylistItem();
        }
      });
    }
  }

  // Initialize player on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    wireUpControls();

    // Detect FLAC support and disable the FLAC button if not supported
    if (flacBtn && !browserCanPlayFlac()) {
      flacBtn.disabled = true;
      flacBtn.title = 'FLAC playback unsupported in this browser';
      flacBtn.classList.add('disabled');
    }

    // Default to MP3
    setActiveSourceBtn('mp3');
    loadPlaylistForSource('mp3');
  });

  // Expose small API for debugging (optional)
  window.__simpleMusicPlayer = {
    loadPlaylistForSource,
    playIndex,
    getSongs: () => songs,
    getCurrentIndex: () => currentIndex,
  };

})();

