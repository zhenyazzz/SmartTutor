import React, { useState } from 'react';
import { Calendar, Clock, User, Star, MessageSquare, BookOpen, DollarSign, Settings, LogIn } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Activity {
  id: string;
  type: 'lesson' | 'message' | 'review' | 'payment' | 'profile' | 'login';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  details?: any;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'lesson',
    title: 'Проведено занятие',
    description: 'Занятие с Марией Петровой по математике',
    timestamp: '2024-11-22T14:00:00',
    icon: BookOpen,
    iconColor: 'text-blue-500',
    details: { duration: '60 мин', subject: 'Математика' }
  },
  {
    id: '2',
    type: 'message',
    title: 'Новое сообщение',
    description: 'Получено сообщение от Александра Сидорова',
    timestamp: '2024-11-22T10:30:00',
    icon: MessageSquare,
    iconColor: 'text-green-500'
  },
  {
    id: '3',
    type: 'review',
    title: 'Новый отзыв',
    description: 'Екатерина Новикова оставила отзыв с оценкой 5 звезд',
    timestamp: '2024-11-21T18:15:00',
    icon: Star,
    iconColor: 'text-yellow-500',
    details: { rating: 5, comment: 'Отличный репетитор!' }
  },
  {
    id: '4',
    type: 'payment',
    title: 'Получен платеж',
    description: 'Оплата за занятие от Марии Петровой',
    timestamp: '2024-11-21T15:00:00',
    icon: DollarSign,
    iconColor: 'text-green-600',
    details: { amount: 1500 }
  },
  {
    id: '5',
    type: 'profile',
    title: 'Обновление профиля',
    description: 'Изменено расписание занятий',
    timestamp: '2024-11-20T12:00:00',
    icon: Settings,
    iconColor: 'text-gray-500'
  },
  {
    id: '6',
    type: 'login',
    title: 'Вход в систему',
    description: 'Авторизация с IP 192.168.1.1',
    timestamp: '2024-11-20T09:00:00',
    icon: LogIn,
    iconColor: 'text-indigo-500'
  },
  {
    id: '7',
    type: 'lesson',
    title: 'Запланировано занятие',
    description: 'Новая запись от Дмитрия Козлова на 25 ноября',
    timestamp: '2024-11-19T16:30:00',
    icon: Calendar,
    iconColor: 'text-blue-500',
    details: { date: '25.11.2024', time: '16:00' }
  },
  {
    id: '8',
    type: 'message',
    title: 'Отправлено сообщение',
    description: 'Сообщение отправлено Ольге Новиковой',
    timestamp: '2024-11-19T14:00:00',
    icon: MessageSquare,
    iconColor: 'text-green-500'
  }
];

export function ActivityHistory() {
  const [activities] = useState<Activity[]>(mockActivities);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = activities.filter(activity => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} минут назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'час' : 'часов'} назад`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'день' : 'дней'} назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      lesson: { label: 'Занятие', className: 'bg-blue-100 text-blue-700' },
      message: { label: 'Сообщение', className: 'bg-green-100 text-green-700' },
      review: { label: 'Отзыв', className: 'bg-yellow-100 text-yellow-700' },
      payment: { label: 'Платеж', className: 'bg-emerald-100 text-emerald-700' },
      profile: { label: 'Профиль', className: 'bg-gray-100 text-gray-700' },
      login: { label: 'Вход', className: 'bg-indigo-100 text-indigo-700' }
    };

    const badge = badges[type];
    return badge ? (
      <Badge variant="secondary" className={badge.className}>
        {badge.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="p-6 bg-white">
        <h2 className="text-gray-900 mb-4">История активности</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Поиск по активности..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="lesson">Занятия</SelectItem>
              <SelectItem value="message">Сообщения</SelectItem>
              <SelectItem value="review">Отзывы</SelectItem>
              <SelectItem value="payment">Платежи</SelectItem>
              <SelectItem value="profile">Профиль</SelectItem>
              <SelectItem value="login">Входы</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Activity Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {filteredActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex-shrink-0 size-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center`}>
                  <Icon className={`size-6 ${activity.iconColor}`} />
                </div>

                {/* Activity card */}
                <Card className="flex-1 p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-gray-900">{activity.title}</h3>
                        {getTypeBadge(activity.type)}
                      </div>
                      <p className="text-gray-600 text-sm">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="size-3" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>

                  {/* Activity details */}
                  {activity.details && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-4 text-sm">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-gray-500 capitalize">{key}:</span>
                            <span className="text-gray-900">
                              {typeof value === 'number' && key === 'amount' ? `${value} ₽` : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <Card className="p-12 bg-white text-center">
          <Calendar className="size-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-gray-900 mb-2">Нет активности</h3>
          <p className="text-gray-600">Активность появится здесь после ваших действий</p>
        </Card>
      )}

      {/* Load More */}
      {filteredActivities.length > 0 && (
        <div className="text-center">
          <Button variant="outline">Загрузить еще</Button>
        </div>
      )}
    </div>
  );
}

