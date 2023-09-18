import { api } from "@/lib/axios";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface IPrompt {
  id: string
  title: string
  template: string
}

interface IPromptSelect {
  onPromptSelected: (template: string) => void
}

export function PromptSelect(props: IPromptSelect) {
  const [prompts, setPrompts] = useState<IPrompt[]>([])

  useEffect(() => {
    api.get<IPrompt[]>('prompts').then(response => setPrompts(response.data))
  }, [])

  function handlePromptSelected (promptId: string) {
    const selectedPrompt = prompts.find(prompt => prompt.id === promptId)

    if (!selectedPrompt) return

    return props.onPromptSelected(selectedPrompt.template)
  }

  return (
    <Select onValueChange={handlePromptSelected}>
    <SelectTrigger>
      <SelectValue placeholder="Selecione um prompt..."/>
    </SelectTrigger>
    <SelectContent>
      { prompts.map(prompt => <SelectItem key={prompt.id} value={prompt.id}> {prompt.title} </SelectItem>) }
    </SelectContent>
  </Select>
  )
}