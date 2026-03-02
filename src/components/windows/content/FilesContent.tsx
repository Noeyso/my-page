const files = [
  { icon: '📄', name: 'resume.pdf' },
  { icon: '🖼️', name: 'photos.zip' },
  { icon: '📝', name: 'notes.txt' },
  { icon: '🎵', name: 'playlist.m3u' },
  { icon: '📁', name: 'projects' },
];

export default function FilesContent() {
  return (
    <div>
      <div className="window-heading">Hyper Files</div>
      {files.map((item) => (
        <div key={item.name} className="file-item">
          <span>{item.icon}</span>
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
}
