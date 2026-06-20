import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import { Toggle } from '@/components/ui/toggle'
import { Extension } from '@tiptap/core'
import { TextAlign } from '@tiptap/extension-text-align'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Undo,
    Redo,
    Code,
    Quote,
    Minus,
    Eraser,
    Pilcrow,
    Baseline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from 'lucide-react'

// Define custom LineHeight extension
const LineHeight = Extension.create({
    name: 'lineHeight',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultHeight: 'normal',
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: this.options.defaultHeight,
                        parseHTML: element => element.style.lineHeight || this.options.defaultHeight,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight || attributes.lineHeight === this.options.defaultHeight) {
                                return {}
                            }

                            return {
                                style: `line-height: ${attributes.lineHeight}`,
                            }
                        },
                    },
                },
            },
        ]
    },

    addCommands() {
        return {
            setLineHeight:
                (lineHeight: string) =>
                ({ commands }) => {
                    return this.options.types.every(type =>
                        commands.updateAttributes(type, { lineHeight })
                    )
                },

            unsetLineHeight:
                () =>
                ({ commands }) => {
                    return this.options.types.every(type =>
                        commands.updateAttributes(type, { lineHeight: null })
                    )
                },
        }
    },
})

// Define custom FontSize extension
const FontSize = Extension.create({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {}
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            }
                        },
                    },
                },
            },
        ]
    },

    addCommands() {
        return {
            setFontSize:
                (fontSize: string) =>
                ({ chain }) => {
                    return chain().setMark('textStyle', { fontSize }).run()
                },
            unsetFontSize:
                () =>
                ({ chain }) => {
                    return chain()
                        .setMark('textStyle', { fontSize: null })
                        .removeEmptyTextStyle()
                        .run()
                },
        }
    },
})

