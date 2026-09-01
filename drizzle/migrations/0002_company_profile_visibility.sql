CREATE POLICY "Companies view candidate profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.test_attempts ta
    JOIN public.tests t ON t.id = ta.test_id
    JOIN public.companies c ON c.id = t.company_id
    WHERE ta.student_id = profiles.id AND c.owner_user_id = auth.uid()
  ));
