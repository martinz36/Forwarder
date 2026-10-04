import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    "blob": { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      return { uploadedAt: new Date() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
