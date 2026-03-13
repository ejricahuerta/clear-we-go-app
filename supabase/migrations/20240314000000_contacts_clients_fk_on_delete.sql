-- Set ON DELETE behavior for clients ↔ contacts circular FK so deletes don't block.
-- - When a contact is deleted: clients.contact_id → SET NULL (client kept, link removed).
-- - When a client is deleted: contacts.client_id → SET NULL (contact kept, link removed).

-- 1) clients.contact_id → contacts(id): ON DELETE SET NULL
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_contact_id_fkey;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

-- 2) contacts.client_id → clients(id): ON DELETE SET NULL
ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS fk_contacts_client;

ALTER TABLE public.contacts
  ADD CONSTRAINT fk_contacts_client
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
