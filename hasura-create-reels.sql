-- Run this in HASURA Console (Data tab > SQL)
-- This will create the table directly in Hasura

CREATE TABLE public.reels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    video_url text NOT NULL,
    caption text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.reels
    ADD CONSTRAINT reels_pkey PRIMARY KEY (id);

-- Track the table automatically
SELECT * FROM hdb_catalog.hdb_table WHERE table_name = 'reels';