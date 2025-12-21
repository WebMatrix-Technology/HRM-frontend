'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  const employee = useAuthStore((state) => state.employee);

  const handleSelectConversation = (employeeId: string, employeeName: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedEmployeeName(employeeName);
  };

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-cyan-400/70">Please log in to access chat</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Chat List Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-96 flex-shrink-0"
        >
          <ChatList
            onSelectConversation={handleSelectConversation}
            selectedEmployeeId={selectedEmployeeId}
          />
        </motion.div>

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 min-w-0"
        >
          {selectedEmployeeId ? (
            <ChatWindow receiverId={selectedEmployeeId} receiverName={selectedEmployeeName} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full glass rounded-xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-gradient-primary/20 flex items-center justify-center mb-4"
              >
                <MessageCircle className="w-10 h-10 text-cyan-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-cyan-400/70 text-center max-w-md">
                Choose a conversation from the list to start chatting, or start a new conversation
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
