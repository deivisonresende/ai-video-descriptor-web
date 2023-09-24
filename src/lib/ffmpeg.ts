import { FFmpeg } from '@ffmpeg/ffmpeg'
import coreURL from '../ffmpeg/ffmpeg-core.js?url'
import { fetchFile } from '@ffmpeg/util'
import wasmURL from '../ffmpeg/ffmpeg-core.wasm?url'
import workerURL from '../ffmpeg/ffmpeg-worker.js?url'

let ffmpeg: FFmpeg | null

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg

  ffmpeg = new FFmpeg()

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL
    })
  }

  return ffmpeg
}

interface ConvertVideoToAudioProps {
  video: File
  setProgress: (progress: number) => void
}

export async function convertVideoToAudio({ video, setProgress }: ConvertVideoToAudioProps) {
  const ffmpeg = await loadFFmpeg()

  await ffmpeg.writeFile('input.mp4', await fetchFile(video))

  ffmpeg.on('progress', event => {
    setProgress(Math.round(event.progress * 100))
  })

  await ffmpeg.exec([
    '-i',
    'input.mp4',
    '-map',
    '0:a',
    '-b:a',
    '20k',
    '-acodec',
    'libmp3lame',
    'output.mp3'
  ])

  const data = await ffmpeg.readFile('output.mp3')

  const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
  const audioFile = new File([audioFileBlob], 'audio.mp3', { type: 'audio/mpeg' })

  return audioFile
}
