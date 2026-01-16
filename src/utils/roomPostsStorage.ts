export interface RoomPost {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  authorName: string;
}

const POSTS_STORAGE_KEY = 'collectible.roomPosts';

const loadAllPosts = (): RoomPost[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(POSTS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as RoomPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load room posts', error);
    return [];
  }
};

const saveAllPosts = (posts: RoomPost[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
};

export const loadRoomPosts = (roomId: string) => {
  return loadAllPosts().filter((post) => post.roomId === roomId);
};

export const addRoomPost = (post: RoomPost) => {
  const posts = loadAllPosts();
  const next = [post, ...posts];
  saveAllPosts(next);
  return next.filter((entry) => entry.roomId === post.roomId);
};

export const generatePostId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto.randomUUID() as string).slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 8);
};
