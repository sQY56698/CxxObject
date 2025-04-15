import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserInfoPanel } from "@/components/UserInfoPanel";

interface UserAvatarProps {
  userId: number;
  username: string;
  avatar?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ userId, username, avatar, className, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  return (
    <UserInfoPanel userId={userId}>
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        {avatar ? (
          <AvatarImage src={avatar} alt={username} />
        ) : (
          <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
        )}
      </Avatar>
    </UserInfoPanel>
  );
} 