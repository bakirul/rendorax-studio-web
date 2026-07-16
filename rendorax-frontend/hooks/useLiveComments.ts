// hooks/useLiveComments.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { io, Socket } from "socket.io-client";
import { confirmDelete } from "@/utils/confirmDelete";
import {
  getCommentDisplayName,
  resolveCommentAuthor,
  type VideoCommentRow,
} from "@/utils/commentAuthor";
import { resolveSpeechLanguage } from "@/utils/languageCodes";
import { translateIncomingChatMessage } from "@/utils/translateLiveChatMessage";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
  emitJoinReviewRoom,
  getReviewRoomId,
} from "@/utils/reviewRoom";
import {
  buildMarkerRows,
  buildMarkersCsv,
  buildMarkersJson,
  buildMarkersXmeml,
  buildMarkersFilename,
  cleanExportFileName,
  downloadTextFile,
  resolveExportFps,
} from "@/utils/exportReviewMarkers";
import { setCommentResolved } from "@/utils/projectFeedbackSummary";

function formatCommentTimecode(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${("0" + Math.floor(seconds % 60)).slice(-2)}`;
}

/** Keep filename fallback from stealing another project's mapped comments. */
function filterFilenameFallbackRows(
  rows: VideoCommentRow[],
  agencyProjectId?: string | null,
): VideoCommentRow[] {
  if (!agencyProjectId) {
    return rows.filter((row) => !row.agency_project_id);
  }
  return rows.filter(
    (row) =>
      !row.agency_project_id || row.agency_project_id === agencyProjectId,
  );
}

function formatCompiledNoteLine(comment: VideoCommentRow): string {
  const author = getCommentDisplayName(comment);
  return `[${formatCommentTimecode(comment.time_stamp)}] ${author}: ${comment.comment_text}`;
}

export type DisplayCommentRow = VideoCommentRow & {
  display_text?: string;
  translated?: boolean;
  translationFailed?: boolean;
};

type CommentTranslationCacheEntry = {
  display_text: string;
  translated: boolean;
  translationFailed: boolean;
};

function commentTranslationCacheKey(
  commentId: string,
  selectedLanguage: string,
): string {
  return `${commentId}:${selectedLanguage}`;
}

export const useLiveComments = (
  user: any,
  previewFile: any,
  videoRef: React.RefObject<HTMLVideoElement>,
  currentFolder?: string | null,
) => {
  const supabase = createClient();
  const videoRefStable = useRef(videoRef);
  videoRefStable.current = videoRef;

  const selectedLanguage = useGlobalStore((state) => state.selectedLanguage);
  const [comments, setComments] = useState<DisplayCommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const activeRoomRef = useRef<string | null>(null);
  const translationCacheRef = useRef<
    Map<string, CommentTranslationCacheEntry>
  >(new Map());
  const translationInFlightRef = useRef<Set<string>>(new Set());
  const commentsRef = useRef<DisplayCommentRow[]>([]);
  commentsRef.current = comments;

  const fetchCommentsForPreview = useCallback(async () => {
    const fileName = previewFile?.name?.trim();
    const assetId =
      typeof previewFile?.assetId === "string"
        ? previewFile.assetId.trim()
        : "";
    const agencyProjectId =
      typeof previewFile?.agencyProjectId === "string"
        ? previewFile.agencyProjectId.trim()
        : null;

    if (!fileName) {
      setComments([]);
      return;
    }

    if (assetId) {
      const { data: byAsset, error: assetError } = await supabase
        .from("video_comments")
        .select("*")
        .eq("media_asset_id", assetId)
        .order("time_stamp", { ascending: true });

      if (assetError) {
        console.error("Failed to load comments by media_asset_id:", assetError);
      }

      if (byAsset && byAsset.length > 0) {
        setComments(byAsset);
        return;
      }

      const { data: byName, error: nameError } = await supabase
        .from("video_comments")
        .select("*")
        .eq("file_name", fileName)
        .order("time_stamp", { ascending: true });

      if (nameError) {
        console.error("Failed to load comments by file_name:", nameError);
        setComments([]);
        return;
      }

      setComments(
        filterFilenameFallbackRows(byName ?? [], agencyProjectId),
      );
      return;
    }

    const { data, error } = await supabase
      .from("video_comments")
      .select("*")
      .eq("file_name", fileName)
      .order("time_stamp", { ascending: true });

    if (error) {
      console.error("Failed to load legacy comments:", error);
      setComments([]);
      return;
    }

    setComments(filterFilenameFallbackRows(data ?? [], agencyProjectId));
  }, [
    previewFile?.name,
    previewFile?.assetId,
    previewFile?.agencyProjectId,
    supabase,
  ]);

  useEffect(() => {
    if (!previewFile?.name || !previewFile?.isVideo) {
      setComments([]);
      return;
    }

    void fetchCommentsForPreview();
  }, [
    previewFile?.name,
    previewFile?.isVideo,
    previewFile?.assetId,
    previewFile?.agencyProjectId,
    fetchCommentsForPreview,
  ]);

  const applyCachedDisplayMetadata = useCallback(
    (rows: DisplayCommentRow[]): DisplayCommentRow[] => {
      if (!user?.id) return rows;

      return rows.map((comment) => {
        if (comment.user_id === user.id) {
          return {
            ...comment,
            display_text: undefined,
            translated: false,
            translationFailed: false,
          };
        }

        const cacheKey = commentTranslationCacheKey(
          comment.id,
          selectedLanguage,
        );
        const cached = translationCacheRef.current.get(cacheKey);
        if (!cached) return comment;

        return { ...comment, ...cached };
      });
    },
    [selectedLanguage, user?.id],
  );

  const commentsTranslationSignature = comments
    .map(
      (comment) =>
        `${comment.id}:${comment.comment_text}:${comment.user_id}`,
    )
    .join("|");

  useEffect(() => {
    if (!user?.id) return;

    setComments((prev) => applyCachedDisplayMetadata(prev));

    const targetLanguage = resolveSpeechLanguage(selectedLanguage).geminiName;
    let cancelled = false;

    const translateMissingComments = async () => {
      const snapshot = commentsRef.current;
      const pending = snapshot.filter(
        (comment) =>
          comment.user_id !== user.id &&
          !translationCacheRef.current.has(
            commentTranslationCacheKey(comment.id, selectedLanguage),
          ) &&
          !translationInFlightRef.current.has(
            commentTranslationCacheKey(comment.id, selectedLanguage),
          ),
      );

      if (pending.length === 0) return;

      await Promise.all(
        pending.map(async (comment) => {
          const cacheKey = commentTranslationCacheKey(
            comment.id,
            selectedLanguage,
          );
          translationInFlightRef.current.add(cacheKey);

          try {
            const result = await translateIncomingChatMessage(
              comment.comment_text,
              targetLanguage,
            );

            if (cancelled) return;

            const entry: CommentTranslationCacheEntry = {
              display_text: result.translationFailed
                ? comment.comment_text
                : result.translated
                  ? result.text
                  : comment.comment_text,
              translated: result.translated && !result.translationFailed,
              translationFailed: Boolean(result.translationFailed),
            };

            translationCacheRef.current.set(cacheKey, entry);

            setComments((prev) =>
              prev.map((row) =>
                row.id === comment.id ? { ...row, ...entry } : row,
              ),
            );
          } catch {
            if (cancelled) return;

            const entry: CommentTranslationCacheEntry = {
              display_text: comment.comment_text,
              translated: false,
              translationFailed: true,
            };

            translationCacheRef.current.set(cacheKey, entry);

            setComments((prev) =>
              prev.map((row) =>
                row.id === comment.id ? { ...row, ...entry } : row,
              ),
            );
          } finally {
            translationInFlightRef.current.delete(cacheKey);
          }
        }),
      );
    };

    void translateMissingComments();

    return () => {
      cancelled = true;
    };
  }, [
    commentsTranslationSignature,
    selectedLanguage,
    user?.id,
    applyCachedDisplayMetadata,
  ]);

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

    const handleCommentUpdated = (incomingComment: VideoCommentRow) => {
      if (!incomingComment?.id) return;
      setComments((prev) =>
        prev.map((row) =>
          row.id === incomingComment.id ? { ...row, ...incomingComment } : row,
        ),
      );
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("comment-added", handleCommentAdded);
    newSocket.on("comment-updated", handleCommentUpdated);

    return () => {
      activeRoomRef.current = null;
      newSocket.off("connect", handleConnect);
      newSocket.off("connect_error", handleConnectError);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("comment-added", handleCommentAdded);
      newSocket.off("comment-updated", handleCommentUpdated);
      newSocket.disconnect();
      setSocket(null);
      setIsLive(false);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const roomToJoin = getReviewRoomId(previewFile, currentFolder);
    if (activeRoomRef.current === roomToJoin) return;

    const joinRoom = () => {
      emitJoinReviewRoom(socket, roomToJoin);
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
  }, [socket, user?.id, previewFile?.name, previewFile?.assetId, currentFolder]);

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
    const commentFileKey =
      previewFile?.name?.trim() || getReviewRoomId(previewFile, currentFolder);
    if (!newComment.trim() || !user || !commentFileKey) return;
    const commentTextToSend = newComment.trim();
    setNewComment("");
    const currentTime = videoRef.current?.currentTime ?? 0;

    const author = resolveCommentAuthor(user);
    const assetId =
      typeof previewFile?.assetId === "string"
        ? previewFile.assetId.trim()
        : "";
    const agencyProjectId =
      typeof previewFile?.agencyProjectId === "string"
        ? previewFile.agencyProjectId.trim()
        : "";

    const insertPayload: Record<string, unknown> = {
      file_name: commentFileKey,
      user_id: user.id,
      time_stamp: currentTime,
      comment_text: commentTextToSend,
      author_display_name: author.author_display_name,
      author_avatar_url: author.author_avatar_url,
      is_resolved: false,
    };

    if (assetId) insertPayload.media_asset_id = assetId;
    if (agencyProjectId) {
      insertPayload.agency_project_id = agencyProjectId;
    } else {
      console.error(
        "Comment blocked: agency_project_id is required for org-scoped RLS",
      );
      setNewComment(commentTextToSend);
      return;
    }

    const { data, error } = await supabase
      .from("video_comments")
      .insert([insertPayload])
      .select();
    if (!error && data && data.length > 0) {
      const insertedComment = data[0];
      setComments((prev) =>
        [...prev, insertedComment].sort((a, b) => a.time_stamp - b.time_stamp),
      );
      if (socket) {
        const reviewRoomId = getReviewRoomId(previewFile, currentFolder);
        socket.emit("new-comment", {
          fileId: reviewRoomId,
          ...insertedComment,
        });
      }
    } else if (error) console.error("Supabase insert error:", error);
  };

  const handleResolveComment = async (
    commentId: string,
    resolved: boolean,
  ) => {
    const previous = commentsRef.current.find((c) => c.id === commentId);
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              is_resolved: resolved,
              resolved_at: resolved ? new Date().toISOString() : null,
              resolved_by: resolved ? user?.id ?? null : null,
            }
          : comment,
      ),
    );

    try {
      const updated = await setCommentResolved(commentId, resolved);
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? { ...comment, ...updated } : comment,
        ),
      );
      if (socket) {
        const reviewRoomId = getReviewRoomId(previewFile, currentFolder);
        socket.emit("comment-updated", {
          fileId: reviewRoomId,
          ...updated,
        });
      }
    } catch (error) {
      console.error("Failed to update comment resolve state:", error);
      if (previous) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId ? previous : comment,
          ),
        );
      }
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update resolve state",
      );
    }
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
    for (const cacheKey of translationCacheRef.current.keys()) {
      if (cacheKey.startsWith(`${commentId}:`)) {
        translationCacheRef.current.delete(cacheKey);
      }
    }
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              comment_text: cleanedText,
              display_text: undefined,
              translated: false,
              translationFailed: false,
            }
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
      const compiledNotes = comments.map(formatCompiledNoteLine).join("\n");
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

  const handleExportMarkers = (format?: "csv" | "json" | "xml") => {
    if (comments.length === 0) {
      alert("No comments to export.");
      return;
    }
    const fileName = previewFile?.name ?? comments[0]?.file_name ?? "unknown";
    const fps = resolveExportFps(previewFile);
    const rows = buildMarkerRows(comments, fileName, fps);
    const sequenceName = cleanExportFileName(fileName);

    const exportCsv = () => {
      downloadTextFile(
        buildMarkersCsv(rows),
        buildMarkersFilename(fileName, "csv"),
        "text/csv;charset=utf-8",
      );
    };

    const exportJson = () => {
      downloadTextFile(
        buildMarkersJson(rows),
        buildMarkersFilename(fileName, "json"),
        "application/json",
      );
    };

    const exportXml = () => {
      downloadTextFile(
        buildMarkersXmeml(rows, sequenceName, fps),
        buildMarkersFilename(fileName, "xml"),
        "application/xml;charset=utf-8",
      );
    };

    if (format === "csv") {
      exportCsv();
      return;
    }
    if (format === "json") {
      exportJson();
      return;
    }
    if (format === "xml") {
      exportXml();
      return;
    }

    exportCsv();
    window.setTimeout(exportJson, 150);
    window.setTimeout(exportXml, 300);
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
      if (socket) {
        const reviewRoomId = getReviewRoomId(previewFile, currentFolder);
        socket.emit("video-seek", { room: reviewRoomId, currentTime: time });
        socket.emit("video-play", { room: reviewRoomId, currentTime: time });
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
    fetchComments: fetchCommentsForPreview,
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    handleResolveComment,
    handleNotifyTeam,
    handleCompileAndSend,
    handleDownloadReport,
    handleExportMarkers,
    jumpToTime,
  };
};
