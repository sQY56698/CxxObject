"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useUserStore } from "@/lib/store/user-store";

const registerSchema = z.object({
  username: z.string().min(1, {
    message: "请输入用户名",
  }),
  email: z.string().email({
    message: "请输入有效的邮箱地址",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字符",
  }),
  confirmPassword: z.string(),
  captcha: z.string().min(4, {
    message: "请输入4位验证码",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不匹配",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useUserStore();
  const [captchaKey, setCaptchaKey] = useState<number>(0);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      captcha: "",
    },
  });

  const refreshCaptcha = () => {
    setCaptchaKey(prev => prev + 1);
  };

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        captcha: values.captcha
      });
      toast.success("注册成功，请登录");
      router.push("/auth?mode=login");
    } catch (error) {
      // 刷新验证码
      refreshCaptcha();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder="请输入用户名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input placeholder="请输入邮箱" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="请输入密码" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="请再次输入密码" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="captcha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>验证码</FormLabel>
              <div className="flex gap-4">
                <FormControl>
                  <Input placeholder="请输入验证码" {...field} className="flex-1" />
                </FormControl>
                <div className="relative w-[160px] h-[50px] cursor-pointer" onClick={refreshCaptcha}>
                  <img
                    src={`/api/captcha/generate?t=${captchaKey}`}
                    alt="验证码"
                    className="w-full h-full"
                  />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "注册中..." : "注册"}
        </Button>
      </form>
    </Form>
  );
} 