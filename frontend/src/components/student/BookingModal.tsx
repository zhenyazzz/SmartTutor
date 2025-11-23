import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, CreditCard, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { scheduleService, type ScheduleSlot } from '../../services/scheduleService';
import { lessonService } from '../../services/lessonService';
import { authService } from '../../services/authService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorId: string;
  tutorName: string;
  hourlyRate: number;
  subjects: string[];
  preselectedSlot?: ScheduleSlot | null;
}

export function BookingModal({ isOpen, onClose, tutorId, tutorName, hourlyRate, subjects, preselectedSlot }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(undefined as Date | undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null as ScheduleSlot | null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [format, setFormat] = useState('online');
  const [message, setMessage] = useState('');
  const [availableSlots, setAvailableSlots] = useState([] as ScheduleSlot[]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null as string | null);

  // Загрузка доступных слотов
  useEffect(() => {
    if (isOpen && tutorId) {
      const loadSlots = async () => {
        try {
          setLoading(true);
          const slots = await scheduleService.getAvailableSlots(tutorId, 14);
          setAvailableSlots(slots);
        } catch (err: any) {
          console.error('Error loading slots:', err);
          setError('Не удалось загрузить доступное время');
        } finally {
          setLoading(false);
        }
      };
      loadSlots();
    }
  }, [isOpen, tutorId]);

  // Установка предвыбранного слота
  useEffect(() => {
    if (preselectedSlot && isOpen) {
      const slotDate = new Date(preselectedSlot.dateTime);
      setSelectedDate(slotDate);
      setSelectedTime(preselectedSlot.startTime);
      setSelectedSlot(preselectedSlot);
    }
  }, [preselectedSlot, isOpen]);

  // Устанавливаем первый предмет по умолчанию
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  // Получаем доступные слоты для выбранной даты
  const getSlotsForDate = (date: Date | undefined): ScheduleSlot[] => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.filter(slot => slot.date === dateStr);
  };

  // Обработка выбора времени
  const handleTimeSelect = (slot: ScheduleSlot) => {
    setSelectedTime(slot.startTime);
    setSelectedSlot(slot);
  };

  // Создание бронирования
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedDate) return;

    try {
      setBooking(true);
      setError(null);

      // Получаем текущего пользователя
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        setError('Необходима авторизация для создания записи. Пожалуйста, обновите страницу и войдите заново.');
        setBooking(false);
        return;
      }
      const studentId = currentUser.id;

      // Формируем дату и время
      const [hours, minutes] = selectedSlot.startTime.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);

      // Создаем урок
      await lessonService.createLesson({
        tutorId,
        studentId: studentId.toString(),
        dateTime: dateTime.toISOString(),
        duration: 60,
        price: hourlyRate
      });

      setStep(3);
      setTimeout(() => {
        onClose();
        setStep(1);
        setSelectedDate(undefined);
        setSelectedTime('');
        setSelectedSlot(null);
        setMessage('');
        setError(null);
        // Обновляем страницу, чтобы показать обновленное расписание
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Error creating lesson:', err);
      
      // Проверяем, это ошибка авторизации
      if (err.isAuthError || err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, обновите страницу и войдите заново.');
        
        // Очищаем токены только если это действительно необходимо
        if (err.shouldClearTokens) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Не удалось создать бронирование');
      }
      
      setBooking(false);
    }
  };

  const slotsForSelectedDate = getSlotsForDate(selectedDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b" style={{ flexShrink: 0 }}>
          <DialogTitle>
            {step === 1 && 'Выберите дату и время'}
            {step === 2 && 'Подтверждение записи'}
            {step === 3 && 'Запись подтверждена!'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-4 pb-2" style={{ minHeight: 0, overflowY: 'auto', flex: '1 1 0%' }}>
        {step === 1 && (
          <div className="space-y-6">
            {/* Subject Selection */}
            {subjects.length > 1 && (
              <div>
                <Label className="mb-3 block">Предмет</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Selection */}
            <div>
              <Label className="mb-3 block">Дата занятия</Label>
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Time Selection */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="size-4 animate-spin text-gray-400" />
                <p className="text-gray-600">Загрузка доступного времени...</p>
              </div>
            ) : selectedDate ? (
              <div>
                <Label className="mb-3 block">Время начала занятия</Label>
                {slotsForSelectedDate.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    На выбранную дату нет доступных слотов
                  </p>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {slotsForSelectedDate
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(slot => (
                        <Button
                          key={slot.id}
                          variant={selectedTime === slot.startTime ? 'default' : 'outline'}
                          onClick={() => handleTimeSelect(slot)}
                        >
                          {slot.startTime}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Выберите дату для просмотра доступного времени
              </p>
            )}

            {/* Format Selection */}
            {selectedTime && (
              <div>
                <Label className="mb-3 block">Формат занятия</Label>
                <RadioGroup value={format} onValueChange={setFormat}>
                  <div className="flex items-center space-x-2 p-3 border rounded-md">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <div>
                        <p className="text-gray-900">Онлайн</p>
                        <p className="text-sm text-gray-600">Занятие через Zoom или Google Meet</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md">
                    <RadioGroupItem value="offline" id="offline" />
                    <Label htmlFor="offline" className="flex-1 cursor-pointer">
                      <div>
                        <p className="text-gray-900">Офлайн</p>
                        <p className="text-sm text-gray-600">Личная встреча по адресу репетитора</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Message */}
            {selectedTime && format && (
              <div>
                <Label htmlFor="message" className="mb-3 block">
                  Сообщение репетитору (необязательно)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Расскажите о ваших целях и ожиданиях от занятий..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Репетитор</span>
                <span className="text-gray-900">{tutorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Дата</span>
                <span className="text-gray-900">
                  {selectedDate?.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Время</span>
                <span className="text-gray-900">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Предмет</span>
                <span className="text-gray-900">{selectedSubject || subjects[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Формат</span>
                <span className="text-gray-900">{format === 'online' ? 'Онлайн' : 'Офлайн'}</span>
              </div>
              <div className="pt-4 border-t flex justify-between">
                <span className="text-gray-900 font-semibold">Итого</span>
                <span className="text-gray-900 font-semibold">{hourlyRate} ₽</span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="mb-3 block">Способ оплаты</Label>
              <Select defaultValue="card">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Банковская карта</SelectItem>
                  <SelectItem value="wallet">Электронный кошелек</SelectItem>
                  <SelectItem value="later">Оплатить после занятия</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Бесплатная отмена</strong> возможна за 24 часа до начала занятия.
                После подтверждения записи вы получите уведомление на email.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="size-8 text-green-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Запись успешно создана!</h3>
            <p className="text-gray-600">
              Детали занятия отправлены на вашу электронную почту.
              Репетитор свяжется с вами в ближайшее время.
            </p>
          </div>
        )}
        </div>

        {/* Fixed buttons at bottom */}
        <div className="flex-shrink-0 border-t pt-4 px-6 pb-6 bg-white" style={{ flexShrink: 0 }}>
          {step === 1 && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Отмена
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedTime}
                className="flex-1"
              >
                Далее
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Назад
              </Button>
              <Button 
                onClick={handleConfirmBooking} 
                className="flex-1"
                disabled={booking}
              >
                {booking ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Создание записи...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4 mr-2" />
                    Подтвердить и оплатить
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

