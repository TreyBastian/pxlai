import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Crop, 
  Move, 
  Type, 
  Paintbrush, 
  Eraser, 
  // Import more icons as needed
} from "lucide-react"

const tools = [
  { icon: <Move size={20} />, name: "Move Tool" },
  { icon: <Crop size={20} />, name: "Crop Tool" },
  { icon: <Type size={20} />, name: "Type Tool" },
  { icon: <Paintbrush size={20} />, name: "Brush Tool" },
  { icon: <Eraser size={20} />, name: "Eraser Tool" },
  // Add more tools as needed
]

export function ToolWidget() {
  return (
    <ScrollArea className="h-full w-full bg-secondary">
      <div className="flex flex-col items-center p-2 space-y-2">
        <TooltipProvider>
          {tools.map((tool, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10">
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </ScrollArea>
  )
}