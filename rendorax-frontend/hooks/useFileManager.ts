// hooks/useFileManager.ts
import { useState, useCallback, useEffect, useRef } from "react";
import {
  requestPresignedUploadForKey,
  uploadFileWithProgress,
  uploadMediaToR2,
  SINGLE_PUT_MAX_BYTES,
} from "@/utils/r2Upload";
import {
  saveMediaAsset,
  mediaFolderForSave,
  fetchMediaAssets,
  buildMediaAssetFetchParams,
  getMediaPlaybackUrl,
  resolveGalleryThumbnail,
  updateMediaAsset,
  deleteMediaAsset,
  deleteMediaAssetsInFolder,
  createMediaFolder,
  fetchAllFolderPaths,
  normalizeMediaFolder,
  type MediaAssetRecord,
} from "@/utils/mediaAssets";
import type { ClientUploadSession } from "@/utils/mediaUploadStatus";
import {
  hasActiveAssetProcessing,
  resolveAssetDisplayStatus,
  UPLOAD_SUCCESS_VISIBLE_MS,
} from "@/utils/mediaUploadStatus";

/** Supabase storage list shape expected by the vault FileGrid. */
export interface VaultFileItem {
  id: string;
  name: string;
  metadata: {
    size?: number | null;
    mimetype?: string;
  };
  created_at?: string;
}

function resolveRenamedFileName(vaultName: string, newCleanName: string): string {
  const underscoreIdx = vaultName.indexOf("_");
  const actualNameWithExt =
    underscoreIdx !== -1 ? vaultName.substring(underscoreIdx + 1) : vaultName;
  const dotIdx = actualNameWithExt.lastIndexOf(".");
  const ext = dotIdx !== -1 ? actualNameWithExt.substring(dotIdx) : "";
  return `${newCleanName.trim()}${ext}`;
}

function mapMediaAssetToVaultFile(asset: MediaAssetRecord): VaultFileItem {
  const tsMatch = asset.objectKey?.match(/(\d{13})_/);
  const timestamp =
    tsMatch?.[1] ?? String(new Date(asset.createdAt).getTime());
  return {
    id: asset.id,
    name: `${timestamp}_${asset.fileName}`,
    metadata: {
      size: asset.fileSize,
      mimetype: asset.mimeType,
    },
    created_at: asset.createdAt,
  };
}

