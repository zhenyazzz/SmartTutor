import React, { useState, useEffect } from 'react';
import { StudentHomePage } from './components/student/StudentHomePage';
import { TutorDetailPage } from './components/student/TutorDetailPage';
import { TutorDashboard } from './components/tutor/TutorDashboard';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { OnboardingFlow } from './components/auth/OnboardingFlow';
import { UserManagement } from './components/admin/UserManagement';
import { ContentModeration } from './components/admin/ContentModeration';
import { ChatSystem } from './components/common/ChatSystem';
import { Users, GraduationCap, BarChart3, MessageSquare, Settings, Shield } from 'lucide-react';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { authService } from './services/authService';

export type UserRole = 'student' | 'tutor' | 'admin';
export type Page = 'home' | 'tutorDetail' | 'tutorDashboard' | 'adminAnalytics' | 'adminUsers' | 'adminModeration' | 'chat';
export type AuthPage = 'login' | 'register' | 'forgotPassword' | 'onboarding' | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && authService.isAuthenticated()) {
      setIsAuthenticated(true);
      setAuthPage(null);
      setCurrentUser(user);
      // Преобразуем роль из бэкенда (STUDENT) в формат фронтенда (student)
      const roleMap: Record<string, UserRole> = {
        'STUDENT': 'student',
        'TUTOR': 'tutor',
        'ADMIN': 'admin'
      };
      const mappedRole = roleMap[user.role] || 'student';
      setUserRole(mappedRole);
      // Устанавливаем начальную страницу в зависимости от роли
      if (mappedRole === 'admin') {
        setCurrentPage('adminAnalytics');
      } else if (mappedRole === 'tutor') {
        setCurrentPage('tutorDashboard');
      } else {
        setCurrentPage('home');
      }
    }
  }, []);

  const handleLogin = (user: any) => {
    setIsAuthenticated(true);
    setAuthPage(null);
    setCurrentUser(user);
    // Преобразуем роль из бэкенда (STUDENT) в формат фронтенда (student)
    const roleMap: Record<string, UserRole> = {
      'STUDENT': 'student',
      'TUTOR': 'tutor',
      'ADMIN': 'admin'
    };
    const mappedRole = roleMap[user.role] || 'student';
    setUserRole(mappedRole);
    // Устанавливаем начальную страницу в зависимости от роли
    if (mappedRole === 'admin') {
      setCurrentPage('adminAnalytics');
    } else if (mappedRole === 'tutor') {
      setCurrentPage('tutorDashboard');
    } else {
      setCurrentPage('home');
    }
  };

  const handleRegister = (user: any) => {
    setCurrentUser(user);
    // Преобразуем роль из бэкенда (STUDENT) в формат фронтенда (student)
    const roleMap: Record<string, UserRole> = {
      'STUDENT': 'student',
      'TUTOR': 'tutor',
      'ADMIN': 'admin'
    };
    const mappedRole = roleMap[user.role] || 'student';
    setUserRole(mappedRole);
    setNeedsOnboarding(true);
    setAuthPage('onboarding');
  };

  const handleOnboardingComplete = (data: any) => {
    setIsAuthenticated(true);
    setAuthPage(null);
    setNeedsOnboarding(false);
    // Устанавливаем начальную страницу в зависимости от роли
    if (userRole === 'admin') {
      setCurrentPage('adminAnalytics');
    } else if (userRole === 'tutor') {
      setCurrentPage('tutorDashboard');
    } else {
      setCurrentPage('home');
    }
  };

  const handleViewTutorDetail = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    setCurrentPage('tutorDetail');
  };

  // Проверка доступа к страницам в зависимости от роли
  useEffect(() => {
    if (!isAuthenticated) return;

    // Проверяем, может ли пользователь с текущей ролью находиться на текущей странице
    const adminPages = ['adminAnalytics', 'adminUsers', 'adminModeration'];
    const tutorPages = ['tutorDashboard'];

    // Если пользователь пытается открыть админскую страницу, но он не админ
    if (adminPages.includes(currentPage) && userRole !== 'admin') {
      // Перенаправляем на доступную страницу
      if (userRole === 'tutor') {
        setCurrentPage('tutorDashboard');
      } else {
        setCurrentPage('home');
      }
    }
    // Если пользователь пытается открыть страницу репетитора, но он не репетитор и не админ
    else if (tutorPages.includes(currentPage) && userRole !== 'tutor' && userRole !== 'admin') {
      setCurrentPage('home');
    }
  }, [currentPage, userRole, isAuthenticated]);

  // Render authentication pages
  if (!isAuthenticated) {
    switch (authPage) {
      case 'login':
        return (
          <LoginPage
            onLogin={handleLogin}
            onNavigateToRegister={() => setAuthPage('register')}
            onNavigateToForgotPassword={() => setAuthPage('forgotPassword')}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onNavigateToLogin={() => setAuthPage('login')}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPasswordPage
            onNavigateToLogin={() => setAuthPage('login')}
          />
        );
      case 'onboarding':
        return (
          <OnboardingFlow
            userRole={userRole}
            onComplete={handleOnboardingComplete}
          />
        );
      default:
        return null;
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <StudentHomePage onViewTutor={handleViewTutorDetail} />;
      case 'tutorDetail':
        return (
          <TutorDetailPage
            tutorId={selectedTutorId!}
            onBack={() => setCurrentPage('home')}
          />
        );
      case 'tutorDashboard':
        return <TutorDashboard onNavigateToChat={() => setCurrentPage('chat')} />;
      case 'adminAnalytics':
        return <AdminAnalytics />;
      case 'adminUsers':
        return <UserManagement />;
      case 'adminModeration':
        return <ContentModeration />;
      case 'chat':
        return <ChatSystem />;
      default:
        return <StudentHomePage onViewTutor={handleViewTutorDetail} />;
    }
  };

  const renderAdminPanel = () => {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="analytics" onClick={() => setCurrentPage('adminAnalytics')}>
              <BarChart3 className="size-4 mr-2" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="users" onClick={() => setCurrentPage('adminUsers')}>
              <Users className="size-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="moderation" onClick={() => setCurrentPage('adminModeration')}>
              <Shield className="size-4 mr-2" />
              Модерация
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            {currentPage === 'adminAnalytics' && renderPage()}
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            {currentPage === 'adminUsers' && renderPage()}
          </TabsContent>
          <TabsContent value="moderation" className="mt-6">
            {currentPage === 'adminModeration' && renderPage()}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-indigo-600">TutorHub</h1>
            <div className="flex gap-2">
              {/* Кнопка "Ученик" - видна всем ролям */}
              <Button
                variant={currentPage === 'home' || currentPage === 'tutorDetail' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCurrentPage('home');
                }}
              >
                <Users className="size-4 mr-2" />
                Ученик
              </Button>
              {/* Кнопка "Репетитор" - видна репетиторам и админам */}
              {(userRole === 'tutor' ) && (
                <Button
                  variant={currentPage === 'tutorDashboard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCurrentPage('tutorDashboard');
                  }}
                >
                  <GraduationCap className="size-4 mr-2" />
                  Репетитор
                </Button>
              )}
              {/* Кнопка "Администратор" - видна только админам */}
              {userRole === 'admin' && (
                <Button
                  variant={['adminAnalytics', 'adminUsers', 'adminModeration'].includes(currentPage) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCurrentPage('adminAnalytics');
                  }}
                >
                  <BarChart3 className="size-4 mr-2" />
                  Администратор
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('chat')}
            >
              <MessageSquare className="size-5" />
            </Button>
            <span className="text-sm text-gray-600">
              Роль: <span className="font-medium">{
                userRole === 'student' ? 'Ученик' :
                userRole === 'tutor' ? 'Репетитор' : 'Администратор'
              }</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await authService.logout();
                setIsAuthenticated(false);
                setAuthPage('login');
                setCurrentUser(null);
              }}
            >
              Выйти
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {['adminAnalytics', 'adminUsers', 'adminModeration'].includes(currentPage)
        ? renderAdminPanel()
        : renderPage()}
    </div>
  );
}

export default App;