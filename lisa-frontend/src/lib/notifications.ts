import { enqueueSnackbar } from "notistack"

export function notifySuccess(message: string) {
  enqueueSnackbar(message, { variant: "success" })
}

export function notifyError(message: string) {
  enqueueSnackbar(message, { variant: "error" })
}
