document.addEventListener('DOMContentLoaded', function() {
    loadStoredKeys();
    setupVisibilityToggles();
});

function loadStoredKeys() {
    chrome.storage.local.get(['clientId', 'clientSecret', 'youtubeApiKey'], function(items) {
        document.getElementById('clientId').value = items.clientId || '';
        document.getElementById('clientSecret').value = items.clientSecret || '';
        document.getElementById('youtubeApiKey').value = items.youtubeApiKey || '';

        document.querySelectorAll('#clientId, #clientSecret, #youtubeApiKey').forEach(input => {
            input.addEventListener('input', function() {
                let clientId = document.getElementById('clientId').value;
                let clientSecret = document.getElementById('clientSecret').value;
                let youtubeApiKey = document.getElementById('youtubeApiKey').value;

                chrome.storage.local.set({ clientId, clientSecret, youtubeApiKey });
            });
        });
    });
}

function setupVisibilityToggles() {
    document.querySelectorAll('.toggle-visibility').forEach(toggle => {
        toggle.addEventListener('click', function() {
            let targetInput = document.getElementById(this.getAttribute('data-target'));
            if (targetInput.type === "password") {
                targetInput.type = "text";
                this.textContent = "Hide";
            } else {
                targetInput.type = "password";
                this.textContent = "Show";
            }
        });
    });
}

document.getElementById('convert').addEventListener('click', async function() {
    const spotifyLink = document.getElementById('spotifyLink').value;
    if (!spotifyLink) {
        document.getElementById('result').textContent = 'Please enter a Spotify link.';
        return;
    }

    const trackId = extractSpotifyTrackID(spotifyLink);
    if (!trackId) {
        document.getElementById('result').textContent = 'Invalid Spotify link.';
        return;
    }

    chrome.storage.local.get(['clientId', 'clientSecret', 'youtubeApiKey'], async (items) => {
        const { clientId, clientSecret, youtubeApiKey } = items;

        try {
            const accessToken = await getSpotifyAccessToken(clientId, clientSecret);
            const trackDetails = await fetchSpotifyTrackDetails(trackId, accessToken);
            const artist = trackDetails.artists[0].name;
            const trackName = trackDetails.name;
            const youtubeLink = await searchYouTube(artist, trackName, youtubeApiKey);

            document.getElementById('result').innerHTML = `YouTube Link: <a href="${youtubeLink}" target="_blank">${youtubeLink}</a>`;
        } catch (error) {
            document.getElementById('result').textContent = `Error: ${error.message}`;
        }
    });
});

function extractSpotifyTrackID(spotifyLink) {
    const match = spotifyLink.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

async function getSpotifyAccessToken(clientId, clientSecret) {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa(clientId + ':' + clientSecret));
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    const data = await response.json();
    return data.access_token;
}

async function fetchSpotifyTrackDetails(trackId, accessToken) {
    const apiUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
    const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        throw new Error(`Spotify API request failed: ${response.statusText}`);
    }

    const trackDetails = await response.json();
    return trackDetails; // Contains track information such as name and artists
}

async function searchYouTube(artist, trackName, apiKey) {
    const query = `${artist} - ${trackName} official video`;
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=1`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error("No results found on YouTube.");
    }

    const videoId = data.items[0].id.videoId;
    return `https://www.youtube.com/watch?v=${videoId}`;
}
