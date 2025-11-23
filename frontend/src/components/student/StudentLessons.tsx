import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, BookOpen, CheckCircle2, XCircle, CalendarX, Loader2, Filter } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { lessonService, Lesson } from '../../services/lessonService';
import { authService } from '../../services/authService';

export function StudentLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PLANNED' | 'COMPLETED' | 'CANCELLED'>('all');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc'>('date-desc');

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = authService.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        setError('Пользователь не найден. Пожалуйста, войдите снова.');
        return;
      }
      const data = await lessonService.getLessonsByStudent();
      setLessons(data);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить уроки');
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    if (statusFilter === 'all') return true;
    return lesson.status === statusFilter;
  });

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();
    return sortBy === 'date-asc' ? dateA - dateB : dateB - dateA;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Запланировано</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Завершено</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Отменено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      }),
      time: date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getUpcomingLessons = () => {
    const now = new Date();
    return sortedLessons.filter(lesson => {
      const lessonDate = new Date(lesson.dateTime);
      return lessonDate >= now && lesson.status === 'PLANNED';
    });
  };

  const upcomingLessons = getUpcomingLessons();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-12 text-center bg-white">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="size-8 animate-spin text-gray-400" />
            <p className="text-gray-600">Загрузка уроков...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-12 text-center bg-white">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadLessons} variant="outline">
            Попробовать снова
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Мои уроки</h1>
        <p className="text-gray-600">
          Управляйте своими записями и отслеживайте прогресс обучения
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Всего уроков</p>
              <p className="text-2xl font-semibold text-gray-900">{lessons.length}</p>
            </div>
            <BookOpen className="size-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Предстоящие</p>
              <p className="text-2xl font-semibold text-gray-900">{upcomingLessons.length}</p>
            </div>
            <Calendar className="size-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Завершено</p>
              <p className="text-2xl font-semibold text-gray-900">
                {lessons.filter(l => l.status === 'COMPLETED').length}
              </p>
            </div>
            <CheckCircle2 className="size-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6 bg-white">
        <div className="flex gap-4 items-center">
          <Filter className="size-5 text-gray-500" />
          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-1 block">Статус</label>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="PLANNED">Запланировано</SelectItem>
                <SelectItem value="COMPLETED">Завершено</SelectItem>
                <SelectItem value="CANCELLED">Отменено</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-1 block">Сортировка</label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Сначала новые</SelectItem>
                <SelectItem value="date-asc">Сначала старые</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Lessons List */}
      {sortedLessons.length === 0 ? (
        <Card className="p-12 text-center bg-white">
          <CalendarX className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {statusFilter === 'all' 
              ? 'У вас пока нет записей на уроки' 
              : `Нет уроков со статусом "${statusFilter === 'PLANNED' ? 'Запланировано' : statusFilter === 'COMPLETED' ? 'Завершено' : 'Отменено'}"`}
          </p>
          <p className="text-sm text-gray-500">
            Найдите репетитора и запишитесь на первое занятие
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedLessons.map(lesson => {
            const { date, time } = formatDateTime(lesson.dateTime);
            const isUpcoming = new Date(lesson.dateTime) >= new Date() && lesson.status === 'PLANNED';
            
            return (
              <Card 
                key={lesson.id} 
                className={`p-6 bg-white hover:shadow-md transition-shadow ${
                  isUpcoming ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {lesson.subjectName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="size-4" />
                            <span>{lesson.tutorName}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(lesson.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="size-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{date}</p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="size-4 text-gray-400" />
                        <span>{lesson.duration} минут</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{lesson.price} ₽</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

