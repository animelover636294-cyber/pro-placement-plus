-- Link a company record to an owning auth user
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner_user_id UUID;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Registration window on tests
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMPTZ;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ;

-- Company invites
CREATE TABLE IF NOT EXISTS public.company_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invites TO authenticated;
GRANT ALL ON public.company_invites TO service_role;
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage company invites" ON public.company_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Test registrations (student opts in during the registration window)
CREATE TABLE IF NOT EXISTS public.test_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, student_id)
);

GRANT SELECT, INSERT, DELETE ON public.test_registrations TO authenticated;
GRANT ALL ON public.test_registrations TO service_role;
ALTER TABLE public.test_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own registrations" ON public.test_registrations
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'company'));

CREATE POLICY "Students register themselves" ON public.test_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_id
        AND (t.registration_opens_at IS NULL OR t.registration_opens_at <= now())
        AND (t.registration_closes_at IS NULL OR t.registration_closes_at >= now())
    )
  );

CREATE POLICY "Students cancel own registration" ON public.test_registrations
  FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- Company access policies
CREATE POLICY "Companies update own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Companies insert own tests" ON public.tests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'company')
    AND EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_user_id = auth.uid())
  );

CREATE POLICY "Companies update own tests" ON public.tests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = tests.company_id AND c.owner_user_id = auth.uid()));

CREATE POLICY "Companies delete own tests" ON public.tests
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = tests.company_id AND c.owner_user_id = auth.uid()));

CREATE POLICY "Companies view attempts on own tests" ON public.test_attempts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tests t
    JOIN public.companies c ON c.id = t.company_id
    WHERE t.id = test_attempts.test_id AND c.owner_user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_test_registrations_test ON public.test_registrations(test_id);
