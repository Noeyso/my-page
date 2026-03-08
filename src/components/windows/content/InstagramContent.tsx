import { useState } from 'react';
import profileImg from '../../../../assets/images/insta/insta-profile.png';
import content1 from '../../../../assets/images/insta/insta-content-1.png';
import content2 from '../../../../assets/images/insta/insta-content-2.png';
import content4 from '../../../../assets/images/insta/insta-content-4.png';
import content5 from '../../../../assets/images/insta/insta-content-5.png';
import content6 from '../../../../assets/images/insta/insta-content-6.png';
import content7 from '../../../../assets/images/insta/insta-content-7.png';

// Pixel Icon Library - SVG icons
import iconHome from '@hackernoon/pixel-icon-library/icons/SVG/solid/home-solid.svg';
import iconSearch from '@hackernoon/pixel-icon-library/icons/SVG/solid/search-solid.svg';
import iconCamera from '@hackernoon/pixel-icon-library/icons/SVG/solid/retro-camera-solid.svg';
import iconHeart from '@hackernoon/pixel-icon-library/icons/SVG/solid/heart-solid.svg';
import iconUser from '@hackernoon/pixel-icon-library/icons/SVG/solid/user-solid.svg';
import iconGrid from '@hackernoon/pixel-icon-library/icons/SVG/solid/grid-solid.svg';
import iconList from '@hackernoon/pixel-icon-library/icons/SVG/solid/bullet-list-solid.svg';
import iconPlay from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';
import iconTag from '@hackernoon/pixel-icon-library/icons/SVG/solid/tag-solid.svg';
import iconComment from '@hackernoon/pixel-icon-library/icons/SVG/solid/comment-solid.svg';
import iconShare from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';
import iconBookmark from '@hackernoon/pixel-icon-library/icons/SVG/solid/bookmark-solid.svg';
import iconSun from '@hackernoon/pixel-icon-library/icons/SVG/solid/sun-solid.svg';

interface PostData {
  id: number;
  img: string;
  caption: string;
}

const POSTS: PostData[] = [
  { id: 1, img: content1, caption: 'pixel me #pixelart #selfie' },
  { id: 2, img: content2, caption: 'coding all day #developer #workspace' },
  { id: 3, img: content4, caption: 'coffee break #iced #cafe' },
  { id: 4, img: content5, caption: 'afternoon walk #puppy #sunshine' },
  { id: 5, img: content6, caption: 'late night gaming #retro #pixel' },
  { id: 6, img: content7, caption: 'with my buddy #dog #love' },
];

const FILTERS = [
  { name: 'Normal', style: 'none' },
  { name: 'Mac 86', style: 'grayscale(80%) contrast(1.2) brightness(0.9)' },
  { name: 'Apple II', style: 'sepia(90%) saturate(1.5) hue-rotate(-20deg)' },
  { name: 'CGA 4', style: 'saturate(2) contrast(1.4) hue-rotate(160deg)' },
  { name: 'C64', style: 'sepia(60%) saturate(0.8) hue-rotate(180deg) brightness(0.8)' },
];

type Tab = 'grid' | 'list' | 'reels' | 'tagged';
type View = 'profile' | 'post' | 'filter';

