import React from 'react';
import { Search, Users, Calendar, MessageSquare, BookOpen, Star, FileText, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface EmptyStateProps {
  type: 'search' | 'students' | 'lessons' | 'messages' | 'reviews' | 'notifications' | 'schedule' | 'general';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ type, title, description, actionLabel, onAction }: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="size-16 text-gray-300" />;
      case 'students':
        return <Users className="size-16 text-gray-300" />;
      case 'lessons':
        return <BookOpen className="size-16 text-gray-300" />;
      case 'messages':
        return <MessageSquare className="size-16 text-gray-300" />;
      case 'reviews':
        return <Star className="size-16 text-gray-300" />;
      case 'notifications':
        return <Bell className="size-16 text-gray-300" />;
      case 'schedule':
        return <Calendar className="size-16 text-gray-300" />;
      default:
        return <FileText className="size-16 text-gray-300" />;
    }
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          title: 'Ничего не найдено',
          description: 'Попробуйте изменить параметры поиска или фильтры',
          actionLabel: 'Сбросить фильтры'
        };
      case 'students':
        return {
          title: 'У вас пока нет учеников',
          description: 'Заполните профиль и настройте расписание, чтобы начать принимать записи',
          actionLabel: 'Настроить профиль'
        };
      case 'lessons':
        return {
          title: 'Нет предстоящих занятий',
          description: 'Здесь будут отображаться ваши запланированные занятия',
          actionLabel: 'Найти репетитора'
        };
      case 'messages':
        return {
          title: 'Нет сообщений',
          description: 'Начните общение с репетиторами или учениками',
          actionLabel: null
        };
      case 'reviews':
        return {
          title: 'Пока нет отзывов',
          description: 'Отзывы от учеников будут отображаться здесь',
          actionLabel: null
        };
      case 'notifications':
        return {
          title: 'Нет уведомлений',
          description: 'Все уведомления будут отображаться здесь',
          actionLabel: null
        };
      case 'schedule':
        return {
          title: 'Расписание не настроено',
          description: 'Добавьте доступные временные слоты для занятий',
          actionLabel: 'Настроить расписание'
        };
      default:
        return {
          title: 'Нет данных',
          description: 'Здесь пока ничего нет',
          actionLabel: null
        };
    }
  };

  const content = {
    title: title || getDefaultContent().title,
    description: description || getDefaultContent().description,
    actionLabel: actionLabel !== undefined ? actionLabel : getDefaultContent().actionLabel
  };

  return (
    <Card className="p-12 bg-white text-center">
      <div className="max-w-md mx-auto">
        {getIcon()}
        <h3 className="text-gray-900 mt-4 mb-2">{content.title}</h3>
        <p className="text-gray-600 mb-6">{content.description}</p>
        {content.actionLabel && onAction && (
          <Button onClick={onAction}>{content.actionLabel}</Button>
        )}
      </div>
    </Card>
  );
}

// Specific empty state components
export function NoSearchResults() {
  return <EmptyState type="search" />;
}

export function NoStudents({ onSetupProfile }: { onSetupProfile?: () => void }) {
  return <EmptyState type="students" onAction={onSetupProfile} />;
}

export function NoLessons({ onFindTutor }: { onFindTutor?: () => void }) {
  return <EmptyState type="lessons" onAction={onFindTutor} />;
}

export function NoMessages() {
  return <EmptyState type="messages" />;
}

export function NoReviews() {
  return <EmptyState type="reviews" />;
}

export function NoNotifications() {
  return <EmptyState type="notifications" />;
}

export function NoSchedule({ onSetupSchedule }: { onSetupSchedule?: () => void }) {
  return <EmptyState type="schedule" onAction={onSetupSchedule} />;
}

