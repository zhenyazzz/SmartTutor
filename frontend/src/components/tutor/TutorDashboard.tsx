import React, { useState, useEffect } from 'react';
import { User, Calendar, BarChart3, Users, Settings, Upload, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { ScheduleEditor } from './ScheduleEditor';
import { TutorStats } from './TutorStats';
import { StudentsList } from './StudentsList';
import { authService } from '../../services/authService';
import { tutorService } from '../../services/tutorService';

export function TutorDashboard() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    subjects: [] as string[],
    experience: 0,
    hourlyRate: 0,
    location: '',
    description: '',
    education: '',
    onlineFormat: true,
    offlineFormat: false
  });

  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [tutorId, setTutorId] = useState(null as string | null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null as string | null);

  // Загрузка данных репетитора
  useEffect(() => {
    const loadTutorData = async () => {
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

        // Получаем данные репетитора по user_id
        const tutorData = await tutorService.getTutorByUserId(currentUser.id);

        if (!tutorData) {
          setError('Данные репетитора не найдены');
          setLoading(false);
          return;
        }

        // Сохраняем ID репетитора
        setTutorId(tutorData.id);

        // Обновляем профиль данными с сервера
        setProfile({
          name: tutorData.name || '',
          email: tutorData.email || '',
          phone: tutorData.phone || '',
          avatar: tutorData.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          subjects: tutorData.subjects || [],
          experience: tutorData.experience || 0,
          hourlyRate: tutorData.hourlyRate || 0,
          location: tutorData.location || '',
          description: tutorData.bio || '',
          education: tutorData.education || '',
          onlineFormat: tutorData.format?.includes('online') ?? true,
          offlineFormat: tutorData.format?.includes('offline') ?? false
        });
      } catch (err: any) {
        console.error('Error loading tutor data:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить данные репетитора');
      } finally {
        setLoading(false);
      }
    };

    loadTutorData();
  }, []);

  const handleAddSubject = () => {
    if (newSubject && !profile.subjects.includes(newSubject)) {
      setProfile({ ...profile, subjects: [...profile.subjects, newSubject] });
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setProfile({
      ...profile,
      subjects: profile.subjects.filter(s => s !== subject)
    });
  };

  const handleSave = async () => {
    if (!tutorId) {
      setError('ID репетитора не найден');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await tutorService.updateTutorProfile(tutorId, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar,
        subjects: profile.subjects,
        experience: profile.experience,
        hourlyRate: profile.hourlyRate,
        location: profile.location,
        description: profile.description,
        education: profile.education,
        onlineFormat: profile.onlineFormat,
        offlineFormat: profile.offlineFormat
      });

      setSuccessMessage('Профиль успешно обновлен!');
      
      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving tutor profile:', err);
      setError(err.response?.data?.error || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Загрузка данных...</p>
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
        <h1 className="text-gray-900 mb-2">Личный кабинет репетитора</h1>
        <p className="text-gray-600">Управляйте профилем, расписанием и просматривайте статистику</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-4" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="size-4" />
            Расписание
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="size-4" />
            Ученики
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="size-4" />
            Статистика
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Photo */}
            <Card className="p-6 bg-white lg:col-span-1">
              <h3 className="mb-4">Фотография профиля</h3>
              <div className="flex flex-col items-center">
                <Avatar className="size-32 mb-4">
                  {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name} />}
                  <AvatarFallback>{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <Button variant="outline" className="gap-2">
                  <Upload className="size-4" />
                  Загрузить фото
                </Button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Рекомендуется фото размером 400x400px
                </p>
              </div>
            </Card>

            {/* Basic Information */}
            <Card className="p-6 bg-white lg:col-span-2">
              <h3 className="mb-4">Основная информация</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Имя и фамилия</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Город</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Опыт (лет)</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={profile.experience}
                      onChange={(e) => setProfile({ ...profile, experience: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Стоимость (₽/час)</Label>
                    <Input
                      id="rate"
                      type="number"
                      value={profile.hourlyRate}
                      onChange={(e) => setProfile({ ...profile, hourlyRate: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="education">Образование</Label>
                  <Input
                    id="education"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">О себе</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            {/* Subjects */}
            <Card className="p-6 bg-white lg:col-span-3">
              <h3 className="mb-4">Преподаваемые предметы</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.subjects.map(subject => (
                  <Badge key={subject} className="gap-2 px-3 py-1">
                    {subject}
                    <button
                      onClick={() => handleRemoveSubject(subject)}
                      className="ml-1 hover:text-red-300"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Добавить предмет"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                />
                <Button onClick={handleAddSubject}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </Card>

            {/* Format Settings */}
            <Card className="p-6 bg-white lg:col-span-3">
              <h3 className="mb-4">Формат занятий</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="online" className="cursor-pointer">Онлайн занятия</Label>
                    <p className="text-sm text-gray-500">Проведение занятий через видеосвязь</p>
                  </div>
                  <Switch
                    id="online"
                    checked={profile.onlineFormat}
                    onCheckedChange={(checked) => setProfile({ ...profile, onlineFormat: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="offline" className="cursor-pointer">Офлайн занятия</Label>
                    <p className="text-sm text-gray-500">Личные встречи с учениками</p>
                  </div>
                  <Switch
                    id="offline"
                    checked={profile.offlineFormat}
                    onCheckedChange={(checked) => setProfile({ ...profile, offlineFormat: checked })}
                  />
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="lg:col-span-3 space-y-4">
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {error}
                </div>
              )}
              <Button 
                className="gap-2" 
                onClick={handleSave}
                disabled={saving || !tutorId}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          <ScheduleEditor />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <StudentsList />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <TutorStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}

