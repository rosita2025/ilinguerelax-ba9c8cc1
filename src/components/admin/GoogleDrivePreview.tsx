
import React from "react";
import { getEmbedUrl, extractDriveId } from "@/lib/googleDrive";
import { ExternalLink, FileText, Folder } from "lucide-react";

interface GoogleDrivePreviewProps {
  url: string | null | undefined;
}

const GoogleDrivePreview: React.FC<GoogleDrivePreviewProps> = ({ url }) => {
  if (!url) return null;

  const embedUrl = getEmbedUrl(url);
  const info = extractDriveId(url);

  if (!embedUrl || !info) return null;

  return (
    <div className="mt-2 border rounded-lg overflow-hidden bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-muted/50 px-3 py-1.5 flex items-center justify-between text-[10px] font-medium text-muted-foreground border-b">
        <div className="flex items-center gap-1.5">
          {info.type === 'folder' ? <Folder className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
          <span>Vista previa de Google Drive ({info.type})</span>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          Abrir en Drive <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <div className="relative aspect-video bg-black/5">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allow="autoplay"
          loading="lazy"
          title="Google Drive Preview"
        />
      </div>
      <p className="p-2 text-[10px] text-muted-foreground italic leading-tight">
        Nota: Si no ves el contenido, asegúrate de que el archivo tenga permisos de "Cualquier persona con el enlace puede ver".
      </p>
    </div>
  );
};

export default GoogleDrivePreview;
