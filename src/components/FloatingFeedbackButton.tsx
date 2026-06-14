"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

export default function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  function handleClick() {
    if (!session) {
      router.push("/auth/signup");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-md bg-[#1e40af] px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-[#1d4ed8] transition-colors"
        aria-label="Open feedback"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>
      <FeedbackModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
