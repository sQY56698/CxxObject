"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { bountyApi } from "@/lib/api/bounty";
import { FileBounty, FileBid } from "@/types/bounty";
import { BidList } from "@/components/bounty/BidList";
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Users, 
  Coins, 
  CircleDot, 
  CheckCircle2, 
  XCircle,
  Eye,
  GalleryVerticalEnd,
  ScrollText,
  Target,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserInfoPanel } from "@/components/UserInfoPanel";
import { usePointsStore } from "@/lib/store/points-store";

export default function BountyDetail() {
  const params = useParams();
  const bountyId = parseInt(params.bountyId as string);
  
  const [bounty, setBounty] = useState<FileBounty | null>(null);
  const [bids, setBids] = useState<FileBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myBidId, setMyBidId] = useState<number | null>(null);
  const bidListRef = useRef<{openUploader: (bidId: number) => void}>(null);
  const { fetchPoints } = usePointsStore();

  const loadBountyDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const bountyData = await bountyApi.getBountyDetail(bountyId);
      setBounty(bountyData);
      
      const bidsData = await bountyApi.getBidList(bountyId);
      setBids(bidsData.content);
      
      const myBid = bidsData.content.find(bid => bid.isMine);
      if (myBid) {
        setMyBidId(myBid.id);
      }
    } catch (error) {
      toast.error("加载悬赏详情失败");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [bountyId]);

  useEffect(() => {
    loadBountyDetail();
    return () => {
      if (myBidId) {
        localStorage.setItem(`bounty_${bountyId}_mybid`, myBidId.toString());
      }
    };
  }, [bountyId, loadBountyDetail]);

  const refreshBidList = useCallback(() => {
    loadBountyDetail();
  }, [loadBountyDetail]);

  const handleCreateBid = async () => {
    try {
      setIsSubmitting(true);
      const result = await bountyApi.createBid(bountyId);
      setMyBidId(result.id);
      toast.success(`参与竞标成功，请上传您的文件`);
      await loadBountyDetail();
      
      if (bidListRef.current && typeof bidListRef.current.openUploader === 'function') {
        setTimeout(() => {
          bidListRef.current!.openUploader(result.id);
        }, 500);
      }
    } catch (error) {
      toast.error("参与竞标失败");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseBounty = async () => {
    try {
      setIsSubmitting(true);
      await bountyApi.closeBounty(bountyId);
      toast.success("悬赏成功关闭");
      loadBountyDetail();
      fetchPoints();
    } catch (error) {
      toast.error("关闭悬赏失败");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectWinner = async (bidId: number) => {
    try {
      setIsSubmitting(true);
      await bountyApi.selectWinner(bountyId, bidId);
      toast.success(`已选择 ${bids.find(bid => bid.id === bidId)?.username} 为胜利者`);
      loadBountyDetail();
      fetchPoints();
    } catch (error) {
      toast.error("选择胜利者失败");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBid = async () => {
    if (!myBidId) return;
    
    try {
      setIsSubmitting(true);
      await bountyApi.cancelBid(myBidId);
      toast.success("已成功退出竞标");
      setMyBidId(null);
      await loadBountyDetail();
      fetchPoints();
    } catch (error: any) {
      console.error("退出竞标失败:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenBounty = async () => {
    try {
      setIsSubmitting(true);
      await bountyApi.reopenBounty(bountyId);
      toast.success("悬赏已重新开启");
      loadBountyDetail();
      fetchPoints();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "重新开启悬赏失败");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !bounty) {
    return (
      <div className="container max-w-4xl m-auto py-8">
        <div className="mb-6">
          <div className="h-6 w-24 bg-muted/50 animate-pulse rounded"></div>
        </div>
        
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex gap-4">
            <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-7 bg-muted/50 animate-pulse rounded w-2/3"></div>
              <div className="h-4 bg-muted/50 animate-pulse rounded w-1/3"></div>
            </div>
            <div className="h-16 w-24 bg-muted/50 animate-pulse rounded"></div>
          </div>
          
          <div className="h-32 bg-muted/50 animate-pulse rounded mt-4"></div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 animate-pulse rounded"></div>
            ))}
          </div>
          
          <div className="h-6 bg-muted/50 animate-pulse rounded w-1/4 mt-6"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted/50 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 获取悬赏状态相关样式
  const getStatusStyle = () => {
    switch (bounty.status) {
      case 1:
        return { 
          bg: "bg-emerald-50", 
          text: "text-emerald-600", 
          label: "进行中",
          icon: <CircleDot className="h-4 w-4" />
        };
      case 2:
        return { 
          bg: "bg-blue-50", 
          text: "text-blue-600", 
          label: "已完成",
          icon: <CheckCircle2 className="h-4 w-4" />
        };
      default:
        return { 
          bg: "bg-gray-50", 
          text: "text-gray-600", 
          label: "已关闭",
          icon: <XCircle className="h-4 w-4" />
        };
    }
  };
  
  const statusStyle = getStatusStyle();

  return (
    <div className="container max-w-4xl m-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Link>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <UserInfoPanel userId={bounty.userId} className="cursor-pointer">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  {bounty.avatar ? (
                    <AvatarImage src={bounty.avatar} alt={bounty.username} />
                  ) : (
                    <AvatarFallback>{bounty.username.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
              </UserInfoPanel>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl flex items-center gap-2 mt-1">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-30"></div>
                      <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1.5 rounded-full">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    {bounty.title}
                  </CardTitle>
                  <div className={`px-2.5 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.icon}
                    {statusStyle.label}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>发布者：{bounty.username}</span>
                  <span className="mx-1">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(bounty.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-lg p-3 border border-amber-200/50 shadow-sm">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-2">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    {bounty.points}
                  </div>
                  <div className="text-sm font-medium text-amber-700/70">
                    积分奖励
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-5 border border-muted relative">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <GalleryVerticalEnd className="h-5 w-5 text-violet-500" />
                悬赏描述
              </h3>
              {bounty.isMine && (
                <>
                  {bounty.status === 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white hover:text-white"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          关闭悬赏
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认关闭悬赏？</AlertDialogTitle>
                          <AlertDialogDescription>
                            关闭悬赏后将根据竞标和你的下载次数返还积分：
                            <ul className="list-disc list-inside mt-2">
                              <li>无人竞标：扣除100积分</li>
                              <li>有竞标未下载：扣除10%积分</li>
                              <li>有竞标且有下载，最少扣除 30%，每下载一次加 10%，最高为 80%</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCloseBounty}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            确认关闭
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  {bounty.status === 3 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white hover:text-white"
                        >
                          <CircleDot className="h-4 w-4 mr-1" />
                          重新开启
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认重新开启悬赏？</AlertDialogTitle>
                          <AlertDialogDescription>
                            重新开启悬赏将再次扣除 {bounty.points} 积分。请确认您有足够的积分。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleReopenBounty}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            确认开启
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {bounty.description}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-violet-50/50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-violet-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <div className="text-sm text-violet-600/70">竞标数</div>
                <div className="text-lg font-medium text-violet-700">{bounty.bidCount}</div>
              </div>
            </div>
            
            <div className="bg-emerald-50/50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm text-emerald-600/70">浏览数</div>
                <div className="text-lg font-medium text-emerald-700">{bounty.viewCount}</div>
              </div>
            </div>
            
            {bounty.winnerId && (
              <div className="bg-blue-50/50 rounded-lg p-4 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Trophy className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-blue-600/70">胜利者</div>
                  <div className="text-lg font-medium flex items-center gap-1 text-blue-700">
                    <UserInfoPanel userId={bounty.winnerId} className="cursor-pointer">
                      <Avatar className="h-5 w-5 ring-1 ring-blue-200">
                        {bounty.winnerAvatar ? (
                          <AvatarImage src={bounty.winnerAvatar} alt={bounty.winnerName} />
                        ) : (
                          <AvatarFallback>{bounty.winnerName?.charAt(0).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                    </UserInfoPanel>
                    {bounty.winnerName}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                <h3 className="font-medium">竞标列表</h3>
                <span className="text-sm text-muted-foreground ml-2">({bounty.bidCount})</span>
              </div>
              
              {bounty.status === 1 && !bounty.isMine && (
                myBidId ? (
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                          disabled={isSubmitting}
                        >
                          退出竞标
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认退出竞标？</AlertDialogTitle>
                          <AlertDialogDescription>
                            退出竞标后，您将不再参与此悬赏，且已上传的文件将不再对此悬赏可见。此操作不可撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCancelBid}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "处理中..." : "确认退出"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <Button 
                    onClick={handleCreateBid} 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
                  >
                    参与竞标
                  </Button>
                )
              )}
            </div>
            <BidList
              ref={bidListRef}
              bids={bids}
              bountyId={bounty.id}
              isBountyOwner={bounty.isMine}
              onSelectWinner={handleSelectWinner}
              disabled={bounty.status !== 1}
              onRefresh={refreshBidList}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 