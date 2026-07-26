import { MAX_CLIENT_UPLOAD_BYTES } from "@/lib/resume/document-types";

const IMAGE_MAX_EDGE_PX = 2048;
const IMAGE_JPEG_QUALITY = 0.82;

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();

      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("无法读取图片，请换一张或粘贴文本"));
      element.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressImageFile(file: File): Promise<File> {
  const image = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    IMAGE_MAX_EDGE_PX / Math.max(image.width, image.height),
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("浏览器无法压缩图片，请粘贴文本或换更小图片");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("图片压缩失败，请换更小图片或粘贴文本"));
          return;
        }

        resolve(result);
      },
      "image/jpeg",
      IMAGE_JPEG_QUALITY,
    );
  });

  const compressed = new File(
    [blob],
    file.name.replace(/\.\w+$/, "") + ".jpg",
    { type: "image/jpeg", lastModified: Date.now() },
  );

  if (compressed.size > MAX_CLIENT_UPLOAD_BYTES) {
    throw new Error(
      `图片压缩后仍超过 ${formatFileSize(MAX_CLIENT_UPLOAD_BYTES)}，请换更小图片或粘贴文本`,
    );
  }

  return compressed;
}

/**
 * 上传前预处理：大图自动压缩，非图片超限则直接报错。
 */
export async function prepareUploadFile(file: File): Promise<File> {
  if (file.size <= MAX_CLIENT_UPLOAD_BYTES) {
    return file;
  }

  if (file.type.startsWith("image/")) {
    return compressImageFile(file);
  }

  throw new Error(
    `文件过大（${formatFileSize(file.size)}），请压缩到 ${formatFileSize(MAX_CLIENT_UPLOAD_BYTES)} 以内或粘贴文本`,
  );
}
