"use client";

import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FileBounty } from "@/types/bounty";
import { bountyApi } from "@/lib/api/bounty";
import { BountyCard } from "./BountyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { FileSearch } from "lucide-react"; // 用于空状态图标

export function BountyList() {
  const [bounties, setBounties] = useState<FileBounty[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isFirstLoading, setIsFirstLoading] = useState(true);

  const loadBounties = async (pageNum: number) => {
    try {
      const response = await bountyApi.getBountyListSorted(pageNum);
      const newBounties = response.content;
      
      if (pageNum === 0) {
        setBounties(newBounties);
      } else {
        setBounties(prev => [...prev, ...newBounties]);
      }
      
      setHasMore(newBounties.length > 0 && pageNum < response.totalPages - 1);
      setPage(pageNum);
    } catch (error) {
      console.error('加载悬赏列表失败:', error);
    } finally {
      setIsFirstLoading(false);
    }
  };

  // 加载下一页
  const loadMore = () => {
    loadBounties(page + 1);
  };

  // 初始加载
  useEffect(() => {
    loadBounties(0);
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

  // 没有任何悬赏时的空状态
  if (!isFirstLoading && bounties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-muted/30 p-4 rounded-full mb-4">
          <FileSearch className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          暂无悬赏
        </h3>
        <p className="text-muted-foreground text-sm max-w-[300px]">
          目前还没有任何悬赏发布，快来发布第一个悬赏吧！
        </p>
      </div>
    );
  }

  return (
    <InfiniteScroll
      dataLength={bounties.length}
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
          没有更多悬赏了
        </div>
      }
      className="space-y-4"
    >
      <div className="space-y-4">
        {bounties.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </InfiniteScroll>
  );
} 