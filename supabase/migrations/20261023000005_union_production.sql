-- What a job's union fields mean: what the person tells us about the
-- production, not something CineArch checks. A day on a union production counts
-- toward that union whether or not the person is a member.
comment on column public.jobs.is_union is
  'The person says the production was under a union agreement (self-reported, not verified). Counts toward that union for members and non-members alike.';
comment on column public.jobs.union_type_id is
  'Which union the production was under, as the person told us (unions.id). Null for a non-union production.';
