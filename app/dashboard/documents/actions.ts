'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteDocument(documentId: string, storagePath: string) {
  const supabase = await createClient()

  await supabase.storage.from('documents').remove([storagePath])

  const { error } = await supabase.from('documents').delete().eq('id', documentId)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/documents')
}