// Satisfy TypeScript compiler for custom commands
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        lineHeight: {
            setLineHeight: (lineHeight: string) => ReturnType
            unsetLineHeight: () => ReturnType
        }
        fontSize: {
            setFontSize: (fontSize: string) => ReturnType
            unsetFontSize: () => ReturnType
        }
    }
}

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4],
                },
            }),
            TextStyle,
            Color.configure({
                types: ['textStyle'],
            }),
            Underline,
            LineHeight,
            FontSize,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'min-h-[220px] w-full px-4 py-3 text-sm focus:outline-none prose dark:prose-invert max-w-none bg-transparent [&_p]:my-1 [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:mt-2 [&_h3]:mb-1 [&_ol]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    // Sync external value changes to Tiptap content, e.g. on load
    useEffect(() => {
        if (!editor) {
            return
        }

        // Avoid updating and resetting cursor if the user is currently typing
        if (editor.isFocused) {
            return
        }

        if (value !== editor.getHTML()) {
            editor.commands.setContent(value || '<p></p>')
        }
    }, [value, editor])

    if (!editor) {
        return null
    }

    const currentLineHeight = editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || 'normal';
    const currentFontSize = editor.getAttributes('textStyle').fontSize || 'normal';

    return (
        <div className="border border-input rounded-xl overflow-hidden bg-white dark:bg-[#1a1c20] focus-within:ring-2 focus-within:ring-[#c90000]/50 focus-within:border-[#c90000]/60 dark:focus-within:ring-[#c90000]/50 transition-all shadow-sm">
            <div className="border-b bg-muted/30 p-1.5 flex flex-wrap gap-1 items-center">
                {/* Text Styles */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Toggle bold"
                    className="h-8 w-8 rounded-lg"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Toggle italic"
                    className="h-8 w-8 rounded-lg"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('underline')}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                    aria-label="Toggle underline"
                    className="h-8 w-8 rounded-lg"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('strike')}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                    aria-label="Toggle strikethrough"
                    className="h-8 w-8 rounded-lg"
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('code')}
                    onPressedChange={() => editor.chain().focus().toggleCode().run()}
                    aria-label="Toggle code"
                    className="h-8 w-8 rounded-lg"
                >
                    <Code className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Alignment */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'left' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                    aria-label="Align left"
                    className="h-8 w-8 rounded-lg"
                    title="Alinear a la izquierda"
                >
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'center' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                    aria-label="Align center"
                    className="h-8 w-8 rounded-lg"
                    title="Centrar"
                >
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'right' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                    aria-label="Align right"
                    className="h-8 w-8 rounded-lg"
                    title="Alinear a la derecha"
                >
                    <AlignRight className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive({ textAlign: 'justify' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
                    aria-label="Align justify"
                    className="h-8 w-8 rounded-lg"
                    title="Justificar"
                >
                    <AlignJustify className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Color Picker */}
                <div className="relative flex items-center h-8 w-8 justify-center rounded-lg hover:bg-muted cursor-pointer transition-colors animate-in fade-in" title="Color de texto">
                    <input
                        type="color"
                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                            editor.chain().focus().setColor(e.currentTarget.value).run();
                        }}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <Baseline className="h-4 w-4" style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }} />
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Font Size Selector */}
                <div className="flex items-center h-8 px-2 rounded-lg hover:bg-muted text-xs font-semibold gap-1 transition-colors" title="Tamaño de letra">
                    <span className="text-gray-400">Tamaño:</span>
                    <select
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'normal') {
                                editor.chain().focus().unsetFontSize().run();
                            } else {
                                editor.chain().focus().setFontSize(val).run();
                            }
                        }}
                        value={currentFontSize}
                        className="bg-transparent border-none outline-none cursor-pointer font-bold text-gray-800 dark:text-gray-200 text-xs px-1"
                    >
                        <option value="normal" className="dark:bg-[#27282a]">Normal</option>
                        <option value="12px" className="dark:bg-[#27282a]">12px</option>
                        <option value="14px" className="dark:bg-[#27282a]">14px</option>
                        <option value="16px" className="dark:bg-[#27282a]">16px</option>
                        <option value="18px" className="dark:bg-[#27282a]">18px</option>
                        <option value="20px" className="dark:bg-[#27282a]">20px</option>
                        <option value="24px" className="dark:bg-[#27282a]">24px</option>
                        <option value="28px" className="dark:bg-[#27282a]">28px</option>
                        <option value="32px" className="dark:bg-[#27282a]">32px</option>
                    </select>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Line Height Selector */}
                <div className="flex items-center h-8 px-2 rounded-lg hover:bg-muted text-xs font-semibold gap-1 transition-colors" title="Tamaño del interlineado">
                    <span className="text-gray-400">Interlineado:</span>
                    <select
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'normal') {
                                editor.chain().focus().unsetLineHeight().run();
                            } else {
                                editor.chain().focus().setLineHeight(val).run();
                            }
                        }}
                        value={currentLineHeight}
                        className="bg-transparent border-none outline-none cursor-pointer font-bold text-gray-800 dark:text-gray-200 text-xs px-1"
                    >
                        <option value="normal" className="dark:bg-[#27282a]">Normal</option>
                        <option value="1.2" className="dark:bg-[#27282a]">1.2</option>
                        <option value="1.4" className="dark:bg-[#27282a]">1.4</option>
                        <option value="1.6" className="dark:bg-[#27282a]">1.6</option>
                        <option value="1.8" className="dark:bg-[#27282a]">1.8</option>
                        <option value="2.0" className="dark:bg-[#27282a]">2.0</option>
                    </select>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Headings & Paragraph */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive('paragraph')}
                    onPressedChange={() => editor.chain().focus().setParagraph().run()}
                    aria-label="Set paragraph"
                    className="h-8 w-8 rounded-lg"
                >
                    <Pilcrow className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 1 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    aria-label="Toggle H1"
                    className="h-8 w-8 rounded-lg"
                >
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    aria-label="Toggle H2"
                    className="h-8 w-8 rounded-lg"
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 3 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    aria-label="Toggle H3"
                    className="h-8 w-8 rounded-lg"
                >
                    <Heading3 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 4 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    aria-label="Toggle H4"
                    className="h-8 w-8 rounded-lg"
                >
                    <Heading4 className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Lists & Blocks */}
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    aria-label="Toggle bullet list"
                    className="h-8 w-8 rounded-lg"
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    aria-label="Toggle ordered list"
                    className="h-8 w-8 rounded-lg"
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('blockquote')}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                    aria-label="Toggle blockquote"
                    className="h-8 w-8 rounded-lg"
                >
                    <Quote className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
                    aria-label="Insert horizontal rule"
                    className="h-8 w-8 rounded-lg"
                >
                    <Minus className="h-4 w-4" />
                </Toggle>

                <div className="w-px h-6 bg-border mx-1" />

                {/* Utilities: Clear Formatting & History */}
                <Toggle
                    size="sm"
                    onPressedChange={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                    aria-label="Clear formatting"
                    className="h-8 w-8 rounded-lg"
                    title="Limpiar formato"
                >
                    <Eraser className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    onPressedChange={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    aria-label="Undo"
                    className="h-8 w-8 rounded-lg"
                >
                    <Undo className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    onPressedChange={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    aria-label="Redo"
                    className="h-8 w-8 rounded-lg"
                >
                    <Redo className="h-4 w-4" />
                </Toggle>
            </div>
            <EditorContent editor={editor} className="p-0 bg-transparent" />
        </div>
    )
}

export default RichTextEditor
