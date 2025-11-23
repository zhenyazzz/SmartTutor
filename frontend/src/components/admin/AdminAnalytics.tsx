import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, BookOpen, ArrowUp, ArrowDown, MapPin, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { adminService, PlatformStats, PlatformGrowth, RevenueData, RevenueStats, SubjectPopularity, CityDistribution, TopTutor } from '../../services/adminService';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

export function AdminAnalytics() {
  const [timePeriod, setTimePeriod] = useState('year');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  
  // Данные
  const [platformStats, setPlatformStats] = useState(null as PlatformStats | null);
  const [platformGrowth, setPlatformGrowth] = useState([] as PlatformGrowth[]);
  const [revenueData, setRevenueData] = useState([] as RevenueData[]);
  const [revenueStats, setRevenueStats] = useState(null as RevenueStats | null);
  const [subjectPopularity, setSubjectPopularity] = useState([] as SubjectPopularity[]);
  const [cityDistribution, setCityDistribution] = useState([] as CityDistribution[]);
  const [topTutors, setTopTutors] = useState([] as TopTutor[]);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [stats, growth, revenue, revenueStatsData, subjects, cities, tutors] = await Promise.all([
          adminService.getPlatformStats(timePeriod),
          adminService.getPlatformGrowth(timePeriod),
          adminService.getRevenueData(timePeriod),
          adminService.getRevenueStats(timePeriod),
          adminService.getSubjectPopularity(),
          adminService.getCityDistribution(),
          adminService.getTopTutors(10)
        ]);

        setPlatformStats(stats);
        setPlatformGrowth(growth);
        setRevenueData(revenue);
        setRevenueStats(revenueStatsData);
        setSubjectPopularity(subjects);
        setCityDistribution(cities);
        setTopTutors(tutors);
      } catch (err: any) {
        console.error('Error loading admin analytics:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить данные аналитики');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timePeriod]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Загрузка аналитики...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-6 bg-white">
            <p className="text-red-600">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Аналитика платформы</h1>
        <p className="text-gray-600">Общая статистика и ключевые показатели</p>
      </div>

      {/* Period Filter */}
      <div className="flex justify-end mb-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="size-6 text-indigo-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              (platformStats?.tutorsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(platformStats?.tutorsGrowth || 0) >= 0 ? (
                <ArrowUp className="size-4" />
              ) : (
                <ArrowDown className="size-4" />
              )}
              <span>{platformStats?.tutorsGrowth ? (platformStats.tutorsGrowth >= 0 ? '+' : '') + platformStats.tutorsGrowth + '%' : '0%'}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Всего репетиторов</p>
          <p className="text-3xl text-gray-900">{platformStats?.totalTutors || 0}</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="size-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              (platformStats?.studentsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(platformStats?.studentsGrowth || 0) >= 0 ? (
                <ArrowUp className="size-4" />
              ) : (
                <ArrowDown className="size-4" />
              )}
              <span>{platformStats?.studentsGrowth ? (platformStats.studentsGrowth >= 0 ? '+' : '') + platformStats.studentsGrowth + '%' : '0%'}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Всего учеников</p>
          <p className="text-3xl text-gray-900">{platformStats?.totalStudents || 0}</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="size-6 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              (platformStats?.lessonsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(platformStats?.lessonsGrowth || 0) >= 0 ? (
                <ArrowUp className="size-4" />
              ) : (
                <ArrowDown className="size-4" />
              )}
              <span>{platformStats?.lessonsGrowth ? (platformStats.lessonsGrowth >= 0 ? '+' : '') + platformStats.lessonsGrowth + '%' : '0%'}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Занятий в месяц</p>
          <p className="text-3xl text-gray-900">{(platformStats?.lessonsThisMonth || 0).toLocaleString('ru-RU')}</p>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="size-6 text-purple-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              (platformStats?.commissionGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(platformStats?.commissionGrowth || 0) >= 0 ? (
                <ArrowUp className="size-4" />
              ) : (
                <ArrowDown className="size-4" />
              )}
              <span>{platformStats?.commissionGrowth ? (platformStats.commissionGrowth >= 0 ? '+' : '') + platformStats.commissionGrowth + '%' : '0%'}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Комиссия платформы</p>
          <p className="text-3xl text-gray-900">{Math.round(platformStats?.commissionThisMonth || 0).toLocaleString('ru-RU')} ₽</p>
        </Card>
      </div>

      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="growth">Рост</TabsTrigger>
          <TabsTrigger value="revenue">Выручка</TabsTrigger>
          <TabsTrigger value="subjects">Предметы</TabsTrigger>
          <TabsTrigger value="tutors">Репетиторы</TabsTrigger>
        </TabsList>

        {/* Growth Tab */}
        <TabsContent value="growth" className="mt-6 space-y-6">
          {/* Platform Growth Chart */}
          <Card className="p-6 bg-white">
            <h3 className="mb-6">Рост пользователей платформы</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={platformGrowth}>
                <defs>
                  <linearGradient id="colorTutors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area 
                  type="monotone" 
                  dataKey="tutors" 
                  stroke="#4f46e5" 
                  fillOpacity={1} 
                  fill="url(#colorTutors)" 
                  name="Репетиторы"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorStudents)" 
                  name="Ученики"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Lessons Chart */}
          <Card className="p-6 bg-white">
            <h3 className="mb-6">Количество проведенных занятий</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={platformGrowth}>
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
                  fill="#06b6d4" 
                  name="Занятий"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <Card className="p-6 bg-white">
            <h3 className="mb-6">Динамика выручки и комиссии</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={revenueData}>
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
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Общая выручка"
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="commission" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Комиссия платформы"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white">
              <p className="text-gray-600 text-sm mb-2">Общая выручка за период</p>
              <p className="text-3xl text-gray-900 mb-1">
                {revenueStats?.totalRevenue 
                  ? (revenueStats.totalRevenue / 1000000).toFixed(1) + ' млн ₽'
                  : '0 ₽'
                }
              </p>
              <div className={`flex items-center gap-1 text-sm ${
                (revenueStats?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(revenueStats?.revenueGrowth || 0) >= 0 ? (
                  <ArrowUp className="size-4" />
                ) : (
                  <ArrowDown className="size-4" />
                )}
                <span>
                  {revenueStats?.revenueGrowth 
                    ? (revenueStats.revenueGrowth >= 0 ? '+' : '') + revenueStats.revenueGrowth + '% к прошлому периоду'
                    : '0%'
                  }
                </span>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <p className="text-gray-600 text-sm mb-2">Комиссия за период</p>
              <p className="text-3xl text-gray-900 mb-1">
                {revenueStats?.totalCommission 
                  ? (revenueStats.totalCommission / 1000000).toFixed(2) + ' млн ₽'
                  : '0 ₽'
                }
              </p>
              <div className={`flex items-center gap-1 text-sm ${
                (revenueStats?.commissionGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(revenueStats?.commissionGrowth || 0) >= 0 ? (
                  <ArrowUp className="size-4" />
                ) : (
                  <ArrowDown className="size-4" />
                )}
                <span>
                  {revenueStats?.commissionGrowth 
                    ? (revenueStats.commissionGrowth >= 0 ? '+' : '') + revenueStats.commissionGrowth + '% к прошлому периоду'
                    : '0%'
                  }
                </span>
              </div>
            </Card>

            <Card className="p-6 bg-white">
              <p className="text-gray-600 text-sm mb-2">Средний чек</p>
              <p className="text-3xl text-gray-900 mb-1">
                {Math.round(revenueStats?.avgCheck || 0).toLocaleString('ru-RU')} ₽
              </p>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <span>Средняя стоимость занятия</span>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Distribution Pie Chart */}
            <Card className="p-6 bg-white">
              <h3 className="mb-6">География репетиторов</h3>
              {cityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={cityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {cityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500">
                  Нет данных о городах
                </div>
              )}
            </Card>

            {/* City Details */}
            <Card className="p-6 bg-white">
              <h3 className="mb-6">Детализация по городам</h3>
              <div className="space-y-4">
                {cityDistribution.length > 0 ? cityDistribution.map((city, index) => (
                  <div key={city.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="size-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="text-gray-900">{city.name}</p>
                        <p className="text-sm text-gray-600">{city.tutors} репетиторов</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{city.value}%</Badge>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">Нет данных о городах</p>
                )}
              </div>
            </Card>
          </div>

          {/* Subject Popularity Table */}
          <Card className="p-6 bg-white">
            <h3 className="mb-6">Популярность предметов</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600">Предмет</th>
                    <th className="text-left py-3 px-4 text-gray-600">Репетиторов</th>
                    <th className="text-left py-3 px-4 text-gray-600">Учеников</th>
                    <th className="text-left py-3 px-4 text-gray-600">Средний рейтинг</th>
                    <th className="text-left py-3 px-4 text-gray-600">Тренд</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectPopularity.length > 0 ? subjectPopularity.map((subject, index) => (
                    <tr key={subject.subject} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="size-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-900">{subject.subject}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{subject.tutors}</td>
                      <td className="py-4 px-4 text-gray-900">{subject.students}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900">{subject.avgRating}</span>
                          <span className="text-yellow-400">★</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowUp className="size-4" />
                          <span className="text-sm">Активен</span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        Нет данных о предметах
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Top Tutors Tab */}
        <TabsContent value="tutors" className="mt-6">
          <Card className="p-6 bg-white">
            <h3 className="mb-6">Топ репетиторов платформы</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-gray-600">Рейтинг</th>
                    <th className="text-left py-3 px-4 text-gray-600">Репетитор</th>
                    <th className="text-left py-3 px-4 text-gray-600">Предмет</th>
                    <th className="text-left py-3 px-4 text-gray-600">Оценка</th>
                    <th className="text-left py-3 px-4 text-gray-600">Учеников</th>
                    <th className="text-left py-3 px-4 text-gray-600">Занятий</th>
                    <th className="text-left py-3 px-4 text-gray-600">Доход</th>
                  </tr>
                </thead>
                <tbody>
                  {topTutors.length > 0 ? topTutors.map((tutor, index) => (
                    <tr key={tutor.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className={`size-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{tutor.name}</td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary">{tutor.subject}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900">{tutor.rating}</span>
                          <span className="text-yellow-400">★</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{tutor.students}</td>
                      <td className="py-4 px-4 text-gray-900">{tutor.lessons}</td>
                      <td className="py-4 px-4 text-gray-900">
                        {tutor.earnings.toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Нет данных о репетиторах
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

