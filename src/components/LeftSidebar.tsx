import { MessageSquare, Bell, ShoppingBag, LucideIcon } from "lucide-react";
import { useIsMobile } from '../hooks/useIsMobile';

/**
 * =====================================================
 * LEFT SIDEBAR COMPONENT
 * =====================================================
 *
 * Fixed sidebar on the left side of the screen containing
 * My Garage (with profile picture), Chat, Notifications, Shop.
 * Hidden on mobile (these buttons are in the footer).
 *
 * =====================================================
 */

interface LeftSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userProfilePicture?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  useProfilePicture?: boolean;
}

export default function LeftSidebar({
  activeSection,
  onSectionChange,
  userProfilePicture
}: LeftSidebarProps) {
  const isMobile = useIsMobile();

  // Don't render on mobile - these buttons are in the footer
  if (isMobile) {
    return null;
  }

  const sidebarItems: SidebarItem[] = [
    { id: "garage", label: "My Garage", useProfilePicture: true },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "shop", label: "Shop", icon: ShoppingBag },
  ];

  const textColor = '#000000';
  const navInactiveColor = '#000000';

  // Default profile picture placeholder
  const defaultProfilePic = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';

  return (
    <aside style={{
      position: 'sticky',
      top: '5rem',
      alignSelf: 'flex-start',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '1rem 0 1rem 1rem',
      background: 'transparent',
      border: 'none',
    }}>
      {sidebarItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
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
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundImage: `url(${userProfilePicture || defaultProfilePic})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: isActive ? '2px solid #000' : '1px solid #ccc',
              }} />
            ) : IconComponent ? (
              <IconComponent
                size={30}
                strokeWidth={isActive ? 2 : 1.5}
              />
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
