"""Record audio until silence, convert to MP3, and transcribe with ElevenLabs STT."""

from pathlib import Path
import os
import sys
import time
from typing import Optional

import numpy as np
import sounddevice as sd
from dotenv import load_dotenv
from pydub import AudioSegment
from scipy.io.wavfile import write
from elevenlabs.client import ElevenLabs


DEFAULT_SAMPLE_RATE = 44_100
WAV_FILENAME = Path("recorded_audio.wav")
MP3_FILENAME = Path("recorded_audio.mp3")
DEFAULT_SILENCE_THRESHOLD = 0.01  # RMS level below which we consider silence
DEFAULT_MIN_SILENCE_SEC = 1.0
DEFAULT_MAX_RECORD_SEC = 30
DEFAULT_MIN_CAPTURE_SEC = 1.0


def get_input_channels() -> int:
    """Return preferred input channel count (2 if available)."""
    dev = sd.query_devices(kind="input")
    max_ch = dev.get("max_input_channels", 1) or 1
    channels = 2 if max_ch >= 2 else 1
    print(f"Input device: {dev['name']}")
    print(f"Max input channels: {max_ch}")
    print(f"Recording channels: {channels}")
    return channels


def record_wav_until_silence(
    sample_rate: int,
    channels: int,
    wav_path: Path,
    silence_threshold: float = DEFAULT_SILENCE_THRESHOLD,
    min_silence_sec: float = DEFAULT_MIN_SILENCE_SEC,
    max_record_sec: float = DEFAULT_MAX_RECORD_SEC,
    min_capture_sec: float = DEFAULT_MIN_CAPTURE_SEC,
    blocksize: int = 2048,
) -> None:
    """Record audio until trailing silence is detected, then write WAV."""

    print(
        "Recording... (stop after {:.1f}s of silence, max {:.0f}s)".format(
            min_silence_sec, max_record_sec
        )
    )

    frames = []
    start_time = last_voice_time = time.time()

    with sd.InputStream(
        samplerate=sample_rate,
        channels=channels,
        dtype="float32",
        blocksize=blocksize,
    ) as stream:
        while True:
            block, _ = stream.read(blocksize)
            frames.append(block.copy())

            rms = float(np.sqrt(np.mean(np.square(block))))
            if rms > silence_threshold:
                last_voice_time = time.time()

            elapsed = time.time() - start_time
            silence_elapsed = time.time() - last_voice_time

            if elapsed >= max_record_sec:
                print("Reached max recording duration; stopping.")
                break

            if elapsed >= min_capture_sec and silence_elapsed >= min_silence_sec:
                print(f"Detected {min_silence_sec:.1f}s of silence; stopping.")
                break

    recording = np.concatenate(frames, axis=0)
    audio_int16 = np.int16(np.clip(recording, -1.0, 1.0) * 32767)
    write(wav_path, sample_rate, audio_int16)
    print(f"Saved WAV to {wav_path}")


def convert_wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    """Convert a WAV file to MP3 and remove the WAV once done."""
    if not wav_path.exists():
        raise FileNotFoundError(f"Missing WAV file at {wav_path}")

    print(f"Converting {wav_path} -> {mp3_path}...")
    audio = AudioSegment.from_wav(wav_path)
    audio.export(mp3_path, format="mp3")
    wav_path.unlink(missing_ok=True)
    print(f"MP3 saved to {mp3_path}; removed {wav_path}")


def transcribe_mp3(mp3_path: Path, api_key: str) -> str:
    if not mp3_path.exists():
        raise FileNotFoundError(f"Missing MP3 file at {mp3_path}")

    client = ElevenLabs(api_key=api_key)
    with mp3_path.open("rb") as audio_file:
        result = client.speech_to_text.convert(
            file=audio_file,
            model_id="scribe_v2",
            tag_audio_events=True,
            language_code="eng",
            diarize=True,
        )
    return result.text


def load_api_key() -> str:
    load_dotenv()
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise EnvironmentError("ELEVENLABS_API_KEY not found in environment or .env file")
    return api_key


def main(sample_rate: int = DEFAULT_SAMPLE_RATE) -> int:
    try:
        channels = get_input_channels()
        record_wav_until_silence(
            sample_rate=sample_rate,
            channels=channels,
            wav_path=WAV_FILENAME,
        )
        convert_wav_to_mp3(WAV_FILENAME, MP3_FILENAME)

        api_key = load_api_key()
        transcript = transcribe_mp3(MP3_FILENAME, api_key)
        print("\nTranscription:\n" + transcript)
        return 0
    except Exception as exc:  # pragma: no cover - CLI guard
        print(f"Error: {exc}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
