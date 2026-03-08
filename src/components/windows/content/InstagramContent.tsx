import { useState, useEffect, useCallback } from 'react';
import profileImg from '../../../../assets/images/insta/insta-profile.png';
import content1 from '../../../../assets/images/insta/insta-content-1.png';
import content2 from '../../../../assets/images/insta/insta-content-2.png';
import content4 from '../../../../assets/images/insta/insta-content-4.png';
import content5 from '../../../../assets/images/insta/insta-content-5.png';
import content6 from '../../../../assets/images/insta/insta-content-6.png';
import content7 from '../../../../assets/images/insta/insta-content-7.png';
import { fetchAllLikes, toggleLike } from '../../../services/likeService';
import {
  fetchComments,
  fetchAllCommentCounts,
  addComment,
  deleteComment,
  CommentRow,
} from '../../../services/commentService';
import {
  fetchCommentLikes,
  toggleCommentLike,
  CommentLikeState,
} from '../../../services/commentLikeService';
import { useSessionStore } from '../../../store/useSessionStore';

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

const POST_IDS = POSTS.map((p) => p.id);

const FILTERS = [
  { name: 'Normal', style: 'none' },
  { name: 'Mac 86', style: 'grayscale(80%) contrast(1.2) brightness(0.9)' },
  { name: 'Apple II', style: 'sepia(90%) saturate(1.5) hue-rotate(-20deg)' },
  { name: 'CGA 4', style: 'saturate(2) contrast(1.4) hue-rotate(160deg)' },
  { name: 'C64', style: 'sepia(60%) saturate(0.8) hue-rotate(180deg) brightness(0.8)' },
];

type Tab = 'grid' | 'list' | 'reels' | 'tagged';
type View = 'profile' | 'post' | 'filter' | 'comments';

interface LikeState {
  count: number;
  likedByMe: boolean;
}

