import { MessageSquare, Bell, ShoppingBag, Bookmark, Users, LucideIcon } from "lucide-react";
import { useIsMobile } from '../hooks/useIsMobile';
import { useAppUI } from '../context/AppUIContext';

interface LeftSidebarProps {
  userProfilePicture?: string;
  userInitials?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  useProfilePicture?: boolean;
}

export default function LeftSidebar({
  userProfilePicture,
  userInitials
}: LeftSidebarProps) {
  const { activeSection, setActiveSection } = useAppUI();
  const isMobile = useIsMobile();

  // Don't render on mobile - these buttons are in the footer
  if (isMobile) {
    return null;
  }

  const sidebarItems: SidebarItem[] = [
    { id: "garage", label: "My Garage", useProfilePicture: true },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "friends", label: "Friends", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "shop", label: "Shop", icon: ShoppingBag },
    { id: "saved", label: "Save", icon: Bookmark },
  ];

  const textColor = '#000000';
  const navInactiveColor = '#000000';

  return (
    <aside style={{
      position: 'sticky',
      top: '5rem',
      alignSelf: 'flex-start',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '2rem 0',
      background: 'transparent',
      border: 'none',
    }}>
      {sidebarItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0',
              borderRadius: '0',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: 'transparent',
              color: isActive ? textColor : navInactiveColor,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = textColor;
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = navInactiveColor;
              }
            }}
          >
            {item.useProfilePicture ? (
              userProfilePicture ? (
                <div style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  minHeight: '24px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  backgroundImage: `url(${userProfilePicture})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: isActive ? '2px solid #000' : '1px solid #ccc',
                }} />
              ) : (
                <div style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  minHeight: '24px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  background: '#111',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  border: isActive ? '2px solid #000' : '1px solid #ccc',
                }}>
                  {(userInitials || 'UU').slice(0, 2).toUpperCase()}
                </div>
              )
            ) : IconComponent ? (
              <span style={{
                width: '30px',
                height: '30px',
                minWidth: '30px',
                minHeight: '30px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconComponent
                  size={30}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </span>
            ) : null}
            <span style={{
              fontSize: '17px',
              fontWeight: isActive ? 600 : 500,
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
