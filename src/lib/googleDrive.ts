
/**
 * Utility for Google Drive URL extraction and normalization.
 */

export const extractDriveId = (url: string): { id: string; type: 'file' | 'folder' } | null => {
  if (!url) return null;

  // Pattern for File IDs
  const filePatterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{25,})/,
    /\/d\/([a-zA-Z0-9_-]{25,})/,
    /id=([a-zA-Z0-9_-]{25,})/,
    /open\?id=([a-zA-Z0-9_-]{25,})/
  ];

  for (const pattern of filePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) return { id: match[1], type: 'file' };
  }

  // Pattern for Folder IDs
  const folderPatterns = [
    /\/folders\/([a-zA-Z0-9_-]{25,})/,
    /id=([a-zA-Z0-9_-]{25,})/ // sometimes folders use id= too, but usually folders are explicit
  ];

  for (const pattern of folderPatterns) {
    const match = url.match(pattern);
    if (match && match[1] && url.includes('folders')) return { id: match[1], type: 'folder' };
  }

  return null;
};

export const normalizeDriveUrl = (url: string): string => {
  const extracted = extractDriveId(url);
  if (!extracted) return url;

  if (extracted.type === 'folder') {
    return `https://drive.google.com/drive/folders/${extracted.id}`;
  }
  return `https://drive.google.com/file/d/${extracted.id}/view`;
};

export const getEmbedUrl = (url: string): string | null => {
  const extracted = extractDriveId(url);
  if (!extracted) return null;

  if (extracted.type === 'folder') {
    return `https://drive.google.com/embeddedfolderview?id=${extracted.id}#grid`;
  }
  return `https://drive.google.com/file/d/${extracted.id}/preview`;
};
