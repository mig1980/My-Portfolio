/**
 * @fileoverview Admin root: picks the document (?doc=executive|ats) and remounts the editor per document.
 */

import { useCallback, useState } from 'react';
import { DEFAULT_DOC_ID, getResumeDocument, type ResumeDocId } from '../resume/documents';
import ResumeEditor from './ResumeEditor';

function initialDocId(): ResumeDocId {
  return (
    getResumeDocument(new URLSearchParams(window.location.search).get('doc'))?.id ?? DEFAULT_DOC_ID
  );
}

const AdminApp = () => {
  const [docId, setDocId] = useState<ResumeDocId>(initialDocId);

  const handleSwitch = useCallback((next: ResumeDocId) => {
    setDocId(next);
    window.history.replaceState(null, '', `?doc=${next}`);
  }, []);

  // key: each document gets a fresh editor (own file, sha, draft and build status).
  return <ResumeEditor key={docId} docId={docId} onSwitchDoc={handleSwitch} />;
};

export default AdminApp;
