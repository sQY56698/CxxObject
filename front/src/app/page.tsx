import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  // 模拟热门悬赏数据
  const hotTasks = [
    {
      id: 1,
      title: "寻找2024年最新的机器学习资料",
      reward: 500,
      deadline: "2024-04-20",
      category: "教育资源",
    },
    {
      id: 2,
      title: "需要完整版Adobe系列软件合集",
      reward: 300,
      deadline: "2024-04-15",
      category: "软件资源",
    },
    {
      id: 3,
      title: "收集各大高校考研真题资料",
      reward: 800,
      deadline: "2024-04-25",
      category: "教育资源",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 text-center bg-gradient-to-b from-primary/10 to-background">
        <div className="container">
          <h1 className="text-4xl font-bold mb-6">
            文件资源共享与悬赏平台
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            快速找到你需要的文件，或通过悬赏获得帮助
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/tasks">
              <Button size="lg">
                浏览悬赏
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="lg" variant="outline">
                发布悬赏
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hot Tasks Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">热门悬赏</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-2">{task.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        类别：{task.category}
                      </p>
                    </div>
                    <div className="text-primary font-bold">
                      ¥{task.reward}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      截止日期：{task.deadline}
                    </span>
                    <Button variant="outline" size="sm">
                      查看详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/tasks">
              <Button variant="outline">
                查看更多悬赏
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-2xl font-bold mb-12 text-center">
            平台特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="font-semibold mb-4">安全可靠</h3>
              <p className="text-muted-foreground">
                文件经过安全检查，支付交易有保障
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-4">快速响应</h3>
              <p className="text-muted-foreground">
                海量用户在线，迅速获得资源
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-4">分类完善</h3>
              <p className="text-muted-foreground">
                资源分类详细，轻松找到所需
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
