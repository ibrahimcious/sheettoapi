import z from "zod"

export const ConnectSheetSchema = z.object({
  sheetUrl: z.string().min(1, "Sheet URL is required"),
  sheetName: z.string().min(1, "Sheet name is required"),
  tabName: z.string().optional(),

})

export const DeleteSheetSchema = z.object({
  id: z.string().min(1),
})
