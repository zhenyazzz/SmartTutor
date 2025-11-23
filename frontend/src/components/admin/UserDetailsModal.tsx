import React from 'react';
import { X, Mail, Phone, Calendar, Activity, Award, DollarSign, Users, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'tutor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  avatar: string;
  joinedDate: string;
  lastActive: string;
  verified: boolean;
  stats?: {
    lessons?: number;
    students?: number;
    earnings?: number;
  };
}

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активный</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Заблокирован</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ожидает</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tutor':
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Репетитор</Badge>;
      case 'student':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Ученик</Badge>;
      case 'admin':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Администратор</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Информация о пользователе</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <Card className="p-6 bg-white">
            <div className="flex items-start gap-4">
              <Avatar className="size-20">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">{user.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.status)}
                  {user.verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Верифицирован
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4" />
                    <span>Регистрация: {new Date(user.joinedDate).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="size-4" />
                    <span>Последняя активность: {user.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          {user.stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.role === 'tutor' ? (
                <>
                  <Card className="p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Users className="size-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Учеников</p>
                        <p className="text-xl text-gray-900">{user.stats.students}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="size-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Занятий</p>
                        <p className="text-xl text-gray-900">{user.stats.lessons}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Доход</p>
                        <p className="text-xl text-gray-900">{user.stats.earnings?.toLocaleString('ru-RU')} ₽</p>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-4 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="size-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Занятий пройдено</p>
                      <p className="text-xl text-gray-900">{user.stats.lessons}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="activity">Активность</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
              <TabsTrigger value="notes">Заметки</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              <Card className="p-6 bg-white">
                <h4 className="mb-4 text-gray-900">Последняя активность</h4>
                <div className="space-y-4">
                  {[
                    { action: 'Вход в систему', time: '2 часа назад', type: 'login' },
                    { action: 'Обновление профиля', time: '1 день назад', type: 'update' },
                    { action: 'Новое занятие', time: '3 дня назад', type: 'lesson' },
                    { action: 'Получен отзыв', time: '5 дней назад', type: 'review' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`size-2 rounded-full mt-2 ${
                        activity.type === 'login' ? 'bg-blue-500' :
                        activity.type === 'update' ? 'bg-green-500' :
                        activity.type === 'lesson' ? 'bg-indigo-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card className="p-6 bg-white">
                <h4 className="mb-4 text-gray-900">История действий</h4>
                <div className="space-y-3">
                  {[
                    { date: '22.11.2024', action: 'Проведено занятие с Марией П.' },
                    { date: '20.11.2024', action: 'Добавлен новый временной слот' },
                    { date: '18.11.2024', action: 'Получен отзыв (5 звезд)' },
                    { date: '15.11.2024', action: 'Обновлена информация о предметах' }
                  ].map((item, index) => (
                    <div key={index} className="pb-3 border-b last:border-0">
                      <p className="text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card className="p-6 bg-white">
                <h4 className="mb-4 text-gray-900">Административные заметки</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-gray-600">Администратор: Иван И.</p>
                      <p className="text-xs text-gray-500">10.11.2024</p>
                    </div>
                    <p className="text-gray-900">Отличный репетитор, много положительных отзывов</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <textarea
                      placeholder="Добавить заметку..."
                      className="w-full p-2 border rounded resize-none"
                      rows={3}
                    />
                    <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                      Сохранить заметку
                    </button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
