const galleryItems = ['🌸', '🎨', '🌟', '💖', '🦋', '🌈', '✨', '🎀', '🌺'];

export default function GalleryContent() {
  return (
    <div>
      <div className="window-heading">Sticker Gallery</div>
      <div className="gallery-grid">
        {galleryItems.map((item, index) => (
          <div key={`${item}-${index}`} className="gallery-item">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
