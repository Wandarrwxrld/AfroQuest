export interface RoomSubcategory {
  name: string
  /** Real slug on /shop/:slug, confirmed against the live categories
   *  table on 2026-09-24. */
  slug: string
}

export interface RoomHotspot {
  /** Zone label shown on the marker's hover tooltip. */
  name: string
  /** Position as a percentage of the image, so hotspots stay aligned
   *  at any display width. This is the center point the dot sits on. */
  xPct: number
  yPct: number
  subcategories: RoomSubcategory[]
}

/** This room image is AI-generated/rendered, not real product photography,
 *  so hotspots point at categories rather than specific SKUs - a rendered
 *  jacket shouldn't be presented as if it's one exact real product a
 *  customer will receive. Clicking a zone opens a picker of that zone's
 *  real subcategories rather than jumping straight to a single page.
 *
 *  Slugs below are real, confirmed against the live Supabase categories
 *  table. Two known gaps, both because the category genuinely doesn't
 *  exist yet in the catalog (not a missing-slug placeholder issue):
 *  - "Hi-Vis Vests" isn't a category, so that slot points at the parent
 *    "workwear-hivz" (All Hi-Vis Workwear) instead.
 *  - "Overalls"/"Coveralls" aren't categories - the closest real match
 *    is "Worksuits", so that zone only has one real option for now. */
export const ROOM_HOTSPOTS: RoomHotspot[] = [
  {
    name: 'Hi-Vis Workwear',
    xPct: 52.5,
    yPct: 24.48,
    subcategories: [
      { name: 'Shirts', slug: 'workwear-hivz-shirts' },
      { name: 'Pants', slug: 'workwear-hivz-pants' },
      { name: 'All Hi-Vis Workwear', slug: 'workwear-hivz' },
    ],
  },
  {
    name: 'Boots & Trainers',
    xPct: 73.44,
    yPct: 41.37,
    subcategories: [
      { name: 'Boots & Safety Boots', slug: 'footwear-boots-safety-boots' },
      { name: 'Outdoors & Hiking', slug: 'footwear-outdoors-hiking' },
      { name: 'Work Sneakers & Industrial Trainers', slug: 'footwear-work-sneakers-industrial-trainers' },
    ],
  },
  {
    name: 'Overalls',
    xPct: 92.81,
    yPct: 42.22,
    subcategories: [
      { name: 'Worksuits', slug: 'workwear-worksuits' },
    ],
  },
  {
    name: 'Jackets',
    xPct: 40.0,
    yPct: 65.86,
    subcategories: [
      { name: 'Winter Jackets', slug: 'workwear-winter-jackets' },
      { name: 'Zip Up Jackets', slug: 'workwear-hivz-zip-up-jackets' },
      { name: 'Short Sleeve Jackets', slug: 'workwear-hivz-short-sleeve-jackets' },
    ],
  },
]
