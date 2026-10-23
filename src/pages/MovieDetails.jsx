import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "./MovieDetails.css";

const BACKEND_URL = "http://127.0.0.1:8000";

function getMediaUrl(url) {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) return url;

  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getMovieVideos(movie) {
  const videos = [];

  if (Array.isArray(movie?.quality_files)) {
    movie.quality_files.forEach((item) => {
      if (item.file) {
        videos.push({
          id: item.id || item.quality,
          quality: item.quality || "Video",
          url: getMediaUrl(item.file),
        });
      }
    });
  }

  if (movie?.movie_file) {
    const url = getMediaUrl(movie.movie_file);

    if (!videos.some((item) => item.url === url)) {
      videos.push({
        id: "main",
        quality: movie.quality === "FULL_HD" ? "Full HD" : "HD",
        url,
      });
    }
  }

  return videos;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function MovieDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const pendingPosition = useRef(null);
  const resumeAfterQualityChange = useRef(false);

  const [movie, setMovie] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoError, setVideoError] = useState("");

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load movie information.
  useEffect(() => {
    let cancelled = false;

    async function loadMovie() {
      setLoading(true);
      setError("");
      setVideoError("");
      setMovie(null);
      setVideos([]);
      setSelectedVideoUrl("");

      try {
        const response = await API.get(`/movies/${id}/`);

        if (cancelled) return;

        const data = response.data;
        const availableVideos = getMovieVideos(data);

        setMovie(data);
        setVideos(availableVideos);
        setSelectedVideoUrl(availableVideos[0]?.url || "");

        if (availableVideos.length === 0) {
          setVideoError("No video file is available for this movie.");
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Movie details error:", err);

        setError(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            err.response?.data?.message ||
            (err.response?.status === 401
              ? "Please log in again."
              : err.response?.status === 403
                ? "You do not have permission to access this movie."
                : "Unable to load this movie. Please try again.")
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMovie();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Track fullscreen state.
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  // Clean up video.
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    };
  }, []);

  // Play or pause.
  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.error("Playback error:", err);
      setVideoError(
        "Unable to play this video. Check the file URL and format."
      );
    }
  }, []);

  // Skip forward or backward.
  const skip = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;

    const maxTime = Number.isFinite(video.duration)
      ? video.duration
      : video.currentTime + seconds;

    video.currentTime = Math.max(
      0,
      Math.min(maxTime, video.currentTime + seconds)
    );
  }, []);

  // Mute or unmute.
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);

    if (!video.muted && video.volume === 0) {
      video.volume = 1;
      setVolume(1);
    }
  }, []);

  // Change volume.
  const handleVolumeChange = (event) => {
    const value = Number(event.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    video.muted = value === 0;

    setVolume(value);
    setMuted(value === 0);
  };

  // Enter or exit fullscreen.
  const toggleFullscreen = async () => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (!document.fullscreenElement) {
        await player.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // Change video quality while preserving playback position.
  const changeQuality = (event) => {
    const nextUrl = event.target.value;
    if (!nextUrl || nextUrl === selectedVideoUrl) return;

    const video = videoRef.current;

    pendingPosition.current = video?.currentTime || 0;
    resumeAfterQualityChange.current = Boolean(video && !video.paused);

    setVideoError("");
    setSelectedVideoUrl(nextUrl);
  };

  // Restore playback after the selected quality loads.
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    setVolume(video.volume);
    setMuted(video.muted);

    if (pendingPosition.current !== null) {
      const position = pendingPosition.current;
      pendingPosition.current = null;

      if (Number.isFinite(video.duration)) {
        video.currentTime = Math.min(position, video.duration);
      }

      if (resumeAfterQualityChange.current) {
        resumeAfterQualityChange.current = false;
        video.play().catch(console.error);
      }
    }
  };

  // Keyboard shortcuts.
  useEffect(() => {
    const handleKeyboard = (event) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
            target.tagName
          ))
      ) {
        return;
      }

      if (!videoRef.current) return;

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowLeft") {
        skip(-10);
      } else if (event.key === "ArrowRight") {
        skip(10);
      } else if (event.key.toLowerCase() === "m") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [togglePlay, skip, toggleMute]);

  if (loading) {
    return (
      <div className="movie-details-page movie-loading-page">
        <div className="movie-loader" />
        <p>Loading movie...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-details-page movie-error-page">
        <div className="movie-error-box">
          <div className="movie-error-icon">!</div>
          <h2>Movie Not Available</h2>
          <p>{error || "Movie not found."}</p>

          <button
            type="button"
            className="movie-back-page-button"
            onClick={() => navigate("/movies")}
          >
            ← Back to Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-details-page">
      <header className="movie-top-bar">
        <button
          type="button"
          className="movie-page-back"
          onClick={() => navigate("/movies")}
        >
          ← Movies
        </button>

        <h1>{movie.title}</h1>
      </header>

      <main>
        <section
          ref={playerRef}
          className="custom-player"
          aria-label="Movie video player"
        >
          {isFullscreen && (
            <button
              type="button"
              className="movie-back-button"
              onClick={() => navigate("/movies")}
            >
              ← Back to Movies
            </button>
          )}

          {selectedVideoUrl ? (
            <video
              key={selectedVideoUrl}
              ref={videoRef}
              className="movie-video"
              src={selectedVideoUrl}
              controls
              controlsList="nodownload"
              playsInline
              preload="metadata"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={(event) =>
                setCurrentTime(event.currentTarget.currentTime)
              }
              onDurationChange={(event) => {
                const value = event.currentTarget.duration;
                setDuration(Number.isFinite(value) ? value : 0);
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onVolumeChange={(event) => {
                setMuted(event.currentTarget.muted);
                setVolume(event.currentTarget.volume);
              }}
              onError={() => {
                setVideoError(
                  "The video could not be played. Check the uploaded file and media URL.",
                );
              }}
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="no-video">
              <span>🎬</span>
              <p>No video is available for this movie.</p>
            </div>
          )}

          {videoError && (
            <p className="movie-video-error" role="alert">
              {videoError}
            </p>
          )}

          {videos.length > 1 && (
            <div className="movie-quality-selector">
              <label htmlFor="movie-quality">Video quality</label>

              <select
                id="movie-quality"
                value={selectedVideoUrl}
                onChange={changeQuality}
              >
                {videos.map((item) => (
                  <option key={item.id} value={item.url}>
                    {item.quality}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="movie-player-actions">
            {selectedVideoUrl && (
              <>
                <button type="button" onClick={togglePlay}>
                  {playing ? "❚❚ Pause" : "▶ Play"}
                </button>

                <button type="button" onClick={() => skip(-10)}>
                  ↶ 10 sec
                </button>

                <button type="button" onClick={() => skip(10)}>
                  10 sec ↷
                </button>

                <button type="button" onClick={toggleMute}>
                  {muted ? "🔇 Unmute" : "🔊 Mute"}
                </button>

                <label>
                  Volume
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                </label>

                <span className="movie-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <button type="button" onClick={toggleFullscreen}>
                  ⛶ Fullscreen
                </button>
              </>
            )}
          </div>
        </section>

        {/* Movie information only. No Download Movie button or section. */}
        <section className="movie-information">
          <div className="movie-info-main">
            <div className="movie-logo-container">
              {movie.logo ? (
                <img
                  src={getMediaUrl(movie.logo)}
                  alt={`${movie.title} poster`}
                  className="movie-logo"
                />
              ) : (
                <div className="movie-logo-placeholder">🎬</div>
              )}
            </div>

            <div className="movie-info-content">
              <span className="movie-info-label">CINEHUB MOVIE</span>

              <h2>{movie.title}</h2>

              <div className="movie-meta-info">
                {movie.release_date && <span>📅 {movie.release_date}</span>}

                {movie.language && <span>🌐 {movie.language}</span>}

                {movie.rating !== null && movie.rating !== undefined && (
                  <span>⭐ {movie.rating}/10</span>
                )}

                {movie.quality && (
                  <span>
                    🎞️ {movie.quality === "FULL_HD" ? "Full HD" : movie.quality}
                  </span>
                )}
              </div>

              {movie.genres && (
                <p className="movie-genres-info">{movie.genres}</p>
              )}

              {movie.director && (
                <p>
                  <strong>Director:</strong> {movie.director}
                </p>
              )}

              {movie.starring && (
                <p>
                  <strong>Starring:</strong> {movie.starring}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MovieDetails;
