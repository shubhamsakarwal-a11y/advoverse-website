-- Plans table with features
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  monthly_price INTEGER NOT NULL DEFAULT 0,
  quarterly_price INTEGER NOT NULL DEFAULT 0,
  yearly_price INTEGER NOT NULL DEFAULT 0,
  max_cases INTEGER DEFAULT 20,
  max_users INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

-- Seed existing plans
INSERT INTO plans (name, description, monthly_price, quarterly_price, yearly_price, max_cases, max_users, features, is_popular, display_order) VALUES
('Junior Advocate', '20 Cases\nIdeal for beginners', 100, 270, 960, 20, 1, '["forms_drafting","compendium","study_material","appointments","todo_lists"]', false, 1),
('Solo Advocate', '60 Cases\nIndependent practice setup', 200, 540, 1920, 60, 1, '["forms_drafting","compendium","study_material","appointments","todo_lists","import_export"]', false, 2),
('Advocate + Clerk', '1 Additional User\n120 Cases\nClerk coordination workflow', 300, 810, 2880, 120, 2, '["forms_drafting","compendium","study_material","appointments","todo_lists","import_export","multi_user"]', true, 3),
('Chamber Lite', '3 Users\n200 Cases\nSmall chamber management', 800, 2160, 7680, 200, 3, '["forms_drafting","compendium","study_material","appointments","todo_lists","import_export","multi_user","detach_widgets"]', false, 4),
('Chamber', '6 Users\n500 Cases\nProfessional chamber workflow', 1500, 4050, 14400, 500, 6, '["forms_drafting","compendium","study_material","appointments","todo_lists","import_export","multi_user","detach_widgets","chatroom"]', false, 5),
('Chamber Pro', '9 Users\nUnlimited Cases\nAdvanced litigation management', 3000, 8100, 28800, 999999, 9, '["forms_drafting","compendium","study_material","appointments","todo_lists","import_export","multi_user","detach_widgets","chatroom"]', false, 6),
('Exclusive', 'Unlimited Users\nUnlimited Cases\nEnterprise legal operations', 5000, 13500, 48000, 999999, 999999, '["forms_drafting","compendium","study_material","appointments","todo_lists","import_export","multi_user","detach_widgets","chatroom"]', false, 7);