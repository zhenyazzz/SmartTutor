import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Send, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { messageService, ChatUser, Message } from '../../services/messageService';
import { authService } from '../../services/authService';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Получаем ID текущего пользователя
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id.toString());
    }
  }, []);

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
    if (selectedChat && currentUserId) {
      loadMessages(selectedChat.conversationId);
      // Отмечаем сообщения как прочитанные
      messageService.markAsRead(selectedChat.conversationId).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.conversationId, currentUserId]);

  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling для обновления сообщений
  useEffect(() => {
    if (selectedChat && currentUserId) {
      // Очищаем предыдущий интервал
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Устанавливаем новый интервал для обновления сообщений каждые 3 секунды
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(selectedChat.conversationId, true); // true = silent update
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [selectedChat?.conversationId, currentUserId]);

  // Обновление списка бесед каждые 5 секунд
  useEffect(() => {
    if (!currentUserId) return;
    
    const interval = setInterval(() => {
      if (!loading) {
        loadConversations(true); // true = silent update
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, currentUserId]);

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
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
      } else if (conversations.length > 0 && !selectedChat && !silent) {
        setSelectedChat(conversations[0]);
      }
    } catch (err: any) {
      if (!silent) {
        console.error('Error loading conversations:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Не удалось загрузить беседы';
        setError(errorMessage);
        
        // Если ошибка авторизации, показываем специальное сообщение
        if (err.response?.status === 401) {
          setError('Ошибка авторизации. Пожалуйста, войдите заново.');
          console.warn('Authentication error in chat. User may need to re-login.');
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadMessages = async (conversationId: string, silent = false) => {
    try {
      if (!silent) {
        setLoadingMessages(true);
        setError(null);
      }
      const messagesData = await messageService.getMessages(conversationId);
      
      // Нормализуем senderId для сравнения с текущим пользователем
      const normalizedMessages = messagesData.map(msg => ({
        ...msg,
        senderId: msg.senderId === 'me' || (currentUserId && msg.senderId === currentUserId) ? 'me' : msg.senderId
      }));
      
      setMessages(normalizedMessages);
      
      if (!silent) {
        // Отмечаем сообщения как прочитанные
        messageService.markAsRead(conversationId).catch(console.error);
      }
    } catch (err: any) {
      if (!silent) {
        console.error('Error loading messages:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить сообщения');
      }
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

      // Нормализуем senderId для отправленного сообщения
      const normalizedMessage = {
        ...sentMessage,
        senderId: 'me'
      };

      // Добавляем отправленное сообщение в список
      setMessages([...messages, normalizedMessage]);
      setNewMessage('');

      // Обновляем список бесед, чтобы обновить последнее сообщение
      await loadConversations(true);
      
      // Прокручиваем к новому сообщению
      setTimeout(() => scrollToBottom(), 100);
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

  // Форматирование даты для разделителя сообщений
  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

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
                <h3 className="text-gray-900 font-semibold">{selectedChat.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedChat.role === 'tutor' ? 'Репетитор' : 'Студент'}
                </p>
              </div>
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
          <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
            {loadingMessages ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="size-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">Нет сообщений</p>
                  <p className="text-sm text-gray-500 mt-2">Начните общение, отправив первое сообщение</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isMe = message.senderId === 'me' || (currentUserId && message.senderId === currentUserId);
                  const showDateSeparator = index === 0 || 
                    new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();
                  
                  return (
                    <React.Fragment key={message.id}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {formatMessageDate(message.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2 rounded-lg shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <p
                              className={`text-xs ${
                                isMe ? 'text-indigo-200' : 'text-gray-500'
                              }`}
                            >
                              {message.time}
                            </p>
                            {isMe && message.read && (
                              <span className="text-xs text-indigo-200">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !sending) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
                disabled={sending}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={sending || !newMessage.trim()}
                className="px-4"
              >
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

