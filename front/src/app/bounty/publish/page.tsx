"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bountyApi } from "@/lib/api/bounty";
import { ArrowLeft, FileText, Info } from "lucide-react";
import Link from "next/link";
import { usePointsStore } from "@/lib/store/points-store";

// 定义表单验证模式
const formSchema = z.object({
  title: z.string()
    .min(5, { message: "标题至少需要5个字符" })
    .max(100, { message: "标题最多100个字符" }),
  description: z.string()
    .min(20, { message: "描述至少需要20个字符" })
    .max(1000, { message: "描述最多1000个字符" }),
  points: z.coerce.number()
    .min(100, { message: "悬赏积分至少为100" })
    .max(10000, { message: "悬赏积分最多为10000" })
});

type FormValues = z.infer<typeof formSchema>;

export default function PublishBounty() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchPoints } = usePointsStore();

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      points: 100
    },
  });

  // 提交表单
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // 调用API发布悬赏
      const response = await bountyApi.publishBounty({
        title: values.title,
        description: values.description,
        points: values.points,
      });
      
      toast.success("悬赏发布成功！");
      fetchPoints();
      
      // 重定向到悬赏详情页
      router.push(`/bounty/${response.id}`);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl m-auto py-8">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            发布悬赏
          </CardTitle>
          <CardDescription>
            创建悬赏任务，找到你需要的文件资源
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>悬赏标题</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入悬赏标题" {...field} />
                    </FormControl>
                    <FormDescription>
                      简洁明了的标题更容易吸引其他用户
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>悬赏描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="详细描述你需要的文件资源"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      详细描述你需要的文件内容、格式要求等信息
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>悬赏积分</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        min={100}
                        max={10000}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      设置合理的积分可以提高任务完成几率
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted/30 p-4 rounded-md flex items-start gap-2">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">悬赏规则说明：</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>发布悬赏将立即扣除相应积分</li>
                    <li>如无人竞标关闭，将扣除100积分作为手续费</li>
                    <li>有竞标未下载关闭，将扣除10%积分作为手续费</li>
                    <li>有竞标且有下载关闭，将根据下载次数扣除30%-80%不等的积分</li>
                    <li>一旦选定中标者，全部积分将转给对方，无法撤回</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "发布中..." : "发布悬赏"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 