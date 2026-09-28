/**
 * @fileoverview CodeMirror 6 HTML editor (admin bundle only).
 */

import { memo, useMemo, type RefObject } from 'react';
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  lineWrap: boolean;
  editorRef: RefObject<ReactCodeMirrorRef | null>;
}

const HtmlEditor = memo(({ value, onChange, lineWrap, editorRef }: HtmlEditorProps) => {
  const extensions = useMemo(
    () => [html({ autoCloseTags: true }), ...(lineWrap ? [EditorView.lineWrapping] : [])],
    [lineWrap]
  );

  return (
    <CodeMirror
      ref={editorRef}
      value={value}
      onChange={onChange}
      extensions={extensions}
      height="100%"
      className="h-full text-[13px]"
      aria-label="Résumé HTML"
      basicSetup={{ foldGutter: true, searchKeymap: true, highlightActiveLine: true }}
    />
  );
});

HtmlEditor.displayName = 'HtmlEditor';

export default HtmlEditor;
