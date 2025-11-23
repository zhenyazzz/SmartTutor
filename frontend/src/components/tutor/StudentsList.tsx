import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, MessageSquare, Star, Filter, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { authService } from '../../services/authService';
import { tutorService, Student } from '../../services/tutorService';

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Загрузка студентов
  useEffect(() => {
    const loadStudents = async () => {
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

        // Загружаем студентов
        const studentsData = await tutorService.getStudentsByTutor(tutorData.id);
        setStudents(studentsData);
      } catch (err: any) {
        console.error('Error loading students:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить список студентов');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активный</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">На паузе</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-gray-200 text-gray-700">Завершен</Badge>;
      default:
        return null;
    }
  };

  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalLessons = students.reduce((sum, s) => sum + s.lessonsCompleted, 0);

  // Генерируем аватар на основе имени

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Загрузка списка студентов...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
            <div className="size-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="size-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Всего учеников</p>
              <p className="text-2xl text-gray-900">{students.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="size-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Активных</p>
              <p className="text-2xl text-gray-900">{activeStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Проведено занятий</p>
              <p className="text-2xl text-gray-900">{totalLessons}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Поиск по имени, email или предмету..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="size-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="paused">На паузе</SelectItem>
              <SelectItem value="completed">Завершенные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Students List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.map(student => (
          <Card key={student.id} className="p-6 bg-white hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="size-16">
                  <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">Ученик с {student.joined}</p>
                    </div>
                    {getStatusBadge(student.status)}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="size-4" />
                      <span>{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats and Info */}
              <div className="flex flex-col md:flex-row gap-6 md:items-center">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Предмет</p>
                    <p className="text-gray-900">{student.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Проведено занятий</p>
                    <p className="text-gray-900">{student.lessonsCompleted}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Следующее занятие</p>
                    <p className="text-gray-900">{student.nextLesson}</p>
                  </div>
                  {student.rating && (
                    <div>
                      <p className="text-sm text-gray-600">Рейтинг</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`size-4 ${
                              i < student.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" className="gap-2">
                    <MessageSquare className="size-4" />
                    Написать
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Calendar className="size-4" />
                    Расписание
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card className="p-12 bg-white text-center">
          <p className="text-gray-600">Ученики не найдены</p>
        </Card>
      )}
    </div>
  );
}

