import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert className="border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <AlertTitle>Não foi possível carregar</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
          {onRetry ? (
            <Button className="mt-3" type="button" variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      </div>
    </Alert>
  )
}
