import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { FileVideo, Upload } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "@radix-ui/react-select";
import { Textarea } from "./ui/textarea";
import { api } from "@/lib/axios";
import { convertVideoToAudio } from "@/lib/ffmpeg";

type Status = 'waiting' | 'fileSelected' | 'converting' | 'uploading' | 'transcribing' | 'success' 

const statusMessages = {
  waiting: 'Carregar vídeo',
  fileSelected: 'Carregar vídeo',
  converting: 'Convertendo em áudio ',
  uploading: 'Carregando...',
  transcribing: 'Transcrevendo...',
  success: 'Transcrição concluída'
}

interface VideoInputFormProps {
  onVideoUploaded: { 
    setVideoId: (videoId: string | null) => void
    setIsTranscribing: (isTranscribing: boolean) => void
  }
}

export function VideoInputForm (props: VideoInputFormProps){
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('waiting')
  const [progress, setProgress] = useState(0)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>){
    setStatus('waiting')

    props.onVideoUploaded.setVideoId(null)

    const { files } = event.currentTarget

    if(!files) return

    const selectedFile = files[0]

    if(selectedFile) setStatus('fileSelected')

    setVideoFile(selectedFile)
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    props.onVideoUploaded.setIsTranscribing(true)

    const prompt = promptInputRef.current?.value

    if(!videoFile) return

    setStatus('converting')
    const audioFile = await convertVideoToAudio({ video: videoFile, setProgress })

    const form = new FormData()

    form.append('file', audioFile)

    setStatus('uploading')
    const uploadResponse = await api.post('videos/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })

    const videoId = uploadResponse.data.video.id

    setStatus("transcribing")
    await api.post(`videos/${videoId}/transcription`, { 
      prompt 
    })

    setStatus('success')

    props.onVideoUploaded.setIsTranscribing(false)
    props.onVideoUploaded.setVideoId(videoId)
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
          disabled={ !['waiting', 'fileSelected'].includes(status)}
          ref={promptInputRef}
          id="transcription_prompt" 
          className='h-20 leading-relaxed resize-none' 
          placeholder='Inclua palavras chaves mencionadas no vídeo separadas por vírgula (,)'
          />
      </div>

      <TooltipProvider delayDuration={100} skipDelayDuration={500}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
                <Button disabled={ status !== 'fileSelected' } type="submit" className='w-full disabled:opacity-40 disabled:cursor-not-allowed mt-4'> 
                  { statusMessages[status] + (status === 'converting' ? + progress + '%' : '') }
                  { status === 'fileSelected' || status === 'waiting' ? <Upload className='w-4 h-4 ml-2'/> : null }
                </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent hidden={!['waiting', 'success'].includes(status)} className='bg-muted mb-4'>
            <p className='text-foreground'> 
              {
                status === 'success' 
                  ? 'Selecione outro vídeo ou realize a execução'
                  : status === 'waiting' 
                    ? 'Selecione um vídeo'
                    : ''
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </form>
  )
}