import type { SupabaseClient } from "@supabase/supabase-js";
import { CHECKLIST_TEMPLATES } from "@/lib/checklist-templates";

export const PROJECT_SERVICE_TYPES = ["estate_cleanout", "presale_clearout", "tenant_moveout", "downsizing"] as const;
const SERVICE_TYPES = PROJECT_SERVICE_TYPES;

export type CreateProjectInput = {
  client_id: string;
  service_type: (typeof SERVICE_TYPES)[number];
  property_address: string;
  neighbourhood?: string | null;
  property_size?: string | null;
  stage?: string;
  quote_amount?: number | null;
};

export type TimelineActor = {
  id: string | null;
  name: string;
  role: string;
};

/**
 * Inserts a project row, timeline `project_created`, and checklist from template.
 * Caller must enforce auth / business rules.
 */
export async function insertProjectWithChecklist(
  supabase: SupabaseClient,
  input: CreateProjectInput,
  actor: TimelineActor
): Promise<{ projectId: string } | { error: string }> {
  const {
    client_id,
    service_type,
    property_address,
    neighbourhood,
    property_size,
    stage = "todo",
    quote_amount,
  } = input;

  const insert: Record<string, unknown> = {
    client_id,
    service_type,
    property_address,
    neighbourhood: neighbourhood?.trim() || null,
    property_size: property_size || null,
    stage,
  };
  if (quote_amount !== undefined) {
    insert.quote_amount = quote_amount;
  }

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert(insert)
    .select("id")
    .single();

  if (insertError || !project) {
    return { error: insertError?.message ?? "Failed to create project" };
  }

  const projectId = project.id as string;

  const { error: timelineError } = await supabase.from("timeline_events").insert({
    client_id,
    project_id: projectId,
    event_type: "project_created",
    event_category: "project",
    event_description: `Project created by ${actor.name}: ${service_type.replace(/_/g, " ")} at ${property_address}`,
    created_by_id: actor.id,
    created_by_name: actor.name,
    created_by_role: actor.role,
  });
  if (timelineError) {
    return { error: timelineError.message };
  }

  const template = CHECKLIST_TEMPLATES[service_type];
  if (template?.length) {
    const checklistRows = template.map((item_text, i) => ({
      project_id: projectId,
      service_type,
      item_text,
      sort_order: i + 1,
    }));
    const { error: checklistError } = await supabase.from("checklist_items").insert(checklistRows);
    if (checklistError) {
      return { error: checklistError.message };
    }
  }

  return { projectId };
}

export function isServiceType(s: string): s is (typeof SERVICE_TYPES)[number] {
  return (SERVICE_TYPES as readonly string[]).includes(s);
}
