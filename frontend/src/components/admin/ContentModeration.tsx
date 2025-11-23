import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Eye, Flag, MessageSquare, Star, User, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { moderationService, ModerationItem, ModerationStats } from '../../services/moderationService';

export function ContentModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = activeTab === 'pending' ? 'PENDING' : activeTab === 'approved' ? 'APPROVED' : activeTab === 'rejected' ? 'REJECTED' : undefined;
      const [itemsData, statsData] = await Promise.all([
        moderationService.getAllItemsForModeration(status),
        moderationService.getModerationStats()
      ]);
      
      setItems(itemsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading moderation data:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить данные модерации');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = stats?.pending || items.filter(i => i.status === 'pending').length;

  const handleApprove = async (itemId: string) => {
    try {
      setProcessingId(itemId);
      await moderationService.approveReview(itemId);
      await loadData(); // Перезагружаем данные
      if (selectedItem?.id === itemId) {
        setIsDetailModalOpen(false);
        setSelectedItem(null);
      }
    } catch (err: any) {
      console.error('Error approving review:', err);
      setError(err.response?.data?.error || 'Не удалось одобрить отзыв');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (itemId: string, reason: string) => {
    try {
      setProcessingId(itemId);
      await moderationService.rejectReview(itemId, reason);
      await loadData(); // Перезагружаем данные
      if (selectedItem?.id === itemId) {
        setIsDetailModalOpen(false);
        setSelectedItem(null);
        setRejectReason('');
      }
    } catch (err: any) {
      console.error('Error rejecting review:', err);
      setError(err.response?.data?.error || 'Не удалось отклонить отзыв');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (item: ModerationItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <Star className="size-5 text-yellow-500" />;
      case 'profile':
        return <User className="size-5 text-blue-500" />;
      case 'complaint':
        return <Flag className="size-5 text-red-500" />;
      default:
        return <MessageSquare className="size-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'review':
        return 'Отзыв';
      case 'profile':
        return 'Профиль';
      case 'complaint':
        return 'Жалоба';
      default:
        return 'Контент';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Высокий</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Средний</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Низкий</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ожидает</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Одобрено</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Отклонено</Badge>;
      default:
        return null;
    }
  };

  const renderModerationItem = (item: ModerationItem) => (
    <Card key={item.id} className="p-6 bg-white">
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(item.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">{getTypeLabel(item.type)}</span>
              {getPriorityBadge(item.priority)}
              {getStatusBadge(item.status)}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>

          {/* Author/Target */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                {item.author.avatar && <AvatarImage src={item.author.avatar} alt={item.author.name} />}
                <AvatarFallback>{item.author.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-900">{item.author.name}</span>
            </div>
            {item.target && (
              <>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    {item.target.avatar && <AvatarImage src={item.target.avatar} alt={item.target.name} />}
                    <AvatarFallback>{item.target.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-900">{item.target.name}</span>
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="mb-3">
            {item.rating && (
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-4 ${star <= item.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">({item.rating})</span>
              </div>
            )}
            <p className="text-gray-700 line-clamp-2">{item.content}</p>
          </div>

          {item.reason && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
                <strong>Причина жалобы:</strong> {item.reason}
              </p>
            </div>
          )}

          {/* Actions */}
          {item.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(item)}
                className="gap-2"
                disabled={processingId !== null}
              >
                <Eye className="size-4" />
                Подробнее
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(item.id)}
                className="gap-2 bg-green-600 hover:bg-green-700"
                disabled={processingId !== null}
              >
                {processingId === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Одобрить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(item.id, 'Нарушение правил')}
                className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                disabled={processingId !== null}
              >
                {processingId === item.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
                Отклонить
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Модерация контента</h2>
          <p className="text-gray-600">
            {pendingCount} {pendingCount === 1 ? 'элемент' : 'элементов'} ожидает проверки
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="size-5" />
            <p>{error}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <X className="size-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="size-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ожидает</p>
              <p className="text-2xl text-gray-900">{stats?.pending || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Одобрено</p>
              <p className="text-2xl text-gray-900">{stats?.approved || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-red-100 rounded-lg flex items-center justify-center">
              <X className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Отклонено</p>
              <p className="text-2xl text-gray-900">{stats?.rejected || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Flag className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Всего</p>
              <p className="text-2xl text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Ожидают ({stats?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Одобренные ({stats?.approved || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Отклоненные ({stats?.rejected || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Нет отзывов, ожидающих модерации</p>
            </Card>
          ) : (
            items.map(renderModerationItem)
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Нет одобренных отзывов</p>
            </Card>
          ) : (
            items.map(renderModerationItem)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Нет отклоненных отзывов</p>
            </Card>
          ) : (
            items.map(renderModerationItem)
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      {selectedItem && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Детали модерации</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedItem.type)}
                <span className="text-lg text-gray-900">{getTypeLabel(selectedItem.type)}</span>
                {getPriorityBadge(selectedItem.priority)}
              </div>

              <Card className="p-4 bg-gray-50">
                {selectedItem.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-5 ${star <= selectedItem.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">Рейтинг: {selectedItem.rating}/5</span>
                  </div>
                )}
                <p className="text-gray-900">{selectedItem.content}</p>
              </Card>

              {selectedItem.reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-900">
                    <strong>Причина жалобы:</strong> {selectedItem.reason}
                  </p>
                </div>
              )}

              {selectedItem.status === 'pending' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Причина отклонения (опционально)
                  </label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Укажите причину отклонения..."
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1"
                >
                  Закрыть
                </Button>
                {selectedItem.status === 'pending' && (
                  <>
                    <Button
                      onClick={async () => {
                        await handleApprove(selectedItem.id);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={processingId !== null}
                    >
                      {processingId === selectedItem.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          Обработка...
                        </>
                      ) : (
                        'Одобрить'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await handleReject(selectedItem.id, rejectReason);
                      }}
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      disabled={processingId !== null}
                    >
                      {processingId === selectedItem.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" />
                          Обработка...
                        </>
                      ) : (
                        'Отклонить'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
