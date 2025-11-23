import React from 'react';
import { Star, MapPin, Video, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import type { Tutor } from './StudentHomePage';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface TutorCardProps {
  tutor: Tutor;
  onView: () => void;
}

export function TutorCard({ tutor, onView }: TutorCardProps) {
  return (
    <Card className="p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer" onClick={onView}>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar className="size-20">
            {tutor.avatar && <AvatarImage src={tutor.avatar} alt={tutor.name} />}
            <AvatarFallback>{tutor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          {tutor.isOnline && (
            <div className="absolute bottom-0 right-0 size-4 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 truncate">{tutor.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-900">{tutor.rating}</span>
                </div>
                <span className="text-gray-500 text-sm">({tutor.reviews} отзывов)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-900">{tutor.hourlyRate} ₽</div>
              <div className="text-sm text-gray-500">за час</div>
            </div>
          </div>

          {/* Subjects */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tutor.subjects.map(subject => (
              <Badge key={subject} variant="secondary" className="bg-indigo-50 text-indigo-700">
                {subject}
              </Badge>
            ))}
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TrendingUp className="size-4" />
              <span>{tutor.experience} лет опыта</span>
            </div>
            {tutor.location && (
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                <span>{tutor.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Video className="size-4" />
              <span>{tutor.format.includes('online') && tutor.format.includes('offline') 
                ? 'Онлайн/Офлайн' 
                : tutor.format.includes('online') ? 'Онлайн' : 'Офлайн'}</span>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-4 text-gray-400" />
            <div className="flex gap-1">
              {tutor.availability.map(day => (
                <Badge key={day} variant="outline" className="text-xs">
                  {day}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full" 
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            Подробнее
          </Button>
        </div>
      </div>
    </Card>
  );
}

