import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Video, Clock, Award, BookOpen, Users, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { BookingModal } from './BookingModal';
import { tutorService } from '../../services/tutorService';
import { reviewService, type Review, type RatingDistribution } from '../../services/reviewService';
import { scheduleService, type ScheduleSlot } from '../../services/scheduleService';
import type { Tutor } from './StudentHomePage';

interface TutorDetailPageProps {
  tutorId: string;
  onBack: () => void;
}

export function TutorDetailPage({ tutorId, onBack }: TutorDetailPageProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null as ScheduleSlot | null);
  const [tutor, setTutor] = useState(null as Tutor | null);
  const [reviews, setReviews] = useState([] as Review[]);
  const [ratingDistribution, setRatingDistribution] = useState([] as RatingDistribution[]);
  const [availableSlots, setAvailableSlots] = useState([] as ScheduleSlot[]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  // Загрузка данных репетитора
  useEffect(() => {
    const loadTutor = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tutorService.getTutorById(tutorId);
        setTutor(data);
      } catch (err: any) {
        console.error('Error loading tutor:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить данные репетитора');
      } finally {
        setLoading(false);
      }
    };

    if (tutorId) {
      loadTutor();
    }
  }, [tutorId]);

  // Загрузка отзывов
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        const [reviewsData, distributionData] = await Promise.all([
          reviewService.getReviewsByTutorId(tutorId),
          reviewService.getRatingDistribution(tutorId)
        ]);
        setReviews(reviewsData);
        setRatingDistribution(distributionData);
      } catch (err: any) {
        console.error('Error loading reviews:', err);
        // Не показываем ошибку, просто оставляем пустые отзывы
      } finally {
        setReviewsLoading(false);
      }
    };

    if (tutorId) {
      loadReviews();
    }
  }, [tutorId]);

  // Загрузка расписания
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setScheduleLoading(true);
        const slots = await scheduleService.getAvailableSlots(tutorId, 14);
        setAvailableSlots(slots);
      } catch (err: any) {
        console.error('Error loading schedule:', err);
        // Не показываем ошибку, просто оставляем пустое расписание
      } finally {
        setScheduleLoading(false);
      }
    };

    if (tutorId) {
      loadSchedule();
    }
  }, [tutorId]);

  // Если загрузка или ошибка
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
          <ArrowLeft className="size-4" />
          Назад к поиску
        </Button>
        <Card className="p-12 text-center bg-white">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="size-8 animate-spin text-gray-400" />
            <p className="text-gray-600">Загрузка данных репетитора...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
          <ArrowLeft className="size-4" />
          Назад к поиску
        </Button>
        <Card className="p-12 text-center bg-white">
          <p className="text-red-600 mb-4">{error || 'Репетитор не найден'}</p>
          <Button onClick={onBack} variant="outline">
            Вернуться к поиску
          </Button>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
        <ArrowLeft className="size-4" />
        Назад к поиску
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card className="p-6 bg-white">
            <div className="flex gap-6">
              <div className="relative flex-shrink-0">
                <Avatar className="size-32">
                  {tutor.avatar && <AvatarImage src={tutor.avatar} alt={tutor.name} />}
                  <AvatarFallback>{tutor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {tutor.isOnline && (
                  <div className="absolute bottom-2 right-2 size-5 bg-green-500 rounded-full border-4 border-white" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-gray-900 mb-2">{tutor.name}</h1>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="size-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-900">{tutor.rating}</span>
                        <span className="text-gray-500">({tutor.reviews} отзывов)</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        Проверенный репетитор
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.subjects.map(subject => (
                    <Badge key={subject} className="bg-indigo-600">
                      {subject}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award className="size-4" />
                    <span>{tutor.experience} лет опыта</span>
                  </div>
                  {tutor.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="size-4" />
                      <span>{tutor.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Video className="size-4" />
                    <span>{tutor.format.includes('online') && tutor.format.includes('offline') 
                      ? 'Онлайн / Офлайн' 
                      : tutor.format.includes('online') ? 'Онлайн' : 'Офлайн'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="about">О репетиторе</TabsTrigger>
              <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              <TabsTrigger value="schedule">Расписание</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <Card className="p-6 bg-white">
                {tutor.bio && (
                  <>
                    <h3 className="mb-4">Описание</h3>
                    <p className="text-gray-600 mb-6">{tutor.bio}</p>
                  </>
                )}

                {tutor.education && (
                  <>
                    <h3 className="mb-4">Образование</h3>
                    <p className="text-gray-600 mb-6">{tutor.education}</p>
                  </>
                )}

                {(!tutor.bio && !tutor.education) && (
                  <p className="text-gray-600">Информация о репетиторе пока не добавлена.</p>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card className="p-6 bg-white mb-6">
                <h3 className="mb-4">Рейтинг и отзывы</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-5xl text-gray-900 mb-2">{tutor.rating}</div>
                    <div className="flex justify-center mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`size-5 ${
                            star <= Math.round(tutor.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">{tutor.reviews} отзывов</p>
                  </div>

                  <div className="space-y-2">
                    {ratingDistribution.length > 0 ? (
                      ratingDistribution.map(({ stars, count, percentage }) => (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-8">{stars} ★</span>
                          <Progress value={percentage} className="flex-1 h-2" />
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Нет данных о распределении рейтингов</p>
                    )}
                  </div>
                </div>
              </Card>

              {reviewsLoading ? (
                <Card className="p-6 bg-white">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin text-gray-400" />
                    <p className="text-gray-600">Загрузка отзывов...</p>
                  </div>
                </Card>
              ) : reviews.length === 0 ? (
                <Card className="p-6 bg-white">
                  <p className="text-gray-600 text-center">Пока нет отзывов</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <Card key={review.id} className="p-6 bg-white">
                      <div className="flex gap-4">
                        <Avatar>
                          {review.avatar && <AvatarImage src={review.avatar} alt={review.author} />}
                          <AvatarFallback>{review.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-gray-900">{review.author}</h4>
                              <p className="text-sm text-gray-500">{review.date}</p>
                            </div>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`size-4 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card className="p-6 bg-white">
                <h3 className="mb-4">Доступное время для занятий</h3>
                <p className="text-gray-600 mb-6">
                  Выберите удобное время для первого занятия. Зеленым отмечены свободные слоты.
                </p>

                {scheduleLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="size-4 animate-spin text-gray-400" />
                    <p className="text-gray-600">Загрузка расписания...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Нет доступных слотов для бронирования
                  </p>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      // Группируем слоты по датам
                      const slotsByDate = availableSlots.reduce((acc: Record<string, ScheduleSlot[]>, slot) => {
                        if (!acc[slot.date]) {
                          acc[slot.date] = [];
                        }
                        acc[slot.date].push(slot);
                        return acc;
                      }, {});

                      const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
                      const dayNamesShort = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                      const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                                         'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

                      return (Object.entries(slotsByDate) as [string, ScheduleSlot[]][])
                        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                        .map(([date, slots]) => {
                          const dateObj = new Date(date + 'T00:00:00');
                          const dayOfWeek = dayNames[dateObj.getDay()];
                          const day = dateObj.getDate();
                          const month = monthNames[dateObj.getMonth()];
                          const year = dateObj.getFullYear();
                          const isToday = date === new Date().toISOString().split('T')[0];
                          
                          return (
                            <div key={date}>
                              <h4 className="mb-3 text-gray-900">
                                {dayNamesShort[dateObj.getDay()]}, {day} {month} {year !== new Date().getFullYear() ? year : ''}
                                {isToday && <span className="ml-2 text-sm text-indigo-600">(Сегодня)</span>}
                              </h4>
                              <div className="grid grid-cols-5 gap-2">
                                {slots
                                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                  .map((slot) => (
                                    <Button
                                      key={slot.id}
                                      variant="outline"
                                      className="border-green-500 text-green-700 hover:bg-green-50"
                                      onClick={() => {
                                        setSelectedSlotForBooking(slot);
                                        setIsBookingModalOpen(true);
                                      }}
                                    >
                                      {slot.startTime.slice(0, 5)}
                                    </Button>
                                  ))}
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white sticky top-6">
            <div className="text-center mb-6">
              <div className="text-3xl text-gray-900 mb-1">{tutor.hourlyRate} ₽</div>
              <p className="text-gray-600">за одно занятие (60 минут)</p>
            </div>

            <Button 
              className="w-full mb-4" 
              size="lg"
              onClick={() => {
                setSelectedSlotForBooking(null);
                setIsBookingModalOpen(true);
              }}
            >
              <Calendar className="size-4 mr-2" />
              Записаться на занятие
            </Button>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Video className="size-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">Формат занятий</p>
                  <p className="text-gray-600">
                    {tutor.format.includes('online') && tutor.format.includes('offline') 
                      ? 'Онлайн / Офлайн' 
                      : tutor.format.includes('online') ? 'Онлайн' : 'Офлайн'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="size-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">Время ответа</p>
                  <p className="text-gray-600">Обычно в течение часа</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Award className="size-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">Первое занятие</p>
                  <p className="text-gray-600">Бесплатная консультация</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 text-center">
                Безопасная оплата через платформу
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedSlotForBooking(null);
        }}
        tutorId={tutor.id}
        tutorName={tutor.name}
        hourlyRate={tutor.hourlyRate}
        subjects={tutor.subjects}
        preselectedSlot={selectedSlotForBooking}
      />
    </div>
  );
}

