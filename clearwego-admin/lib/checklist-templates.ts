/**
 * Service-specific checklist item text. Auto-created per project on creation.
 * Source: docs/06-projects-module.md
 */
export const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  estate_cleanout: [
    "Authorization document verified",
    "Pre-approved items list reviewed",
    "Walk through all rooms with client list",
    "Before photos - every room",
    "Items sorted: keep, donate, dispose",
    "Flagged items confirmed with client",
    "Bin loaded",
    "Donation items set aside",
    "After photos - every room",
    "Property swept and clean",
    "All doors and windows locked",
    "Keys returned or secured",
    "Mark as cleared",
  ],
  presale_clearout: [
    "Before photos - every room",
    "Items removed per client instructions",
    "Staging items left in place",
    "Bin loaded",
    "After photos - every room",
    "Property photo-ready confirmed",
    "All doors and windows locked",
    "Keys returned or secured",
    "Mark as cleared",
  ],
  tenant_moveout: [
    "Before photos - every room",
    "Document all items left by tenant",
    "Note any property damage with photos",
    "Items removed and disposed",
    "Bin loaded",
    "After photos - every room",
    "Written inventory completed",
    "All doors and windows locked",
    "Keys returned to property manager",
    "Mark as cleared",
  ],
  downsizing: [
    "Sensitive items identified and set aside",
    "Before photos - every room",
    "Items sorted: move, donate, dispose",
    "Moving items packed and labelled",
    "Flagged items confirmed with family",
    "Bin loaded",
    "Donation items set aside",
    "After photos - every room",
    "Moving items dispatched to new location",
    "Property swept and clean",
    "All doors and windows locked",
    "Mark as cleared",
  ],
};

export type ServiceType = keyof typeof CHECKLIST_TEMPLATES;
