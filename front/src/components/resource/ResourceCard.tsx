import React from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Download, 
  Eye, 
  FileText, 
  Lock, 
  Coins
} from "lucide-react";
import { UserFileTaskDTO } from "@/types/file";
import { UserFileTaskStatusEnum } from "@/types/file";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";

interface ResourceCardProps {
  resource: UserFileTaskDTO;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const router = useRouter();
  
  const getStatusBadge = () => {
    switch (resource.status) {
      case UserFileTaskStatusEnum.REVIEWING:
        return (
          <Badge
            variant="outline"
            className="text-orange-500 border-orange-500"
          >
            审核中
          </Badge>
        );
      case UserFileTaskStatusEnum.PUBLISHED:
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            已发布
          </Badge>
        );
      case UserFileTaskStatusEnum.SUCCESS:
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            发布成功
          </Badge>
        );
      case UserFileTaskStatusEnum.REJECTED:
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            已驳回
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: zhCN
      });
    } catch (e) {
      return dateString;
    }
  };
  
  const handleCardClick = () => {
    router.push(`/resources/${resource.id}`);
  };
  
  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-md cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1" title={resource.title}>
            {resource.title}
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="flex items-center gap-2 text-sm mt-2">
          <div className="flex items-center">
            <UserAvatar className="mr-2" userId={resource.userId} username={resource.username} avatar={resource.avatar} />
            <span className="text-muted-foreground">{resource.username}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTime(resource.createdAt)}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2" title={resource.description}>
          {resource.description}
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2">
        <div className="flex items-center text-sm text-muted-foreground gap-3">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{resource.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{resource.downloadCount}</span>
          </div>
        </div>
        
        <div className="flex items-center">
          {resource.isFree ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>免费</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100">
              <Coins className="h-3.5 w-3.5" />
              <span>{resource.requiredPoints} 积分</span>
            </Badge>
          )}
          
          {!resource.hasAccess && !resource.isFree && (
            <span className="ml-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResourceCard; 