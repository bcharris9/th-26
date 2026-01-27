from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.play import play
import os

load_dotenv()

elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

audio_stream = elevenlabs.text_to_speech.convert(
    text="The first move is what sets everything in motion.",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2",
    output_format="mp3_44100_128",
)

chunks = []
for chunk in audio_stream:
    chunks.append(chunk)

audio_bytes = b"".join(chunks)

# ✅ Save locally
output_folder = "audio_outputs"
os.makedirs(output_folder, exist_ok=True)

file_path = os.path.join(output_folder, "tts_output.mp3")

with open(file_path, "wb") as f:
    f.write(audio_bytes)

print("Saved MP3 to:", file_path)

# ✅ Play audio
play(audio_bytes)