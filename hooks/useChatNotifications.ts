'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from './useSocket';
import { useToast } from '@/hooks/use-toast';

interface ChatNotificationProps {
  enabled?: boolean;
  showOnlyWhenInactive?: boolean;
}

interface MessageData {
  conversationId: string;
  message: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      image?: string;
    };
    createdAt: string;
  };
  senderId: string;
}

export function useChatNotifications({
  enabled = true,
  showOnlyWhenInactive = true
}: ChatNotificationProps = {}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { isConnected, onNewMessage } = useSocket({ autoConnect: true });
  const isActiveRef = useRef(true);
  const lastNotificationRef = useRef<string | null>(null);

  // Track if the page is visible/active
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
    };

    const handleFocus = () => {
      isActiveRef.current = true;
    };

    const handleBlur = () => {
      isActiveRef.current = false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);

  // Listen for new messages and show notifications
  useEffect(() => {
    if (!enabled || !isConnected || !session?.user?.id) return;

    const unsubscribe = onNewMessage((data: MessageData) => {
      // Don't show notification for own messages
      if (data.senderId === session.user.id) return;

      // Don't show notification if we just showed one for the same conversation
      if (lastNotificationRef.current === data.conversationId) return;
      lastNotificationRef.current = data.conversationId;

      // Don't show notification if user is active and showOnlyWhenInactive is true
      if (showOnlyWhenInactive && isActiveRef.current) return;

      const senderName = data.message.sender.name || 'Someone';
      const messageContent = data.message.content;
      const truncatedContent = messageContent.length > 50
        ? messageContent.substring(0, 50) + '...'
        : messageContent;

      // Show toast notification
      toast({
        title: `New message from ${senderName}`,
        description: truncatedContent,
        action: {
          label: 'View',
          onClick: () => {
            // Focus the chat window or navigate to chat
            const event = new CustomEvent('focusChat', {
              detail: { conversationId: data.conversationId }
            });
            window.dispatchEvent(event);
          }
        },
      });

      // Show browser notification if permission granted and page is not visible
      if (
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.hidden
      ) {
        const notification = new Notification(`New message from ${senderName}`, {
          body: truncatedContent,
          icon: data.message.sender.image || '/default-avatar.png',
          badge: '/favicon.ico',
          tag: data.conversationId, // Prevent duplicate notifications for same conversation
          requireInteraction: false,
        });

        // Click to focus chat
        notification.onclick = () => {
          window.focus();
          const event = new CustomEvent('focusChat', {
            detail: { conversationId: data.conversationId }
          });
          window.dispatchEvent(event);
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Clear the notification ref after a delay to allow subsequent notifications
      setTimeout(() => {
        lastNotificationRef.current = null;
      }, 1000);
    });

    return unsubscribe;
  }, [enabled, isConnected, session, showOnlyWhenInactive, onNewMessage]);

  return {
    isSupported: 'Notification' in window,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    requestPermission: () => {
      if ('Notification' in window) {
        return Notification.requestPermission();
      }
      return Promise.resolve('unsupported');
    }
  };
}