-- Create Admin User for AlterNatives
-- Password: admin123 (hashed with bcrypt, cost 10)
-- This hash corresponds to: admin123

INSERT INTO admin_users (email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  'admin@alternatives.nativeworld.com',
  '$2b$10$D3VMDO5xHPg7n75qilsoFOY.KbBKK21hiZ61AjCkmdmbETjZzJARS',
  'Admin User',
  'super_admin',
  true,
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT id, email, name, role, isActive FROM admin_users WHERE email = 'admin@alternatives.nativeworld.com';
