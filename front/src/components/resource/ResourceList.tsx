"use client";

import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { UserFileTaskDTO } from "@/types/file";
import { resourceApi } from "@/lib/api/resource";
import ResourceCard from "@/components/resource/ResourceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { FileIcon } from "lucide-react"; // 用于空状态图标

export function ResourceList() {
  const [resources, setResources] = useState<UserFileTaskDTO[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isFirstLoading, setIsFirstLoading] = useState(true);

  const loadResources = async (pageNum: number) => {
    try {
      const response = await resourceApi.getPublicResources(pageNum);
      const newResources = response.content;
      
      if (pageNum === 0) {
        setResources(newResources);
      } else {
        setResources(prev => [...prev, ...newResources]);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('加载资源列表失败:', error);
    } finally {
      setIsFirstLoading(false);
    }
  };

  // 加载下一页
  const loadMore = () => {
    loadResources(page + 1);
  };

  // 初始加载
  useEffect(() => {
    loadResources(0);
  }, []);

  // 首次加载时的骨架屏
  if (isFirstLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-[160px]">
            <div className="p-5 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // 没有任何资源时的空状态
  if (!isFirstLoading && resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-muted/30 p-4 rounded-full mb-4">
          <FileIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          暂无资源
        </h3>
        <p className="text-muted-foreground text-sm max-w-[300px]">
          目前还没有任何资源发布，快来分享第一个资源吧！
        </p>
      </div>
    );
  }

  return (
    <InfiniteScroll
      dataLength={resources.length}
      next={loadMore}
      hasMore={hasMore}
      loader={
        <div className="space-y-4 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="h-[160px]">
              <div className="p-5 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      }
      endMessage={
        <div className="text-center py-8 text-muted-foreground">
          没有更多资源了
        </div>
      }
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </InfiniteScroll>
  );
} 