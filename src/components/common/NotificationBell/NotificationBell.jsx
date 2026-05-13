import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../../../services/api';
import './NotificationBell.css';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=20');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Calculate the fixed position of the dropdown relative to the bell button
  const calculateDropdownPos = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const dropdownWidth = window.innerWidth <= 480 ? window.innerWidth - 24 : 380;
    const rightEdge = window.innerWidth - rect.right;
    // Clamp so it never goes off-screen on the left
    const clampedRight = Math.max(8, rightEdge);
    setDropdownPos({
      top: rect.bottom + 8,
      right: clampedRight,
    });
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      calculateDropdownPos();
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate position on scroll or resize so dropdown follows the bell
  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = () => calculateDropdownPos();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, calculateDropdownPos]);

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'referral_received': return '🩺';
      case 'referral_accepted': return '✅';
      case 'referral_denied': return '❌';
      case 'doctor_assigned': return '👨‍⚕️';
      default: return '📢';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell"
        onClick={handleToggle}
        ref={bellRef}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown"
          ref={dropdownRef}
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllRead}>
                <CheckCheck size={16} /> Mark all read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">
                      {formatTime(notif.createdAt)}
                    </div>
                  </div>
                  {!notif.isRead && (
                    <div className="notification-unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};