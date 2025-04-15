"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CircleDot,
  CheckCircle2,
  XCircle,
  Coins,
  Eye,
  Users,
  Plus,
  Target,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { bountyApi } from "@/lib/api/bounty";
import { FileBounty, BountyStatus } from "@/types/bounty";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyBountyList() {
  const [bounties, setBounties] = useState<FileBounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const pageSize = 9;

  // 获取悬赏列表
  const loadBounties = async (page = 0) => {
    try {
      setIsLoading(true);
      const result = await bountyApi.getMyBountyList(page, pageSize);
      setBounties(result.content);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalElements);
      setCurrentPage(result.number);
    } catch (error) {
      console.error("加载悬赏列表失败:", error);
      toast.error("加载悬赏列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBounties();
  }, []);

  // 页码变化处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadBounties(page);
  };

  // 根据状态和搜索词筛选悬赏
  const filteredBounties = bounties
    .filter((bounty) => {
      const matchesStatus =
        activeTab === "all" ||
        (activeTab === "in_progress" && bounty.status === BountyStatus.IN_PROGRESS) ||
        (activeTab === "completed" && bounty.status === BountyStatus.COMPLETED) ||
        (activeTab === "closed" && bounty.status === BountyStatus.CLOSED);

      const matchesSearch =
        searchQuery === "" ||
        bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "points_high":
          return b.points - a.points;
        case "points_low":
          return a.points - b.points;
        case "popular":
          return b.viewCount - a.viewCount;
        default:
          return 0;
      }
    });

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

  // 生成分页项
  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5; // 最多显示的页码数
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(0, currentPage - halfVisible);
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    // 调整起始页，确保始终显示 maxVisible 个页码
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(0, endPage - maxVisible + 1);
    }

    // 添加首页
    if (startPage > 0) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink
            onClick={() => handlePageChange(0)}
            isActive={currentPage === 0}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 1) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // 添加中间页码
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // 添加末页
    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => handlePageChange(totalPages - 1)}
            isActive={currentPage === totalPages - 1}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-12">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 - 添加更好的间距和阴影 */}
        <div className="bg-white rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link
                href="/"
                className="text-muted-foreground hover:text-primary flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回首页
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  我发布的悬赏
                </h1>
                <Badge variant="outline" className="ml-2">
                  共 {totalItems} 个
                </Badge>
              </div>
            </div>

            <Link href="/bounty/publish">
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
              >
                <Plus className="h-4 w-4" />
                发布悬赏
              </Button>
            </Link>
          </div>

          {/* 搜索和筛选区 - 改进响应式布局 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索悬赏标题或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[200px]">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">最新发布</SelectItem>
                  <SelectItem value="oldest">最早发布</SelectItem>
                  <SelectItem value="points_high">积分从高到低</SelectItem>
                  <SelectItem value="points_low">积分从低到高</SelectItem>
                  <SelectItem value="popular">最多浏览</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 状态标签页 - 改进样式和响应式 */}
        <div className="bg-white rounded-xl p-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="in_progress">进行中</TabsTrigger>
              <TabsTrigger value="completed">已完成</TabsTrigger>
              <TabsTrigger value="closed">已关闭</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 悬赏列表 - 内容部分保持不变 */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-none shadow-none">
                  <CardHeader className="p-0 space-y-0">
                    <div className="h-3 bg-primary/5 animate-pulse" />
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between mt-3">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBounties.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-white shadow-sm">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Target className="h-8 w-8 text-primary/60" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">暂无悬赏</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "没有找到匹配的悬赏"
                  : "您还没有发布任何悬赏，或者没有符合当前筛选条件的悬赏"}
              </p>
              <Link href="/bounty/publish">
                <Button className="bg-gradient-to-r from-primary to-primary/90">
                  发布悬赏
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.map((bounty) => {
                  const statusStyle = getStatusStyle(bounty.status);

                  return (
                    <Link href={`/bounty/${bounty.id}`} key={bounty.id}>
                      <Card className="overflow-hidden border shadow-sm hover:shadow-lg transition-all hover:border-primary/20 h-full flex flex-col group bg-gradient-to-b from-white to-muted/5">
                        <CardHeader className="relative p-5 pb-3">
                          {/* 状态标签和积分显示 */}
                          <div className="flex justify-between items-start mb-3">
                            {/* 状态标签 */}
                            <div
                              className={`
                                px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5
                                shadow-sm border border-opacity-10
                                ${statusStyle.bg} ${statusStyle.text}
                                transition-transform group-hover:scale-105
                              `}
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
                          <CardTitle className="text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                            <div className="line-clamp-2">{bounty.title}</div>
                          </CardTitle>

                          {/* 描述 */}
                          <p className="text-sm text-muted-foreground/90 line-clamp-2">
                            {bounty.description}
                          </p>
                        </CardHeader>

                        {/* 统计信息 */}
                        <CardFooter className="mt-auto px-5 py-3 bg-muted/5 border-t flex items-center justify-between">
                          {/* 时间信息 */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground/80">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatDateTime(bounty.createdAt)}</span>
                            </div>
                          </div>

                          {/* 查看和竞标数据 */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-sm">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/10 text-muted-foreground/80">
                                <Eye className="h-3.5 w-3.5" />
                                <span>{bounty.viewCount}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 text-primary/80">
                                <Users className="h-3.5 w-3.5" />
                                <span className="font-medium">{bounty.bidCount}</span>
                              </div>
                            </div>
                          </div>
                        </CardFooter>

                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* 分页组件 - 使用 shadcn 的分页组件 */}
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                        isDisabled={currentPage === 0}
                      />
                    </PaginationItem>
                    
                    {renderPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                        isDisabled={currentPage === totalPages - 1}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