export const useFileManager = (user: any, currentFolder: string) => {
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSession, setUploadSession] = useState<ClientUploadSession | null>(
    null,
  );
  const uploadDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [vaultAssetsByName, setVaultAssetsByName] = useState<
    Record<string, MediaAssetRecord>
  >({});
  const [allFolders, setAllFolders] = useState<string[]>([]);
  const fileUrlByVaultNameRef = useRef<Record<string, string>>({});
  const assetIdByVaultNameRef = useRef<Record<string, string>>({});
  const vaultAssetByVaultNameRef = useRef<Record<string, MediaAssetRecord>>({});

  const fetchAllFolders = useCallback(async () => {
    if (!user?.id) {
      setAllFolders([]);
      return;
    }

    try {
      const paths = await fetchAllFolderPaths(user.id);
      setAllFolders(paths);
    } catch (error) {
      console.error("Failed to fetch vault folders:", error);
      setAllFolders([]);
    }
  }, [user?.id]);

  const fetchFiles = useCallback(async (userId: string, folderPath: string) => {
    try {
      const params = buildMediaAssetFetchParams(folderPath, userId);
      const assets = await fetchMediaAssets(params);
      const vaultFiles = assets.map(mapMediaAssetToVaultFile);
      const urlMap: Record<string, string> = {};
      const idMap: Record<string, string> = {};
      const assetMap: Record<string, MediaAssetRecord> = {};
      const thumbMap: Record<string, string> = {};

      vaultFiles.forEach((item, index) => {
        const asset = assets[index];
        const playbackUrl = getMediaPlaybackUrl(asset);
        if (playbackUrl) {
          urlMap[item.name] = playbackUrl;
        }
        idMap[item.name] = asset.id;
        assetMap[item.name] = asset;

        const thumbnail = resolveGalleryThumbnail(asset, playbackUrl);
        if (thumbnail) {
          thumbMap[item.name] = thumbnail;
        }
      });

      fileUrlByVaultNameRef.current = urlMap;
      assetIdByVaultNameRef.current = idMap;
      vaultAssetByVaultNameRef.current = assetMap;
      setVaultItems(vaultFiles);
      setFileUrls(urlMap);
      setThumbnailUrls(thumbMap);
      setVaultAssetsByName(assetMap);
    } catch (error) {
      console.error("Failed to fetch vault files:", error);
      fileUrlByVaultNameRef.current = {};
      assetIdByVaultNameRef.current = {};
      vaultAssetByVaultNameRef.current = {};
      setVaultItems([]);
      setFileUrls({});
      setThumbnailUrls({});
      setVaultAssetsByName({});
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchFiles(user.id, currentFolder);
    } else {
      setVaultItems([]);
      setFileUrls({});
      setThumbnailUrls({});
      setVaultAssetsByName({});
      fileUrlByVaultNameRef.current = {};
      assetIdByVaultNameRef.current = {};
      vaultAssetByVaultNameRef.current = {};
    }
  }, [user, currentFolder, fetchFiles]);

  useEffect(() => {
    if (user?.id) {
      fetchAllFolders();
    } else {
      setAllFolders([]);
    }
  }, [user?.id, fetchAllFolders]);

  const buildR2UploadObjectKey = (fileName: string) => {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `uploads/${Date.now()}_${sanitizedName}`;
  };

  const clearUploadDismissTimer = useCallback(() => {
    if (uploadDismissTimerRef.current) {
      clearTimeout(uploadDismissTimerRef.current);
      uploadDismissTimerRef.current = null;
    }
  }, []);

  const scheduleUploadSessionTransition = useCallback(
    (asset: MediaAssetRecord, fileName: string) => {
      clearUploadDismissTimer();
      uploadDismissTimerRef.current = setTimeout(() => {
        if (hasActiveAssetProcessing(asset)) {
          setUploadSession({
            fileName,
            progress: 100,
            phase: "processing",
            savedAsset: asset,
          });
          return;
        }
        setUploadSession(null);
        setUploadProgress(0);
      }, UPLOAD_SUCCESS_VISIBLE_MS);
    },
    [clearUploadDismissTimer],
  );

  useEffect(() => {
    if (uploadSession?.phase !== "processing" || !uploadSession.savedAsset?.id) {
      return;
    }

    const freshAsset = Object.values(vaultAssetsByName).find(
      (asset) => asset.id === uploadSession.savedAsset?.id,
    );
    if (!freshAsset) return;

    if (!hasActiveAssetProcessing(freshAsset)) {
      setUploadSession(null);
      setUploadProgress(0);
      return;
    }

    const nextLabel = resolveAssetDisplayStatus(freshAsset);
    const currentLabel = uploadSession.savedAsset
      ? resolveAssetDisplayStatus(uploadSession.savedAsset)
      : null;
    if (nextLabel?.key !== currentLabel?.key) {
      setUploadSession((current) =>
        current
          ? {
              ...current,
              savedAsset: freshAsset,
            }
          : current,
      );
    }
  }, [vaultAssetsByName, uploadSession]);

  useEffect(() => clearUploadDismissTimer, [clearUploadDismissTimer]);

  const reportUploadProgress = useCallback((progress: number) => {
    setUploadProgress(progress);
    setUploadSession((current) => {
      if (
        !current ||
        current.phase === "failed" ||
        current.phase === "complete" ||
        current.phase === "processing"
      ) {
        return current;
      }

      if (progress >= 100) {
        return { ...current, progress: 100, phase: "finalizing" };
      }

      return { ...current, progress, phase: "uploading" };
    });
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    clearUploadDismissTimer();
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadSession({
          fileName: file.name,
          progress: 0,
          phase: "uploading",
        });

        const contentType = file.type || "application/octet-stream";
        const objectKey = buildR2UploadObjectKey(file.name);

        const result =
          file.size > SINGLE_PUT_MAX_BYTES
            ? await uploadMediaToR2(file, reportUploadProgress)
            : await (async () => {
                const { uploadUrl, publicUrl, objectKey: resolvedKey } =
                  await requestPresignedUploadForKey(objectKey, contentType);
                await uploadFileWithProgress(uploadUrl, file, reportUploadProgress);
                return { publicUrl, objectKey: resolvedKey };
              })();

        setUploadSession({
          fileName: file.name,
          progress: 100,
          phase: "finalizing",
        });

        const savedAsset = await saveMediaAsset({
          fileName: file.name,
          publicUrl: result.publicUrl,
          objectKey: result.objectKey,
          mimeType: contentType,
          userId: user.id,
          folder: mediaFolderForSave(currentFolder),
          fileSize: file.size,
        });

        setUploadSession({
          fileName: file.name,
          progress: 100,
          phase: "complete",
          savedAsset,
        });
        setUploading(false);

        await fetchFiles(user.id, currentFolder);
        await fetchAllFolders();

        const freshAsset =
          Object.values(vaultAssetByVaultNameRef.current).find(
            (asset) => asset.id === savedAsset.id,
          ) ?? savedAsset;

        scheduleUploadSessionTransition(freshAsset, file.name);
      }

      setUploadProgress(100);
    } catch (error) {
      clearUploadDismissTimer();
      const message =
        error instanceof Error ? error.message : "Upload failed unexpectedly.";
      setUploadSession((current) =>
        current
          ? { ...current, phase: "failed", errorMessage: message }
          : {
              fileName: files[0]?.name ?? "Upload",
              progress: 0,
              phase: "failed",
              errorMessage: message,
            },
      );
      alert(`Upload failed: ${message}`);
      setUploadProgress(0);
      setUploading(false);
    }
  };

  const getSignedUrl = async (fileName: string) =>
    fileUrlByVaultNameRef.current[fileName] ?? undefined;

  const getVaultAssetRecord = (vaultFileName: string): MediaAssetRecord | undefined =>
    vaultAssetByVaultNameRef.current[vaultFileName];

  const resolveAssetId = (vaultFileName: string): string | undefined =>
    assetIdByVaultNameRef.current[vaultFileName] ??
    vaultItems.find((item) => item?.name === vaultFileName)?.id;

  const handleDeleteFile = async (
    fileName: string,
    clearPreview: () => void,
  ) => {
    const assetId = resolveAssetId(fileName);
    if (!assetId) {
      alert("Error deleting file: Asset not found.");
      return;
    }

    try {
      await deleteMediaAsset(assetId);
      delete fileUrlByVaultNameRef.current[fileName];
      delete assetIdByVaultNameRef.current[fileName];
      delete vaultAssetByVaultNameRef.current[fileName];
      clearPreview();
      await fetchFiles(user.id, currentFolder);
      await fetchAllFolders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete file.";
      alert(`Error deleting file: ${message}`);
    }
  };

  const handleRenameFile = async (
    oldName: string,
    newCleanName: string,
    clearPreview: () => void,
  ) => {
    const assetId = resolveAssetId(oldName);
    if (!assetId) {
      alert("Error renaming file: Asset not found.");
      return;
    }

    const newFileName = resolveRenamedFileName(oldName, newCleanName);

    try {
      await updateMediaAsset(assetId, { fileName: newFileName });
      delete fileUrlByVaultNameRef.current[oldName];
      delete assetIdByVaultNameRef.current[oldName];
      delete vaultAssetByVaultNameRef.current[oldName];
      clearPreview();
      await fetchFiles(user.id, currentFolder);
      await fetchAllFolders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to rename file.";
      alert(`Error renaming file: ${message}`);
    }
  };

  const handleMoveFile = async (
    fileName: string,
    destinationFolder: string,
    clearPreview: () => void,
  ) => {
    const assetId = resolveAssetId(fileName);
    if (!assetId) {
      alert("Error moving file: Asset not found.");
      return;
    }

    const destination = normalizeMediaFolder(destinationFolder);
    const current = normalizeMediaFolder(currentFolder);
    if (destination === current) return;

    try {
      await updateMediaAsset(assetId, {
        folder: destination ? destination : null,
      });
      delete fileUrlByVaultNameRef.current[fileName];
      delete assetIdByVaultNameRef.current[fileName];
      delete vaultAssetByVaultNameRef.current[fileName];
      clearPreview();
      await fetchFiles(user.id, currentFolder);
      await fetchAllFolders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to move file.";
      alert(`Error moving file: ${message}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!user) return;
    const folderName = prompt("Enter new folder name:");
    if (!folderName || folderName.trim() === "") return;

    const cleanFolder = normalizeMediaFolder(currentFolder);
    const newPath = cleanFolder
      ? `${cleanFolder}/${folderName.trim()}`
      : folderName.trim();

    try {
      await createMediaFolder(newPath);
      await fetchAllFolders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create folder.";
      alert(`Error creating folder: ${message}`);
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    const normalizedFolder = normalizeMediaFolder(folderPath);
    if (!normalizedFolder) {
      alert("Error deleting folder: Invalid folder path.");
      return;
    }

    try {
      await deleteMediaAssetsInFolder(normalizedFolder);
      await fetchFiles(user.id, currentFolder);
      await fetchAllFolders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete folder.";
      alert(`Error deleting folder: ${message}`);
    }
  };

  return {
    vaultItems,
    fileUrls,
    thumbnailUrls,
    vaultAssetsByName,
    uploading,
    uploadProgress,
    uploadSession,
    allFolders,
    fetchFiles,
    fetchAllFolders,
    handleUpload,
    getSignedUrl,
    getVaultAssetRecord,
    handleDeleteFile,
    handleRenameFile,
    handleMoveFile,
    handleCreateFolder,
    handleDeleteFolder,
  };
};
