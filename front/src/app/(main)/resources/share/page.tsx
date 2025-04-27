"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { FileInfo } from "@/types/file";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Info } from "lucide-react";
import Link from "next/link";
import { usePointsStore } from "@/lib/store/points-store";
import ChunkUploader from "@/components/upload/ChunkUploader";
import { resourceApi } from "@/lib/api/resource";
import { ALLOWED_FILE_TYPES } from "@/lib/constant";

// 修改表单验证模式，添加fileId字段
const formSchema = z.object({
  title: z.string()
    .min(5, { message: "标题至少需要5个字符" })
    .max(100, { message: "标题最多100个字符" }),
  description: z.string()
    .min(20, { message: "描述至少需要20个字符" })
    .max(1000, { message: "描述最多1000个字符" }),
  isFree: z.boolean(),
  requiredPoints: z.coerce.number()
    .min(10, { message: "所需积分至少为10" })
    .max(1000, { message: "所需积分最多为1000" })
    .optional()
    .refine(val => val === undefined || val >= 10, {
      message: "收费资源至少需要10积分",
    }),
  fileId: z.number({ 
    required_error: "请上传资源文件",
    invalid_type_error: "文件ID格式不正确"
  }).positive({ message: "请上传资源文件" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareResource() {
  const router = useRouter();
  const params = useSearchParams();
  const resourceId = parseInt(params.get("resourceId") as string);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | undefined>(undefined);
  const { fetchPoints } = usePointsStore();
  const defaultPoints = 10;

  // 初始化表单，添加fileId字段
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      isFree: true,
      requiredPoints: defaultPoints,
      // fileId字段初始为undefined，让校验可以触发
    },
    mode: "onChange", // 启用实时校验模式
  });

  // 监听免费开关变化
  const watchIsFree = form.watch("isFree");

  console.log(params);
  

  // 加载资源数据
  useEffect(() => {
    const fetchResourceData = async () => {
      try {
        setIsLoading(true);
        const data = await resourceApi.getResourceDetail(resourceId);

        // 设置表单默认值
        form.reset({
          title: data.title,
          description: data.description,
          isFree: data.isFree,
          requiredPoints: data.requiredPoints || defaultPoints,
          fileId: data.fileId,
        });

        // 保存文件信息
        if (data.fileInfo) {
          setFileInfo(data.fileInfo);
        }
      } catch (error) {
        console.error("加载资源详情失败:", error);
        toast.error("加载资源详情失败，请重试");
        router.push("/resources");
      } finally {
        setIsLoading(false);
      }
    };

    if (resourceId) {
      fetchResourceData();
    }
  }, [resourceId, form, router]);

  // 处理文件上传成功，更新表单中的fileId字段
  const handleUploadSuccess = (fileInfo: FileInfo) => {
    // 关键：将文件ID设置到表单中
    form.setValue("fileId", fileInfo.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setFileInfo(fileInfo);
    toast.success("文件上传成功！");
  };

  // 提交表单
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      let response;
      if (resourceId) {
        // 更新资源
        response = await resourceApi.updateResource(resourceId, {
          title: values.title,
          description: values.description,
          fileId: values.fileId,
          isFree: values.isFree,
          requiredPoints: values.isFree ? undefined : values.requiredPoints,
        });
      } else {
        // 使用新的 resourceApi 创建资源共享任务
        response = await resourceApi.createResource({
          title: values.title,
          description: values.description,
          fileId: values.fileId, // 直接使用表单中的fileId
          isFree: values.isFree,
          requiredPoints: values.isFree ? undefined : values.requiredPoints,
        });
      }

      toast.success("资源发布成功！审核通过后即可显示");
      fetchPoints();

      // 重定向到资源详情页
      router.push(`/resources/${response.id}`);
    } catch (error) {
      console.error("发布资源失败:", error);
      toast.error("发布资源失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果正在加载，显示骨架屏
  if (resourceId && isLoading) {
    return (
      <div className="container max-w-3xl m-auto py-8">
        <div className="mb-6">
          <Skeleton className="h-6 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-24 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-64 w-full" />
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl m-auto py-8">
      <div className="mb-6">
        <Link
          href="/resources"
          className="flex items-center text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回资源列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            分享资源
          </CardTitle>
          <CardDescription>
            <div className="bg-muted/30 p-4 rounded-md flex items-start gap-2">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">资源分享说明：</p>
                <ul className="list-disc list-inside space-y-1">
                  {!resourceId ? (
                    <>
                      <li>所有上传的资源需经过审核才能发布</li>
                      <li>
                        免费资源下载不消耗积分，但您可获得每次下载100积分的奖励
                      </li>
                      <li>收费资源下载时，您将获得用户支付积分的80%作为奖励</li>
                      <li>违规资源将被下架，并可能导致账号受限</li>
                    </>
                  ) : (
                    <>
                      <li>修改资源信息后，需要重新审核才能发布</li>
                      <li>如果您修改了文件，用户将下载更新后的文件</li>
                      <li>违规资源将被下架，并可能导致账号受限</li>
                    </>
                  )}
                </ul>
                <ul className="list-disc list-inside space-y-1"></ul>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* 资源信息表单 */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">填写资源信息</h3>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>资源标题</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入资源标题" {...field} />
                        </FormControl>
                        <FormDescription>
                          简洁明了的标题更容易被用户找到
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
                        <FormLabel>资源描述</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="详细描述您的资源内容、用途等信息"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          详细的描述可以帮助其他用户更好地了解您的资源
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>免费资源</FormLabel>
                          <FormDescription>
                            设置为免费资源，所有用户均可下载
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!watchIsFree && (
                    <FormField
                      control={form.control}
                      name="requiredPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>所需积分</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10"
                              min={10}
                              max={1000}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            其他用户下载此资源需要支付的积分，您将获得80%作为奖励
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* 文件上传区域 - 添加为一个表单字段 */}
                  <FormField
                    control={form.control}
                    name="fileId"
                    render={() => (
                      <FormItem>
                        <FormLabel>上传资源文件</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div>
                              <ChunkUploader
                                fileInfo={fileInfo}
                                onUploadSuccess={handleUploadSuccess}
                                onUploadError={(error) => {
                                  toast.error(`上传失败: ${error.message}`);
                                }}
                                allowedFileTypes={ALLOWED_FILE_TYPES}
                                multiple={false}
                                maxFileSize={5 * 1024 * 1024 * 1024} // 5GB
                              />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "发布中..." : "发布资源"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 