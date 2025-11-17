"use client";
import { UploadButton, UploadDropzone } from "@/utils/uploadthing";

export default function Home() {
  return (
    <div>
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          // Do something with the response
          console.log("Files: ", res);
          alert("Upload Completed");
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          alert(`ERROR! ${error.message}`);
        }}
      />

      <UploadDropzone
        endpoint="imageUploader"
        uploadProgressGranularity="fine"
      />
    </div>
  );
}