function PixelIcon({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={`insta-pixel-icon ${className ?? ''}`} />;
}

export default function InstagramContent() {
  const [activeTab, setActiveTab] = useState<Tab>('grid');
  const [currentView, setCurrentView] = useState<View>('profile');
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [liked, setLiked] = useState(false);

  const handlePostClick = (post: PostData) => {
    setSelectedPost(post);
    setCurrentView('post');
    setLiked(false);
    setActiveFilter(0);
  };

  const handleFilterClick = () => {
    if (selectedPost) {
      setCurrentView('filter');
    }
  };

  const handleBack = () => {
    if (currentView === 'filter') {
      setCurrentView('post');
    } else {
      setCurrentView('profile');
      setSelectedPost(null);
    }
  };

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setShowDialog(true);
    }
  };

  return (
    <div className="insta-app">
      {/* Congratulations Dialog */}
      {showDialog && (
        <div className="insta-dialog-overlay">
          <div className="insta-dialog">
            <div className="insta-dialog-title">
              <span>Congratulation!</span>
              <button
                type="button"
                className="insta-dialog-close"
                onClick={() => setShowDialog(false)}
              >
                X
              </button>
            </div>
            <div className="insta-dialog-body">
              <p>You earn 17 likes</p>
              <p>4 new followers and 1 comment</p>
            </div>
            <div className="insta-dialog-buttons">
              <button type="button" onClick={() => setShowDialog(false)}>
                OK
              </button>
              <button type="button" onClick={() => setShowDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail View */}
      {currentView === 'post' && selectedPost && (
        <>
          <div className="insta-nav-top">
            <button type="button" className="insta-nav-btn" onClick={handleBack}>
              Back
            </button>
            <PixelIcon src={iconSun} alt="brightness" />
            <button type="button" className="insta-nav-btn" onClick={handleFilterClick}>
              Next
            </button>
          </div>
          <div className="insta-post-view">
            <img
              className="insta-post-image"
              src={selectedPost.img}
              alt="post"
            />
          </div>
          <div className="insta-post-actions">
            <button
              type="button"
              className={`insta-action-btn ${liked ? 'insta-liked' : ''}`}
              onClick={handleLike}
            >
              <PixelIcon src={iconHeart} alt="like" className={liked ? 'insta-icon-liked' : ''} />
            </button>
            <button type="button" className="insta-action-btn">
              <PixelIcon src={iconComment} alt="comment" />
            </button>
            <button type="button" className="insta-action-btn">
              <PixelIcon src={iconShare} alt="share" />
            </button>
            <span className="insta-action-spacer" />
            <button type="button" className="insta-action-btn">
              <PixelIcon src={iconBookmark} alt="bookmark" />
            </button>
          </div>
          <div className="insta-post-info">
            <span className="insta-post-likes">{liked ? '18' : '17'} likes</span>
            <span className="insta-post-caption">{selectedPost.caption}</span>
          </div>
          <div className="insta-bottom-bar">
            <button type="button" onClick={handleBack}>Filter</button>
            <button type="button" onClick={handleFilterClick}>Edit</button>
          </div>
        </>
      )}

      {/* Filter View */}
      {currentView === 'filter' && selectedPost && (
        <>
          <div className="insta-nav-top">
            <button type="button" className="insta-nav-btn" onClick={handleBack}>
              Back
            </button>
            <PixelIcon src={iconSun} alt="brightness" />
            <button
              type="button"
              className="insta-nav-btn"
              onClick={() => setCurrentView('profile')}
            >
              Next
            </button>
          </div>
          <div className="insta-post-view">
            <img
              className="insta-post-image"
              src={selectedPost.img}
              alt="post"
              style={{
                filter: FILTERS[activeFilter].style,
              }}
            />
          </div>
          <div className="insta-filter-strip">
            {FILTERS.map((f, i) => (
              <div
                key={f.name}
                className={`insta-filter-item ${i === activeFilter ? 'insta-filter-active' : ''}`}
                onClick={() => setActiveFilter(i)}
              >
                <span className="insta-filter-label">{f.name}</span>
                <div className="insta-filter-thumb">
                  <img
                    src={selectedPost.img}
                    alt={f.name}
                    style={{ filter: f.style }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="insta-bottom-bar">
            <button type="button" onClick={handleBack}>Filter</button>
            <button type="button">Edit</button>
          </div>
        </>
      )}

      {/* Profile View */}
      {currentView === 'profile' && (
        <>
          <div className="insta-profile-header">
            <span className="insta-username">soyeon_dev</span>
          </div>
          <div className="insta-profile-section">
            <div className="insta-avatar">
              <img src={profileImg} alt="profile" />
            </div>
            <div className="insta-stats-area">
              <div className="insta-stats">
                <div className="insta-stat">
                  <span className="insta-stat-num">42</span>
                  <span className="insta-stat-label">posts</span>
                </div>
                <div className="insta-stat">
                  <span className="insta-stat-num">1.2k</span>
                  <span className="insta-stat-label">followers</span>
                </div>
                <div className="insta-stat">
                  <span className="insta-stat-num">256</span>
                  <span className="insta-stat-label">following</span>
                </div>
              </div>
              <div className="insta-follow-row">
                <button type="button" className="insta-follow-btn">+ Follow</button>
                <button type="button" className="insta-follow-dropdown">▼</button>
              </div>
            </div>
          </div>
          <div className="insta-bio">
            <span className="insta-bio-name">Soyeon Yang</span>
            <span className="insta-bio-text">Frontend Developer</span>
            <span className="insta-bio-text">Retro aesthetics enthusiast</span>
          </div>

          {/* Tabs */}
          <div className="insta-tabs">
            <button
              type="button"
              className={`insta-tab ${activeTab === 'grid' ? 'insta-tab-active' : ''}`}
              onClick={() => setActiveTab('grid')}
            >
              <PixelIcon src={iconGrid} alt="grid" />
            </button>
            <button
              type="button"
              className={`insta-tab ${activeTab === 'list' ? 'insta-tab-active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              <PixelIcon src={iconList} alt="list" />
            </button>
            <button
              type="button"
              className={`insta-tab ${activeTab === 'reels' ? 'insta-tab-active' : ''}`}
              onClick={() => setActiveTab('reels')}
            >
              <PixelIcon src={iconPlay} alt="reels" />
            </button>
            <button
              type="button"
              className={`insta-tab ${activeTab === 'tagged' ? 'insta-tab-active' : ''}`}
              onClick={() => setActiveTab('tagged')}
            >
              <PixelIcon src={iconTag} alt="tagged" />
            </button>
          </div>

          {/* Grid */}
          <div className="insta-grid">
            {POSTS.map((post) => (
              <div
                key={post.id}
                className="insta-grid-item"
                onClick={() => handlePostClick(post)}
              >
                <img src={post.img} alt={`post-${post.id}`} />
              </div>
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="insta-bottom-nav">
            <button type="button" className="insta-bnav-btn insta-bnav-active">
              <PixelIcon src={iconHome} alt="home" />
            </button>
            <button type="button" className="insta-bnav-btn">
              <PixelIcon src={iconSearch} alt="search" />
            </button>
            <button type="button" className="insta-bnav-btn">
              <PixelIcon src={iconCamera} alt="camera" />
            </button>
            <button type="button" className="insta-bnav-btn">
              <PixelIcon src={iconHeart} alt="activity" />
            </button>
            <button type="button" className="insta-bnav-btn">
              <PixelIcon src={iconUser} alt="profile" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
