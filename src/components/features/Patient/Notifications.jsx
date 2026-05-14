import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import api from "../../../services/api";
import "./Notifications.css";

const Notifications = ({ onNotificationAction }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 seconds for new notifications
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications?limit=20");
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      fetchNotifications();
      if (onNotificationAction) onNotificationAction();
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      fetchNotifications();
      if (onNotificationAction) onNotificationAction();
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "vitals_alert":          return "⚠️";
      case "vitals_recorded":       return "❤️";
      case "appointment_scheduled": return "📅";
      case "appointment_updated":   return "📅";
      case "appointment_cancelled": return "❌";
      case "appointment":           return "📅";
      case "referral_received":     return "🩺";
      case "referral_accepted":     return "✅";
      case "referral_denied":       return "❌";
      case "referral_responded":    return "🩺";
      case "prescription_created":  return "💊";
      case "prescription":          return "💊";
      case "condition_added":       return "📋";
      case "doctor_assigned":       return "👨‍⚕️";
      case "profile_update":        return "👤";
      case "welcome":               return "👋";
      default:                      return "📢";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={handleMarkAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${!notif.isRead ? "unread" : ""}`}
                  onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    {notif.title && (
                      <p style={{ fontWeight: 600, marginBottom: 2 }}>
                        {notif.title}
                      </p>
                    )}
                    <p>{notif.message}</p>
                    <span className="notification-time">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.isRead && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#3B82F6",
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
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

export default Notifications;