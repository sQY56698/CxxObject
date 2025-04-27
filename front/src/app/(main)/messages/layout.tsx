import { MessageNav } from '@/components/message/message-nav';

export default function MessagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-[calc(100vh-64px)]">
      <div className="relative h-full">
        <MessageNav />
        <main className="pl-16 h-full overflow-hidden">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 