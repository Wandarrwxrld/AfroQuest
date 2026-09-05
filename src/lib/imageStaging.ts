import { supabase } from './supabase'
import type { ProductImage } from '../types/database'

const BUCKET = 'product-images'
/** Staged uploads live under this prefix until an admin assigns them to a
 *  real product. Nothing here implies a product name or SKU - filenames
 *  are treated as opaque, per how the source photos were actually organized. */
const STAGING_PREFIX = 'staging'

export function resolveImageUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return '/placeholder-product.svg'
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export interface StagedImage {
  storagePath: string
  url: string
  originalFolder: string
  originalFilename: string
  uploadedAt: string | null
}

/** Uploads a raw image file with no product association. originalFolder is
 *  kept purely as a human hint in the admin UI (e.g. "footwear/boots and
 *  safety boots") since your source zip's folder names are meaningful even
 *  when individual filenames aren't. */
export async function uploadStagedImage(file: File, originalFolder: string): Promise<StagedImage> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${STAGING_PREFIX}/${crypto.randomUUID()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  return {
    storagePath,
    url: resolveImageUrl(storagePath),
    originalFolder,
    originalFilename: file.name,
    uploadedAt: new Date().toISOString(),
  }
}

/** Lists everything still sitting in staging, i.e. not yet assigned to a
 *  product. Admin browses these visually and picks which belong where. */
export async function listStagedImages(): Promise<StagedImage[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(STAGING_PREFIX, {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw error

  return (data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => ({
      storagePath: `${STAGING_PREFIX}/${f.name}`,
      url: resolveImageUrl(`${STAGING_PREFIX}/${f.name}`),
      originalFolder: '(uploaded via admin)',
      originalFilename: f.name,
      uploadedAt: f.created_at ?? null,
    }))
}

/** Moves a staged image into a real product's image set: creates the
 *  product_images row and relocates the Storage object out of staging so
 *  it stops showing up as "unassigned". This is the actual moment a photo
 *  becomes "this is a picture of that product" - a human decision, not a
 *  filename match. */
export async function assignImageToProduct(
  staged: StagedImage,
  productId: string,
  displayOrder: number
): Promise<ProductImage> {
  const finalPath = `products/${productId}/${staged.storagePath.split('/').pop()}`

  const { error: moveError } = await supabase.storage.from(BUCKET).move(staged.storagePath, finalPath)
  if (moveError) throw moveError

  // See KNOWN ISSUE note in adminProducts.ts createProduct - same unresolved type collapse.
  const { data, error: dbError } = await (supabase as any)
    .from('product_images')
    .insert({ product_id: productId, storage_path: finalPath, display_order: displayOrder })
    .select()
    .single()

  if (dbError) throw dbError
  return data
}

export async function discardStagedImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}
