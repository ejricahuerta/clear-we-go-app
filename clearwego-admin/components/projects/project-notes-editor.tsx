"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Strikethrough, Link2, Heading2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notesHtmlToMarkdown, notesMarkdownToHtml } from "@/lib/projects/notes-serialization";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  projectId: string;
  initialMarkdown: string | null;
  onSaved?: (markdown: string | null) => void;
};

/** Keeps a final empty paragraph so the TipTap placeholder can show on the “next” line. */
function ensureTrailingEmptyParagraph(editor: Editor): void {
  const { doc } = editor.state;
  if (doc.childCount === 0) return;
  const last = doc.child(doc.childCount - 1);
  if (last.type.name === "paragraph" && last.content.size === 0) return;
  editor.commands.insertContentAt(doc.content.size, "<p></p>");
}

export function ProjectNotesEditor({ projectId, initialMarkdown, onSaved }: Props) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(initialMarkdown?.trim() ?? "");
  const initialHtml = notesMarkdownToHtml(initialMarkdown ?? "");

  const persist = useCallback(
    (markdown: string) => {
      const normalized = markdown.trim() === "" ? null : markdown;
      const payload = normalized;
      const sameAsLast =
        (payload ?? "") === (lastSavedRef.current.trim() === "" ? "" : lastSavedRef.current);
      if (sameAsLast) return;

      setSaveStatus("saving");
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: payload }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          lastSavedRef.current = payload ?? "";
          onSaved?.(payload);
          setSaveStatus("saved");
          window.setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch(() => {
          setSaveStatus("error");
          window.setTimeout(() => setSaveStatus("idle"), 4000);
        });
    },
    [projectId, onSaved]
  );

  const scheduleSave = useCallback(
    (editor: { getHTML: () => string }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const md = notesHtmlToMarkdown(editor.getHTML());
        persist(md);
      }, 900);
    },
    [persist]
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-primary underline underline-offset-2 font-medium" },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({
          placeholder: "Write project notes…",
        }),
      ],
      content: initialHtml,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm dark:prose-invert max-w-none min-h-[1.5em] focus:outline-none px-0 py-0",
            "prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed",
            "prose-a:text-primary prose-li:marker:text-muted-foreground",
            "[&_.ProseMirror]:outline-none"
          ),
        },
      },
      onUpdate: ({ editor: ed }) => {
        ensureTrailingEmptyParagraph(ed);
        scheduleSave(ed);
      },
    },
    [projectId]
  );

  useEffect(() => {
    if (!editor) return;
    queueMicrotask(() => ensureTrailingEmptyParagraph(editor));
  }, [editor]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    const onBlur = () => {
      const md = notesHtmlToMarkdown(editor.getHTML());
      persist(md);
    };
    editor.on("blur", onBlur);
    return () => {
      editor.off("blur", onBlur);
    };
  }, [editor, persist]);

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10 flex items-center gap-2">
        {saveStatus === "saving" && (
          <span className="text-xs text-muted-foreground tabular-nums">Saving…</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-muted-foreground tabular-nums">Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-xs text-destructive tabular-nums">Could not save</span>
        )}
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 120, placement: "top" }}
          className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-0.5 shadow-md"
        >
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="size-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="size-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            <Strikethrough className="size-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Heading"
          >
            <Heading2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <List className="size-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered list"
          >
            <ListOrdered className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const prev = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Link URL", prev ?? "https://");
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
            aria-label="Link"
          >
            <Link2 className="size-4" />
          </Button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="tiptap-root text-[15px] leading-relaxed text-foreground" />
    </div>
  );
}
