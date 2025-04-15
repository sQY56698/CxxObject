"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  PlusCircle, 
  TrendingUp, 
  Bookmark, 
  History, 
  Clock, 
  CircleDot, 
  CheckCircle2, 
  XCircle, 
  Coins,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { bountyApi } from "@/lib/api/bounty";
import { FileBounty, BountyStatus } from "@/types/bounty";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import useEmblaCarousel from 'embla-carousel-react';
import AutoPlay from 'embla-carousel-autoplay';
import { cn } from "@/lib/utils";

export default function Home() {
  const [latestBounties, setLatestBounties] = useState<FileBounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Embla Carousel 设置
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'center',
      slidesToScroll: 1,
    },
    [AutoPlay({ delay: 5000, stopOnInteraction: false })]
  );

  // 监听滚动事件更新指示器
  useEffect(() => {
    if (!emblaApi) return;
    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', handleSelect);

    return () => {
      emblaApi.off('select', handleSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // 获取最新悬赏数据
  useEffect(() => {
    const loadLatestBounties = async () => {
      try {
        setIsLoading(true);
        const data = await bountyApi.getLatestBounties();
        setLatestBounties(data);
      } catch (error) {
        console.error("加载最新悬赏失败:", error);
        toast.error("加载轮播图数据失败");
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestBounties();
  }, []);

  // 获取状态样式
  const getStatusStyle = (status: number) => {
    switch (status) {
      case BountyStatus.IN_PROGRESS:
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          label: "进行中",
          icon: <CircleDot className="h-3.5 w-3.5" />,
        };
      case BountyStatus.COMPLETED:
        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
          label: "已完成",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case BountyStatus.CLOSED:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          label: "已关闭",
          icon: <XCircle className="h-3.5 w-3.5" />,
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          label: "未知",
          icon: <CircleDot className="h-3.5 w-3.5" />,
        };
    }
  };

  // 模拟热门悬赏数据
  const hotTasks = [
    {
      id: 1,
      title: "寻找2024年最新的机器学习资料",
      reward: 500,
      deadline: "2024-04-20",
      category: "教育资源",
    },
    {
      id: 2,
      title: "需要完整版Adobe系列软件合集",
      reward: 300,
      deadline: "2024-04-15",
      category: "软件资源",
    },
    {
      id: 3,
      title: "收集各大高校考研真题资料",
      reward: 800,
      deadline: "2024-04-25",
      category: "教育资源",
    },
  ];

  // 模拟推荐悬赏数据
  const recommendedTasks = [
    {
      id: 4,
      title: "Python数据分析实战教程",
      reward: 400,
    },
    {
      id: 5,
      title: "前端开发学习资料合集",
      reward: 350,
    },
  ];

  return (
    <main className="min-h-screen bg-background">

      {/* Main Content Area - 左右布局 */}
      <section>
        <div className="container px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            {/* 左侧主要内容区域 */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              {/* 最新悬赏轮播图 */}
              <div className="rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-bold flex items-center">
                    <span className="bg-primary/10 p-1.5 rounded-md mr-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </span>
                    最新悬赏
                  </h2>
                  
                  {/* 轮播控制按钮 */}
                  {!isLoading && latestBounties.length > 0 && (
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-full border-primary/20 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-primary/5"
                        onClick={scrollPrev}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-full border-primary/20 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-primary/5"
                        onClick={scrollNext}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Card key={i} className="h-[240px]">
                        <CardContent className="p-5 space-y-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-24 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : latestBounties.length > 0 ? (
                  <div className="relative">
                    <div className="overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                        {latestBounties.map((bounty) => {
                          const statusStyle = getStatusStyle(bounty.status);
                          
                          return (
                            <div key={bounty.id} 
                              className="flex-[0_0_100%] min-w-0 px-4 
                                md:flex-[0_0_50%] lg:flex-[0_0_50%]"
                            >
                              <Link href={`/bounty/${bounty.id}`} className="block h-full">
                                <Card className="overflow-hidden border shadow-sm hover:shadow-lg 
                                  transition-all hover:border-primary/20 h-full flex flex-col 
                                  group bg-gradient-to-b from-white to-muted/5 mx-auto"
                                >
                                  <div className="relative p-5 pb-3 flex flex-col h-full">
                                    {/* 状态标签和积分显示 */}
                                    <div className="flex justify-between items-start mb-3">
                                      {/* 状态标签 */}
                                      <div
                                        className={cn(
                                          "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                                          "shadow-sm border border-opacity-10",
                                          "transition-transform group-hover:scale-105",
                                          statusStyle.bg,
                                          statusStyle.text
                                        )}
                                      >
                                        {statusStyle.icon}
                                        {statusStyle.label}
                                      </div>
                                      
                                      {/* 积分显示 */}
                                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100/50 
                                        px-3 py-1 rounded-full border border-amber-200/30 shadow-sm
                                        transition-transform group-hover:scale-105"
                                      >
                                        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-1">
                                          <Coins className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                                          {bounty.points}
                                        </span>
                                      </div>
                                    </div>

                                    {/* 标题 */}
                                    <div className="text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors">
                                      <div className="line-clamp-2">{bounty.title}</div>
                                    </div>

                                    {/* 描述 */}
                                    <p className="text-sm text-muted-foreground/90 line-clamp-2 mb-auto">
                                      {bounty.description}
                                    </p>

                                    {/* 统计信息 */}
                                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                                      {/* 时间信息 */}
                                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground/80">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{formatDateTime(bounty.createdAt)}</span>
                                      </div>

                                      {/* 查看和竞标数据 */}
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/10 text-muted-foreground/80 text-xs">
                                          <Eye className="h-3 w-3" />
                                          <span>{bounty.viewCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 text-primary/80 text-xs">
                                          <Users className="h-3 w-3" />
                                          <span>{bounty.bidCount}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg bg-white/80 backdrop-blur-sm shadow-sm">
                    <p className="text-muted-foreground">暂无最新悬赏</p>
                  </div>
                )}

                {/* 轮播图底部指示器 */}
                {!isLoading && latestBounties.length > 0 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {latestBounties.map((_, index) => (
                      <button
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 
                          ${selectedIndex === index 
                            ? 'w-8 bg-primary' 
                            : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                        onClick={() => emblaApi?.scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 热门悬赏 */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <span className="bg-red-100 p-1.5 rounded-md mr-2">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  </span>
                  热门悬赏
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotTasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold mb-2">{task.title}</h3>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/40 text-xs text-muted-foreground">
                              {task.category}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100/50 
                            px-3 py-1 rounded-full border border-amber-200/30 shadow-sm">
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-1">
                              <Coins className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                              {task.reward}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            截止: {task.deadline}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-primary/20 text-primary hover:bg-primary/5"
                          >
                            查看详情
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link href="/bounty">
                    <Button 
                      variant="outline"
                      className="border-primary/20 text-primary hover:bg-primary/5"
                    >
                      查看更多悬赏
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 平台特色 */}
              <div className="bg-gradient-to-br from-white to-muted/20 rounded-xl p-8 shadow-sm border">
                <h2 className="text-2xl font-bold mb-6 text-center">平台特色</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center bg-white p-6 rounded-lg shadow-sm border">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">安全可靠</h3>
                    <p className="text-muted-foreground text-sm">
                      文件经过安全检查，支付交易有保障
                    </p>
                  </div>
                  <div className="text-center bg-white p-6 rounded-lg shadow-sm border">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">快速响应</h3>
                    <p className="text-muted-foreground text-sm">
                      海量用户在线，迅速获得资源
                    </p>
                  </div>
                  <div className="text-center bg-white p-6 rounded-lg shadow-sm border">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">分类完善</h3>
                    <p className="text-muted-foreground text-sm">
                      资源分类详细，轻松找到所需
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧边栏 */}
            <div className="space-y-6 pt-6">
              {/* 发布悬赏卡片 */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/90 to-primary group">
                <CardContent className="p-6 text-white space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">发布新悬赏</h3>
                  </div>
                  <p className="text-sm text-white/80">
                    快速发布悬赏，找到你需要的资源
                  </p>
                  <Link href="/bounty/publish" className="block mt-4">
                    <Button 
                      className="w-full gap-2 bg-white text-primary hover:bg-white/90 
                        shadow-lg shadow-primary/20 group-hover:shadow-primary/30 
                        transition-all duration-300 font-medium text-base"
                    >
                      发布悬赏
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* 为您推荐 - 改进样式 */}
              <Card className="border shadow-sm hover:shadow-md transition-all overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b py-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded-md">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                    热门推荐
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {recommendedTasks.map((task) => (
                    <Link href={`/bounty/${task.id}`} key={task.id}>
                      <div className="group p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                            bg-gradient-to-r from-amber-50 to-amber-100/50 
                            border border-amber-200/30 shadow-sm shrink-0"
                          >
                            <Coins className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">{task.reward}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" />
                          <span>238 浏览</span>
                          <Users className="h-3.5 w-3.5 ml-2" />
                          <span>12 投标</span>
                        </div>
                    </div>
                    </Link>
                  ))}
                  <Link href="/bounty" className="block mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full text-primary hover:bg-primary/5 border border-primary/20"
                    >
                      查看更多推荐
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* 常用功能 - 改进样式 */}
              <Card className="border shadow-sm hover:shadow-md transition-all">
                <CardContent className="grid grid-cols-2 gap-3 p-4">
                  <Link href="/bounty/favorite" className="block">
                    <div className="group p-4 rounded-lg border border-muted bg-gradient-to-br from-white to-muted/5 
                      hover:border-primary/20 hover:shadow-sm transition-all text-center">
                      <div className="mx-auto w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-2
                        group-hover:bg-primary/10 transition-colors">
                        <Bookmark className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">我的收藏</span>
                    </div>
                  </Link>
                  <Link href="/bounty/history" className="block">
                    <div className="group p-4 rounded-lg border border-muted bg-gradient-to-br from-white to-muted/5 
                      hover:border-primary/20 hover:shadow-sm transition-all text-center">
                      <div className="mx-auto w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-2
                        group-hover:bg-primary/10 transition-colors">
                        <History className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">浏览记录</span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
