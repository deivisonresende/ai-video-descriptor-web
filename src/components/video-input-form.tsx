import { Separator } from "@radix-ui/react-select";
import { FileVideo, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status = 'waiting' | 'converting' | 'uploading' | 'transcribing' | 'success'

const statusMessages = {
  waiting: 'Carregar vídeo',
  converting: 'Convertendo em áudio...',
  uploading: 'Carregando...',
  transcribing: 'Transcrevendo...',
  success: 'Concluído'
}

export function VideoInputForm (){
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('waiting')
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>){
    setStatus('waiting')

    const { files } = event.currentTarget

    if(!files) return

    const selectedFile = files[0]
    setVideoFile(selectedFile)
  }

  async function convertVideoToAudio(video: File){
    const ffmpeg = await loadFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    ffmpeg.on('progress', progress => {
      console.log('progress: ', Math.round(progress.progress * 100))
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

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value

    if(!videoFile) return

    setStatus('converting')
    const audioFile = await convertVideoToAudio(videoFile)

    const form = new FormData()

    form.append('file', audioFile)

    setStatus('uploading')
    const uploadResponse = await api.post('videos/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })

    const videoId = uploadResponse.data.video.id

    setStatus("transcribing")
    const transcriptionResponse = await api.post(`videos/${videoId}/transcription`, { prompt })

    const transcription = transcriptionResponse.data.transcript

    setStatus('success')
  }

  const previewURL = useMemo(() => {
    if (!videoFile) return undefined
  
    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label 
        htmlFor="video"
        className="border relative flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/10"
      >
       { 
       videoFile ? (
        <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0 aspect-video"/>
       ) : (
        <>
         <FileVideo className='w-4 h-4'/>
          Selecione um vídeo
        </>
       )}

      </label>
      <input 
        type="file" 
        name="video" 
        id="video" 
        accept="video/mp4" 
        className="sr-only"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className='space-y-2'>
        <Label htmlFor='transcription_prompt'>Prompt de transcrição</Label>
        <Textarea
          disabled={ status !== 'waiting' }
          ref={promptInputRef}
          id="transcription_prompt" 
          className='h-20 leading-relaxed resize-none' 
          placeholder='Inclua palavras chaves mencionadas no vídeo separadas por vírgula (,)'
          />
      </div>

      <Button disabled={ status !== 'waiting' } type="submit" className='w-full'> 
        { statusMessages[status] }
        { status === 'waiting' ? <Upload className='w-4 h-4 ml-2'/> : null }
      </Button>
    </form>
  )
}