function PixelIcon({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={`insta-pixel-icon ${className ?? ''}`} />;
}

export default function InstagramContent() {
  const [activeTab, setActiveTab] = useState<Tab>('grid');
  const [currentView, setCurrentView] = useState<View>('profile');
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ likes: 0, action: '' });
  const [likesMap, setLikesMap] = useState<Record<number, LikeState>>({});
  const [toggling, setToggling] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewComments, setPreviewComments] = useState<CommentRow[]>([]);
  const [commentLikesMap, setCommentLikesMap] = useState<Record<string, CommentLikeState>>({});
  const [togglingCommentLike, setTogglingCommentLike] = useState(false);

  const nickname = useSessionStore((s) => s.nickname);

  // 좋아요 + 댓글 수 데이터 로드
  const loadData = useCallback(async () => {
    try {
      const [likesResult, countsResult] = await Promise.all([
        fetchAllLikes(POST_IDS),
        fetchAllCommentCounts(POST_IDS),
      ]);
      setLikesMap(likesResult);
      setCommentCounts(countsResult);
    } catch {
      // 실패 시 기본값 유지
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostClick = async (post: PostData) => {
    setSelectedPost(post);
    setCurrentView('post');
    setActiveFilter(0);
    try {
      const all = await fetchComments(post.id);
      setPreviewComments(all.slice(-2));
    } catch {
      setPreviewComments([]);
    }
  };

  const handleFilterClick = () => {
    if (selectedPost) {
      setCurrentView('filter');
    }
  };

  const handleBack = () => {
    if (currentView === 'filter') {
      setCurrentView('post');
    } else if (currentView === 'comments') {
      setCurrentView('post');
    } else {
      setCurrentView('profile');
      setSelectedPost(null);
    }
  };

  const handleLike = async (postId: number) => {
    if (!nickname || toggling) return;
    setToggling(true);

    try {
      const nowLiked = await toggleLike(postId);
      const prev = likesMap[postId] ?? { count: 0, likedByMe: false };
      const newCount = nowLiked ? prev.count + 1 : prev.count - 1;

      setLikesMap((m) => ({
        ...m,
        [postId]: { count: newCount, likedByMe: nowLiked },
      }));

      if (nowLiked) {
        setDialogMessage({ likes: newCount, action: 'liked' });
        setShowDialog(true);
      }
    } catch {
      // 에러 무시
    } finally {
      setToggling(false);
    }
  };

  const handleOpenComments = async (post: PostData) => {
    setSelectedPost(post);
    setCurrentView('comments');
    setCommentText('');
    try {
      const result = await fetchComments(post.id);
      setComments(result);
      if (result.length > 0) {
        const likes = await fetchCommentLikes(result.map((c) => c.id));
        setCommentLikesMap(likes);
      } else {
        setCommentLikesMap({});
      }
    } catch {
      setComments([]);
      setCommentLikesMap({});
    }
  };

  const handleSubmitComment = async () => {
    if (!nickname || !selectedPost || !commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(selectedPost.id, commentText.trim());
      setComments((prev) => {
        const updated = [...prev, newComment];
        setPreviewComments(updated.slice(-2));
        return updated;
      });
      setCommentCounts((prev) => ({
        ...prev,
        [selectedPost.id]: (prev[selectedPost.id] ?? 0) + 1,
      }));
      setCommentText('');
    } catch {
      // 에러 무시
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => {
        const updated = prev.filter((c) => c.id !== commentId);
        setPreviewComments(updated.slice(-2));
        return updated;
      });
      setCommentCounts((prev) => ({
        ...prev,
        [selectedPost.id]: Math.max((prev[selectedPost.id] ?? 1) - 1, 0),
      }));
    } catch {
      // 에러 무시
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!nickname || togglingCommentLike) return;
    setTogglingCommentLike(true);
    try {
      const nowLiked = await toggleCommentLike(commentId);
      const prev = commentLikesMap[commentId] ?? { count: 0, likedByMe: false };
      setCommentLikesMap((m) => ({
        ...m,
        [commentId]: {
          count: nowLiked ? prev.count + 1 : prev.count - 1,
          likedByMe: nowLiked,
        },
      }));
    } catch {
      // 에러 무시
    } finally {
      setTogglingCommentLike(false);
    }
  };

  const getCommentLikeInfo = (commentId: string): CommentLikeState =>
    commentLikesMap[commentId] ?? { count: 0, likedByMe: false };

  const getLikeInfo = (postId: number): LikeState =>
    likesMap[postId] ?? { count: 0, likedByMe: false };

  const totalLikes = Object.values(likesMap).reduce((sum, v) => sum + v.count, 0);

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
              <p>You earned {dialogMessage.likes} likes</p>
              <p>on this post!</p>
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
              className="insta-action-btn"
              onClick={() => handleLike(selectedPost.id)}
              disabled={!nickname || toggling}
            >
              <PixelIcon
                src={iconHeart}
                alt="like"
                className={getLikeInfo(selectedPost.id).likedByMe ? 'insta-icon-liked' : ''}
              />
            </button>
            <button
              type="button"
              className="insta-action-btn"
              onClick={() => selectedPost && handleOpenComments(selectedPost)}
            >
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
            <span className="insta-post-likes">
              {getLikeInfo(selectedPost.id).count} likes
            </span>
            <span className="insta-post-caption">{selectedPost.caption}</span>
            {(commentCounts[selectedPost.id] ?? 0) > 2 && (
              <button
                type="button"
                className="insta-view-comments"
                onClick={() => handleOpenComments(selectedPost)}
              >
                View all {commentCounts[selectedPost.id]} comments
              </button>
            )}
            {previewComments.length > 0 && (
              <div
                className="insta-comment-preview"
                onClick={() => handleOpenComments(selectedPost)}
              >
                {previewComments.map((c) => (
                  <div key={c.id} className="insta-comment-preview-item">
                    <span className="insta-comment-nickname">{c.nickname}</span>
                    <span className="insta-comment-preview-text">{c.content}</span>
                  </div>
                ))}
              </div>
            )}
            {!nickname && (
              <span className="insta-post-hint">* Log in to like & comment</span>
            )}
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

      {/* Comments View */}
      {currentView === 'comments' && selectedPost && (
        <>
          <div className="insta-nav-top">
            <button type="button" className="insta-nav-btn" onClick={handleBack}>
              Back
            </button>
            <span className="insta-nav-title">Comments</span>
            <span className="insta-nav-btn" />
          </div>
          <div className="insta-comments-list">
            {comments.length === 0 && (
              <div className="insta-comments-empty">No comments yet.</div>
            )}
            {comments.map((c) => {
              const cLike = getCommentLikeInfo(c.id);
              return (
                <div key={c.id} className="insta-comment-item">
                  <div className="insta-comment-header">
                    <span className="insta-comment-nickname">{c.nickname}</span>
                    <span className="insta-comment-time">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="insta-comment-body">
                    <span className="insta-comment-content">{c.content}</span>
                    <div className="insta-comment-actions">
                      <button
                        type="button"
                        className="insta-comment-like-btn"
                        onClick={() => handleCommentLike(c.id)}
                        disabled={!nickname || togglingCommentLike}
                      >
                        <PixelIcon
                          src={iconHeart}
                          alt="like"
                          className={cLike.likedByMe ? 'insta-icon-liked' : ''}
                        />
                      </button>
                      {cLike.count > 0 && (
                        <span className="insta-comment-like-count">{cLike.count}</span>
                      )}
                      {c.nickname === nickname && (
                        <button
                          type="button"
                          className="insta-comment-delete"
                          onClick={() => handleDeleteComment(c.id)}
                        >
                          X
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="insta-comment-input-area">
            <input
              type="text"
              className="insta-comment-input"
              placeholder={nickname ? 'Add a comment...' : 'Log in to comment'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitComment();
              }}
              disabled={!nickname}
              maxLength={200}
            />
            <button
              type="button"
              className="insta-comment-submit"
              onClick={handleSubmitComment}
              disabled={!nickname || !commentText.trim() || submitting}
            >
              Post
            </button>
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
                  <span className="insta-stat-num">{POSTS.length}</span>
                  <span className="insta-stat-label">posts</span>
                </div>
                <div className="insta-stat">
                  <span className="insta-stat-num">{totalLikes}</span>
                  <span className="insta-stat-label">likes</span>
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
            {POSTS.map((post) => {
              const info = getLikeInfo(post.id);
              return (
                <div
                  key={post.id}
                  className="insta-grid-item"
                  onClick={() => handlePostClick(post)}
                >
                  <img src={post.img} alt={`post-${post.id}`} />
                  {info.count > 0 && (
                    <span className="insta-grid-likes">
                      <PixelIcon src={iconHeart} alt="likes" className="insta-icon-liked" />
                      {info.count}
                    </span>
                  )}
                </div>
              );
            })}
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
