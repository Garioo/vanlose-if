"use client";
"use no memo";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarBtn({
  onClick,
  active,
  label,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${
        active ? "bg-black text-white" : "text-gray-600 hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-4 bg-gray-300 self-center mx-0.5" />;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border border-gray-300 border-b-0 bg-gray-50">
        <ToolbarBtn
          label="Fed"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        />
        <ToolbarBtn
          label="Kursiv"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        />
        <Sep />
        <ToolbarBtn
          label="H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        />
        <ToolbarBtn
          label="H3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        />
        <Sep />
        <ToolbarBtn
          label="Liste"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        />
        <ToolbarBtn
          label="1. Liste"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        />
        <Sep />
        <ToolbarBtn
          label="Citat"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        />
        <ToolbarBtn
          label="—"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
        />
        <ToolbarBtn
          label="Kode"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
        />
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose-vif border border-gray-300 min-h-80 px-4 py-3 text-sm focus-within:border-black transition-colors [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-75 [&_.ProseMirror]:cursor-text"
      />
    </div>
  );
}
