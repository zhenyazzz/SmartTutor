import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, GraduationCap, Target, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Progress } from '../ui/progress';

interface OnboardingFlowProps {
  userRole: 'student' | 'tutor';
  onComplete: (data: any) => void;
}

const subjects = [
  'Математика', 'Физика', 'Химия', 'Биология', 'Английский язык',
  'История', 'Программирование', 'География', 'Русский язык', 'Литература'
];

const scheduleOptions = [
  { value: 'morning', label: 'Утро (8:00-12:00)', icon: '🌅' },
  { value: 'afternoon', label: 'День (12:00-18:00)', icon: '☀️' },
  { value: 'evening', label: 'Вечер (18:00-22:00)', icon: '🌙' },
  { value: 'flexible', label: 'Гибкий график', icon: '⏰' }
];

export function OnboardingFlow({ userRole, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    subjects: [],
    goals: '',
    schedule: '',
    experience: '',
    priceRange: '',
    bio: ''
  });

  const studentSteps = [
    {
      title: 'Добро пожаловать!',
      description: 'Давайте настроим ваш профиль для лучшего подбора репетитора',
      icon: Sparkles
    },
    {
      title: 'Выберите предметы',
      description: 'Какие предметы вы хотите изучать?',
      icon: GraduationCap
    },
    {
      title: 'Ваши цели',
      description: 'Расскажите о том, чего вы хотите достичь',
      icon: Target
    },
    {
      title: 'Удобное время',
      description: 'Когда вам удобно заниматься?',
      icon: Calendar
    }
  ];

  const tutorSteps = [
    {
      title: 'Добро пожаловать!',
      description: 'Давайте создадим ваш профиль репетитора',
      icon: Sparkles
    },
    {
      title: 'Ваши предметы',
      description: 'Какие предметы вы преподаете?',
      icon: GraduationCap
    },
    {
      title: 'Опыт работы',
      description: 'Расскажите о вашем опыте преподавания',
      icon: Target
    },
    {
      title: 'Расписание',
      description: 'Когда вы готовы проводить занятия?',
      icon: Calendar
    }
  ];

  const steps = userRole === 'student' ? studentSteps : tutorSteps;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const toggleSubject = (subject: string) => {
    setFormData((prev: any) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s: string) => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="text-center py-8">
          <div className="size-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="size-10 text-indigo-600" />
          </div>
          <h2 className="text-gray-900 mb-4">
            {userRole === 'student' ? 'Рады видеть вас!' : 'Добро пожаловать в команду!'}
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            {userRole === 'student'
              ? 'Мы поможем вам найти идеального репетитора. Ответьте на несколько вопросов, чтобы мы могли подобрать лучшие варианты.'
              : 'Давайте настроим ваш профиль, чтобы ученики могли легко вас найти и записаться на занятия.'}
          </p>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {subjects.map(subject => (
              <Badge
                key={subject}
                variant={formData.subjects.includes(subject) ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => toggleSubject(subject)}
              >
                {formData.subjects.includes(subject) && (
                  <Check className="size-3 mr-1" />
                )}
                {subject}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Выбрано предметов: {formData.subjects.length}
          </p>
        </div>
      );
    }

    if (currentStep === 2) {
      if (userRole === 'student') {
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="goals">Расскажите о ваших целях</Label>
              <Textarea
                id="goals"
                placeholder="Например: Подготовка к ЕГЭ по математике, улучшение разговорного английского..."
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                rows={5}
              />
            </div>
            <div>
              <Label htmlFor="priceRange">Бюджет на занятие (₽/час)</Label>
              <Input
                id="priceRange"
                type="number"
                placeholder="1500"
                value={formData.priceRange}
                onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
              />
            </div>
          </div>
        );
      } else {
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="experience">Опыт преподавания (лет)</Label>
              <Input
                id="experience"
                type="number"
                placeholder="5"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                placeholder="Расскажите о вашем опыте, достижениях и подходе к преподаванию..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={5}
              />
            </div>
          </div>
        );
      }
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-4">
          <RadioGroup
            value={formData.schedule}
            onValueChange={(value) => setFormData({ ...formData, schedule: value })}
          >
            {scheduleOptions.map(option => (
              <div
                key={option.value}
                className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <span>{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    return null;
  };

  const canProceed = () => {
    if (currentStep === 0) return true;
    if (currentStep === 1) return formData.subjects.length > 0;
    if (currentStep === 2) {
      if (userRole === 'student') return formData.goals.trim() !== '';
      return formData.bio.trim() !== '';
    }
    if (currentStep === 3) return formData.schedule !== '';
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Шаг {currentStep + 1} из {steps.length}
            </span>
            <span className="text-sm text-indigo-600">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 bg-white shadow-lg">
          {/* Step Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {React.createElement(steps[currentStep].icon, {
                className: 'size-6 text-indigo-600'
              })}
              <h2 className="text-gray-900">{steps[currentStep].title}</h2>
            </div>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="size-4" />
              Назад
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Завершить
                  <Check className="size-4" />
                </>
              ) : (
                <>
                  Далее
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>

          {/* Skip Option */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentStep(steps.length - 1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Пропустить настройку
              </button>
            </div>
          )}
        </Card>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-indigo-600'
                  : index < currentStep
                  ? 'w-2 bg-indigo-300'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
