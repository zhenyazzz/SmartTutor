import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Star, Calendar, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { authService } from '../../services/authService';
import { tutorService, TutorStats } from '../../services/tutorService';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

export function TutorStats() {
  const [timePeriod, setTimePeriod] = useState('year');
  const [stats, setStats] = useState<TutorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutorId, setTutorId] = useState<string | null>(null);

  // Загрузка статистики
  useEffect(() => {
    const loadStats = async () => {
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

        // Загружаем статистику
        const statsData = await tutorService.getTutorStats(tutorData.id, timePeriod);
        setStats(statsData);
      } catch (err: any) {
        console.error('Error loading stats:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [timePeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-6 bg-white">
        <p className="text-red-600">{error || 'Не удалось загрузить статистику'}</p>
      </Card>
    );
  }

  // Форматируем данные для графиков
  const studentGrowthData = stats.monthlyData.map(item => ({
    month: item.month,
    students: item.students,
    lessons: item.lessons
  }));

  const earningsData = stats.monthlyData.map(item => ({
    month: item.month,
    earnings: item.earnings
  }));

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900">Статистика профиля</h2>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Последняя неделя</SelectItem>
            <SelectItem value="month">Последний месяц</SelectItem>
            <SelectItem value="quarter">Последний квартал</SelectItem>
            <SelectItem value="year">Последний год</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="size-6 text-indigo-600" />
            </div>
            {stats.growth.students >= 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUp className="size-4" />
                <span>+{stats.growth.students}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <ArrowDown className="size-4" />
                <span>{stats.growth.students}%</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-1">Всего учеников</p>
          <p className="text-3xl text-gray-900">{stats.totalStudents}</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="size-6 text-green-600" />
            </div>
            {stats.growth.lessons >= 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUp className="size-4" />
                <span>+{stats.growth.lessons}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <ArrowDown className="size-4" />
                <span>{stats.growth.lessons}%</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-1">Занятий в месяц</p>
          <p className="text-3xl text-gray-900">{stats.lessonsThisMonth}</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="size-6 text-blue-600" />
            </div>
            {stats.growth.earnings >= 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUp className="size-4" />
                <span>+{stats.growth.earnings}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <ArrowDown className="size-4" />
                <span>{stats.growth.earnings}%</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-1">Доход в месяц</p>
          <p className="text-3xl text-gray-900">{stats.earningsThisMonth.toLocaleString('ru-RU')} ₽</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="size-6 text-yellow-600" />
            </div>
            {stats.growth.rating >= 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ArrowUp className="size-4" />
                <span>+{stats.growth.rating.toFixed(1)}</span>
              </div>
            ) : stats.growth.rating < 0 ? (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <ArrowDown className="size-4" />
                <span>{stats.growth.rating.toFixed(1)}</span>
              </div>
            ) : null}
          </div>
          <p className="text-gray-600 text-sm mb-1">Средний рейтинг</p>
          <p className="text-3xl text-gray-900">{stats.avgRating.toFixed(1)}</p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Growth Chart */}
        <Card className="p-6 bg-white">
          <h3 className="mb-6">Рост базы учеников</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke="#4f46e5" 
                strokeWidth={2}
                name="Учеников"
                dot={{ fill: '#4f46e5', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Lessons Chart */}
        <Card className="p-6 bg-white">
          <h3 className="mb-6">Количество занятий</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="lessons" 
                fill="#10b981" 
                name="Занятий"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <Card className="p-6 bg-white">
          <h3 className="mb-6">Динамика доходов</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#06b6d4" 
                strokeWidth={2}
                name="Доход (₽)"
                dot={{ fill: '#06b6d4', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Rating Chart */}
        <Card className="p-6 bg-white">
          <h3 className="mb-6">Динамика рейтинга</h3>
          <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.ratingData.length > 0 ? stats.ratingData : [{ month: 'Нет данных', rating: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis domain={[4.5, 5.0]} stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rating" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Рейтинг"
                dot={{ fill: '#f59e0b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Subject Distribution */}
      <Card className="p-6 bg-white">
        <h3 className="mb-6">Распределение по предметам</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.subjectDistribution.length > 0 ? stats.subjectDistribution : []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.subjectDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col justify-center space-y-4">
            {stats.subjectDistribution.length > 0 ? (
              stats.subjectDistribution.map((subject, index) => (
              <div key={subject.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="size-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="text-gray-900">{subject.name}</p>
                    <p className="text-sm text-gray-600">{subject.students} учеников</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">{subject.value}%</p>
                </div>
              </div>
            ))
            ) : (
              <p className="text-gray-500 text-center">Нет данных по предметам</p>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 bg-white">
        <h3 className="mb-4">Последняя активность</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="size-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="size-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900">Новый ученик записался на занятие</p>
              <p className="text-sm text-gray-600">2 часа назад</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="size-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="size-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900">Получен новый отзыв с оценкой 5 звезд</p>
              <p className="text-sm text-gray-600">5 часов назад</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="size-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900">Занятие с Марией Петровой завершено</p>
              <p className="text-sm text-gray-600">1 день назад</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

