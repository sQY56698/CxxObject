'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileBounty } from "@/types/bounty";
import { UserFileTaskDTO } from "@/types/file";
import { bountyApi } from "@/lib/api/bounty";
import { resourceApi } from "@/lib/api/resource";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { Coins, Eye, Users, Download, FileText, FileIcon } from "lucide-react";
import { createPortal } from 'react-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface SearchResultPanelProps {
  keyword: string;
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect;
}

type SearchType = 'bounties' | 'resources';

export function SearchResultPanel({ keyword, isOpen, onClose, anchorRect }: SearchResultPanelProps) {
  const [bountyResults, setBountyResults] = useState<FileBounty[]>([]);
  const [resourceResults, setResourceResults] = useState<UserFileTaskDTO[]>([]);
  const [isBountyLoading, setIsBountyLoading] = useState(false);
  const [isResourceLoading, setIsResourceLoading] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('bounties');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 重置搜索结果
  const resetSearchResults = () => {
    setBountyResults([]);
    setResourceResults([]);
  };

  // 切换搜索类型
  const handleSearchTypeChange = (value: string) => {
    setSearchType(value as SearchType);

    // 如果切换到尚未加载的类型，则执行对应搜索
    if (value === 'bounties' && bountyResults.length === 0 && !isBountyLoading) {
      searchBounties();
    } else if (value === 'resources' && resourceResults.length === 0 && !isResourceLoading) {
      searchResources();
    }
  };

  // 搜索悬赏
  const searchBounties = async () => {
    if (!keyword.trim()) {
      setBountyResults([]);
      return;
    }

    setIsBountyLoading(true);
    try {
      const data = await bountyApi.searchBounties(keyword);
      setBountyResults(data);
    } catch (error) {
      console.error('搜索悬赏失败:', error);
    } finally {
      setIsBountyLoading(false);
    }
  };

  // 搜索资源
  const searchResources = async () => {
    if (!keyword.trim()) {
      setResourceResults([]);
      return;
    }

    setIsResourceLoading(true);
    try {
      const response = await resourceApi.searchResources(keyword);
      setResourceResults(response.content);
    } catch (error) {
      console.error('搜索资源失败:', error);
    } finally {
      setIsResourceLoading(false);
    }
  };

  // 当关键词变化或面板打开时执行搜索
  useEffect(() => {
    if (isOpen && keyword) {
      if (searchType === 'bounties') {
        searchBounties();
      } else {
        searchResources();
      }
    }
  }, [keyword, isOpen]);

  // 当关键词变化时重置搜索结果
  useEffect(() => {
    resetSearchResults();
  }, [keyword]);

  if (!mounted || !isOpen || !anchorRect) return null;

  const style = {
    top: `${anchorRect.bottom + 8}px`,
    left: `${anchorRect.left}px`,
    width: `${anchorRect.width}px`,
    maxHeight: '80vh',
    overflowY: 'auto'
  };

  return createPortal(
    <div className="fixed z-50" style={style}>
      <Card className="w-full shadow-lg border-border/50 py-0">
        <CardContent className="p-2">
          <Tabs defaultValue="bounties" value={searchType} onValueChange={handleSearchTypeChange}>
            <div className="flex justify-between items-center px-2 py-2 border-b">
              <TabsList>
                <TabsTrigger value="bounties" className="flex items-center gap-1.5">
                  <FileIcon className="h-3.5 w-3.5" />
                  悬赏
                  {bountyResults.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {bountyResults.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  资源
                  {resourceResults.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {resourceResults.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="bounties" className="mt-0">
              {isBountyLoading ? (
                // 加载状态
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : bountyResults.length > 0 ? (
                // 搜索结果列表
                <div className="space-y-1">
                  {bountyResults.map((bounty) => (
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
            </TabsContent>

            <TabsContent value="resources" className="mt-0">
              {isResourceLoading ? (
                // 加载状态
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : resourceResults.length > 0 ? (
                // 搜索结果列表
                <div className="space-y-1">
                  {resourceResults.map((resource) => (
                    <Link
                      key={resource.id}
                      href={`/resources/${resource.id}`}
                      onClick={onClose}
                    >
                      <div className="p-3 hover:bg-muted/50 rounded-lg transition-colors group">
                        <div className="flex items-start gap-3">
                          <UserAvatar
                            userId={resource.userId}
                            username={resource.username}
                            avatar={resource.avatar}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {resource.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {resource.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {resource.isFree ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>免费资源</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-amber-600">
                                  <Coins className="h-3.5 w-3.5" />
                                  <span>{resource.requiredPoints} 积分</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                <span>{resource.viewCount}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="h-3.5 w-3.5" />
                                <span>{resource.downloadCount}</span>
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
                  未找到相关资源
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
} 