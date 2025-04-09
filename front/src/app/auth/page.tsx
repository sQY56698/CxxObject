"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useEffect } from "react";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "login";

  useEffect(() => {
    if (mode !== "login" && mode !== "register") {
      router.replace("/auth?mode=login");
    }
  }, [mode, router]);

  return (
    <div className="container relative min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">欢迎</CardTitle>
          <CardDescription className="text-center">
            请选择登录或注册以继续
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="login"
                onClick={() => router.push("/auth?mode=login")}
              >
                登录
              </TabsTrigger>
              <TabsTrigger
                value="register"
                onClick={() => router.push("/auth?mode=register")}
              >
                注册
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 