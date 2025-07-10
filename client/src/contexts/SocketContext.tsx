import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_API = import.meta.env.VITE_SOCKET_API;

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [_, setForceUpdate] = useState(0); // To force rerender on socket connect

  useEffect(() => {
    if (user) {
      // Get token from cookies (if needed for auth)
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))?.split('=')[1];
      console.log(token)
      console.log('SOCKET_API:', SOCKET_API);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      socketRef.current = io(SOCKET_API, {
        auth: { token },
        withCredentials: true
      });
      // Debug logging
      socketRef.current.on('connect', () => {
        console.log('[socket.io] Connected:', socketRef.current?.id);
        setForceUpdate(x => x + 1);
      });
      socketRef.current.on('disconnect', (reason) => {
        console.log('[socket.io] Disconnected:', reason);
      });
      socketRef.current.on('connect_error', (err) => {
        console.error('[socket.io] Connection error:', err.message);
      });
      socketRef.current.on('error', (err) => {
        console.error('[socket.io] Server error:', err);
      });
      socketRef.current.on('joined_chat', (chatId) => {
        console.log('[socket.io] Joined chat:', chatId);
      });
      socketRef.current.on('left_chat', (chatId) => {
        console.log('[socket.io] Left chat:', chatId);
      });
    }
    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}; 