// hooks/useLiveComments.ts
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { io, Socket } from "socket.io-client";
import { confirmDelete } from "@/utils/confirmDelete";

export const useLiveComments = (
  user: any,
  previewFile: any,
  videoRef: React.RefObject<HTMLVideoElement>,
  currentFolder?: string | null
) => {
  const supabase = createClient();

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  const fetchComments = useCallback(
    async (fileName: string) => {
      const { data } = await supabase
        .from("video_comments")
        .select("*")
        .eq("file_name", fileName)
        .order("time_stamp", { ascending: true });
      if (data) setComments(data);
      else setComments([]);
    },
    [supabase],
  );

  // 🚀 GLOBAL SOCKET CONNECTION
  useEffect(() => {
    if (!user) return; // Only connect if user is loaded

    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
    );
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsLive(true);
      const roomToJoin = previewFile?.name || currentFolder || "global-lobby";
      newSocket.emit("join-video-room", roomToJoin);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("⚠️ [useLiveComments] Socket connection failed. Ensure NEXT_PUBLIC_BACKEND_URL is set in production:", err.message);
    });

    newSocket.on("disconnect", () => setIsLive(false));

    newSocket.on("comment-added", (incomingComment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === incomingComment.id)) return prev;
        return [...prev, incomingComment].sort(
          (a, b) => a.time_stamp - b.time_stamp,
        );
      });
    });

    // 🚀 NEW: VIDEO PLAY STATE SYNC LISTENERS
    newSocket.on("video-play", (data) => {
      if (videoRef.current && videoRef.current.paused) {
        // Only update time if the difference is more than 0.5 seconds to avoid jitter
        if (Math.abs(videoRef.current.currentTime - data.currentTime) > 0.5) {
          videoRef.current.currentTime = data.currentTime;
        }
        videoRef.current.play().catch(e => console.error("Auto-play blocked:", e));
      }
    });

    newSocket.on("video-pause", (data) => {
      if (videoRef.current && !videoRef.current.paused) {
         if (Math.abs(videoRef.current.currentTime - data.currentTime) > 0.5) {
          videoRef.current.currentTime = data.currentTime;
        }
        videoRef.current.pause();
      }
    });

    newSocket.on("video-seek", (data) => {
      if (videoRef.current && Math.abs(videoRef.current.currentTime - data.currentTime) > 0.5) {
        videoRef.current.currentTime = data.currentTime;
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, previewFile?.name, currentFolder]);

  const handleAddComment = async (e: React.FormEvent) => {
    // ... [আপনার আগের কোড হুবহু থাকবে] ...
    e.preventDefault();
    if (!newComment.trim() || !previewFile || !videoRef.current || !user)
      return;
    const commentTextToSend = newComment.trim();
    setNewComment("");
    const currentTime = videoRef.current.currentTime;
    videoRef.current.pause();

    const { data, error } = await supabase
      .from("video_comments")
      .insert([
        {
          file_name: previewFile.name,
          user_id: user.id,
          time_stamp: currentTime,
          comment_text: commentTextToSend,
        },
      ])
      .select();
    if (!error && data && data.length > 0) {
      const insertedComment = data[0];
      setComments((prev) =>
        [...prev, insertedComment].sort((a, b) => a.time_stamp - b.time_stamp),
      );
      if (socket) {
        socket.emit("new-comment", {
          fileId: previewFile.name,
          ...insertedComment,
        });
      }
    } else if (error) console.error("Supabase insert error:", error);
  };

  const handleDeleteComment = async (commentId: string) => {
     // ... [আপনার আগের কোড হুবহু থাকবে] ...
    if (!confirmDelete("comment")) return;
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    const { error } = await supabase
      .from("video_comments")
      .delete()
      .eq("id", commentId);
    if (error) console.error("Failed to delete comment from database:", error);
  };

  const handleEditComment = async (commentId: string, currentText: string) => {
     // ... [আপনার আগের কোড হুবহু থাকবে] ...
    const newCommentText = prompt("Edit your feedback:", currentText);
    if (newCommentText === null) return;
    if (!newCommentText.trim()) {
      alert(
        "Comment cannot be empty! If you want to remove it, please use the delete button.",
      );
      return;
    }
    const cleanedText = newCommentText.trim();
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, comment_text: cleanedText }
          : comment,
      ),
    );
    const { error } = await supabase
      .from("video_comments")
      .update({ comment_text: cleanedText })
      .eq("id", commentId);
    if (error) console.error("Failed to update comment in database:", error);
  };

  const handleNotifyTeam = async () => {
    // ... [আপনার আগের কোড হুবহু থাকবে] ...
    if (!previewFile || !user || comments.length === 0 || isNotifying) return;
    setIsNotifying(true);
    try {
      const cleanFileName = previewFile.name.substring(
        previewFile.name.indexOf("_") + 1,
      );
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: cleanFileName,
          totalComments: comments.length,
          userEmail: user.email,
        }),
      });
      if (res.ok) {
        setNotificationSent(true);
        setTimeout(() => setNotificationSent(false), 5000);
      }
    } catch (err) {
      console.error("Failed to notify team:", err);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleCompileAndSend = async () => {
     // ... [আপনার আগের কোড হুবহু থাকবে] ...
    if (!previewFile || !user || comments.length === 0 || isNotifying) {
      alert("No comments found to compile.");
      return;
    }
    setIsNotifying(true);
    try {
      const cleanFileName = previewFile.name.substring(
        previewFile.name.indexOf("_") + 1,
      );
      const compiledNotes = comments
        .map(
          (c) =>
            `[${Math.floor(c.time_stamp / 60)}:${("0" + Math.floor(c.time_stamp % 60)).slice(-2)}] ${c.comment_text}`,
        )
        .join("\n");
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: cleanFileName,
          totalComments: comments.length,
          userEmail: user.email,
          compiledNotes: compiledNotes,
        }),
      });
      if (res.ok) {
        setNotificationSent(true);
        alert("Success! Compiled report has been sent to the Editor.");
        setTimeout(() => setNotificationSent(false), 5000);
      }
    } catch (err) {
      console.error("Failed to notify team:", err);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleDownloadReport = () => {
    // ... [আপনার আগের কোড হুবহু থাকবে] ...
    if (comments.length === 0) {
      alert("No comments to generate a report.");
      return;
    }
    const text = comments
      .map(
        (c) =>
          `- [${Math.floor(c.time_stamp / 60)}:${("0" + Math.floor(c.time_stamp % 60)).slice(-2)}] ${c.comment_text}`,
      )
      .join("\n\n");
    const blob = new Blob(
      [
        `KACHNA STUDIO - REVIEW REPORT\nFile: ${previewFile?.name}\nTotal Comments: ${comments.length}\n\n${text}`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Review_Report_${Date.now()}.txt`;
    a.click();
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      // Broadcast seek event
      if(socket && previewFile?.name) {
          socket.emit("video-seek", { room: previewFile.name, currentTime: time });
          socket.emit("video-play", { room: previewFile.name, currentTime: time });
      }
    }
  };

  return {
    comments,
    setComments,
    newComment,
    setNewComment,
    socket,
    isLive,
    isNotifying,
    notificationSent,
    fetchComments,
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    handleNotifyTeam,
    handleCompileAndSend,
    handleDownloadReport,
    jumpToTime,
  };
};