import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import { getImageUrl } from './utils/storageHelpers';
import { useIsMobile } from './hooks/useIsMobile';

type ChatMessage = {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
};

type Conversation = {
  id: string;
  otherUserId: string;
  name: string;
  avatarUrl?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount: number;
  isTyping?: boolean;
  messages: ChatMessage[];
};

type ChatContextValue = {
  conversations: Conversation[];
  selectedId: string | null;
  selectConversation: (id: string) => void;
  isMobile: boolean;
};

const client = generateClient<Schema>();

const ChatContext = createContext<ChatContextValue | null>(null);

const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('Chat components must be used within ChatProvider.');
  }
  return ctx;
};

export function ChatProvider({
  children,
  openConversationForUserId,
  onConversationOpened,
}: {
  children: React.ReactNode;
  openConversationForUserId?: string | null;
  onConversationOpened?: () => void;
}) {
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isMobile) {
      setSelectedId(null);
      return;
    }
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [isMobile, conversations, selectedId]);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload?.sub as string | undefined;
        setCurrentUserId(userId ?? null);
      } catch (error) {
        console.error('Failed to load user session', error);
      }
    };
    loadUserId();
  }, [isMobile]);

  const fetchFriendUserIds = async (userId: string) => {
    const { data } = await client.models.Friendship.list({
      filter: { userId: { eq: userId } },
    });
    return (data || []).map((friendship) => friendship.friendUserId).filter(Boolean) as string[];
  };

  const buildConversationList = async (userId: string, friendIds: string[]) => {
    const { data } = await client.models.Conversation.list({
      filter: { participantUserIds: { contains: userId } },
      limit: 200,
    });
    const conversationsForUser = (data || []).map((conversation) => {
      const otherUserId = (conversation.participantUserIds || []).find((id) => id !== userId) || '';
      return { conversation, otherUserId };
    }).filter((entry) => entry.otherUserId && friendIds.includes(entry.otherUserId));

    const profiles = await Promise.all(
      conversationsForUser.map(async (entry) => {
        const { data: byOwner } = await client.models.Profile.list({
          filter: { ownerId: { eq: entry.otherUserId } },
        });
        const profile = byOwner?.[0];
        if (!profile) {
          const { data: byId } = await client.models.Profile.get({ id: entry.otherUserId });
          return { ...entry, profile: byId ?? null };
        }
        return { ...entry, profile };
      })
    );

    const resolved = await Promise.all(
      profiles.map(async (entry) => ({
        ...entry,
        avatar: entry.profile?.avatarUrl ? (await getImageUrl(entry.profile.avatarUrl)) ?? undefined : undefined,
      }))
    );

    return resolved.map((entry) => ({
      id: entry.conversation.id,
      otherUserId: entry.otherUserId,
      name: entry.profile?.displayName || entry.profile?.username || entry.profile?.nickname || 'Unknown user',
      avatarUrl: entry.avatar,
      lastMessage: entry.conversation.lastMessage || '',
      timestamp: entry.conversation.updatedAt || undefined,
      unreadCount: 0,
      messages: [],
    }));
  };

  useEffect(() => {
    let cancelled = false;
    const loadConversations = async () => {
      if (!currentUserId) {
        setConversations([]);
        return;
      }
      try {
        const friends = await fetchFriendUserIds(currentUserId);
        if (cancelled) return;
        const list = await buildConversationList(currentUserId, friends);
        if (!cancelled) {
          setConversations(list);
        }
      } catch (error) {
        console.error('Failed to load conversations', error);
        if (!cancelled) {
          setConversations([]);
        }
      }
    };
    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !openConversationForUserId) {
      return;
    }

    const openConversation = async () => {
      try {
        const friends = await fetchFriendUserIds(currentUserId);
        if (!friends.includes(openConversationForUserId)) {
          onConversationOpened?.();
          return;
        }

        const { data } = await client.models.Conversation.list({
          filter: { participantUserIds: { contains: currentUserId } },
          limit: 200,
        });
        let existing = (data || []).find((conversation) =>
          (conversation.participantUserIds || []).includes(openConversationForUserId)
        );

        if (!existing) {
          const created = await client.models.Conversation.create({
            participantUserIds: [currentUserId, openConversationForUserId],
            updatedAt: new Date().toISOString(),
          });
          existing = created.data ?? undefined;
        }

        if (existing) {
          setSelectedId(existing.id);
          const list = await buildConversationList(currentUserId, friends);
          setConversations(list);
        }
      } catch (error) {
        console.error('Failed to open conversation', error);
      } finally {
        onConversationOpened?.();
      }
    };

    openConversation();
  }, [currentUserId, openConversationForUserId, onConversationOpened]);

  const selectConversation = (id: string) => {
    if (!id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  };

  const value = useMemo(
    () => ({
      conversations,
      selectedId,
      selectConversation,
      isMobile,
    }),
    [conversations, selectedId, isMobile]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatTimestamp = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function ChatConversationList() {
  const { conversations, selectedId, selectConversation, isMobile } = useChatContext();

  if (isMobile && selectedId) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      padding: '1rem',
      border: '1px solid #e5e7eb',
      marginTop: '2rem',
      height: '100%',
      minHeight: '600px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Conversations</h3>
      {conversations.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '0.95rem',
        }}>
          Go make some friends
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {conversations.map((conversation) => {
            const isActive = conversation.id === selectedId;
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => selectConversation(conversation.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#e5e7eb' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#d1d5db',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {conversation.avatarUrl ? (
                    <img
                      src={conversation.avatarUrl}
                      alt={conversation.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials(conversation.name)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conversation.name}
                    </span>
                    {conversation.timestamp && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatTimestamp(conversation.timestamp)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conversation.lastMessage}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '999px',
                        backgroundColor: '#111827',
                        color: '#fff',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 6px',
                      }}>
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatSection() {
  const { conversations, selectedId, selectConversation, isMobile } = useChatContext();
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) || null;

  if (isMobile && !selectedConversation) {
    return null;
  }

  if (!selectedConversation) {
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid #e5e7eb',
        marginTop: '2rem',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
      }}>
        Select a conversation to start chatting.
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      marginTop: '2rem',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '600px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 1,
      }}>
        {isMobile && (
          <button
            type="button"
            onClick={() => selectConversation('')}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {selectedConversation.avatarUrl ? (
            <img
              src={selectedConversation.avatarUrl}
              alt={selectedConversation.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            getInitials(selectedConversation.name)
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{selectedConversation.name}</div>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {selectedConversation.messages.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            No messages yet. Start the conversation from the message input.
          </div>
        ) : (
          selectedConversation.messages.map((message) => {
            const isMine = message.sender === 'me';
            return (
              <div
                key={message.id}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  backgroundColor: isMine ? '#111827' : '#fff',
                  color: isMine ? '#fff' : '#111827',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ fontSize: '0.9rem' }}>{message.text}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem', textAlign: 'right' }}>
                  {message.time}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedConversation.isTyping && (
        <div style={{ padding: '0 1rem 0.5rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>
          {selectedConversation.name} is typing...
        </div>
      )}

      <div style={{
        padding: '1rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: '#f8f9fa',
      }}>
        <input
          type="text"
          placeholder="Type a message..."
          disabled
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            backgroundColor: '#ffffff',
            color: '#999',
            cursor: 'not-allowed',
          }}
        />
        <button
          disabled
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Send size={18} />
          Send
        </button>
      </div>
    </div>
  );
}
