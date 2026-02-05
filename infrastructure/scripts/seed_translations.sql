-- translations table + sample header translations
CREATE TABLE IF NOT EXISTS translations (
  translation_key TEXT NOT NULL,
  lang_code TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (translation_key, lang_code)
);

INSERT INTO translations(translation_key, lang_code, value) VALUES
  ('header.sign_in','en','Sign In'),
  ('header.register','en','Register'),
  ('header.notifications','en','Notifications'),
  ('header.view_all','en','View all'),
  ('header.language_currency','en','Language & Currency'),
  ('header.sign_in','ar','تسجيل الدخول'),
  ('header.register','ar','تسجيل'),
  ('header.notifications','ar','الإشعارات'),
  ('header.view_all','ar','عرض الكل'),
  ('header.language_currency','ar','اللغة والعملة'),
  ('header.sign_in','fr','Se connecter'),
  ('header.register','fr','S''inscrire'),
  ('header.notifications','fr','Notifications'),
  ('header.view_all','fr','Voir tout'),
  ('header.language_currency','fr','Langue et devise')
ON CONFLICT (translation_key, lang_code) DO UPDATE
  SET value = EXCLUDED.value, is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP;

-- Verify
SELECT translation_key AS key, lang_code, value FROM translations WHERE translation_key LIKE 'header.%' ORDER BY translation_key, lang_code;