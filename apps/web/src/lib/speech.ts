export const createMediaRecorder = async () => {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not supported in this browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
  });
  return { recorder, stream };
};
