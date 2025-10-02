import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const CLIENT_ID = "8e77974a64774b40aa10a3b97f7e8ffd"; 
const REDIRECT_URI = "https://github.com/lcanunayon/spotify-top-tracker.git"; // change to your deployed domain
const SCOPES = "user-read-currently-playing user-read-playback-state";

export default function SpotifyTracker() {
  const [token, setToken] = useState(null);
  const [songs, setSongs] = useState({});

  // Step 1: Handle Spotify Auth
  useEffect(() => {
    const hash = window.location.hash;
    let t = window.localStorage.getItem("token");

    if (!t && hash) {
      t = new URLSearchParams(hash.replace("#", "?")).get("access_token");
      window.location.hash = "";
      window.localStorage.setItem("token", t);
    }
    setToken(t);
  }, []);

  // Step 2: Poll Spotify API for current track
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data && data.item) {
          const songName = `${data.item.name} - ${data.item.artists.map(a => a.name).join(", ")}`;
          setSongs((prev) => ({
            ...prev,
            [songName]: (prev[songName] || 0) + 1,
          }));
        }
      }
    }, 5000); // check every 5 seconds

    return () => clearInterval(interval);
  }, [token]);

  // Step 3: Sort songs
  const sortedSongs = Object.entries(songs).sort((a, b) => b[1] - a[1]);
  const maxPlays = sortedSongs.length ? sortedSongs[0][1] : 1;

  // Step 4: Render UI
  if (!token) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <h1 className="text-3xl font-bold mb-4">Spotify Play Tracker</h1>
        <a
          href={`https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES}`}
          className="px-6 py-3 bg-green-500 rounded-xl hover:bg-green-600 transition font-semibold"
        >
          Connect with Spotify
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Spotify Play Tracker</h1>
        <p className="text-gray-400 max-w-xl">
          Tracks how many times each song is played while this app is running. 
          Data is pulled live from your Spotify account.
        </p>
      </header>

      <div className="w-full max-w-2xl space-y-4">
        {sortedSongs.map(([song, count], index) => (
          <motion.div
            key={song}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-xl p-4 shadow-md"
          >
            <div className="flex justify-between mb-1">
              <span className="font-medium">{index + 1}. {song}</span>
              <span className="text-gray-400">{count} plays</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-3 bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${(count / maxPlays) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}