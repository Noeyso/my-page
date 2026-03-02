const galleryItems = ['💿', '🦋', '🌼', '🎀', '📸', '🌈', '🫧', '⭐', '🍭'];

export default function GalleryContent() {
  return (
    <div>
      <div className="window-heading">CD Shelf & Stickers</div>
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
