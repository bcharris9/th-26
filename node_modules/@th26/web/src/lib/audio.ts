export const playStreamingAudio = (url: string) => {
  const audio = new Audio(url);
  audio.preload = "auto";
  const play = async () => {
    await audio.play();
  };
  const stop = () => {
    audio.pause();
    audio.currentTime = 0;
  };
  return { audio, play, stop };
};
