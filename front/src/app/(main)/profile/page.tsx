"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/lib/store/user-store";
import { UserProfileData } from "@/types/user";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Camera } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import AvatarUploader from '@/components/upload/AvatarUploader';

// 表单验证
const profileFormSchema = z.object({
  gender: z.string().optional(),
  birthDate: z.date().optional(),
  bio: z.string().max(1000, "个人简介不能超过1000个字符").optional(),
  website: z.string().url("请输入有效的网址").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, profile, fetchProfile, updateProfile, fetchUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | undefined>(undefined);

  // 如果未登录，重定向到登录页
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 初始化表单
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      gender: profile?.gender?.toString() || "",
      birthDate: profile?.birthDate ? new Date(profile.birthDate) : undefined,
      bio: profile?.bio || "",
      website: profile?.website || "",
    },
  });

  // 当profile加载完成后，更新表单默认值
  useEffect(() => {
    if (profile) {
      form.reset({
        gender: profile.gender?.toString() || "",
        birthDate: profile.birthDate ? new Date(profile.birthDate) : undefined,
        bio: profile.bio || "",
        website: profile.website || "",
      });
    }
  }, [profile, form]);

  // 获取用户名首字母作为头像备用
  const getUserInitial = (username?: string) => {
    if (!username) return "?";
    return username.charAt(0).toUpperCase();
  };

  // 提交表单
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);

      const profileData: UserProfileData = {
        gender: data.gender ? parseInt(data.gender) : undefined,
        birthDate: data.birthDate ? format(data.birthDate, "yyyy-MM-dd") : undefined,
        bio: data.bio,
        website: data.website,
        avatar: newAvatarUrl
      };

      await updateProfile(profileData);
      await fetchUser();
      toast.success("个人资料已更新");
    } catch (error) {
      console.error("更新资料失败:", error);
      toast.error("更新资料失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 修改头像预览和上传处理
  const handleAvatarUploadSuccess = (avatarUrl: string) => {
    setNewAvatarUrl(avatarUrl);
    toast.success("头像已上传，请保存个人资料以确认更改");
  };

  // 如果正在加载，显示加载中
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div 
                className="relative group cursor-pointer"
                onClick={handleAvatarClick}
                title="点击更换头像"
              >
                <Avatar className="h-16 w-16">
                  {(newAvatarUrl || user.avatar) ? (
                    <AvatarImage
                      src={newAvatarUrl || user.avatar}
                      alt={user.username}
                      width={64}
                      height={64}
                    />
                  ) : (
                    <AvatarFallback className="text-xl">
                      {getUserInitial(user.username)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <AvatarUploader
                  ref={fileInputRef}
                  onUploadSuccess={handleAvatarUploadSuccess}
                />
              </div>
              <div>
                <CardTitle className="text-2xl">{user.username}的个人资料</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性别</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择性别" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">未知</SelectItem>
                          <SelectItem value="1">男</SelectItem>
                          <SelectItem value="2">女</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>出生日期</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy-MM-dd")
                              ) : (
                                <span>选择出生日期</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        您的出生日期仅用于个性化服务，不会公开展示
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>个人简介</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="介绍一下自己吧..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        不超过1000个字符
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>个人网站</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        您的个人网站或博客链接
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存个人资料"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          {newAvatarUrl && (
            <div className="px-6 pb-4 text-sm text-muted-foreground">
              头像已更改，请点击保存个人资料以确认更改
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 