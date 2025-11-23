import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Clock, Star, DollarSign, Video, MapPinned, Loader2, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { TutorCard } from './TutorCard';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { tutorService } from '../../services/tutorService';
import { StudentLessons } from './StudentLessons';

export interface Tutor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subjects: string[];
  rating: number;
  reviews: number;
  hourlyRate: number;
  experience: number;
  avatar: string;
  isOnline: boolean;
  format: ('online' | 'offline')[];
  location?: string;
  availability: string[];
  bio?: string;
  education?: string;
}


interface StudentHomePageProps {
  onViewTutor: (tutorId: string) => void;
}

export function StudentHomePage({ onViewTutor }: StudentHomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [minRating, setMinRating] = useState(0);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [tutors, setTutors] = useState([] as Tutor[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [sortBy, setSortBy] = useState('rating');

  const subjects = ['Все предметы', 'Математика', 'Физика', 'Химия', 'Биология', 'Английский язык', 
                    'История', 'Программирование', 'География', 'Информатика', 'Обществознание', 'Экономика'];

  // Загрузка репетиторов с сервера
  useEffect(() => {
    const loadTutors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const filters: {
          subject?: string;
          minPrice?: number;
          maxPrice?: number;
          minRating?: number;
        } = {};
        if (selectedSubject !== 'all') {
          filters.subject = selectedSubject;
        }
        if (priceRange[0] > 0) {
          filters.minPrice = priceRange[0];
        }
        if (priceRange[1] < 3000) {
          filters.maxPrice = priceRange[1];
        }
        if (minRating > 0) {
          filters.minRating = minRating;
        }

        const data = await tutorService.getAllTutors(filters);
        setTutors(data);
      } catch (err: any) {
        console.error('Error loading tutors:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить репетиторов');
      } finally {
        setLoading(false);
      }
    };

    loadTutors();
  }, [selectedSubject, priceRange, minRating]);

  // Клиентская фильтрация (поиск по имени и формат занятий)
  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tutor.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFormat = (!onlineOnly && !offlineOnly) ||
                          (onlineOnly && tutor.format.includes('online')) ||
                          (offlineOnly && tutor.format.includes('offline'));
    
    return matchesSearch && matchesFormat;
  });

  // Сортировка
  const sortedTutors = [...filteredTutors].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.hourlyRate - b.hourlyRate;
      case 'price-desc':
        return b.hourlyRate - a.hourlyRate;
      case 'experience':
        return b.experience - a.experience;
      case 'rating':
      default:
        return b.rating - a.rating;
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="search" className="gap-2">
            <Search className="size-4" />
            Поиск репетиторов
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <BookOpen className="size-4" />
            Мои уроки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <StudentLessons />
        </TabsContent>

        <TabsContent value="search">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-gray-900 mb-2">Найдите идеального репетитора</h1>
            <p className="text-gray-600">
              Более 1000 профессиональных репетиторов готовы помочь вам достичь ваших целей
            </p>
          </div>

      {/* Search Bar */}
      <Card className="p-6 mb-6 bg-white shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
            <Input
              placeholder="Поиск по имени репетитора или предмету..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Фильтры
          </Button>
        </div>
      </Card>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <Card className="p-6 bg-white shadow-sm sticky top-6">
              <h3 className="mb-4 text-gray-900">Фильтры</h3>

              {/* Subject Filter */}
              <div className="mb-6">
                <Label className="mb-2 block">Предмет</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все предметы</SelectItem>
                    {subjects.slice(1).map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <Label className="mb-2 block">Стоимость занятия</Label>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={3000}
                    step={100}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{priceRange[0]} ₽</span>
                    <span>{priceRange[1]} ₽</span>
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <Label className="mb-2 block">Минимальный рейтинг</Label>
                <div className="flex gap-2">
                  {[0, 4.0, 4.5, 4.8, 5.0].map(rating => (
                    <Button
                      key={rating}
                      variant={minRating === rating ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMinRating(rating)}
                    >
                      {rating === 0 ? 'Все' : `${rating}+`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Format Filter */}
              <div className="mb-6">
                <Label className="mb-3 block">Формат занятий</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="size-4 text-gray-500" />
                      <Label htmlFor="online" className="cursor-pointer">Онлайн</Label>
                    </div>
                    <Switch
                      id="online"
                      checked={onlineOnly}
                      onCheckedChange={setOnlineOnly}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPinned className="size-4 text-gray-500" />
                      <Label htmlFor="offline" className="cursor-pointer">Офлайн</Label>
                    </div>
                    <Switch
                      id="offline"
                      checked={offlineOnly}
                      onCheckedChange={setOfflineOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Reset Filters */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedSubject('all');
                  setPriceRange([0, 3000]);
                  setMinRating(0);
                  setOnlineOnly(false);
                  setOfflineOnly(false);
                }}
              >
                Сбросить фильтры
              </Button>
            </Card>
          </div>
        )}

        {/* Tutors Grid */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              Найдено репетиторов: <span className="font-medium text-gray-900">{sortedTutors.length}</span>
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">По рейтингу</SelectItem>
                <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
                <SelectItem value="experience">По опыту</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Card className="p-12 text-center bg-white">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="size-8 animate-spin text-gray-400" />
                <p className="text-gray-600">Загрузка репетиторов...</p>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-12 text-center bg-white">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Попробовать снова
              </Button>
            </Card>
          ) : sortedTutors.length === 0 ? (
            <Card className="p-12 text-center bg-white">
              <p className="text-gray-600">
                Репетиторы не найдены. Попробуйте изменить параметры поиска.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedTutors.map(tutor => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  onView={() => onViewTutor(tutor.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

