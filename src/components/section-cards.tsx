"use client";

import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-hot-toast"; // Make sure you have a toast component

import { AdItem } from "../../types/index";
import { createPortal } from "react-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

export function SectionCards({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AdItem[]>([]);
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null);
  // const [adId, setAdId] = useState<string | null>(null);
  // const [openEmbed, setOpenEmbed] = useState<boolean>(false);
  const [videoStates, setVideoStates] = useState<
    Record<string, "idle" | "generating" | "ready">
  >({});

  useEffect(() => {
    async function fetchAds() {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspace/${url}/ads`);
        if (!res.ok) throw new Error("Failed to fetch ads");
        const ads = await res.json();
        setItems(ads);

        const initialStates: Record<string, "idle" | "generating" | "ready"> =
          {};
        ads.forEach((ad: AdItem) => {
          initialStates[ad._id] = ad.videoUrl ? "ready" : "idle";
        });
        setVideoStates(initialStates);
      } catch (err) {
        console.error("Error fetching ads:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAds();
  }, [url]);

  const generateVideo = async (adId: string) => {
    setVideoStates((prev) => ({ ...prev, [adId]: "generating" }));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/workspace/${url}/ads/${adId}/generate-video`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Video generation failed");

      const data = await res.json(); // { videoUrl: string }

      setItems((prev) =>
        prev.map((ad) =>
          ad._id === adId ? { ...ad, videoUrl: data.videoUrl } : ad
        )
      );
      setVideoStates((prev) => ({ ...prev, [adId]: "ready" }));

      // Show toast
      toast.success("Video Generated");
    } catch (err) {
      console.error("Video generation error:", err);
      setVideoStates((prev) => ({ ...prev, [adId]: "idle" }));
      toast.error("Failed to generate video");
      // toast({
      //   title: "Error",
      //   description: "Failed to generate video.",
      //   variant: "destructive",
      //   duration: 3000,
      // });
    }
  };

    async function handleDelete() {
      if (!deleteAdId) return;
  
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/workspace/${url}/ads/${deleteAdId}`,
          { method: "DELETE" }
        );
        setItems((prev) => prev.filter((ad) => ad._id !== deleteAdId));
        setDeleteAdId(null);
      } catch (err) {
        console.error("Failed to delete ad:", err);
      }
    }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <Card key={i} className="p-4">
              <CardHeader>
                <CardDescription>
                  <Skeleton width={100} height={16} />
                </CardDescription>
                <CardTitle className="text-2xl font-semibold">
                  <Skeleton width={140} height={24} />
                </CardTitle>
              </CardHeader>
              <CardFooter>
                <Skeleton height={160} />
              </CardFooter>
            </Card>
          ))}
      </div>
    );
  }

  return (
    <>
    {createPortal(
      <AlertDialog
              open={!!deleteAdId}
              onOpenChange={() => setDeleteAdId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this
                    ad and remove its data from the workspace.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteAdId(null)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>, document.body
    )}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((ad) => (
        <Card key={ad._id} className="relative">
          <Trash     onClick={() => setDeleteAdId(ad._id)} fill="#fb2c36" className="cursor-pointer w-6 h-6 absolute top-[-.5rem] right-0 text-red-500"/>
          <CardHeader>
            <CardDescription>Generated Ad</CardDescription>
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {ad.description}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Image
              src={ad.imageBase64}
              alt={ad.description}
              quality={100}
              width={500}
              height={500}
              className="aspect-video w-full rounded-md object-cover"
            />
            <div className="flex gap-2">
              {videoStates[ad._id] === "idle" && (
                <Button onClick={() => generateVideo(ad._id)}>
                  Generate Video
                </Button>
              )}
              {videoStates[ad._id] === "generating" && (
                <Button disabled>Generating...</Button>
              )}
              {videoStates[ad._id] === "ready" && ad.videoUrl && (
                <a href={ad.videoUrl} target="_blank" rel="noreferrer">
                  <Button>Play Video</Button>
                </a>
              )}

              <Button
                onClick={() => {
                  const byteString = atob(ad.imageBase64.split(",")[1]);
                  const ab = new ArrayBuffer(byteString.length);
                  const ia = new Uint8Array(ab);
                  for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                  }
                  const blob = new Blob([ab], { type: "image/png" });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                }}
              >
                View Image
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
    </>
  );
}
