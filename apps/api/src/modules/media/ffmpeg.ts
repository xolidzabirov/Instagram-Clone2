import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const TIMEOUT_MS = 10 * 60 * 1000;

/** Runs ffmpeg and resolves with its stderr (where ffmpeg writes its log) */
export function ffmpeg(args: string[], { allowFailure = false } = {}): Promise<string> {
  if (!ffmpegPath) return Promise.reject(new Error("ffmpeg binary is not available"));

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath as unknown as string, ["-hide_banner", ...args], { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      // Only the beginning matters (stream info); cap memory for long encodes
      if (stderr.length < 64_000) stderr += chunk.toString();
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), TIMEOUT_MS);
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 || allowFailure) resolve(stderr);
      else reject(new Error(`ffmpeg exited with ${code}: ${stderr.slice(-500)}`));
    });
  });
}

/** Duration and stream presence from `ffmpeg -i` output */
export async function probe(input: string) {
  // Without an output ffmpeg exits non-zero, but still prints the stream info
  const log = await ffmpeg(["-i", input], { allowFailure: true });
  const duration = log.match(/Duration: (\d+):(\d{2}):(\d{2}(?:\.\d+)?)/);
  const durationMs = duration
    ? Math.round((Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3])) * 1000)
    : null;
  return {
    durationMs,
    hasVideo: /Stream #.*: Video:/.test(log),
    hasAudio: /Stream #.*: Audio:/.test(log),
  };
}
