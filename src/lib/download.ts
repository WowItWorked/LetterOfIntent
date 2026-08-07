/** Client-side file download via an object URL. Nothing leaves the device. */
export function triggerDownload(filename: string, content: Blob | string, mime?: string) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime ?? "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a beat to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
