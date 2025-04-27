import { Image, Video, Music, FileText, Table, Presentation, Archive, FileIcon as FileIconLucide } from "lucide-react"
import { FileType } from "@/types/file"

export default function FileIcon({ fileType }: { fileType: number }) {
  switch (fileType) {
    case FileType.IMAGE:
      return <Image className="h-6 w-6" />;
    case FileType.VIDEO:
      return <Video className="h-6 w-6" />;
    case FileType.AUDIO:
      return <Music className="h-6 w-6" />;
    case FileType.PDF:
      return <FileText className="h-6 w-6" />;
    case FileType.EXCEL:
      return <Table className="h-6 w-6" />;
    case FileType.WORD:
      return <FileText className="h-6 w-6" />;
    case FileType.PPT:
      return <Presentation className="h-6 w-6" />;
    case FileType.ARCHIVE:
      return <Archive className="h-6 w-6" />;
    default:
      return <FileIconLucide className="h-6 w-6" />;
  }
};

