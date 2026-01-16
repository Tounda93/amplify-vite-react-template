export interface RoomRecord {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  isPublic: boolean;
  allowMemberEvents: boolean;
  rules: string[];
  links: { title: string; url: string }[];
  requirementsToJoin: string;
  createdAt: string;
  memberCount?: number;
  creatorName?: string;
  creatorId?: string;
}

const ROOMS_STORAGE_KEY = 'collectible.rooms';

export const getRoomShareUrl = (roomId: string) => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/rooms/${roomId}`;
};

export const loadRooms = (): RoomRecord[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(ROOMS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as RoomRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load rooms', error);
    return [];
  }
};

export const saveRooms = (rooms: RoomRecord[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
};

export const addRoom = (room: RoomRecord) => {
  const rooms = loadRooms();
  const next = [room, ...rooms];
  saveRooms(next);
  return next;
};

export const getRoomById = (roomId: string) => {
  const rooms = loadRooms();
  return rooms.find((room) => room.id === roomId) || null;
};

export const generateRoomId = (title: string) => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto.randomUUID() as string).slice(0, 8)
    : Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : suffix;
};
