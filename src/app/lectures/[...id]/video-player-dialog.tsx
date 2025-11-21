"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";
import { useState, useMemo } from "react";

type VideoPlayerDialogProps = {
  youtubeUrl: string;
};

// Helper function to extract YouTube video ID from various URL formats
function getYouTubeId(url: string) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes("youtube.com")) {
      const videoId = urlObj.searchParams.get("v");
      if (videoId) {
        return videoId;
      }
      // Handle /embed/ URLs
      const pathParts = urlObj.pathname.split('/');
      if (pathParts[1] === 'embed' && pathParts[2]) {
        return pathParts[2];
      }
    }
  } catch (error) {
    console.error("Invalid URL for YouTube video:", url, error);
  }
  return null;
}

export function VideoPlayerDialog({ youtubeUrl }: VideoPlayerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const videoId = useMemo(() => getYouTubeId(youtubeUrl), [youtubeUrl]);

  if (!videoId) {
    // Don't render the button if the URL is invalid or not a YouTube URL
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          <Youtube className="ml-2 h-5 w-5 text-red-500" />
          مشاهدة ملخص الفيديو
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>ملخص الفيديو</DialogTitle>
        </DialogHeader>
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
}
