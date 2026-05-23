import { useMutation } from '@tanstack/react-query'
import { routeComplaint, type RoutingResponse } from '@/api/classifier'

export function useClassifier() {
  const mutation = useMutation<RoutingResponse, Error, string>({
    mutationFn: routeComplaint,
  })

  return {
    result: mutation.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
    classify: mutation.mutate,
    reset: mutation.reset,
  }
}
