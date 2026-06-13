import { zodResolver } from "@hookform/resolvers/zod"
import type { FieldValues, Resolver } from "react-hook-form"
import type { ZodType } from "zod"

export function formResolver<T extends FieldValues>(
  schema: ZodType<T, FieldValues>
): Resolver<T> {
  return zodResolver(schema) as Resolver<T>
}
