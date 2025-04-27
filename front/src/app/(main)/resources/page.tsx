"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Search, FileText } from "lucide-react";
import { resourceApi } from "@/lib/api/resource";
import { UserFileTaskDTO } from "@/types/file";
import InfiniteScroll from "react-infinite-scroll-component";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store/user-store";
import ResourceCard from "@/components/resource/ResourceCard";

enum ResourceTab {
  ALL = "all",
  FREE = "free",
  PAID = "paid"
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<UserFileTaskDTO[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(ResourceTab.ALL);
  const [searchKeyword, setSearchKeyword] = useState("");
  const { user } = useUserStore();

  // 加载资源列表
  const fetchResources = async (pageNum = 0) => {
    setIsLoading(true);

    let isFree = null;
    switch (activeTab) {
      case ResourceTab.ALL:
        break;
      case ResourceTab.FREE:
        isFree = true;
        break;
      case ResourceTab.PAID:
        isFree = false;
        break;
    }
    try {
      const queryParams: any = { 
        page: pageNum, 
        size: 10,
        userId: user?.userId, 
        isFree,
        keyword: searchKeyword,
      };
      
      const response = await resourceApi.queryResources(queryParams);
      
      if (pageNum === 0) {
        setResources(response.content);
      } else {
        setResources(prev => [...prev, ...response.content]);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error("获取资源列表失败", error);
      toast.error("获取资源列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchResources(0);
  }, [activeTab, searchKeyword]);

  // 切换标签时重置数据
  const handleTabChange = (value: string) => {
    setActiveTab(value as ResourceTab);
    setPage(0);
    setResources([]);
  };

  // 处理搜索
  const handleSearch = () => {
    setPage(0);
    setResources([]);
    fetchResources(0);
  };
  
  // 渲染资源卡片
  const renderResourceCards = () => {
    if (isLoading && page === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-[240px]">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (resources.length === 0 && !isLoading) {
      return (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无资源</h3>
          <p className="text-muted-foreground mb-6">
            暂时没有可用资源，快来分享您的资源吧
          </p>
          <Link href="/resources/share">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              分享我的资源
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <InfiniteScroll
        dataLength={resources.length}
        next={() => fetchResources(page + 1)}
        hasMore={hasMore}
        loader={
          <div className="py-4 text-center">
            <Skeleton className="h-8 w-32 mx-auto" />
          </div>
        }
        endMessage={
          <div className="text-center py-4 text-muted-foreground">
            没有更多资源了
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </InfiniteScroll>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">资源中心</h1>
          <p className="text-muted-foreground">
            探索社区分享的各类资源，或分享您的资源给其他用户
          </p>
        </div>
        <Link href="/resources/share">
          <Button className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 gap-2">
            <Upload className="h-4 w-4" />
            分享我的资源
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">全部资源</TabsTrigger>
            <TabsTrigger value="free">免费资源</TabsTrigger>
            <TabsTrigger value="paid">积分资源</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex w-full md:w-auto gap-2">
          <Input
            placeholder="搜索资源..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="max-w-[300px]"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {renderResourceCards()}
    </div>
  );
} 