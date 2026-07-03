// hooks/useLiveComments.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { io, Socket } from "socket.io-client";
import { confirmDelete } from "@/utils/confirmDelete";
import {
  resolveCommentAuthor,
  type VideoCommentRow,
} from "@/utils/commentAuthor";

export const useLiveComments = (
  user: any,
  previewFile: any,
  videoRef: React.RefObject<HTMLVideoElement>,
  currentFolder?: string | null,
) => {
  const supabase = createClient();
  const videoRefStable = useRef(videoRef);
  videoRefStable.current = videoRef;

  const [comments, setComments] = useState<VideoCommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const activeRoomRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!previewFile?.name || !previewFile?.isVideo) {
      setComments([]);
      return;
    }

    void fetchComments(previewFile.name);
  }, [previewFile?.name, previewFile?.isVideo, fetchComments]);

  useEffect(() => {
    if (!user?.id) {
      setSocket(null);
      setIsLive(false);
      return;
    }

    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
    );
    setSocket(newSocket);

    const handleConnect = () => setIsLive(true);
    const handleDisconnect = () => setIsLive(false);
    const handleConnectError = (err: Error) => {
      console.warn(
        "⚠️ [useLiveComments] Socket connection failed. Ensure NEXT_PUBLIC_BACKEND_URL is set in production:",
        err.message,
      );
    };
    const handleCommentAdded = (incomingComment: VideoCommentRow) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === incomingComment.id)) return prev;
        return [...prev, incomingComment].sort(
          (a, b) => a.time_stamp - b.time_stamp,
        );
      });
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("comment-added", handleCommentAdded);

    return () => {
      activeRoomRef.current = null;
      newSocket.off("connect", handleConnect);
      newSocket.off("connect_error", handleConnectError);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("comment-added", handleCommentAdded);
      newSocket.disconnect();
      setSocket(null);
      setIsLive(false);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const roomToJoin = previewFile?.name || currentFolder || "global-lobby";
    if (activeRoomRef.current === roomToJoin) return;

    const joinRoom = () => {
      socket.emit("join-video-room", roomToJoin);
      activeRoomRef.current = roomToJoin;
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [socket, user?.id, previewFile?.name, currentFolder]);

  useEffect(() => {
    if (!socket) return;

    const handleVideoPlay = (data: { currentTime: number }) => {
      const video = videoRefStable.current.current;
      if (video && video.paused) {
        if (Math.abs(video.currentTime - data.currentTime) > 0.5) {
          video.currentTime = data.currentTime;
        }
        video.play().catch((e) => console.error("Auto-play blocked:", e));
      }
    };

    const handleVideoPause = (data: { currentTime: number }) => {
      const video = videoRefStable.current.current;
      if (video && !video.paused) {
        if (Math.abs(video.currentTime - data.currentTime) > 0.5) {
          video.currentTime = data.currentTime;
        }
        video.pause();
      }
    };

    const handleVideoSeek = (data: { currentTime: number }) => {
      const video = videoRefStable.current.current;
      if (video && Math.abs(video.currentTime - data.currentTime) > 0.5) {
        video.currentTime = data.currentTime;
      }
    };

    socket.on("video-play", handleVideoPlay);
    socket.on("video-pause", handleVideoPause);
    socket.on("video-seek", handleVideoSeek);

    return () => {
      socket.off("video-play", handleVideoPlay);
      socket.off("video-pause", handleVideoPause);
      socket.off("video-seek", handleVideoSeek);
    };
  }, [socket]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !previewFile || !videoRef.current || !user)
      return;
    const commentTextToSend = newComment.trim();
    setNewComment("");
    const currentTime = videoRef.current.currentTime;
    videoRef.current.pause();

    const author = resolveCommentAuthor(user);

    const { data, error } = await supabase
      .from("video_comments")
      .insert([
        {
          file_name: previewFile.name,
          user_id: user.id,
          time_stamp: currentTime,
          comment_text: commentTextToSend,
          author_display_name: author.author_display_name,
          author_avatar_url: author.author_avatar_url,
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
    if (!confirmDelete("comment")) return;
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    const { error } = await supabase
      .from("video_comments")
      .delete()
      .eq("id", commentId);
    if (error) console.error("Failed to delete comment from database:", error);
  };

  const handleEditComment = async (commentId: string, currentText: string) => {
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
        `RENDORAX STUDIO - REVIEW REPORT\nFile: ${previewFile?.name}\nTotal Comments: ${comments.length}\n\n${text}`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Review_Report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      if (socket && previewFile?.name) {
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
