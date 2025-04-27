'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllUserFileTasks, getPendingReviewTasks } from '@/lib/api/admin';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingReviews: 0,
    totalFiles: 0,
    approvedFiles: 0,
    rejectedFiles: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取待审核任务
        const pendingResponse = await getPendingReviewTasks(0, 1);
        
        // 获取所有任务
        const allFilesResponse = await getAllUserFileTasks(0, 1);
        
        // 获取已审核通过的任务
        const approvedResponse = await getAllUserFileTasks(0, 1, 2); // 2 - 已发布
        
        // 获取已驳回的任务
        const rejectedResponse = await getAllUserFileTasks(0, 1, 3); // 3 - 已驳回
        
        setStats({
          pendingReviews: pendingResponse.totalElements || 0,
          totalFiles: allFilesResponse.totalElements || 0,
          approvedFiles: approvedResponse.totalElements || 0,
          rejectedFiles: rejectedResponse.totalElements || 0,
        });
      } catch (error) {
        console.error('获取统计数据失败', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">加载中...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">管理员控制台</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">待审核任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-gray-500 mt-1">待处理的文件审核任务</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">文件总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-gray-500 mt-1">系统内所有文件任务</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">已发布文件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.approvedFiles}</div>
            <p className="text-xs text-gray-500 mt-1">已审核通过的文件任务</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">已驳回文件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rejectedFiles}</div>
            <p className="text-xs text-gray-500 mt-1">未通过审核的文件任务</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 