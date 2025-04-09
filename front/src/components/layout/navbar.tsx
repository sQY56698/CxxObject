"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold">
            文件悬赏
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/tasks" className="text-sm hover:text-primary">
              悬赏任务
            </Link>
            <Link href="/upload" className="text-sm hover:text-primary">
              发布悬赏
            </Link>
            <Link href="/downloads" className="text-sm hover:text-primary">
              我的下载
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:flex items-center">
            <Input
              type="search"
              placeholder="搜索文件或悬赏..."
              className="w-[300px] pl-8"
            />
            <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
          </div>
          <Link href="/auth">
            <Button variant="outline">登录 / 注册</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
} 