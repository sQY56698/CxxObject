import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SignCyclePanel from "./SignCyclePanel";
import { CalendarDays } from "lucide-react";

interface SignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SignDialog({ open, onOpenChange }: SignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            连续签到
          </DialogTitle>
          <DialogDescription>
            连续签到七天可获得额外奖励，中断将重新计算
          </DialogDescription>
        </DialogHeader>
        <SignCyclePanel />
      </DialogContent>
    </Dialog>
  );
} 