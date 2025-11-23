import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Save, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { authService } from '../../services/authService';
import { tutorService } from '../../services/tutorService';
import { scheduleService, ScheduleTemplate } from '../../services/scheduleService';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  dbId?: number; // ID из базы данных для существующих слотов
}

interface DaySchedule {
  day: string;
  dayShort: string;
  dayOfWeek: string; // MONDAY, TUESDAY, etc.
  enabled: boolean;
  slots: TimeSlot[];
}

const daysOfWeek = [
  { day: 'Понедельник', dayShort: 'Пн', dayOfWeek: 'MONDAY' },
  { day: 'Вторник', dayShort: 'Вт', dayOfWeek: 'TUESDAY' },
  { day: 'Среда', dayShort: 'Ср', dayOfWeek: 'WEDNESDAY' },
  { day: 'Четверг', dayShort: 'Чт', dayOfWeek: 'THURSDAY' },
  { day: 'Пятница', dayShort: 'Пт', dayOfWeek: 'FRIDAY' },
  { day: 'Суббота', dayShort: 'Сб', dayOfWeek: 'SATURDAY' },
  { day: 'Воскресенье', dayShort: 'Вс', dayOfWeek: 'SUNDAY' }
];

const timeOptions = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export function ScheduleEditor() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    daysOfWeek.map(({ day, dayShort, dayOfWeek }) => ({
      day,
      dayShort,
      dayOfWeek,
      enabled: false,
      slots: []
    }))
  );

  const [draggedSlot, setDraggedSlot] = useState<{ dayIndex: number; slotId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorId, setTutorId] = useState<string | null>(null);

  // Загрузка данных репетитора и расписания
  useEffect(() => {
    const loadSchedule = async () => {
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

        // Загружаем расписание
        const scheduleTemplate = await scheduleService.getScheduleTemplate(tutorData.id);

        // Преобразуем данные из API в формат компонента
        const newSchedule = daysOfWeek.map(({ day, dayShort, dayOfWeek }) => {
          const daySlots = scheduleTemplate
            .filter(slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable)
            .map(slot => ({
              id: `slot-${slot.id}`,
              dbId: slot.id,
              start: slot.startTime.slice(0, 5), // Преобразуем '09:00:00' в '09:00'
              end: slot.endTime.slice(0, 5)
            }));

          return {
            day,
            dayShort,
            dayOfWeek,
            enabled: daySlots.length > 0,
            slots: daySlots
          };
        });

        setSchedule(newSchedule);
      } catch (err: any) {
        console.error('Error loading schedule:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить расписание');
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  const toggleDay = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].enabled = !newSchedule[dayIndex].enabled;
    setSchedule(newSchedule);
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      start: '09:00',
      end: '10:00'
    };
    newSchedule[dayIndex].slots.push(newSlot);
    setSchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotId: string) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots = newSchedule[dayIndex].slots.filter(slot => slot.id !== slotId);
    setSchedule(newSchedule);
  };

  const updateTimeSlot = (dayIndex: number, slotId: string, field: 'start' | 'end', value: string) => {
    const newSchedule = [...schedule];
    const slot = newSchedule[dayIndex].slots.find(s => s.id === slotId);
    if (slot) {
      slot[field] = value;
      setSchedule(newSchedule);
    }
  };

  const handleDragStart = (dayIndex: number, slotId: string) => {
    setDraggedSlot({ dayIndex, slotId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetDayIndex: number) => {
    if (!draggedSlot) return;

    const newSchedule = [...schedule];
    const sourceDay = newSchedule[draggedSlot.dayIndex];
    const targetDay = newSchedule[targetDayIndex];

    const slotIndex = sourceDay.slots.findIndex(s => s.id === draggedSlot.slotId);
    if (slotIndex !== -1) {
      const [movedSlot] = sourceDay.slots.splice(slotIndex, 1);
      // Удаляем dbId при перемещении, так как это новый слот для другого дня
      movedSlot.dbId = undefined;
      targetDay.slots.push(movedSlot);
      // Включаем день, если он был выключен
      if (!targetDay.enabled) {
        targetDay.enabled = true;
      }
      setSchedule(newSchedule);
    }

    setDraggedSlot(null);
  };

  // Сохранение расписания
  const handleSave = async () => {
    if (!tutorId) {
      setError('ID репетитора не найден');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Преобразуем данные компонента в формат API
      const slotsToSave: ScheduleTemplate[] = [];

      schedule.forEach(daySchedule => {
        if (daySchedule.enabled) {
          daySchedule.slots.forEach(slot => {
            slotsToSave.push({
              id: slot.dbId || 0, // Для новых слотов будет 0, но это не важно при сохранении
              dayOfWeek: daySchedule.dayOfWeek,
              startTime: `${slot.start}:00`, // Преобразуем '09:00' в '09:00:00'
              endTime: `${slot.end}:00`,
              isAvailable: true
            });
          });
        }
      });

      await scheduleService.updateSchedule(tutorId, slotsToSave);
      
      // Показываем сообщение об успехе (можно добавить toast)
      alert('Расписание успешно сохранено!');
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      setError(err.response?.data?.error || 'Не удалось сохранить расписание');
    } finally {
      setSaving(false);
    }
  };

  // Быстрые шаблоны
  const applyTemplate = (template: 'weekdays' | 'evenings' | 'weekends' | 'clear') => {
    const newSchedule = daysOfWeek.map(({ day, dayShort, dayOfWeek }) => {
      let slots: TimeSlot[] = [];
      let enabled = false;

      if (template === 'clear') {
        enabled = false;
        slots = [];
      } else if (template === 'weekdays') {
        // Пн-Пт, 9:00-18:00
        if (['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(dayOfWeek)) {
          enabled = true;
          slots = Array.from({ length: 9 }, (_, i) => ({
            id: `temp-${dayOfWeek}-${i}`,
            start: `${(9 + i).toString().padStart(2, '0')}:00`,
            end: `${(10 + i).toString().padStart(2, '0')}:00`
          }));
        }
      } else if (template === 'evenings') {
        // Пн-Пт, 18:00-21:00
        if (['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(dayOfWeek)) {
          enabled = true;
          slots = Array.from({ length: 3 }, (_, i) => ({
            id: `temp-${dayOfWeek}-${i}`,
            start: `${(18 + i).toString().padStart(2, '0')}:00`,
            end: `${(19 + i).toString().padStart(2, '0')}:00`
          }));
        }
      } else if (template === 'weekends') {
        // Сб-Вс, 10:00-16:00
        if (['SATURDAY', 'SUNDAY'].includes(dayOfWeek)) {
          enabled = true;
          slots = Array.from({ length: 6 }, (_, i) => ({
            id: `temp-${dayOfWeek}-${i}`,
            start: `${(10 + i).toString().padStart(2, '0')}:00`,
            end: `${(11 + i).toString().padStart(2, '0')}:00`
          }));
        }
      }

      return {
        day,
        dayShort,
        dayOfWeek,
        enabled,
        slots
      };
    });

    setSchedule(newSchedule);
  };

  const enabledDaysCount = schedule.filter(d => d.enabled).length;
  const totalSlotsCount = schedule.reduce((sum, d) => sum + d.slots.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Загрузка расписания...</p>
        </div>
      </div>
    );
  }

  if (error && !tutorId) {
    return (
      <Card className="p-6 bg-white">
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-900 mb-2">Ваше расписание</h3>
            <p className="text-gray-600">
              Настройте доступное время для занятий. Ученики смогут выбирать из этих временных слотов.
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl text-gray-900">{enabledDaysCount}</div>
              <div className="text-sm text-gray-600">Рабочих дней</div>
            </div>
            <div>
              <div className="text-2xl text-gray-900">{totalSlotsCount}</div>
              <div className="text-sm text-gray-600">Временных слотов</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Schedule Editor */}
      <Card className="p-6 bg-white">
        <div className="space-y-6">
          {schedule.map((daySchedule, dayIndex) => (
            <div
              key={daySchedule.day}
              className={`border rounded-lg p-4 ${
                daySchedule.enabled ? 'bg-white' : 'bg-gray-50'
              } ${draggedSlot && 'transition-all'}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(dayIndex)}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={daySchedule.enabled}
                    onCheckedChange={() => toggleDay(dayIndex)}
                  />
                  <div>
                    <Label className="cursor-pointer text-gray-900">
                      {daySchedule.day}
                    </Label>
                    {daySchedule.enabled && (
                      <p className="text-sm text-gray-500">
                        {daySchedule.slots.length} {daySchedule.slots.length === 1 ? 'слот' : 'слотов'}
                      </p>
                    )}
                  </div>
                </div>
                {daySchedule.enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(dayIndex)}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Добавить слот
                  </Button>
                )}
              </div>

              {/* Time Slots */}
              {daySchedule.enabled && daySchedule.slots.length > 0 && (
                <div className="space-y-3 ml-8">
                  {daySchedule.slots.map((slot) => (
                    <div
                      key={slot.id}
                      draggable
                      onDragStart={() => handleDragStart(dayIndex, slot.id)}
                      className={`flex items-center gap-3 p-3 border rounded-md bg-white hover:border-indigo-300 cursor-move ${
                        draggedSlot?.slotId === slot.id ? 'opacity-50' : ''
                      }`}
                    >
                      <Clock className="size-4 text-gray-400" />
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={slot.start}
                          onChange={(e) => updateTimeSlot(dayIndex, slot.id, 'start', e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-gray-500">—</span>
                        <select
                          value={slot.end}
                          onChange={(e) => updateTimeSlot(dayIndex, slot.id, 'end', e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(dayIndex, slot.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {daySchedule.enabled && daySchedule.slots.length === 0 && (
                <div className="ml-8 text-center py-6 text-gray-500 text-sm border border-dashed rounded-md">
                  Нет временных слотов. Нажмите "Добавить слот" чтобы создать.
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {/* Quick Templates */}
      <Card className="p-6 bg-white">
        <h3 className="mb-4">Быстрые шаблоны</h3>
        <div className="flex gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyTemplate('weekdays')}
          >
            Будние дни (9:00-18:00)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyTemplate('evenings')}
          >
            Вечера (18:00-21:00)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyTemplate('weekends')}
          >
            Выходные (10:00-16:00)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => applyTemplate('clear')}
          >
            Очистить расписание
          </Button>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          className="gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Сохранить расписание
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

