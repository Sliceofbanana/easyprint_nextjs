'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Send, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from './ui/Use-Toast';

interface Message {
  id: string;
  subject: string;
  message: string;
  status: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

const UserSupport = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.subject || !newMessage.message) {
      toast({
        title: 'Incomplete Form',
        description: 'Please fill in both subject and message',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      toast({
        title: 'Message Sent',
        description: 'Your message has been sent to support. We will respond soon.',
      });

      setNewMessage({ subject: '', message: '' });
      fetchMessages(); // Refresh messages list
    } catch (error) {
      toast({
        title: 'Send Failed',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* New Message Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Help & Support</h2>
                  <p className="text-sm text-gray-600">Send us a message</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="What do you need help with?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="Describe your issue or question..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Message History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Messages</h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-900 mx-auto mb-4" />
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your support messages will appear here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{msg.subject}</h4>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(msg.status)}`}>
                          {getStatusIcon(msg.status)}
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{msg.message}</p>
                      {msg.response && (
                        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-900 rounded">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Admin Response:</p>
                          <p className="text-sm text-gray-700">{msg.response}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserSupport;