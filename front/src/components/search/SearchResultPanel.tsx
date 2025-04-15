'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileBounty } from "@/types/bounty";
import { bountyApi } from "@/lib/api/bounty";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { Coins, Clock, Eye, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { createPortal } from 'react-dom';

interface SearchResultPanelProps {
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect;
}

export function SearchResultPanel({ keyword, isOpen, onClose, anchorRect }: SearchResultPanelProps) {
  const [results, setResults] = useState<FileBounty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const searchBounties = async () => {
      if (!keyword.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await bountyApi.searchBounties(keyword);
        setResults(data);
      } catch (error) {
        console.error('搜索失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && keyword) {
      searchBounties();
    }
  }, [keyword, isOpen]);

  if (!mounted || !isOpen || !anchorRect) return null;

  const style = {
    top: `${anchorRect.bottom + 8}px`,
    left: `${anchorRect.left}px`,
    width: `${anchorRect.width}px`,
  };

  return createPortal(
    <div className="fixed z-50" style={style}>
      <Card className="w-full shadow-lg border-border/50">
        <CardContent className="p-2">
          {isLoading ? (
            // 加载状态
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            // 搜索结果列表
            <div className="space-y-1">
              {results.map((bounty) => (
                <Link
                  key={bounty.id}
                  href={`/bounty/${bounty.id}`}
                  onClick={onClose}
                >
                  <div className="p-3 hover:bg-muted/50 rounded-lg transition-colors group">
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        userId={bounty.userId}
                        username={bounty.username}
                        avatar={bounty.avatar}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {bounty.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {bounty.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Coins className="h-3.5 w-3.5" />
                            <span className="text-amber-800">{bounty.points}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{bounty.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>{bounty.bidCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // 无结果
            <div className="py-8 text-center text-muted-foreground">
              未找到相关悬赏
            </div>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body
  );
} 