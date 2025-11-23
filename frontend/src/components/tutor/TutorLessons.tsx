import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, BookOpen, Check, X, Loader2, Filter } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { authService } from '../../services/authService';
import { tutorService } from '../../services/tutorService';
import { lessonService, Lesson } from '../../services/lessonService';

export function TutorLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingLesson, setProcessingLesson] = useState<string | null>(null);
  const [tutorId, setTutorId] = useState<string | null>(null);

  // Загрузка уроков
  useEffect(() => {
    const loadLessons = async () => {
      try {
        setLoading(true);
        setError(null);

        // Получаем текущего пользователя
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.id) {
          setError('Пользователь не авторизован');
          setLoading(false);
          return;
        }

        // Получаем данные репетитора
        const tutorData = await tutorService.getTutorByUserId(currentUser.id);
        if (!tutorData) {
          setError('Данные репетитора не найдены');
          setLoading(false);
          return;
        }

        setTutorId(tutorData.id);

        // Загружаем уроки
        const lessonsData = await lessonService.getLessonsByTutor(tutorData.id);
        setLessons(lessonsData);
      } catch (err: any) {
        console.error('Error loading lessons:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить список уроков');
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, []);

  const filteredLessons = lessons.filter(lesson => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return lesson.status === 'PENDING';
    if (statusFilter === 'approved') return lesson.status === 'APPROVED';
    if (statusFilter === 'completed') return lesson.status === 'COMPLETED';
    if (statusFilter === 'cancelled') return lesson.status === 'CANCELLED' || lesson.status === 'REJECTED';
    return true;
  });

  const getStatusBadge = (status: Lesson['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-500">Ожидает одобрения</Badge>;
      case 'APPROVED':
      case 'PLANNED':
        return <Badge className="bg-blue-500">Одобрен</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Завершен</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">Отклонен</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-gray-500">Отменен</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleApprove = async (lessonId: string) => {
    try {
      setProcessingLesson(lessonId);
      setError(null);
      
      const updatedLesson = await lessonService.approveLesson(lessonId);
      
      // Обновляем урок в списке
      setLessons(lessons.map(lesson => 
        lesson.id === lessonId ? updatedLesson : lesson
      ));
    } catch (err: any) {
      console.error('Error approving lesson:', err);
      setError(err.response?.data?.error || 'Не удалось одобрить урок');
    } finally {
      setProcessingLesson(null);
    }
  };

  const handleReject = async (lessonId: string) => {
    if (!confirm('Вы уверены, что хотите отклонить этот урок?')) {
      return;
    }

    try {
      setProcessingLesson(lessonId);
      setError(null);
      
      const updatedLesson = await lessonService.rejectLesson(lessonId);
      
      // Обновляем урок в списке
      setLessons(lessons.map(lesson => 
        lesson.id === lessonId ? updatedLesson : lesson
      ));
    } catch (err: any) {
      console.error('Error rejecting lesson:', err);
      setError(err.response?.data?.error || 'Не удалось отклонить урок');
    } finally {
      setProcessingLesson(null);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const pendingCount = lessons.filter(l => l.status === 'PENDING').length;
  const approvedCount = lessons.filter(l => l.status === 'APPROVED' || l.status === 'PLANNED').length;
  const completedCount = lessons.filter(l => l.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Загрузка уроков...</p>
        </div>
      </div>
    );
  }

  if (error && !lessons.length) {
    return (
      <Card className="p-6 bg-white">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="size-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Ожидают одобрения</p>
              <p className="text-2xl text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Check className="size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Одобрено</p>
              <p className="text-2xl text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="size-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Завершено</p>
              <p className="text-2xl text-gray-900">{completedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-6 bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="size-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидают одобрения</SelectItem>
              <SelectItem value="approved">Одобренные</SelectItem>
              <SelectItem value="completed">Завершенные</SelectItem>
              <SelectItem value="cancelled">Отмененные/Отклоненные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-sm text-red-900">{error}</p>
        </Card>
      )}

      {/* Lessons List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLessons.map(lesson => {
          const { date, time } = formatDateTime(lesson.dateTime);
          return (
            <Card key={lesson.id} className="p-6 bg-white hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Lesson Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{lesson.studentName}</h3>
                      <p className="text-sm text-gray-500">Ученик</p>
                    </div>
                    {getStatusBadge(lesson.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Предмет</p>
                        <p className="text-gray-900">{lesson.subjectName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Дата</p>
                        <p className="text-gray-900">{date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Время</p>
                        <p className="text-gray-900">{time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Длительность</p>
                        <p className="text-gray-900">{lesson.duration} мин</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">Стоимость</p>
                    <p className="text-xl font-semibold text-gray-900">{lesson.price} ₽</p>
                  </div>
                </div>

                {/* Actions */}
                {lesson.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 md:justify-center">
                    <Button
                      onClick={() => handleApprove(lesson.id)}
                      disabled={processingLesson === lesson.id}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {processingLesson === lesson.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Обработка...
                        </>
                      ) : (
                        <>
                          <Check className="size-4" />
                          Одобрить
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(lesson.id)}
                      disabled={processingLesson === lesson.id}
                      variant="destructive"
                      className="gap-2"
                    >
                      {processingLesson === lesson.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Обработка...
                        </>
                      ) : (
                        <>
                          <X className="size-4" />
                          Отклонить
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredLessons.length === 0 && (
        <Card className="p-12 bg-white text-center">
          <Calendar className="size-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Уроки не найдены</p>
        </Card>
      )}
    </div>
  );
}

