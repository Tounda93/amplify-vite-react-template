import { useEffect, useRef, useState } from 'react';
import { Edit, Play, Pause, SkipForward } from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useIsMobile } from '../hooks/useIsMobile';
import { isAdminEmail } from '../constants/admins';

// YouTube IFrame API type declarations
interface YTPlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

interface YTPlayerEvent {
  data: number;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: {
    autoplay?: number;
    controls?: number;
    mute?: number;
    loop?: number;
    playlist?: string;
    modestbranding?: number;
  };
  events?: {
    onReady?: () => void;
    onStateChange?: (event: YTPlayerEvent) => void;
  };
}

interface YTNamespace {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
  PlayerState: {
    PLAYING: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const HERO_STORAGE_KEY = 'collectible_hero_content';

interface HeroContent {
  imageUrl?: string;
  videoUrl?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  todaysHighlight?: string;
}

const DEFAULT_CONTENT: HeroContent = {
  videoUrl: 'https://www.youtube.com/watch?v=bI_mT2SWWOI',
  imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=2000&q=80&auto=format&fit=crop',
  title: 'Welcome to Collectible',
  subtitle: 'Curated encyclopedia for enthusiasts by enthusiasts.',
  ctaText: 'Explore WikiCars',
  ctaLink: '#section=wikicars',
  todaysHighlight: "Today's pick",
};

export default function HeroCarousel() {
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_CONTENT);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<HeroContent>(DEFAULT_CONTENT);
  const isMobile = useIsMobile();
  const [isHeroExpanded, setHeroExpanded] = useState(false);
  const heroHeight = '80vh';
  const controlButtonWidth = isMobile ? 60 : 100;
  const controlButtonHeight = isMobile ? 28 : 42;
  const controlIconSize = isMobile ? 12 : 18;
  const showReadMore = isMobile && !isHeroExpanded;
  const hasCTA = Boolean(heroContent.ctaText && heroContent.ctaLink);

  const playerRef = useRef<YTPlayer | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const session = await fetchAuthSession();
        const email = session.tokens?.idToken?.payload?.email as string | undefined;
        setIsAdmin(isAdminEmail(email));
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // Load persisted hero config on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HERO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as HeroContent;
        const merged = { ...DEFAULT_CONTENT, ...parsed };
        setHeroContent(merged);
        setFormState(merged);
      }
    } catch (err) {
      console.error('Failed to load saved hero content', err);
    }
  }, []);

  const persistHeroContent = (content: HeroContent) => {
    try {
      localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(content));
    } catch (err) {
      console.error('Failed to persist hero content', err);
    }
  };

  // Load YouTube API when needed
  useEffect(() => {
    if (!heroContent.videoUrl) return;

    const existing = document.getElementById('youtube-iframe-api');
    if (existing) return;

    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }, [heroContent.videoUrl]);

  // Initialize player when API ready
  useEffect(() => {
    if (!heroContent.videoUrl) return;
    const videoId = extractYouTubeId(heroContent.videoUrl);
    if (!videoId) return;

    const onYouTubeIframeAPIReady = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
        return;
      }

      playerRef.current = new window.YT!.Player('hero-video-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          mute: 1,
          loop: 1,
          playlist: videoId,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
            setIsPlaying(true);
            playerRef.current?.playVideo();
          },
          onStateChange: (event: YTPlayerEvent) => {
            setIsPlaying(event.data === window.YT!.PlayerState.PLAYING);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, [heroContent.videoUrl]);

  const extractYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:v=|be\/)([\w-]{11})/);
    return match ? match[1] : null;
  };

  const handleSave = () => {
    setHeroContent(formState);
    persistHeroContent(formState);
    setEditing(false);
  };

  const handlePlayPause = () => {
    if (!playerRef.current || !playerReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSkip = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0, true);
    playerRef.current.playVideo();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: heroHeight }}>
      <div style={{ position: 'relative', width: '100%', minHeight: heroHeight, height: heroHeight, maxHeight: heroHeight, overflow: 'hidden' }}>
        {heroContent.videoUrl ? (
          <div style={{ width: '100%', height: '100%' }}>
            <div id="hero-video-player" style={{ width: '100%', height: '100%' }} />
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${heroContent.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: isMobile ? '24px' : '50px',
            left: isMobile ? '1rem' : '5%',
            right: isMobile ? '1rem' : undefined,
            color: 'white',
            maxWidth: isMobile ? 'calc(100% - 2rem)' : '520px',
            zIndex: 2,
          }}
        >
          {heroContent.todaysHighlight && (
            <div
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                fontSize: isMobile ? '9px' : '12px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '20px',
              }}
            >
              {heroContent.todaysHighlight}
            </div>
          )}
          <h1 style={{ fontSize: isMobile ? '26px' : '40px', fontWeight: 700, lineHeight: 1.1, marginBottom: '16px' }}>
            {heroContent.title}
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '18px',
            marginBottom: '20px',
            color: 'rgba(255,255,255,0.85)',
            display: isMobile && !isHeroExpanded ? '-webkit-box' : 'block',
            WebkitLineClamp: isMobile && !isHeroExpanded ? 3 : 'unset',
            WebkitBoxOrient: isMobile && !isHeroExpanded ? 'vertical' : undefined,
            overflow: isMobile && !isHeroExpanded ? 'hidden' : undefined
          }}>
            {heroContent.subtitle}
          </p>
          {(showReadMore || hasCTA) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: showReadMore && hasCTA ? '1rem' : 0
            }}>
              {showReadMore && (
                <button
                  type="button"
                  onClick={() => setHeroExpanded(true)}
                  style={{
                    border: '1px solid rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(15,23,42,0.45)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Read more
                </button>
              )}
              {hasCTA && (
                <a
                  href={heroContent.ctaLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '12px 28px',
                    borderRadius: '999px',
                    backgroundColor: '#737373ff',
                    color: 'white',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: isMobile ? '12px' : '14px'
                  }}
                >
                  {heroContent.ctaText}
                </a>
              )}
            </div>
          )}
        </div>

        {heroContent.videoUrl && (
          <div
            style={{
              position: 'absolute',
              bottom: isMobile ? '12px' : '20px',
              right: isMobile ? '12px' : '20px',
              zIndex: 3,
              display: 'flex',
              gap: isMobile ? '0.35rem' : '0.5rem',
            }}
          >
            <button
              onClick={handlePlayPause}
              style={{
                width: `${controlButtonWidth}px`,
                height: `${controlButtonHeight}px`,
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.5)',
                backgroundColor: 'rgba(15,23,42,0.55)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isPlaying ? <Pause size={controlIconSize} /> : <Play size={controlIconSize} />}
            </button>
            <button
              onClick={handleSkip}
              style={{
                width: `${controlButtonWidth}px`,
                height: `${controlButtonHeight}px`,
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.5)',
                backgroundColor: 'rgba(15, 23, 42, 0.15)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <SkipForward size={controlIconSize} />
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div style={{ position: 'absolute', top: '110px', right: '20px', zIndex: 4 }}>
          <button
            onClick={() => {
              setFormState(heroContent);
              setEditing(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.2rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.5)',
              backgroundColor: 'rgba(15,23,42,0.5)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <Edit size={16} />
            Edit hero
          </button>
        </div>
      )}

      {isAdmin && editing && (
        <div
          style={{
            margin: '1.5rem auto 0 auto',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
            maxWidth: '960px',
            width: '94%',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Hero media configuration</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="YouTube URL"
              value={formState.videoUrl}
              onChange={(e) => setFormState({ ...formState, videoUrl: e.target.value })}
              style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              placeholder="Fallback image URL"
              value={formState.imageUrl}
              onChange={(e) => setFormState({ ...formState, imageUrl: e.target.value })}
              style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              placeholder="Hero title"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              placeholder="Today's pick label"
              value={formState.todaysHighlight || ''}
              onChange={(e) => setFormState({ ...formState, todaysHighlight: e.target.value })}
              style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <textarea
              placeholder="Subtitle / description"
              value={formState.subtitle}
              onChange={(e) => setFormState({ ...formState, subtitle: e.target.value })}
              rows={3}
              style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}
            />
            <input
              type="text"
              placeholder="CTA text"
              value={formState.ctaText}
              onChange={(e) => setFormState({ ...formState, ctaText: e.target.value })}
              style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              placeholder="CTA link"
              value={formState.ctaLink}
              onChange={(e) => setFormState({ ...formState, ctaLink: e.target.value })}
              style={{ padding: '0.7rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#111827',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save hero
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#111827',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
