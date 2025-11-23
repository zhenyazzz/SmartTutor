import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Edit, Trash2, Ban, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Checkbox } from '../ui/checkbox';
import { UserDetailsModal } from './UserDetailsModal';
import { EditUserModal } from './EditUserModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CreateUserModal } from './CreateUserModal';
import { userService, User } from '../../services/userService';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Загрузка пользователей
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const usersData = await userService.getAllUsersForAdmin();
        setUsers(usersData);
      } catch (err: any) {
        console.error('Error loading users:', err);
        setError(err.response?.data?.error || 'Не удалось загрузить пользователей');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleViewDetails = async (user: User) => {
    try {
      const userDetails = await userService.getUserDetailsForAdmin(user.id);
      setSelectedUser(userDetails);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      console.error('Error loading user details:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить детали пользователя');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSuspend = async (userId: string) => {
    try {
      await userService.toggleUserStatus(userId, false);
      // Перезагружаем данные с сервера
      const usersData = await userService.getAllUsersForAdmin();
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error suspending user:', err);
      setError(err.response?.data?.error || 'Не удалось заблокировать пользователя');
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await userService.toggleUserStatus(userId, true);
      // Перезагружаем данные с сервера
      const usersData = await userService.getAllUsersForAdmin();
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error activating user:', err);
      setError(err.response?.data?.error || 'Не удалось активировать пользователя');
    }
  };

  const confirmDelete = async () => {
    if (selectedUser) {
      try {
        await userService.deleteUser(selectedUser.id);
        // Перезагружаем данные с сервера
        const usersData = await userService.getAllUsersForAdmin();
        setUsers(usersData);
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setError(err.response?.data?.error || 'Не удалось удалить пользователя');
        setIsDeleteModalOpen(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активный</Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Заблокирован</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ожидает</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tutor':
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Репетитор</Badge>;
      case 'student':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Ученик</Badge>;
      case 'admin':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Админ</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 bg-white">
          <p className="text-red-600">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Обновить
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Управление пользователями</h2>
          <p className="text-gray-600">Всего пользователей: {users.length}</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="size-4" />
          Добавить пользователя
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6 bg-white">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="tutor">Репетиторы</SelectItem>
              <SelectItem value="student">Ученики</SelectItem>
              <SelectItem value="admin">Администраторы</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="suspended">Заблокированные</SelectItem>
              <SelectItem value="pending">Ожидающие</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-indigo-50 rounded-lg">
            <span className="text-sm text-indigo-900">
              Выбрано: {selectedUsers.length}
            </span>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                if (selectedUsers.length === 1) {
                  const userToEdit = users.find(u => u.id === selectedUsers[0]);
                  if (userToEdit) {
                    setSelectedUser(userToEdit);
                    setIsEditModalOpen(true);
                  }
                }
              }}
              disabled={selectedUsers.length !== 1}
            >
              <Edit className="size-4" />
              Редактировать
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 text-red-600"
              onClick={async () => {
                if (selectedUsers.length > 0) {
                  if (window.confirm(`Вы уверены, что хотите удалить ${selectedUsers.length} пользователей?`)) {
                    try {
                      for (const userId of selectedUsers) {
                        await userService.deleteUser(userId);
                      }
                      // Перезагружаем список
                      const usersData = await userService.getAllUsersForAdmin();
                      setUsers(usersData);
                      setSelectedUsers([]);
                    } catch (err: any) {
                      console.error('Error deleting users:', err);
                      setError(err.response?.data?.error || 'Не удалось удалить пользователей');
                    }
                  }
                }
              }}
            >
              <Trash2 className="size-4" />
              Удалить
            </Button>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleAllUsers}
                  />
                </th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Пользователь</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Роль</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Статус</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Дата регистрации</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Последняя активность</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Статистика</th>
                <th className="px-6 py-3 text-right text-gray-600 text-sm">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900">{user.name}</p>
                          {user.verified && (
                            <CheckCircle className="size-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(user.joinedDate).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {user.lastActive || 'Недавно'}
                  </td>
                  <td className="px-6 py-4">
                    {user.stats && (
                      <div className="text-sm text-gray-600">
                        {user.role === 'tutor' ? (
                          <>
                            <div>{user.stats.students} учеников</div>
                            <div>{user.stats.lessons} занятий</div>
                          </>
                        ) : (
                          <div>{user.stats.lessons} занятий</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                          <CheckCircle className="size-4 mr-2" />
                          Подробнее
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="size-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                            <Ban className="size-4 mr-2" />
                            Заблокировать
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                            <CheckCircle className="size-4 mr-2" />
                            Активировать
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Пользователи не найдены</p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Показано {filteredUsers.length} из {users.length} пользователей
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Предыдущая</Button>
          <Button variant="outline" size="sm">Следующая</Button>
        </div>
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserDetailsModal
            user={selectedUser}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedUser(null);
            }}
          />
          <EditUserModal
            user={selectedUser}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            onSave={async (updatedUser) => {
              try {
                // Обновляем основные данные
                await userService.updateUser(updatedUser.id, {
                  name: updatedUser.name,
                  email: updatedUser.email,
                  role: updatedUser.role,
                  phone: updatedUser.phone
                });

                // Обновляем статус, если он изменился
                const currentUser = users.find(u => u.id === updatedUser.id);
                if (currentUser && currentUser.status !== updatedUser.status) {
                  const isActive = updatedUser.status === 'active';
                  await userService.toggleUserStatus(updatedUser.id, isActive);
                }

                // Перезагружаем данные
                const usersData = await userService.getAllUsersForAdmin();
                setUsers(usersData);
                setIsEditModalOpen(false);
                setSelectedUser(null);
              } catch (err: any) {
                console.error('Error updating user:', err);
                setError(err.response?.data?.error || 'Не удалось обновить пользователя');
                throw err; // Пробрасываем ошибку, чтобы модальное окно могло её показать
              }
            }}
          />
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            onConfirm={confirmDelete}
            userName={selectedUser.name}
          />
        </>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setError(null);
        }}
        onSave={async (userData) => {
          try {
            await userService.createUser(userData);
            // Перезагружаем список пользователей
            const usersData = await userService.getAllUsersForAdmin();
            setUsers(usersData);
            setIsCreateModalOpen(false);
            setError(null);
          } catch (err: any) {
            console.error('Error creating user:', err);
            setError(err.response?.data?.error || 'Не удалось создать пользователя');
            throw err; // Пробрасываем ошибку, чтобы модальное окно могло её показать
          }
        }}
      />
    </div>
  );
}
