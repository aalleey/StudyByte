import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
