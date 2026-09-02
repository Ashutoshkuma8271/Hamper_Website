-- Admin-managed offer fields for storefront offers and sale pricing.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_price integer;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_original_price_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_original_price_check
  CHECK (original_price IS NULL OR original_price > price);

CREATE INDEX IF NOT EXISTS products_offers_idx
  ON public.products (is_offer, created_at DESC)
  WHERE is_offer = true;
