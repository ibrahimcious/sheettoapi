import z from "zod"

export const ConnectSheetSchema = z.object({
  sheetUrl: z.string().min(1, "Sheet URL is required"),
  sheetName: z.string().min(1, "Sheet name is required"),
  tabName: z.string().optional(),

})

export const DeleteSheetSchema = z.object({
  id: z.string().min(1),
})


{/* connectSheetSchema validates the user's input when connecting a sheet — must be a real Google Sheets URL, not just any string.
deleteSheetSchema validates the ID when deleting a connection.*/}
