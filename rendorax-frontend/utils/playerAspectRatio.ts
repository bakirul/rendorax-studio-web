export type AspectRatioSetting = "video" | "dci" | "square" | "portrait";

export const ASPECT_RATIO_OPTIONS: ReadonlyArray<{
  id: AspectRatioSetting;
  label: string;
  title: string;
}> = [
  { id: "video", label: "16:9", title: "1920×1080" },
  { id: "dci", label: "DCI", title: "1.89:1" },
  { id: "square", label: "1:1", title: "Square" },
  { id: "portrait", label: "9:16", title: "Vertical" },
];

/** Static JIT-safe aspect classes for gallery cards and shared lookups. */
export const GALLERY_ASPECT_CLASS: Record<AspectRatioSetting, string> = {
  video: "aspect-video",
  dci: "aspect-[1.89/1]",
  square: "aspect-square",
  portrait: "aspect-[9/16]",
};

export function normalizeAspectRatioSetting(
  value: string | undefined | null,
): AspectRatioSetting {
  if (value === "dci" || value === "square" || value === "portrait") {
    return value;
  }
  return "video";
}

function resolveGalleryAspectClass(aspectRatio: AspectRatioSetting): string {
  switch (aspectRatio) {
    case "video":
      return GALLERY_ASPECT_CLASS.video;
    case "dci":
      return GALLERY_ASPECT_CLASS.dci;
    case "square":
      return GALLERY_ASPECT_CLASS.square;
    case "portrait":
      return GALLERY_ASPECT_CLASS.portrait;
    default:
      return GALLERY_ASPECT_CLASS.video;
  }
}

/** Tailwind aspect + layout classes shared by gallery cards. */
export function getAspectRatioClasses(aspectRatio: AspectRatioSetting | string) {
  const normalized = normalizeAspectRatioSetting(aspectRatio);
  const aspectClass = resolveGalleryAspectClass(normalized);

  return {
    aspectClass,
    galleryMediaClass: "object-cover",
  };
}

/** @deprecated Use getAspectRatioClasses */
export function getPlayerAspectClasses(aspectRatio: AspectRatioSetting | string) {
  return getAspectRatioClasses(aspectRatio);
}
