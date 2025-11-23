import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send, Paperclip, MoreVertical, X, Phone, Video, Info, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { messageService, ChatUser, Message } from '../../services/messageService';

export function ChatSystem() {
  const [chats, setChats] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка бесед
  useEffect(() => {
    // Проверяем, что пользователь авторизован перед загрузкой
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Необходима авторизация для доступа к чату');
      setLoading(false);
      return;
    }
    loadConversations();
  }, []);

  // Загрузка сообщений при выборе беседы
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.conversationId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const conversations = await messageService.getConversations();
      setChats(conversations);
      
      // Проверяем, есть ли сохраненная беседа для автоматического выбора
      const savedConversationId = localStorage.getItem('selectedConversationId');
      if (savedConversationId) {
        const savedChat = conversations.find(chat => chat.conversationId === savedConversationId);
        if (savedChat) {
          setSelectedChat(savedChat);
          // Удаляем сохраненный ID после использования
          localStorage.removeItem('selectedConversationId');
        } else if (conversations.length > 0 && !selectedChat) {
          // Если сохраненная беседа не найдена, выбираем первую
          setSelectedChat(conversations[0]);
        }
      } else if (conversations.length > 0 && !selectedChat) {
        setSelectedChat(conversations[0]);
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Не удалось загрузить беседы';
      setError(errorMessage);
      
      // Если ошибка авторизации, показываем специальное сообщение
      if (err.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите заново.');
        console.warn('Authentication error in chat. User may need to re-login.');
        // Не делаем автоматический редирект - пусть пользователь сам решит
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      setError(null);
      const messagesData = await messageService.getMessages(conversationId);
      setMessages(messagesData);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить сообщения');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    try {
      setSending(true);
      setError(null);
      
      const sentMessage = await messageService.sendMessage(
        selectedChat.conversationId,
        newMessage
      );

      // Добавляем отправленное сообщение в список
      setMessages([...messages, sentMessage]);
      setNewMessage('');

      // Обновляем список бесед, чтобы обновить последнее сообщение
      await loadConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex">
      {/* Chats List */}
      <div className="w-80 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-gray-900 mb-4">Сообщения</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="size-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Нет бесед</p>
            </div>
          ) : (
            filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedChat?.id === chat.id ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={chat.avatar} alt={chat.name} />
                    <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-gray-900 truncate">{chat.name}</p>
                    <span className="text-xs text-gray-500">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <Badge className="size-5 p-0 flex items-center justify-center text-xs">
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  {selectedChat.avatar && <AvatarImage src={selectedChat.avatar} alt={selectedChat.name} />}
                  <AvatarFallback>{selectedChat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {selectedChat.online && (
                  <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="text-gray-900">{selectedChat.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedChat.online ? 'В сети' : 'Не в сети'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="size-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Info className="size-4" />
              </Button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 mx-4 mt-2 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="h-6 w-6 p-0 text-red-800"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="size-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Нет сообщений</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === 'me'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === 'me' ? 'text-indigo-200' : 'text-gray-500'
                      }`}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="size-4" />
              </Button>
              <Input
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                className="flex-1"
                disabled={sending}
              />
              <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="size-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">Выберите чат для начала общения</p>
          </div>
        </div>
      )}
    </div>
  );
}

