import React, { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePlugin from 'grapesjs-preset-webpage';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';

interface VisualEditorProps {
    initialHtml: string;
    globalCss: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (html: string, css: string) => void;
    onLiveChange?: (html: string, css: string) => void;
}

export function VisualEditor({
    initialHtml,
    globalCss,
    isOpen,
    onClose,
    onSave,
    onLiveChange
}: VisualEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const liveSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onLiveChangeRef = useRef<typeof onLiveChange>(onLiveChange);
    const baseGlobalCssRef = useRef<string>("");
    const inlineCssRef = useRef<string>("");
    const lastEmittedRef = useRef<{ html: string; css: string }>({ html: "", css: "" });

    useEffect(() => {
        onLiveChangeRef.current = onLiveChange;
    }, [onLiveChange]);

    const normalizeCssForComparison = (css: string) =>
        css
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\s+/g, " ")
            .trim();

    const stripBaseCssSnapshot = (candidateCss: string, baseCss: string) => {
        const candidate = candidateCss?.trim();
        if (!candidate) return "";

        const base = baseCss?.trim();
        if (!base) return candidate;

        if (candidate === base) return "";
        if (candidate.startsWith(base)) {
            return candidate.slice(base.length).trim();
        }

        const indexOfExactBase = candidate.indexOf(base);
        if (indexOfExactBase >= 0) {
            return `${candidate.slice(0, indexOfExactBase)}\n${candidate.slice(indexOfExactBase + base.length)}`
                .trim();
        }

        const normalizedCandidate = normalizeCssForComparison(candidate);
        const normalizedBase = normalizeCssForComparison(base);
        if (!normalizedCandidate || !normalizedBase) return candidate;
        if (normalizedCandidate === normalizedBase) return "";

        // Treat near-identical snapshots as redundant (legacy GrapesJS full-css output).
        if (
            normalizedCandidate.length >= Math.floor(normalizedBase.length * 0.95) &&
            normalizedBase.length > 200 &&
            normalizedCandidate.startsWith(normalizedBase.slice(0, 200)) &&
            normalizedCandidate.endsWith(normalizedBase.slice(-200))
        ) {
            return "";
        }

        return candidate;
    };

    const normalizeEditorCssOutput = (css: string) => {
        let normalized = css || "";
        normalized = stripBaseCssSnapshot(normalized, baseGlobalCssRef.current);
        normalized = stripBaseCssSnapshot(normalized, inlineCssRef.current);
        return normalized.trim();
    };

    const parseInitialDocument = (html: string) => {
        if (typeof window === "undefined") {
            return { components: html, inlineCss: "", externalStyles: [] as string[] };
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const externalStyles = Array.from(doc.querySelectorAll('head link[rel="stylesheet"][href]'))
                .map((linkTag) => linkTag.getAttribute("href") || "")
                .filter(Boolean)
                .filter((href) => !/styles\.css(?:\?|$)/i.test(href));

            doc.querySelectorAll("script").forEach((scriptTag) => scriptTag.remove());
            const components = doc.body?.innerHTML?.trim() || html;
            const inlineCss = Array.from(doc.querySelectorAll("style"))
                .map((styleTag) => styleTag.textContent || "")
                .join("\n");

            return { components, inlineCss, externalStyles };
        } catch (error) {
            console.warn("Failed to parse visual editor HTML, using raw content.", error);
            return { components: html, inlineCss: "", externalStyles: [] as string[] };
        }
    };

    const injectCanvasBaseStyles = (editor: Editor, cssText: string) => {
        try {
            const canvasDocument = editor.Canvas.getDocument();
            if (!canvasDocument?.head) return;

            let baseStyleTag = canvasDocument.head.querySelector('style[data-gjs-helper="base-global-css"]');
            if (!baseStyleTag) {
                baseStyleTag = canvasDocument.createElement("style");
                baseStyleTag.setAttribute("data-gjs-helper", "base-global-css");
            }

            baseStyleTag.textContent = cssText || "";
            // Keep site CSS as the last stylesheet so Grapes preset CSS cannot override it.
            canvasDocument.head.appendChild(baseStyleTag);
        } catch (error) {
            console.warn("Failed to inject base CSS into editor canvas:", error);
        }
    };

    const injectEditorCanvasHelpers = (editor: Editor) => {
        try {
            const canvasDocument = editor.Canvas.getDocument();
            if (!canvasDocument?.head) return;

            const existing = canvasDocument.head.querySelector('style[data-gjs-helper="editor-canvas-fixes"]');
            if (existing) return;

            const helperStyle = canvasDocument.createElement("style");
            helperStyle.setAttribute("data-gjs-helper", "editor-canvas-fixes");
            helperStyle.textContent = `
                /* Keep animated blocks visible in editor iframe when page JS is not running */
                .animate-on-scroll,
                .reveal,
                .reveal-left,
                .reveal-right,
                .reveal-scale {
                    opacity: 1 !important;
                    transform: none !important;
                    transition: none !important;
                }
            `;
            canvasDocument.head.appendChild(helperStyle);
        } catch (error) {
            console.warn("Failed to inject visual editor canvas helper styles:", error);
        }
    };

    useEffect(() => {
        if (!isOpen || !editorRef.current) return;

        try {
            const { components, inlineCss, externalStyles } = parseInitialDocument(initialHtml);

            const editor = grapesjs.init({
                container: editorRef.current,
                fromElement: false,
                height: '100%',
                width: '100%',
                storageManager: false,
                plugins: [webpagePlugin],
                pluginsOpts: {
                    [webpagePlugin as any]: {
                        // Options for the webpage plugin
                    }
                },
                canvas: {
                    styles: externalStyles,
                },
            });

            baseGlobalCssRef.current = globalCss || "";
            inlineCssRef.current = inlineCss || "";

            // Override the RTE link action so it prompts for a URL and creates
            // a proper <a href> tag instead of raw markdown text.
            editor.RichTextEditor.remove('link');
            editor.RichTextEditor.add('link', {
                icon: '🔗',
                attributes: { title: 'Insert / Edit Link' },
                result: (rte: any) => {
                    const selection = rte.selection();
                    const selectedText = selection ? selection.toString() : '';

                    // Check if cursor is already inside an <a> tag
                    let currentHref = '';
                    try {
                        const anchorNode = rte.doc.getSelection()?.anchorNode;
                        const anchor = anchorNode?.parentElement?.closest?.('a');
                        if (anchor) currentHref = anchor.getAttribute('href') || '';
                    } catch (_) { /* ignore */ }

                    const url = window.prompt(
                        selectedText
                            ? `Enter URL for "${selectedText.slice(0, 60)}${selectedText.length > 60 ? '…' : ''}"`
                            : 'Enter URL:',
                        currentHref || 'https://'
                    );

                    if (url === null) return; // user cancelled
                    if (url.trim() === '') {
                        // Remove link if URL is cleared
                        rte.exec('unlink');
                        return;
                    }
                    rte.exec('createLink', url.trim());
                },
            });

            editor.setComponents(components);
            editor.setStyle(inlineCss || "");
            injectCanvasBaseStyles(editor, baseGlobalCssRef.current);
            injectEditorCanvasHelpers(editor);

            const emitLiveChange = () => {
                if (!onLiveChangeRef.current) return;

                if (liveSyncTimeoutRef.current) {
                    clearTimeout(liveSyncTimeoutRef.current);
                }

                liveSyncTimeoutRef.current = setTimeout(() => {
                    try {
                        const html = editor.getHtml();
                        const css = normalizeEditorCssOutput(editor.getCss() || "");

                        if (html === lastEmittedRef.current.html && css === lastEmittedRef.current.css) {
                            return;
                        }

                        lastEmittedRef.current = { html, css };
                        onLiveChangeRef.current?.(html, css);
                    } catch (error) {
                        console.warn("Failed to emit visual editor live change:", error);
                    }
                }, 120);
            };

            editor.on("update", emitLiveChange);
            editor.on("load", () => {
                injectCanvasBaseStyles(editor, baseGlobalCssRef.current);
                injectEditorCanvasHelpers(editor);
            });

            setEditorInstance(editor);

            return () => {
                if (liveSyncTimeoutRef.current) {
                    clearTimeout(liveSyncTimeoutRef.current);
                    liveSyncTimeoutRef.current = null;
                }

                editor.off("update", emitLiveChange);
                editor.destroy();
                setEditorInstance(null);
            };
        } catch (err: any) {
            console.error("GrapesJS Initialization error: ", err);
            setErrorMsg(err.message || String(err));
        }
    }, [isOpen]); // Initialize only when opened

    if (!isOpen) return null;

    const handleSave = () => {
        if (editorInstance) {
            const html = editorInstance.getHtml();
            const css = normalizeEditorCssOutput(editorInstance.getCss() || "");
            onSave(html, css);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
            <div className="flex items-center justify-between p-2 bg-gray-900 text-white shadow-md">
                <div className="flex items-center space-x-4 px-2">
                    <h2 className="text-lg font-semibold">Visual Editor</h2>
                    <span className="text-sm text-gray-400">Drag & Drop components to customize your site</span>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Save size={16} className="mr-2" />
                        Save & Apply
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-800 text-gray-300">
                        <X size={16} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {errorMsg && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-black align-middle text-xl">
                        Error Loading Editor: {errorMsg}
                    </div>
                )}
                <div id="gjs-container" className="absolute inset-0 h-full w-full" ref={editorRef}></div>
            </div>
        </div>
    );
}
