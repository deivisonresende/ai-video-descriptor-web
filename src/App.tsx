import { Github, Wand2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMemo, useState } from 'react';

import { Button } from "./components/ui/button";
import { Label } from './components/ui/label';
import { PromptSelect } from './components/prompt-select';
import { Separator } from "./components/ui/separator";
import { Slider } from './components/ui/slider';
import { Textarea } from "./components/ui/textarea";
import { VideoInputForm } from './components/video-input-form';
import { useCompletion } from 'ai/react';

export function App() {
  const [temperature, setTemperature] = useState(0.5)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    completion,
    isLoading
  } = useCompletion({
    api: `http://localhost:3333/v1/videos/transcription/completion`,
    body: {
      videoId,
      temperature
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 py-3 flex items-center justify-between border-b">
        <div>
          <h1 className="text-xl font-bold">ai.video</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Desenvolvido com 💚 no NLW AI Rocketseat
          </span>
          
          <Separator orientation="vertical" className="h-6"/>

          <Button variant="outline">
            <Github className="w-4 h-4 mr-2"/>
            Sign in
          </Button>
        </div>
      </div>
      
      <main className="flex flex-1 p-6 gap-6">
        <div className="flex flex-col flex-1 gap-4">
          <div className="grid grid-rows-2 gap-4 flex-1">
            <Textarea 
              className="resize-none p-4 leading-relaxed"
              placeholder="Inclua o prompt para a IA..."
              value={input}
              onChange={handleInputChange}
            />
            <Textarea 
              className="resize-none p-4 leading-relaxed"
              placeholder="Resultado gerado pela IA..."
              readOnly={true}
              value={completion}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Lembre-se: Você pode usar a variável <code className="text-primary">{'{transcription}'}</code> no seu prompt para adicionar o conteúdo da transcrição do vídeo selecionado
          </p>
        </div>

        <aside className="w-80 space-y-6">
            <VideoInputForm onVideoUploaded={{ setVideoId, setIsTranscribing }}/>

            <Separator />

            <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
                <Label>
                  Prompt
                </Label>
               
                <PromptSelect disabled={!videoId} onPromptSelected={setInput}/>
              </div>

              <div className='space-y-2'>
                <Label>
                  Modelo
                </Label>
                <Select defaultValue='GPT3.5' disabled={true}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='GPT3.5'>GPT 3.5-turbo</SelectItem>
                  </SelectContent>
                </Select>
                <span className='block text-xs text-muted-foreground italic'>Você poderá customizar essa opção em breve</span>
              </div>

              <div className='space-y-4'>
                <Label>
                  Temperatura
                </Label>
                <Slider
                  disabled={!videoId}
                  style={!videoId ? { opacity: 0.4 } : {}}
                  defaultValue={[0.5]}
                  value={[temperature]}
                  onValueChange={ value => setTemperature(value[0] )}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <span className='block text-xs text-muted-foreground italic leading-relaxed'>Valores mais altos tendem a deixar o resultado mais criativo, porém mais suscetível a erros.</span>
              </div>

              <Separator />

              <TooltipProvider delayDuration={100} skipDelayDuration={500}>
                <Tooltip>
                  <TooltipTrigger asChild>
                   <span tabIndex={0}>
                    <Button type='submit' className='w-full disabled:opacity-40' disabled={isLoading || !videoId}> 
                        Executar
                        <Wand2  className="w-4 h-4 ml-2"/>
                      </Button>
                   </span>
                  </TooltipTrigger>
                  <TooltipContent hidden={!!videoId || isLoading} className='bg-muted mb-4'>
                    <p className='text-foreground'> {
                      isTranscribing 
                        ? 'Aguarde a transcrição para executar'
                        : !isLoading 
                          ? 'Carregue um vídeo para executar'
                          : ''
                      }
                      </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </form>
        </aside>
      </main>
    </div>
  )
}
