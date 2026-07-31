CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  weight_kg NUMERIC NOT NULL,
  producer_id INTEGER REFERENCES producers (id),
  site_id INTEGER REFERENCES sequestration_sites (id),
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT transactions_direction_link_chk CHECK (
    (direction = 'in' AND producer_id IS NOT NULL AND site_id IS NULL) OR
    (direction = 'out' AND site_id IS NOT NULL AND producer_id IS NULL)
  )
);
